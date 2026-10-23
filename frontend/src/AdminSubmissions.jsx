import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";

const API_URL = "http://localhost:5000/api/submissions";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

async function fetchSubmissions() {
  const [reportData, briefData] = await Promise.all([
    readResponse(await apiFetch(`${API_URL}/reports`)),
    readResponse(await apiFetch(`${API_URL}/weekly-briefs`)),
  ]);
  return { reports: reportData.reports || [], briefs: briefData.briefs || [] };
}

export default function AdminSubmissions() {
  const [reports, setReports] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSubmissions();
      setReports(data.reports);
      setBriefs(data.briefs);
    } catch (requestError) {
      setError(requestError.message || "Unable to load staff submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadInitialSubmissions() {
      try {
        const data = await fetchSubmissions();
        if (active) {
          setReports(data.reports);
          setBriefs(data.briefs);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load staff submissions.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInitialSubmissions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Staff submissions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Reports sent to admin and weekly briefs shared by staff.
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">
          {loading ? "Loading..." : "Refresh submissions"}
        </button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? <p className="py-8 text-center text-slate-500">Loading submissions...</p> : (
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold text-slate-800">Reports ({reports.length})</h3>
            <div className="max-h-[32rem] space-y-3 overflow-y-auto">
              {reports.map((report) => (
                <article key={report.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h4 className="font-semibold text-slate-800">{report.title}</h4>
                    <time className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</time>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{report.staff_name} · {report.department || "No department"} · {report.employee_id}</p>
                  {report.task_title && <p className="mt-2 text-sm font-medium text-[#800000]">Task: {report.task_title}</p>}
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{report.content}</p>
                </article>
              ))}
              {!reports.length && <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No staff reports have been sent.</p>}
            </div>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-slate-800">Weekly briefs ({briefs.length})</h3>
            <div className="max-h-[32rem] space-y-3 overflow-y-auto">
              {briefs.map((brief) => (
                <article key={brief.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h4 className="font-semibold text-slate-800">{brief.staff_name}</h4>
                    <time className="text-xs text-slate-500">Week of {String(brief.week_start).slice(0, 10)}</time>
                  </div>
                  <p className="text-sm text-slate-500">{brief.department_name || "Department not set"} · {brief.employee_id}</p>
                  {[
                    ["Done this week", brief.work_done],
                    ["Next week", brief.next_week],
                    ["Challenges", brief.challenges],
                    ["Impact", brief.impact],
                  ].map(([label, value]) => (
                    <p key={label} className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                      <strong>{label}: </strong>{value}
                    </p>
                  ))}
                </article>
              ))}
              {!briefs.length && <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">No weekly briefs have been shared yet.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
