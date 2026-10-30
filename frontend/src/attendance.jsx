
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { apiFetch } from "./services/api";
import Icon from "./components/Icon";

const API_URL = "http://localhost:5000/api/attendance";
const STAFF_URL = "http://localhost:5000/api/staff";

const initialSession = {
  expires_at: "",
};

function getLocalDateTimeParts() {
  const localDateTime = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60_000,
  ).toISOString();

  return {
    attendance_date: localDateTime.slice(0, 10),
    check_in_time: localDateTime.slice(11, 16),
  };
}

function createInitialAttendanceForm() {
  return {
    staff_id: "",
    ...getLocalDateTimeParts(),
    status: "Present",
    remarks: "",
  };
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState(initialSession);
  const [session, setSession] = useState(null);
  const [sessionQrData, setSessionQrData] = useState("");

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    staff_id: "",
    qr_token: "",
  });

  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState(
    createInitialAttendanceForm,
  );
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "Present",
    remarks: "",
  });

  const requestJSON = useCallback(async (url, options = {}) => {
    const response = await apiFetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "The request failed.");
    }

    return data;
  }, []);

  const loadAttendance = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");

    try {
      const data = await requestJSON(API_URL);

      setRecords(
        Array.isArray(data) ? data : data.attendance || []
      );
    } catch (err) {
      setError(err.message || "Unable to load attendance records.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [requestJSON]);

  useEffect(() => {
    let active = true;
    async function loadInitialData() {
      try {
        const [attendanceData, staffData] = await Promise.all([
          requestJSON(API_URL),
          requestJSON(STAFF_URL),
        ]);
        if (active) {
          setRecords(
            Array.isArray(attendanceData)
              ? attendanceData
              : attendanceData.attendance || [],
          );
          setStaff(Array.isArray(staffData) ? staffData : staffData.staff || []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load attendance.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInitialData();
    return () => {
      active = false;
    };
  }, [requestJSON]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadAttendance(false);
    }, 15_000);

    return () => window.clearInterval(intervalId);
  }, [loadAttendance]);

  useEffect(() => {
    let active = true;

    if (!session?.qr_token) return undefined;

    QRCode.toDataURL(session.qr_token, {
      errorCorrectionLevel: "H",
      margin: 4,
      width: 320,
    })
      .then((dataUrl) => {
        if (active) setSessionQrData(dataUrl);
      })
      .catch((qrError) => {
        if (active) {
          setError(qrError.message || "Unable to generate the session QR code.");
        }
      });

    return () => {
      active = false;
    };
  }, [session]);

  function clearNotifications() {
    setError("");
    setMessage("");
  }

  async function createSession(event) {
    event.preventDefault();
    clearNotifications();

    const expiryDate = new Date(sessionForm.expires_at);
    if (
      !Number.isFinite(expiryDate.getTime()) ||
      expiryDate.getTime() <= Date.now() + 60_000
    ) {
      setError("Choose an expiry time at least one minute in the future.");
      return;
    }

    try {
      const data = await requestJSON(`${API_URL}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expires_at: expiryDate.toISOString(),
        }),
      });

      setSessionQrData("");
      setSession(data);
      setMessage("QR attendance session created successfully.");
      setShowSessionForm(false);
      setSessionForm(initialSession);
    } catch (err) {
      setError(err.message || "Unable to create QR session.");
    }
  }

  async function closeSession() {
    if (!session?.id) return;

    clearNotifications();

    try {
      await requestJSON(`${API_URL}/sessions/${session.id}/close`, {
        method: "PATCH",
      });

      setSessionQrData("");
      setSession(null);
      setMessage("Attendance session closed successfully.");
    } catch (err) {
      setError(err.message || "Unable to close attendance session.");
    }
  }

  async function checkIn(event) {
    event.preventDefault();
    clearNotifications();

    try {
      await requestJSON(`${API_URL}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: Number(checkInForm.staff_id),
          qr_token: checkInForm.qr_token.trim(),
        }),
      });

      setMessage("Staff attendance recorded successfully.");
      setShowCheckInForm(false);
      setCheckInForm({ staff_id: "", qr_token: "" });
      await loadAttendance();
    } catch (err) {
      setError(err.message || "Unable to record attendance.");
    }
  }

  async function createAttendanceRecord(event) {
    event.preventDefault();
    clearNotifications();
    setSavingAttendance(true);

    try {
      await requestJSON(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...attendanceForm,
          staff_id: Number(attendanceForm.staff_id),
          check_in_time:
            attendanceForm.status === "Absent"
              ? null
              : attendanceForm.check_in_time || null,
        }),
      });

      setShowAttendanceForm(false);
      setAttendanceForm(createInitialAttendanceForm());
      setMessage("Attendance record added successfully.");
      await loadAttendance();
    } catch (err) {
      setError(err.message || "Unable to add attendance record.");
    } finally {
      setSavingAttendance(false);
    }
  }

  function openEdit(record) {
    setEditingRecord(record);
    setEditForm({
      status: record.status || "Present",
      remarks: record.remarks || "",
    });
    clearNotifications();
  }

  async function saveEdit(event) {
    event.preventDefault();
    clearNotifications();

    try {
      await requestJSON(`${API_URL}/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      setEditingRecord(null);
      setMessage("Attendance record updated successfully.");
      await loadAttendance();
    } catch (err) {
      setError(err.message || "Unable to update attendance.");
    }
  }

  async function deleteRecord(id) {
    if (!window.confirm("Delete this attendance record?")) return;

    clearNotifications();

    try {
      await requestJSON(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      setMessage("Attendance record deleted successfully.");
      await loadAttendance();
    } catch (err) {
      setError(err.message || "Unable to delete attendance.");
    }
  }

  const filteredRecords = records.filter((record) => {
    const fullName =
      `${record.first_name || ""} ${record.last_name || ""}`.toLowerCase();

    const searchText = search.toLowerCase();

    const matchesSearch =
      fullName.includes(searchText) ||
      String(record.employee_id || "").toLowerCase().includes(searchText) ||
      String(record.department || "").toLowerCase().includes(searchText);

    const recordDate = String(record.attendance_date || "").slice(0, 10);

    const matchesDate =
      !dateFilter || recordDate === dateFilter;

    const matchesStatus =
      statusFilter === "All" || record.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const presentCount = records.filter(
    (record) => record.status === "Present"
  ).length;

  const lateCount = records.filter(
    (record) => record.status === "Late"
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "Absent"
  ).length;

  function formatTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
  }

  function statusStyle(status) {
    if (status === "Present") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Late") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-red-100 text-red-700";
  }

  return (
    <div className="bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex justify-end">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setShowSessionForm(!showSessionForm);
                setShowCheckInForm(false);
                setShowAttendanceForm(false);
              }}
              className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <span className="inline-flex items-center gap-2">
                <Icon name="plus" size={18} />
                Create QR Session
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setShowCheckInForm(!showCheckInForm);
                setShowSessionForm(false);
                setShowAttendanceForm(false);
                setCheckInForm({
                  staff_id: "",
                  qr_token: session?.qr_token || "",
                });
              }}
              className="rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-700"
            >
              Staff Check-In
            </button>
            <button
              type="button"
              onClick={() => {
                clearNotifications();
                setShowAttendanceForm(true);
                setShowSessionForm(false);
                setShowCheckInForm(false);
              }}
              className="rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
            >
              <span className="inline-flex items-center gap-2">
                <Icon name="plus" size={18} />
                Add Attendance
              </span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* QR Session Form */}
        {showSessionForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Create QR Attendance Session
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSessionForm(false)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close session form"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={createSession} className="p-6">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Session expiry date and time
                </label>

                <input
                  type="datetime-local"
                  required
                  value={sessionForm.expires_at}
                  onChange={(event) =>
                    setSessionForm({ expires_at: event.target.value })
                  }
                  className="mb-5 w-full rounded-lg border border-slate-300 px-4 py-3"
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSessionForm(false)}
                    className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Session Result */}
        {session && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Active QR Session
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Session ID: {session.id}
            </p>

            <div className="mt-4 flex flex-col items-start gap-2">
              {sessionQrData ? (
                <div className="flex flex-col items-start gap-3">
                  <img
                    src={sessionQrData}
                    alt="QR code for the active attendance session"
                    className="h-80 w-80 rounded-lg border border-slate-200 bg-white p-2"
                  />
                  <a
                    href={sessionQrData}
                    download={`attendance-session-${session.id}.png`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Download QR code
                  </a>
                </div>
              ) : (
                <p role="status" className="text-sm text-slate-500">
                  Preparing session QR code...
                </p>
              )}
              <p className="text-sm text-slate-500">
                Staff can scan this QR code from their Attendance page.
              </p>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-700">
              QR token
            </p>

            <div className="mt-2 break-all rounded-lg bg-slate-100 p-4 font-mono text-sm text-slate-800">
              {session.qr_token}
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Expires: {session.expires_at}
            </p>

            <button
              type="button"
              onClick={() => {
                setCheckInForm({ staff_id: "", qr_token: session.qr_token });
                setShowCheckInForm(true);
                setShowSessionForm(false);
                setShowAttendanceForm(false);
              }}
              className="mt-4 rounded-lg bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
            >
              Use session for Staff Check-In
            </button>

            <button
              type="button"
              onClick={closeSession}
              className="ml-3 mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Close Session
            </button>
          </div>
        )}

        {/* Check-In Form */}
        {showCheckInForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Record Staff Check-In
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCheckInForm(false)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close check-in form"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={checkIn} className="p-6">
                {!staff.length && (
                  <p className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    Add a staff member in the Staff section before recording a check-in.
                  </p>
                )}
                <p className="mb-5 text-sm text-slate-500">
                  Create a QR session first, then use its token here. A newly
                  created session is filled in automatically.
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Staff Member
                    </label>

                    <select
                      required
                      value={checkInForm.staff_id}
                      onChange={(event) =>
                        setCheckInForm({
                          ...checkInForm,
                          staff_id: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="">Select staff member</option>

                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name} {member.last_name} — {member.employee_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      QR Token
                    </label>

                    <input
                      required
                      value={checkInForm.qr_token}
                      onChange={(event) =>
                        setCheckInForm({
                          ...checkInForm,
                          qr_token: event.target.value,
                        })
                      }
                      placeholder="Enter or scan the QR token"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="submit"
                    disabled={!staff.length}
                    className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
                  >
                    Record Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCheckInForm(false)}
                    className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manual Attendance Form */}
        {showAttendanceForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Add Attendance Record
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAttendanceForm(false)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close attendance form"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={createAttendanceRecord} className="p-6">
                {!staff.length && (
                  <p className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    Add a staff member in the Staff section before recording attendance.
                  </p>
                )}
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Staff Member
                    </label>
                    <select
                      required
                      value={attendanceForm.staff_id}
                      onChange={(event) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          staff_id: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="">Select staff member</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name} {member.last_name} — {member.employee_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Attendance Date
                    </label>
                    <input
                      type="date"
                      required
                      value={attendanceForm.attendance_date}
                      onChange={(event) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          attendance_date: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Status
                    </label>
                    <select
                      required
                      value={attendanceForm.status}
                      onChange={(event) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          status: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>

                  {attendanceForm.status !== "Absent" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Check-In Time (optional)
                      </label>
                      <input
                        type="time"
                        value={attendanceForm.check_in_time}
                        onChange={(event) =>
                          setAttendanceForm({
                            ...attendanceForm,
                            check_in_time: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                      />
                    </div>
                  )}

                  <div className={attendanceForm.status === "Absent" ? "md:col-span-2" : ""}>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Remarks (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={attendanceForm.remarks}
                      onChange={(event) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          remarks: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="submit"
                    disabled={!staff.length || savingAttendance}
                    className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingAttendance ? "Saving..." : "Save Attendance"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAttendanceForm(false)}
                    className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Records
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-800">
              {records.length}
            </h2>
          </div>

          <div className="rounded-xl border border-green-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Present</p>
            <h2 className="mt-3 text-3xl font-bold text-green-600">
              {presentCount}
            </h2>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Late</p>
            <h2 className="mt-3 text-3xl font-bold text-amber-500">
              {lateCount}
            </h2>
          </div>

          <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Absent</p>
            <h2 className="mt-3 text-3xl font-bold text-red-600">
              {absentCount}
            </h2>
          </div>
        </div>

        {/* Edit Record Form */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Correct Attendance Record #{editingRecord.id}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close attendance record form"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={saveEdit} className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Attendance Status
                    </label>

                    <select
                      value={editForm.status}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          status: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                    >
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Correction Remarks
                    </label>

                    <textarea
                      rows={3}
                      value={editForm.remarks}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          remarks: event.target.value,
                        })
                      }
                      placeholder="Explain why this record is being corrected"
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Save Correction
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Attendance Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredRecords.length} matching record(s)
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff..."
                className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading attendance records...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Check-In</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-slate-500">
                        {record.id}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {record.first_name} {record.last_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.employee_id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {record.department || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {String(record.attendance_date || "").slice(0, 10) || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatTime(record.check_in_time)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEdit(record)}
                            className="rounded-md bg-blue-50 px-3 py-2 font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="rounded-md bg-red-50 px-3 py-2 font-medium text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!filteredRecords.length && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        {search || dateFilter || statusFilter !== "All"
                          ? "No attendance records match your filters."
                          : "No attendance records found yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-200 p-4 text-right">
            <button
              onClick={loadAttendance}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Refresh Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
