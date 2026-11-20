import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";

const AUTH_URL = "/api/auth/account-requests";
const DEPARTMENTS_URL = "/api/departments";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

export default function AccountRequests() {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const [requestData, departmentData] = await Promise.all([
        readResponse(await apiFetch(AUTH_URL)),
        readResponse(await apiFetch(DEPARTMENTS_URL)),
      ]);
      setRequests(requestData.requests || []);
      setDepartments(
        (Array.isArray(departmentData) ? departmentData : departmentData.departments || [])
          .filter((department) => department.status === "Active"),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load account requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadInitialRequests() {
      try {
        const [requestResponse, departmentResponse] = await Promise.all([
          apiFetch(AUTH_URL),
          apiFetch(DEPARTMENTS_URL),
        ]);
        const [requestData, departmentData] = await Promise.all([
          readResponse(requestResponse),
          readResponse(departmentResponse),
        ]);
        if (active) {
          setRequests(requestData.requests || []);
          setDepartments(
            (Array.isArray(departmentData) ? departmentData : departmentData.departments || [])
              .filter((department) => department.status === "Active"),
          );
        }
      } catch (requestError) {
        if (active) setError(requestError.message || "Unable to load account requests.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialRequests();
    return () => {
      active = false;
    };
  }, []);

  function updateForm(requestId, field, value) {
    setForms((current) => ({
      ...current,
      [requestId]: { ...current[requestId], [field]: value },
    }));
  }

  async function reviewRequest(request, action) {
    setWorkingId(request.id);
    setError("");
    setMessage("");
    try {
      const form = forms[request.id] || {};
      const response = await apiFetch(`${AUTH_URL}/${request.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(action === "approve"
          ? {
              body: JSON.stringify({
                department_id: form.department_id || "",
                position: form.position || "",
                is_senior: Boolean(form.is_senior),
              }),
            }
          : {}),
      });
      const data = await readResponse(response);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setMessage(
        data.employee_id
          ? `${data.message} Employee ID: ${data.employee_id}`
          : data.message,
      );
    } catch (requestError) {
      setError(requestError.message || `Unable to ${action} this account request.`);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Account requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review new staff signups. Approved applicants can then sign in with their submitted password.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}

      {loading ? (
        <p className="py-8 text-center text-slate-500">Loading account requests...</p>
      ) : requests.length ? (
        <div className="space-y-4">
          {requests.map((request) => {
            const form = forms[request.id] || {};
            const busy = workingId === request.id;
            const reviewInProgress = workingId !== null;
            return (
              <article key={request.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {request.first_name} {request.last_name}
                    </h3>
                    <p className="text-sm text-slate-600">{request.email}</p>
                  </div>
                  <time className="text-xs text-slate-500">
                    Requested {new Date(request.created_at).toLocaleString()}
                  </time>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700">
                    Department
                    <select
                      required
                      value={form.department_id || ""}
                      onChange={(event) => updateForm(request.id, "department_id", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>{department.department_name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Position (optional)
                    <input
                      type="text"
                      maxLength={100}
                      value={form.position || ""}
                      onChange={(event) => updateForm(request.id, "position", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(form.is_senior)}
                    onChange={(event) => updateForm(request.id, "is_senior", event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#800000]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Grant Senior Staff access</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      This allows them to assign job positions to active staff in their own department.
                    </span>
                  </span>
                </label>
                {!departments.length && (
                  <p className="mt-3 text-sm text-amber-700">Create an active department before approving requests.</p>
                )}
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => reviewRequest(request, "reject")}
                    disabled={reviewInProgress}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy ? "Saving..." : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewRequest(request, "approve")}
                    disabled={reviewInProgress || !departments.length || !form.department_id}
                    className="rounded-lg bg-[#800000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#650000] disabled:opacity-60"
                  >
                    {busy ? "Saving..." : "Approve and create account"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
          There are no account requests awaiting approval.
        </p>
      )}
    </section>
  );
}
