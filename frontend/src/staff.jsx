import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/staff";

const emptyForm = {
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    position: "",
    employment_status: "Active",
};

function Staff() {
    const [staff, setStaff] = useState([]);
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
            setError("");
            const response = await fetch(API_URL);

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
        fetchStaff();
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
            department: employee.department || "",
            position: employee.position || "",
            employment_status: employee.employment_status || "Active",
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
            const response = await fetch(url, {
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
            const response = await fetch(`${API_URL}/${employee.id}`, {
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
        <div className="min-h-screen bg-slate-100 text-slate-800">
            <div className="flex min-h-screen">

                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 bg-slate-900 p-6 text-white md:block">
                    <h1 className="mb-10 text-2xl font-bold">
                        Staff<span className="text-blue-400">Hub</span>
                    </h1>

                    <nav className="space-y-3">
                        <a
                            href="#dashboard"
                            className="block rounded-lg bg-blue-600 px-4 py-3 font-medium"
                        >
                            Dashboard
                        </a>

                        <a
                            href="#staff"
                            className="block rounded-lg px-4 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                            Staff Records
                        </a>
                    </nav>

                    <p className="mt-12 text-sm text-slate-400">
                        Staff Management System
                    </p>
                </aside>

                {/* Main content */}
                <main id="dashboard" className="min-w-0 flex-1 p-4 sm:p-8">
                    <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-sm font-medium text-blue-600">
                                MANAGEMENT / STAFF
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-900">
                                Staff Management
                            </h2>

                            <p className="mt-2 text-slate-500">
                                Add, edit, search and manage your staff records.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAdd}
                            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            + Add Staff
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
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
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

                    <footer className="mt-8 text-center text-sm text-slate-400">
                        Staff Management System © 2026
                    </footer>
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
                                ×
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
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="employee@example.com"
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="department"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Department
                                    </label>
                                    <input
                                        id="department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="e.g. IT"
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
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
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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