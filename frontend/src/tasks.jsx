import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";
import Icon from "./components/Icon";

const API_URL = "http://localhost:5000/api/tasks";
const STAFF_URL = "http://localhost:5000/api/staff";
const statuses = ["Pending", "In Progress", "Completed", "Cancelled"];
const priorities = ["Low", "Medium", "High", "Urgent"];

const emptyForm = {
  title: "",
  description: "",
  assigned_to: "",
  priority: "Medium",
  status: "Pending",
  start_date: "",
  due_date: "",
};

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Unexpected server response (HTTP ${response.status}).`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "The request failed.");
  }
  return data;
}

function dateValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function staffName(member) {
  return `${member.first_name} ${member.last_name}`.trim();
}

function findStaffMember(value, staff) {
  const searchValue = value.trim().toLowerCase();
  if (!searchValue) return null;

  const matches = staff.filter((member) =>
    [staffName(member), member.employee_id, member.email]
      .filter(Boolean)
      .some((candidate) => candidate.trim().toLowerCase() === searchValue),
  );
  return matches.length === 1 ? matches[0] : null;
}

function priorityStyle(priority) {
  const styles = {
    Low: "bg-slate-100 text-slate-700",
    Medium: "bg-blue-100 text-blue-700",
    High: "bg-amber-100 text-amber-700",
    Urgent: "bg-red-100 text-red-700",
  };
  return styles[priority] || styles.Medium;
}

function statusStyle(status) {
  const styles = {
    Pending: "bg-slate-100 text-slate-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };
  return styles[status] || styles.Pending;
}

export default function Tasks({ user }) {
  const isAdmin = user?.role === "admin";
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [assigneeInput, setAssigneeInput] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const taskResponse = await apiFetch(API_URL);
        const taskData = await readResponse(taskResponse);
        const staffData = isAdmin
          ? await readResponse(await apiFetch(STAFF_URL))
          : [];

        if (active) {
          setTasks(Array.isArray(taskData) ? taskData : taskData.tasks || []);
          setStaff(Array.isArray(staffData) ? staffData : staffData.staff || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load tasks.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      const data = await readResponse(await apiFetch(API_URL));
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      setError(err.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshStaff() {
    setStaffLoading(true);
    setFormError("");
    try {
      const data = await readResponse(await apiFetch(STAFF_URL));
      const members = Array.isArray(data) ? data : data.staff || [];
      setStaff(members);
    } catch (err) {
      setFormError(err.message || "Unable to load staff members.");
    } finally {
      setStaffLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setAssigneeInput("");
    setError("");
    setFormError("");
    setMessage("");
    setShowForm(true);
    refreshStaff();
  }

  function openEditForm(task) {
    setEditingId(task.id);
    const assignedStaff = staff.find(
      (member) => String(member.id) === String(task.assigned_to),
    );
    setForm({
      title: task.title || "",
      description: task.description || "",
      assigned_to: task.assigned_to ? String(task.assigned_to) : "",
      priority: task.priority || "Medium",
      status: task.status || "Pending",
      start_date: dateValue(task.start_date),
      due_date: dateValue(task.due_date),
    });
    setAssigneeInput(
      assignedStaff ? staffName(assignedStaff) : task.assigned_staff_name || "",
    );
    setError("");
    setFormError("");
    setMessage("");
    setShowForm(true);
    refreshStaff();
  }

  async function saveTask(event) {
    event.preventDefault();
    if (assigneeInput.trim() && !form.assigned_to) {
      setFormError("Choose a matching staff name, email, or employee ID from the suggestions.");
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
    setMessage("");

    try {
      const response = await apiFetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
            start_date: form.start_date || null,
            due_date: form.due_date || null,
          }),
        },
      );
      const data = await readResponse(response);
      setMessage(data.message || (editingId
        ? "Task updated successfully."
        : "Task created successfully."));
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await loadTasks();
    } catch (err) {
      setFormError(err.message || "Unable to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return;

    setError("");
    setMessage("");
    try {
      await readResponse(await apiFetch(`${API_URL}/${id}`, { method: "DELETE" }));
      setMessage("Task deleted successfully.");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to delete task.");
    }
  }

  async function updateStatus(task, status) {
    setError("");
    setMessage("");
    try {
      await readResponse(await apiFetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }));
      setMessage("Task status updated.");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to update task status.");
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const searchValue = search.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      [task.title, task.description, task.assigned_staff_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchValue));
    return matchesStatus && matchesSearch;
  });

  const counts = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "Pending").length,
    inProgress: tasks.filter((task) => task.status === "In Progress").length,
    completed: tasks.filter((task) => task.status === "Completed").length,
  };

  return (
    <div className="bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {isAdmin && <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#650000]"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="plus" size={18} />
              Add Task
            </span>
          </button>
        </div>}

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

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Tasks", counts.total, "text-slate-800"],
            ["Pending", counts.pending, "text-slate-700"],
            ["In Progress", counts.inProgress, "text-blue-700"],
            ["Completed", counts.completed, "text-green-700"],
          ].map(([label, count, color]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className={`mt-2 text-3xl font-bold ${color}`}>{count}</p>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="mb-5 flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit Task" : "Create Task"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close task form"
                >
                  <Icon name="close" />
                </button>
              </div>

              <form onSubmit={saveTask} className="px-6 pb-6">
                {formError && (
                  <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                    {formError}
                  </p>
                )}
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="task-title" className="mb-2 block text-sm font-semibold text-slate-700">
                      Task title *
                    </label>
                    <input
                      id="task-title"
                      required
                      maxLength={200}
                      value={form.title}
                      onChange={(event) => setForm({ ...form, title: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                      placeholder="e.g. Prepare monthly report"
                    />
                  </div>

                  <div>
                    <label htmlFor="task-assignee" className="mb-2 block text-sm font-semibold text-slate-700">
                      Assign to
                    </label>
                    <input
                      id="task-assignee"
                      type="text"
                      list="task-staff-options"
                      autoComplete="off"
                      value={assigneeInput}
                      onChange={(event) => {
                        const value = event.target.value;
                        const member = findStaffMember(value, staff);
                        setAssigneeInput(value);
                        setFormError("");
                        setForm((current) => ({
                          ...current,
                          assigned_to: member ? String(member.id) : "",
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                      placeholder={staffLoading ? "Loading staff members..." : staff.length ? "Search by name, email, or employee ID" : "No staff members available"}
                      aria-describedby="task-assignee-help"
                      disabled={staffLoading}
                    />
                    <datalist id="task-staff-options">
                      {staff.map((member) => (
                        <option
                          key={`${member.id}-name`}
                          value={staffName(member)}
                          label={`${member.employee_id}${member.email ? ` — ${member.email}` : ""}`}
                        />
                      ))}
                      {staff.map((member) => (
                        <option
                          key={`${member.id}-employee`}
                          value={member.employee_id}
                          label={`${staffName(member)}${member.email ? ` — ${member.email}` : ""}`}
                        />
                      ))}
                      {staff.filter((member) => member.email).map((member) => (
                        <option
                          key={`${member.id}-email`}
                          value={member.email}
                          label={`${staffName(member)} — ${member.employee_id}`}
                        />
                      ))}
                    </datalist>
                    <p id="task-assignee-help" className="mt-1 text-xs text-slate-500">
                      {staffLoading
                        ? "Refreshing staff list..."
                        : staff.length
                        ? "Select a suggestion to assign this task, or leave blank for Unassigned."
                        : "Add a staff member first to assign this task."}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="task-priority" className="mb-2 block text-sm font-semibold text-slate-700">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      value={form.priority}
                      onChange={(event) => setForm({ ...form, priority: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                    >
                      {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-status" className="mb-2 block text-sm font-semibold text-slate-700">
                      Status
                    </label>
                    <select
                      id="task-status"
                      value={form.status}
                      onChange={(event) => setForm({ ...form, status: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
                    >
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-start-date" className="mb-2 block text-sm font-semibold text-slate-700">
                      Start date
                    </label>
                    <input
                      id="task-start-date"
                      type="date"
                      value={form.start_date}
                      onChange={(event) => setForm({ ...form, start_date: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label htmlFor="task-due-date" className="mb-2 block text-sm font-semibold text-slate-700">
                      Due date
                    </label>
                    <input
                      id="task-due-date"
                      type="date"
                      min={form.start_date || undefined}
                      value={form.due_date}
                      onChange={(event) => setForm({ ...form, due_date: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="task-description" className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>
                    <textarea
                      id="task-description"
                      rows={3}
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3"
                      placeholder="Add details for this task"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#800000] px-6 py-3 font-semibold text-white hover:bg-[#650000] disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingId ? "Save Changes" : "Create Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">All Tasks</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"} found
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 sm:max-w-xs"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter tasks by status"
                className="rounded-lg border border-slate-300 bg-white px-4 py-3"
              >
                <option value="All">All statuses</option>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading tasks...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Task</th>
                    <th className="px-5 py-4">Assigned to</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Due date</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="transition hover:bg-slate-50">
                      <td className="max-w-md px-5 py-4">
                        <p className="font-semibold text-slate-800">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 truncate text-slate-500">{task.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {task.assigned_staff_name || "Unassigned"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isAdmin ? (
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(task.status)}`}>
                            {task.status}
                          </span>
                        ) : (
                          <select
                            value={task.status}
                            onChange={(event) => updateStatus(task, event.target.value)}
                            aria-label={`Update status for ${task.title}`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                          >
                            {statuses.filter((status) => status !== "Cancelled" || task.status === "Cancelled").map((status) => (
                              <option key={status}>{status}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {dateValue(task.due_date) || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {isAdmin ? <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(task)}
                            className="rounded-md bg-[#f5e8eb] px-3 py-2 font-medium text-[#800000] hover:bg-[#ead0d7]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="rounded-md bg-red-50 px-3 py-2 font-medium text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div> : <span className="text-xs text-slate-500">Update status above</span>}
                      </td>
                    </tr>
                  ))}
                  {!filteredTasks.length && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        {search || statusFilter !== "All"
                          ? "No tasks match your filters."
                          : "No tasks yet. Click Add Task to create one."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-slate-100 px-5 py-4 text-right">
            <button
              type="button"
              onClick={loadTasks}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
