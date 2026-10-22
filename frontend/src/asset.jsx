import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/assets";
const STAFF_URL = "http://localhost:5000/api/staff";

const initialForm = {
  asset_tag: "",
  asset_name: "",
  category: "",
  description: "",
  serial_number: "",
  asset_condition: "Good",
  status: "Available",
  assigned_to: "",
  purchase_date: "",
  purchase_cost: "",
  location: "",
};

export default function Asset() {
  const [assets, setAssets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAssets();
    fetchStaff();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load assets.");
      }

      setAssets(Array.isArray(data) ? data : data.assets || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to the asset API.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaff() {
    try {
      const response = await fetch(STAFF_URL);
      const data = await response.json();

      if (response.ok) {
        setStaff(Array.isArray(data) ? data : data.staff || []);
      }
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      purchase_cost:
        form.purchase_cost === "" ? null : Number(form.purchase_cost),
      purchase_date: form.purchase_date || null,
      status: form.assigned_to ? "Assigned" : form.status,
    };

    try {
      const response = await fetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save asset.");
      }

      resetForm();
      setSuccess(editingId ? "Asset updated successfully." : "Asset added successfully.");
      await fetchAssets();
    } catch (err) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(asset) {
    setForm({
      asset_tag: asset.asset_tag || "",
      asset_name: asset.asset_name || "",
      category: asset.category || "",
      description: asset.description || "",
      serial_number: asset.serial_number || "",
      asset_condition: asset.asset_condition || "Good",
      status: asset.status || "Available",
      assigned_to: asset.assigned_to ? String(asset.assigned_to) : "",
      purchase_date: asset.purchase_date
        ? String(asset.purchase_date).slice(0, 10)
        : "",
      purchase_cost: asset.purchase_cost ?? "",
      location: asset.location || "",
    });

    setEditingId(asset.id);
    setShowForm(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete asset.");
      }

      setSuccess("Asset deleted successfully.");
      await fetchAssets();
    } catch (err) {
      setError(err.message || "Failed to delete asset.");
    }
  }

  async function handleAssign(id) {
    const staffId = window.prompt("Enter the staff ID to assign this asset to:");

    if (!staffId) return;

    if (!Number.isInteger(Number(staffId)) || Number(staffId) < 1) {
      setError("Enter a valid staff ID.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: Number(staffId) }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to assign asset.");
      }

      setSuccess("Asset assigned successfully.");
      await fetchAssets();
    } catch (err) {
      setError(err.message || "Failed to assign asset.");
    }
  }

  async function handleReturn(id) {
    if (!window.confirm("Return this asset and mark it as available?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${id}/return`, {
        method: "PATCH",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to return asset.");
      }

      setSuccess("Asset returned successfully.");
      await fetchAssets();
    } catch (err) {
      setError(err.message || "Failed to return asset.");
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const searchable = [
      asset.asset_tag,
      asset.asset_name,
      asset.category,
      asset.serial_number,
      asset.location,
      asset.assigned_staff_name,
      asset.employee_id,
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchable.includes(search.toLowerCase()) &&
      (filterStatus === "All" || asset.status === filterStatus)
    );
  });

  const stats = [
    {
      label: "Total Assets",
      value: assets.length,
      color: "border-blue-500",
    },
    {
      label: "Available",
      value: assets.filter((a) => a.status === "Available").length,
      color: "border-green-500",
    },
    {
      label: "Assigned",
      value: assets.filter((a) => a.status === "Assigned").length,
      color: "border-indigo-500",
    },
    {
      label: "Under Maintenance",
      value: assets.filter((a) => a.status === "Under Maintenance").length,
      color: "border-yellow-500",
    },
  ];

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  function statusClass(status) {
    const styles = {
      Available: "bg-green-100 text-green-700",
      Assigned: "bg-blue-100 text-blue-700",
      "Under Maintenance": "bg-yellow-100 text-yellow-800",
      Retired: "bg-gray-200 text-gray-700",
      Lost: "bg-red-100 text-red-700",
    };

    return styles[status] || "bg-gray-100 text-gray-700";
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-800 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Asset Management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage organisational assets, assignments, and inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Add Asset
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border-l-4 ${item.color} bg-white p-5 shadow-sm`}
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-5 text-xl font-bold">
              {editingId ? "Edit Asset" : "Register New Asset"}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm font-medium">
                Asset Tag *
                <input
                  className={inputClass}
                  name="asset_tag"
                  value={form.asset_tag}
                  onChange={handleChange}
                  placeholder="AST-001"
                  required
                />
              </label>

              <label className="text-sm font-medium">
                Asset Name *
                <input
                  className={inputClass}
                  name="asset_name"
                  value={form.asset_name}
                  onChange={handleChange}
                  placeholder="Office Laptop"
                  required
                />
              </label>

              <label className="text-sm font-medium">
                Category
                <input
                  className={inputClass}
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Computer"
                />
              </label>

              <label className="text-sm font-medium">
                Serial Number
                <input
                  className={inputClass}
                  name="serial_number"
                  value={form.serial_number}
                  onChange={handleChange}
                  placeholder="Device serial number"
                />
              </label>

              <label className="text-sm font-medium">
                Condition
                <select
                  className={inputClass}
                  name="asset_condition"
                  value={form.asset_condition}
                  onChange={handleChange}
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Status
                <select
                  className={inputClass}
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired</option>
                  <option value="Lost">Lost</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Assign to Staff
                <select
                  className={inputClass}
                  name="assigned_to"
                  value={form.assigned_to}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((previous) => ({
                      ...previous,
                      assigned_to: value,
                      status: value ? "Assigned" : "Available",
                    }));
                  }}
                >
                  <option value="">Not assigned</option>
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.employee_id} - {person.first_name}{" "}
                      {person.last_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium">
                Purchase Date
                <input
                  className={inputClass}
                  type="date"
                  name="purchase_date"
                  value={form.purchase_date}
                  onChange={handleChange}
                />
              </label>

              <label className="text-sm font-medium">
                Purchase Cost (KES)
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  name="purchase_cost"
                  value={form.purchase_cost}
                  onChange={handleChange}
                  placeholder="65000"
                />
              </label>

              <label className="text-sm font-medium md:col-span-2 xl:col-span-3">
                Location
                <input
                  className={inputClass}
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="IT Department"
                />
              </label>

              <label className="text-sm font-medium md:col-span-2 xl:col-span-3">
                Description
                <textarea
                  className={inputClass}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Asset description..."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Asset"
                  : "Save Asset"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assets, tags, staff..."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 sm:flex-1"
          />

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option value="All">All statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Retired">Retired</option>
            <option value="Lost">Lost</option>
          </select>

          <button
            type="button"
            onClick={fetchAssets}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-bold">Asset Inventory</h2>
            <span className="text-sm text-gray-500">
              {filteredAssets.length} asset(s)
            </span>
          </div>

          {loading ? (
            <p className="p-8 text-center text-gray-500">Loading assets...</p>
          ) : filteredAssets.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              No assets found. Add an asset or change your filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-4">Asset</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Condition</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Assigned Staff</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Cost</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{asset.asset_name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {asset.asset_tag}
                        </p>
                        {asset.serial_number && (
                          <p className="mt-1 text-xs text-gray-400">
                            SN: {asset.serial_number}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">{asset.category || "—"}</td>
                      <td className="px-4 py-4">
                        {asset.asset_condition || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                            asset.status
                          )}`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {asset.assigned_staff_name || "Unassigned"}
                        {asset.employee_id && (
                          <p className="mt-1 text-xs text-gray-500">
                            {asset.employee_id}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4">{asset.location || "—"}</td>

                      <td className="px-4 py-4">
                        {asset.purchase_cost != null
                          ? `KES ${Number(asset.purchase_cost).toLocaleString(
                              "en-KE"
                            )}`
                          : "—"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(asset)}
                            className="rounded bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          {asset.status === "Assigned" ? (
                            <button
                              type="button"
                              onClick={() => handleReturn(asset.id)}
                              className="rounded bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                            >
                              Return
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={["Retired", "Lost"].includes(asset.status)}
                              onClick={() => handleAssign(asset.id)}
                              className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                            >
                              Assign
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(asset.id)}
                            className="rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
