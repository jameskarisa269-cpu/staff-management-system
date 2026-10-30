import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { apiFetch } from "./services/api";
import Icon from "./components/Icon";

const API_URL = "http://localhost:5000/api/attendance";

async function requestJSON(url, options = {}) {
  const response = await apiFetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "The attendance request failed.");
  }

  return data;
}

function getQrToken(value) {
  try {
    const url = new URL(value);
    return url.searchParams.get("qr_token") || url.searchParams.get("token") || value;
  } catch {
    return value;
  }
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "—";
}

function formatTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function StaffAttendance({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [activeSessionQr, setActiveSessionQr] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const loadAttendance = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const data = await requestJSON(API_URL);
      setRecords(Array.isArray(data) ? data : data.attendance || []);
    } catch (requestError) {
      setError(requestError.message || "Unable to load attendance records.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const loadActiveSession = useCallback(async () => {
    try {
      const data = await requestJSON(`${API_URL}/sessions/active`);
      setActiveSession(data.session || null);
    } catch (requestError) {
      setError(requestError.message || "Unable to load the active QR session.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialAttendance() {
      try {
        const data = await requestJSON(API_URL);
        if (active) {
          setRecords(Array.isArray(data) ? data : data.attendance || []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load attendance records.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialAttendance();
    const intervalId = window.setInterval(() => loadAttendance(false), 15_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [loadAttendance]);

  useEffect(() => {
    let active = true;

    async function refreshActiveSession() {
      try {
        const data = await requestJSON(`${API_URL}/sessions/active`);
        if (active) setActiveSession(data.session || null);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load the active QR session.");
        }
      }
    }

    refreshActiveSession();
    const intervalId = window.setInterval(refreshActiveSession, 10_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!activeSession?.qr_token) return undefined;

    let active = true;
    QRCode.toDataURL(activeSession.qr_token, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 320,
    })
      .then((data) => {
        if (active) {
          setActiveSessionQr({ token: activeSession.qr_token, data });
        }
      })
      .catch((qrError) => {
        if (active) {
          setError(qrError.message || "Unable to display the active QR code.");
        }
      });

    return () => {
      active = false;
    };
  }, [activeSession]);

  useEffect(() => {
    if (!scanning) return undefined;

    let active = true;
    let stream;
    let timeoutId;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });

    async function startScanner() {
      try {
        if (!canvas || !context) {
          throw new Error("Unable to start the QR scanner.");
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (!active || !video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();
        const { default: decodeQr } = await import("jsqr");

        async function detectCode() {
          if (!active || !video) return;

          try {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = decodeQr(pixels.data, pixels.width, pixels.height);

              if (code?.data) {
                setQrToken(getQrToken(code.data));
                setError("");
                setMessage("QR code scanned. Select Check in to submit your attendance.");
                setScanning(false);
                return;
              }
            }

            if (!active) return;
            timeoutId = window.setTimeout(detectCode, 300);
          } catch (scanError) {
            if (!active) return;
            setError(scanError.message || "Unable to scan the QR code.");
            setScanning(false);
          }
        }

        detectCode();
      } catch (cameraError) {
        if (active) {
          setError(cameraError.message || "Unable to access the camera.");
          setScanning(false);
        }
      }
    }

    startScanner();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      stream?.getTracks().forEach((track) => track.stop());
      if (video) video.srcObject = null;
    };
  }, [scanning]);

  async function checkInWithToken(token) {
    if (!token?.trim()) {
      setError("Scan the administrator's active QR code before checking in.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await requestJSON(`${API_URL}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: token.trim() }),
      });

      setQrToken("");
      setMessage("You have checked in successfully.");
      await Promise.all([loadAttendance(false), loadActiveSession()]);
    } catch (requestError) {
      setError(requestError.message || "Unable to check in.");
    } finally {
      setSaving(false);
    }
  }

  async function checkIn(event) {
    event.preventDefault();
    await checkInWithToken(qrToken);
  }

  function startScanning() {
    setError("");
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera scanning is unavailable. Paste the token from the admin QR code instead.");
      return;
    }

    setScanning(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#800000]">ATTENDANCE</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">
              Check in, {user.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Scan the active QR code displayed by your administrator, or paste its token below.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f5e8eb] text-[#800000]">
            <Icon name="calendar" size={28} />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-5">
          <h2 className="font-bold text-slate-800">Administrator attendance QR</h2>
          {activeSession ? (
            <div className="mt-4 flex min-w-0 flex-col items-start gap-4 md:flex-row md:items-center">
              {activeSessionQr?.token === activeSession.qr_token ? (
                <img
                  src={activeSessionQr.data}
                  alt="Active attendance QR code provided by the administrator"
                  className="h-56 w-56 rounded-lg border border-slate-200 bg-white p-2 sm:h-64 sm:w-64"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 sm:h-64 sm:w-64">
                  Preparing the active QR code...
                </div>
              )}
              <div className="max-w-md">
                <p className="text-sm text-slate-600">
                  This is the current QR session created by your administrator.
                  It refreshes automatically when a new session is started.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Expires: {new Date(activeSession.expires_at).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => checkInWithToken(activeSession.qr_token)}
                  disabled={saving}
                  className="mt-4 rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white hover:bg-[#650000] disabled:opacity-50"
                >
                  {saving ? "Checking in..." : "Check in with this QR"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              No active QR session is available. Ask the administrator to create
              one in Attendance, then this page will update automatically.
            </p>
          )}
        </div>

        <form onSubmit={checkIn} className="mt-6">
          <label
            htmlFor="attendance-qr-token"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Attendance QR token
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="attendance-qr-token"
              required
              value={qrToken}
              onChange={(event) => setQrToken(event.target.value)}
              placeholder="Scan or paste the token from the admin QR code"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3"
            />
            <button
              type="button"
              onClick={scanning ? () => setScanning(false) : startScanning}
              className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              {scanning ? "Stop scanning" : "Scan QR"}
            </button>
            <button
              type="submit"
              disabled={saving || !qrToken.trim()}
              className="rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white hover:bg-[#650000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Checking in..." : "Check in"}
            </button>
          </div>
        </form>

        {scanning && (
          <div className="mt-5 max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              aria-label="Camera view for scanning attendance QR code"
              autoPlay
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {message && (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-800">My attendance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Records refresh automatically after check-in.
          </p>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading attendance...</p>
        ) : records.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            No attendance records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Check-in time</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-5 py-4 text-slate-700">
                      {formatDate(record.attendance_date)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {formatTime(record.check_in_time)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
