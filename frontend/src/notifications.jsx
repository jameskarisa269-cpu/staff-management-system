import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";
import Icon from "./components/Icon";
import { cleanSeedPrefix } from "./utils/displayText";

const API_URL = "http://localhost:5000/api/notifications";

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Unexpected server response (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "The notification request failed.");
  }
  return data;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export default function Notifications({ user }) {
  const isAdmin = user?.role === "admin";
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "General",
  });
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  async function loadNotifications(showLoading = true) {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const data = await readResponse(await apiFetch(API_URL));
      if (!Array.isArray(data.notifications)) {
        throw new Error("The notifications response was incomplete.");
      }
      setNotifications(data.notifications);
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function refreshNotifications() {
      try {
        const data = await readResponse(await apiFetch(API_URL));
        if (!Array.isArray(data.notifications)) {
          throw new Error("The notifications response was incomplete.");
        }
        if (active) setNotifications(data.notifications);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load notifications.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 15_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  async function updateNotification(url, method, id = null) {
    setBusyId(id ?? "all");
    setError("");
    try {
      await readResponse(
        await apiFetch(url, {
          method,
          ...(method === "PATCH"
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              }
            : {}),
        }),
      );
      await loadNotifications(false);
    } catch (requestError) {
      setError(requestError.message || "Unable to update notifications.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotification(id) {
    setBusyId(id);
    setError("");
    try {
      await readResponse(
        await apiFetch(`${API_URL}/${id}`, { method: "DELETE" }),
      );
      setNotifications((current) =>
        current.filter((notification) => notification.id !== id),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to delete notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function createNotification(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await readResponse(
        await apiFetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }),
      );
      setForm({ title: "", message: "", type: "General" });
      setShowForm(false);
      await loadNotifications(false);
    } catch (requestError) {
      setError(requestError.message || "Unable to create notification.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-slate-600">
            Review and manage system notifications.
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowForm((current) => !current)}
              className="rounded-lg bg-[#800000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#650000]"
            >
              {showForm ? "Cancel" : "Create notification"}
            </button>
          )}
          <button
            type="button"
            onClick={() => loadNotifications()}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() =>
              updateNotification(`${API_URL}/mark-all-read`, "PATCH")
            }
            disabled={!unreadCount || busyId !== null}
            className="rounded-lg bg-[#800000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#650000] disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {isAdmin && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-800">Create notification</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close notification form"
              >
                <Icon name="close" />
              </button>
            </div>

            <form
              onSubmit={createNotification}
              className="grid gap-4 p-6 sm:grid-cols-2"
            >
              <label className="text-sm font-medium text-slate-700">
                Title
                <input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Type
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                >
                  {["General", "Task", "Attendance", "Asset", "System"].map(
                    (type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Message
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
                />
              </label>
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <p className="text-xs text-slate-500">
                  This notification will be visible to all staff.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#800000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#650000] disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="font-semibold text-slate-800">
              No notifications yet
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              New system notifications will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const isRead = Boolean(notification.is_read);
              const recipient = [
                notification.first_name,
                notification.last_name,
              ]
                .filter(Boolean)
                .join(" ");
              const title = cleanSeedPrefix(notification.title);
              const message = cleanSeedPrefix(notification.message);

              return (
                <li
                  key={notification.id}
                  className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between ${
                    isRead ? "bg-white" : "bg-amber-50/50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-800">
                        {title}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {notification.type}
                      </span>
                      {!isRead && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                          Unread
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {message}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                      {isAdmin ? `${recipient || "All staff"} · ` : ""}
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() =>
                          updateNotification(
                            `${API_URL}/${notification.id}/read`,
                            "PATCH",
                            notification.id,
                          )
                        }
                        disabled={busyId !== null}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Mark read
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteNotification(notification.id)}
                        disabled={busyId !== null}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
