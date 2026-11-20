import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";

const API_URL = "/api/team";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

export default function TeamRoles() {
  const [staff, setStaff] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTeam() {
    setLoading(true);
    setError("");
    try {
      const data = await readResponse(await apiFetch(API_URL));
      setStaff(data.staff || []);
      setPositions(
        Object.fromEntries((data.staff || []).map((member) => [member.id, member.position || ""])),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load your department team.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadInitialTeam() {
      try {
        const data = await readResponse(await apiFetch(API_URL));
        if (active) {
          setStaff(data.staff || []);
          setPositions(
            Object.fromEntries((data.staff || []).map((member) => [member.id, member.position || ""])),
          );
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load your department team.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialTeam();
    return () => {
      active = false;
    };
  }, []);

  async function assignPosition(member) {
    setSavingId(member.id);
    setError("");
    setMessage("");
    try {
      const response = await apiFetch(`${API_URL}/${member.id}/position`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: positions[member.id] || "" }),
      });
      const data = await readResponse(response);
      setStaff((current) =>
        current.map((item) =>
          item.id === member.id ? { ...item, position: positions[member.id].trim() } : item,
        ),
      );
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.message || "Unable to assign this position.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team positions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign job positions to active junior staff in your department. Only an admin can grant senior access.
          </p>
        </div>
        <button
          type="button"
          onClick={loadTeam}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}

      {loading ? (
        <p className="py-8 text-center text-slate-500">Loading team members...</p>
      ) : staff.length ? (
        <div className="space-y-3">
          {staff.map((member) => (
            <article key={member.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-800">
                  {member.first_name} {member.last_name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {member.employee_id} · {member.email || "No email"}
                </p>
              </div>
              <label className="w-full text-sm font-medium text-slate-700 sm:max-w-xs">
                Job position
                <input
                  type="text"
                  maxLength={100}
                  required
                  value={positions[member.id] || ""}
                  onChange={(event) =>
                    setPositions((current) => ({ ...current, [member.id]: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={() => assignPosition(member)}
                disabled={savingId !== null || !positions[member.id]?.trim()}
                className="rounded-lg bg-[#800000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#650000] disabled:opacity-60"
              >
                {savingId === member.id ? "Saving..." : "Assign position"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
          There are no other active staff members in your department.
        </p>
      )}
    </section>
  );
}
