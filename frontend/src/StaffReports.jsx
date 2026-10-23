import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";

const SUBMISSIONS_URL = "http://localhost:5000/api/submissions";

function localWeekStart() {
  const date = new Date();
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const emptyBrief = {
  week_start: localWeekStart(),
  work_done: "",
  next_week: "",
  challenges: "",
  impact: "",
};

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "The request failed.");
  return data;
}

async function fetchStaffReportData() {
  const [reportsData, briefsData, tasksData] = await Promise.all([
    readResponse(await apiFetch(`${SUBMISSIONS_URL}/reports`)),
    readResponse(await apiFetch(`${SUBMISSIONS_URL}/weekly-briefs`)),
    readResponse(await apiFetch("http://localhost:5000/api/tasks")),
  ]);
  return {
    reports: reportsData.reports || [],
    briefs: briefsData.briefs || [],
    tasks: tasksData.tasks || [],
  };
}

export default function StaffReports({ user }) {
  const [reportForm, setReportForm] = useState({ task_id: "", title: "", content: "" });
  const [briefForm, setBriefForm] = useState(emptyBrief);
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingReport, setSavingReport] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchStaffReportData();
      setReports(data.reports);
      setBriefs(data.briefs);
      setTasks(data.tasks);
    } catch (requestError) {
      setError(requestError.message || "Unable to load reports and weekly briefs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadInitialData() {
      try {
        const data = await fetchStaffReportData();
        if (active) {
          setReports(data.reports);
          setBriefs(data.briefs);
          setTasks(data.tasks);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load reports and weekly briefs.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInitialData();
    return () => {
      active = false;
    };
  }, []);

  async function submitReport(event) {
    event.preventDefault();
    setSavingReport(true);
    setError("");
    setMessage("");
    try {
      await readResponse(await apiFetch(`${SUBMISSIONS_URL}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportForm,
          task_id: reportForm.task_id || null,
        }),
      }));
      setReportForm({ task_id: "", title: "", content: "" });
      setMessage("Your report was sent to the administrator.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to send your report.");
    } finally {
      setSavingReport(false);
    }
  }

  async function submitBrief(event) {
    event.preventDefault();
    setSavingBrief(true);
    setError("");
    setMessage("");
    try {
      await readResponse(await apiFetch(`${SUBMISSIONS_URL}/weekly-briefs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefForm),
      }));
      setMessage("Your weekly brief is now shared with all staff.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message || "Unable to submit weekly brief.");
    } finally {
      setSavingBrief(false);
    }
  }

  return (
    <div className="space-y-8 bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & weekly briefs</h1>
        <p className="mt-2 text-sm text-slate-600">
          Send progress to your administrator and share weekly department progress with all staff.
        </p>
      </div>

      {message && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={submitReport} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Send a report to admin</h2>
            <p className="mt-1 text-sm text-slate-500">Send a task update or a separate manual report.</p>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Related task (optional)
            <select
              value={reportForm.task_id}
              onChange={(event) => setReportForm({ ...reportForm, task_id: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal"
            >
              <option value="">Manual report</option>
              {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Report title
            <input
              required
              maxLength={200}
              value={reportForm.title}
              onChange={(event) => setReportForm({ ...reportForm, title: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Details
            <textarea
              required
              rows={5}
              value={reportForm.content}
              onChange={(event) => setReportForm({ ...reportForm, content: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal"
              placeholder="Describe progress, results, and any follow-up needed."
            />
          </label>
          <button disabled={savingReport} className="rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white disabled:opacity-60">
            {savingReport ? "Sending..." : "Send to admin"}
          </button>
        </form>

        <form onSubmit={submitBrief} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Weekly brief</h2>
            <p className="mt-1 text-sm text-slate-500">
              {user.department ? `${user.department} department · ` : ""}Shared with all staff.
            </p>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Week starting
            <input
              type="date"
              required
              value={briefForm.week_start}
              onChange={(event) => setBriefForm({ ...briefForm, week_start: event.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal"
            />
          </label>
          {[
            ["work_done", "What we did this week"],
            ["next_week", "What I will do next week"],
            ["challenges", "Challenges faced this week"],
            ["impact", "Impact this week"],
          ].map(([field, label]) => (
            <label key={field} className="block text-sm font-semibold text-slate-700">
              {label}
              <textarea
                required
                rows={3}
                value={briefForm[field]}
                onChange={(event) => setBriefForm({ ...briefForm, [field]: event.target.value })}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal"
              />
            </label>
          ))}
          <button disabled={savingBrief} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60">
            {savingBrief ? "Submitting..." : "Share weekly brief"}
          </button>
        </form>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Weekly progress from staff</h2>
            <p className="mt-1 text-sm text-slate-500">Briefs are shared across departments for everyone to review.</p>
          </div>
          <button type="button" onClick={loadData} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Refresh
          </button>
        </div>
        {loading ? <p className="py-8 text-center text-slate-500">Loading weekly briefs...</p> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {briefs.map((brief) => (
              <article key={brief.id} className="rounded-lg border border-slate-200 p-5">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800">{brief.staff_name}</h3>
                    <p className="text-sm text-slate-500">{brief.department_name || "Department not set"} · {brief.employee_id}</p>
                  </div>
                  <time className="text-sm font-semibold text-[#800000]">Week of {String(brief.week_start).slice(0, 10)}</time>
                </div>
                {[
                  ["What we did this week", brief.work_done],
                  ["What I will do next week", brief.next_week],
                  ["Challenges", brief.challenges],
                  ["Impact", brief.impact],
                ].map(([heading, text]) => (
                  <div key={heading} className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-700">{heading}</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{text}</p>
                  </div>
                ))}
              </article>
            ))}
            {!briefs.length && <p className="py-8 text-center text-slate-500 lg:col-span-2">No weekly briefs have been submitted yet.</p>}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">My sent reports</h2>
        {loading ? <p className="py-8 text-center text-slate-500">Loading reports...</p> : (
          <div className="mt-4 divide-y divide-slate-100">
            {reports.map((report) => (
              <article key={report.id} className="py-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{report.title}</h3>
                  <time className="text-sm text-slate-500">{new Date(report.created_at).toLocaleString()}</time>
                </div>
                {report.task_title && <p className="mt-1 text-sm text-slate-600">Task: {report.task_title}</p>}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{report.content}</p>
              </article>
            ))}
            {!reports.length && <p className="py-8 text-center text-slate-500">You have not sent any reports yet.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
