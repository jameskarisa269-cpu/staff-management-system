import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";
import Icon from "./components/Icon";

const API_URL = "http://localhost:5000/api/staff";
const DEPARTMENTS_URL = "http://localhost:5000/api/departments";

const emptyForm = {
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department_id: "",
    position: "",
    employment_status: "Active",
    password: "",
};

function Staff() {
    const [staff, setStaff] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [search, setSearch] = useState("");

    // Fetch all staff records
    async function fetchStaff() {
        try {
            const response = await apiFetch(API_URL);
            setError("");

            if (!response.ok) {
                throw new Error("Failed to fetch staff records.");
            }

            const data = await response.json();
            setStaff(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let active = true;
        async function loadInitialData() {
            try {
                const [staffResponse, departmentsResponse] = await Promise.all([
                    apiFetch(API_URL),
                    apiFetch(DEPARTMENTS_URL),
                ]);
                const [staffData, departmentData] = await Promise.all([
                    staffResponse.json(),
                    departmentsResponse.json(),
                ]);
                if (!staffResponse.ok) {
                    throw new Error(staffData.message || "Failed to fetch staff records.");
                }
                if (!departmentsResponse.ok) {
                    throw new Error(departmentData.message || "Failed to load departments.");
                }
                if (active) {
                    setStaff(Array.isArray(staffData) ? staffData : []);
                    setDepartments(Array.isArray(departmentData) ? departmentData : []);
                }
            } catch (err) {
                if (active) setError(err.message || "Unable to load staff and departments.");
            } finally {
                if (active) setLoading(false);
            }
        }
        loadInitialData();
        return () => {
            active = false;
        };
    }, []);

    // Open the form for adding a new staff member
    function handleAdd() {
        setEditingId(null);
        setFormData({ ...emptyForm });
        setError("");
        setShowForm(true);
    }

    // Open the form with existing staff details
    function handleEdit(employee) {
        setEditingId(employee.id);
        setFormData({
            employee_id: employee.employee_id || "",
            first_name: employee.first_name || "",
            last_name: employee.last_name || "",
            email: employee.email || "",
            department_id: employee.department_id ? String(employee.department_id) : "",
            position: employee.position || "",
            employment_status: employee.employment_status || "Active",
            password: "",
        });
        setError("");
        setShowForm(true);
    }

    // Update the form when a field changes
    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    // Save a new staff member or update an existing one
    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        const url = editingId
            ? `${API_URL}/${editingId}`
            : API_URL;

        const method = editingId ? "PUT" : "POST";

        try {
            const response = await apiFetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Unable to save staff details."
                );
            }

            setShowForm(false);
            setEditingId(null);
            setFormData({ ...emptyForm });
            await fetchStaff();
        } catch (err) {
            setError(err.message || "An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    }

    // Delete a staff member
    async function handleDelete(employee) {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`
        );

        if (!confirmed) return;

        setError("");

        try {
            const response = await apiFetch(`${API_URL}/${employee.id}`, {
                method: "DELETE",
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Unable to delete this staff member."
                );
            }

            await fetchStaff();
        } catch (err) {
            setError(err.message || "An error occurred while deleting.");
        }
    }

    // Search by employee name, ID, email or department
    const filteredStaff = staff.filter((employee) => {
        const searchableText = [
            employee.employee_id,
            employee.first_name,
            employee.last_name,
            employee.email,
            employee.department,
            employee.position,
        ]
            .join(" ")
            .toLowerCase();

        return searchableText.includes(search.toLowerCase());
    });

    const activeCount = staff.filter(
        (employee) => employee.employment_status === "Active"
    ).length;

    return (
        <div className="min-h-screen bg-white text-slate-800">
            <div className="flex min-h-screen">

                {/* Main content */}
                <main id="dashboard" className="min-w-0 flex-1 p-3 sm:p-4">
                    <header className="mb-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#650000]"
                        >
                            <span className="inline-flex items-center gap-2">
                                <Icon name="plus" size={18} />
                                Add Staff
                            </span>
                        </button>
                    </header>

                    {/* Summary cards */}
                    <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">
                                Total Staff
                            </p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">
                                {staff.length}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">
                                Active Staff
                            </p>
                            <p className="mt-2 text-3xl font-bold text-green-600">
                                {activeCount}
                            </p>
                        </div>
                    </section>

                    {/* Error message */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {/* Staff directory */}
                    <section
                        id="staff"
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Staff Directory
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    View and manage employee information.
                                </p>
                            </div>

                            <input
                                type="search"
                                placeholder="Search staff..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15 sm:max-w-xs"
                            />
                        </div>

                        {loading ? (
                            <p className="p-8 text-center text-slate-500">
                                Loading staff records...
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">ID</th>
                                            <th className="px-5 py-4">Employee</th>
                                            <th className="px-5 py-4">Email</th>
                                            <th className="px-5 py-4">Department</th>
                                            <th className="px-5 py-4">Position</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStaff.length > 0 ? (
                                            filteredStaff.map((employee) => (
                                                <tr
                                                    key={employee.id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4 text-slate-500">
                                                        {employee.id}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-slate-900">
                                                            {employee.first_name}{" "}
                                                            {employee.last_name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {employee.employee_id}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-600">
                                                        {employee.email || "N/A"}
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-600">
                                                        {employee.department || "N/A"}
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-600">
                                                        {employee.position || "N/A"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                                employee.employment_status === "Active"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                            }`}
                                                        >
                                                            {employee.employment_status}
                                                        </span>
                                                    </td>

                                                    {/* Edit and Delete buttons */}
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(employee)}
                                                                className="rounded-md bg-amber-100 px-3 py-2 font-medium text-amber-800 transition hover:bg-amber-200"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(employee)}
                                                                className="rounded-md bg-red-100 px-3 py-2 font-medium text-red-700 transition hover:bg-red-200"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="7"
                                                    className="px-6 py-12 text-center text-slate-500"
                                                >
                                                    {search
                                                        ? "No staff match your search."
                                                        : "No staff records found. Click Add Staff to register an employee."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                </main>
            </div>

            {/* Add/Edit Staff modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="staff-form-title"
                        className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <h3
                                    id="staff-form-title"
                                    className="text-xl font-bold text-slate-900"
                                >
                                    {editingId ? "Edit Staff Member" : "Add New Staff"}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enter the employee details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setError("");
                                }}
                                aria-label="Close form"
                                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="employee_id"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Employee ID *
                                    </label>
                                    <input
                                        id="employee_id"
                                        name="employee_id"
                                        value={formData.employee_id}
                                        onChange={handleChange}
                                        placeholder="e.g. EMP002"
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="first_name"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        First Name *
                                    </label>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="last_name"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Last Name *
                                    </label>
                                    <input
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Email *
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="employee@example.com"
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="department_id"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Department *
                                    </label>
                                    <select
                                        id="department_id"
                                        name="department_id"
                                        value={formData.department_id}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    >
                                        <option value="">Select a department</option>
                                        {departments.map((department) => (
                                            <option key={department.id} value={department.id}>
                                                {department.department_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="position"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Position
                                    </label>
                                    <input
                                        id="position"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                        placeholder="e.g. IT Officer"
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        {editingId ? "New Password (optional)" : "Initial Password *"}
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        minLength={8}
                                        maxLength={128}
                                        required={!editingId}
                                        autoComplete="new-password"
                                        placeholder={editingId ? "Leave blank to keep current password" : "At least 8 characters"}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="employment_status"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Employment Status
                                    </label>
                                    <select
                                        id="employment_status"
                                        name="employment_status"
                                        value={formData.employment_status}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/15"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                                >
                                    {error}
                                </p>
                            )}

                            <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setError("");
                                    }}
                                    disabled={saving}
                                    className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white transition hover:bg-[#650000] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save Changes"
                                            : "Register Staff"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Staff;