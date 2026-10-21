
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/departments";
const STAFF_URL = "http://localhost:5000/api/staff";

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const body = await response.text();

    if (body.trimStart().startsWith("<")) {
      throw new Error(
        `The backend returned HTML instead of JSON (HTTP ${response.status}). Restart the backend and confirm the Department API is available.`
      );
    }

    throw new Error(body || `Unexpected backend response (HTTP ${response.status}).`);
  }

  return response.json();
}

const emptyForm = {
  department_name: "",
  description: "",
  manager_id: "",
  status: "Active",
};

function getManagerName(department, staff) {
  if (department.manager_name) {
    return department.manager_name;
  }

  const manager = staff.find(
    (member) => Number(member.id) === Number(department.manager_id)
  );

  return manager
    ? `${manager.first_name} ${manager.last_name}`.trim()
    : "Not assigned";
}

export default function Departmental() {
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDepartments();
    loadStaff();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load departments");
      }

      setDepartments(
        Array.isArray(data) ? data : data.departments || []
      );
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStaff() {
    try {
      const response = await fetch(STAFF_URL);
      const data = await readApiResponse(response);

      if (response.ok) {
        setStaff(Array.isArray(data) ? data : data.staff || []);
      }
    } catch (err) {
      console.error("Could not load staff:", err);
    }
  }

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  function openEditForm(department) {
    setForm({
      department_name: department.department_name || "",
      description: department.description || "",
      manager_id: department.manager_id ?? "",
      status: department.status || "Active",
    });

    setEditingId(department.id);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      ...form,
      manager_id: form.manager_id ? Number(form.manager_id) : null,
    };

    const url = editingId
      ? `${API_URL}/${editingId}`
      : API_URL;

    try {
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to save department");
      }

      setMessage(
        editingId
          ? "Department updated successfully."
          : "Department created successfully."
      );

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);

      await loadDepartments();
    } catch (err) {
      setError(err.message || "Failed to save department.");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this department?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete department");
      }

      setMessage("Department deleted successfully.");
      await loadDepartments();
    } catch (err) {
      setError(err.message || "Failed to delete department.");
    }
  }

  const filteredDepartments = departments.filter((department) => {
    const searchText = search.toLowerCase();

    return (
      (department.department_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (department.description || "")
        .toLowerCase()
        .includes(searchText) ||
      (department.manager_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (department.status || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  const activeCount = departments.filter(
    (department) => department.status === "Active"
  ).length;

  const inactiveCount = departments.filter(
    (department) => department.status === "Inactive"
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#800000]">
              Staff Management System
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Department Management
            </h1>
            <p className="mt-2 text-slate-500">
              Create departments, assign managers, and manage department
              records.
            </p>
          </div>

          <button
            onClick={openAddForm}
            className="rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#650000]"
          >
            + Add Department
          </button>
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

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Departments
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-800">
              {departments.length}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active Departments
            </p>
            <h2 className="mt-3 text-3xl font-bold text-green-600">
              {activeCount}
            </h2>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Inactive Departments
            </p>
            <h2 className="mt-3 text-3xl font-bold text-orange-500">
              {inactiveCount}
            </h2>
          </div>
        </div>

        {/* Department Form */}
        {showForm && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Department" : "Add New Department"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Department Name *
                  </label>
                  <input
                    type="text"
                    name="department_name"
                    value={form.department_name}
                    onChange={handleChange}
                    placeholder="e.g. Information Technology"
                    required
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Department Manager
                  </label>
                  <select
                    name="manager_id"
                    value={form.manager_id}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                  >
                    <option value="">No manager assigned</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} (
                        {member.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the department's responsibilities"
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-[#800000] px-6 py-3 font-semibold text-white hover:bg-[#650000]"
                >
                  {editingId ? "Update Department" : "Save Department"}
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
        )}

        {/* Department Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                All Departments
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredDepartments.length} department(s) found
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search departments..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading departments...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Manager</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDepartments.map((department) => (
                    <tr
                      key={department.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-500">
                        {department.id}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {department.department_name}
                      </td>

                      <td className="max-w-xs px-6 py-4 text-slate-600">
                        {department.description || "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {getManagerName(department, staff)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            department.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {department.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditForm(department)}
                            className="rounded-md bg-[#f5e8eb] px-3 py-2 font-medium text-[#800000] hover:bg-[#ead0d7]"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(department.id)}
                            className="rounded-md bg-red-50 px-3 py-2 font-medium text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!filteredDepartments.length && (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        {search
                          ? "No departments match your search."
                          : "No departments found. Click Add Department to create one."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
