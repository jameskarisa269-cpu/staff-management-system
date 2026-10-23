import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "./services/api";

const API_URL = "http://localhost:5000/api/audit-logs";
const modules = [
  "Staff",
  "Department",
  "Role",
  "Attendance",
  "Task",
  "Asset",
  "Report",
  "Notification",
  "Authentication",
  "System",
];

async function fetchAuditLogs() {
  const response = await apiFetch(API_URL);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Unable to load audit logs (HTTP ${response.status}).`);
  }

  if (!Array.isArray(data.audit_logs)) {
    throw new Error("The audit log response was incomplete.");
  }

  return data.audit_logs;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [search, setSearch] = useState("");

  async function loadLogs(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      setLogs(await fetchAuditLogs());
    } catch (requestError) {
      setError(requestError.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    fetchAuditLogs()
      .then((data) => {
        if (active) setLogs(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "Unable to load audit logs.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesModule = moduleFilter === "All" || log.module === moduleFilter;
      const matchesAction = actionFilter === "All" || log.action === actionFilter;
      const actor = [log.first_name, log.last_name, log.employee_id]
        .filter(Boolean)
        .join(" ");
      const searchable = [
        actor || "System / API",
        log.action,
        log.module,
        log.record_id,
        log.description,
        log.ip_address === "127.0.0.1" ? "System data" : log.ip_address,
        formatDate(log.created_at),
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return (
        matchesModule &&
        matchesAction &&
        (!query || searchable.includes(query))
      );
    });
  }, [logs, moduleFilter, actionFilter, search]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(
      (log) => log.created_at && new Date(log.created_at).toDateString() === today,
    ).length;
  }, [logs]);
  const modulesUsed = new Set(logs.map((log) => log.module)).size;

  return (
    <div className="bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-slate-600">
              Review successful changes recorded by the StaffHub API.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              System/API is shown as the actor because user sign-in is not configured.
              Sample entries are labeled.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadLogs(true)}
            disabled={refreshing}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh logs"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["Total log entries", logs.length],
            ["Logged today", todayCount],
            ["Modules represented", modulesUsed],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-800">
                {loading ? "…" : value}
              </p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Activity history</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading audit logs..."
                  : `${filteredLogs.length} of ${logs.length} log entry(s)`}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search logs..."
                aria-label="Search audit logs"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                aria-label="Filter by module"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="All">All modules</option>
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                aria-label="Filter by action"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="All">All actions</option>
                {[...new Set(logs.map((log) => log.action))]
                  .sort()
                  .map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              {logs.length
                ? "No audit entries match the selected filters."
                : "No audit entries have been recorded yet. Successful changes made through StaffHub will appear here."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {["Date and time", "Actor", "Action", "Module", "Record", "Details"].map(
                      (heading) => (
                        <th key={heading} className="px-5 py-4 font-semibold">
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const actor = [log.first_name, log.last_name]
                      .filter(Boolean)
                      .join(" ");
                    const isSample = log.ip_address === "127.0.0.1";

                    return (
                      <tr key={log.id} className="align-top hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {actor || "System / API"}
                          {log.employee_id && (
                            <span className="mt-1 block text-xs text-slate-400">
                              {log.employee_id}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              log.action === "Delete"
                                ? "bg-red-100 text-red-700"
                                : log.action === "Create" || log.action === "Created"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">{log.module}</td>
                        <td className="px-5 py-4 text-slate-700">
                          {log.record_id ?? "—"}
                        </td>
                        <td className="max-w-lg px-5 py-4 text-slate-600">
                          {log.description || "—"}
                          {isSample && (
                            <span className="mt-1 block text-xs font-medium text-amber-700">
                              Sample entry
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
