import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/reports";

const reportDefinitions = [
  {
    key: "staff",
    label: "Staff",
    endpoint: "staff",
    collection: "staff",
    columns: [
      ["Employee ID", "employee_id"],
      ["Name", "name"],
      ["Department", "department"],
      ["Position", "position"],
      ["Status", "employment_status"],
      ["Email", "email"],
    ],
  },
  {
    key: "departments",
    label: "Departments",
    endpoint: "departments",
    collection: "departments",
    columns: [
      ["Department", "department_name"],
      ["Manager", "manager_name"],
      ["Staff", "total_staff"],
      ["Active staff", "active_staff"],
      ["Status", "status"],
      ["Description", "description"],
    ],
  },
  {
    key: "attendance",
    label: "Attendance",
    endpoint: "attendance",
    collection: "attendance",
    columns: [
      ["Date", "attendance_date"],
      ["Employee", "name"],
      ["Employee ID", "employee_id"],
      ["Department", "department"],
      ["Check-in", "check_in_time"],
      ["Status", "status"],
      ["Remarks", "remarks"],
    ],
  },
  {
    key: "tasks",
    label: "Tasks",
    endpoint: "tasks",
    collection: "tasks",
    columns: [
      ["Task", "title"],
      ["Assigned to", "assigned_staff_name"],
      ["Priority", "priority"],
      ["Status", "status"],
      ["Start date", "start_date"],
      ["Due date", "due_date"],
    ],
  },
  {
    key: "assets",
    label: "Assets",
    endpoint: "assets",
    collection: "assets",
    columns: [
      ["Asset", "asset_name"],
      ["Tag", "asset_tag"],
      ["Category", "category"],
      ["Status", "status"],
      ["Assigned to", "assigned_staff_name"],
      ["Location", "location"],
      ["Cost", "purchase_cost"],
    ],
  },
];

async function fetchReport(definition) {
  const response = await fetch(`${API_URL}/${definition.endpoint}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Unable to load ${definition.label.toLowerCase()} report.`,
    );
  }

  if (!Array.isArray(data[definition.collection])) {
    throw new Error(`The ${definition.label.toLowerCase()} report response is invalid.`);
  }

  return data[definition.collection];
}

async function requestReports() {
  const results = await Promise.allSettled(
    reportDefinitions.map(async (definition) => [
      definition.key,
      await fetchReport(definition),
    ]),
  );

  const loadedReports = {};
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const [key, rows] = result.value;
      loadedReports[key] = rows;
    } else {
      errors.push(
        `${reportDefinitions[index].label}: ${
          result.reason?.message || "Could not load report."
        }`,
      );
    }
  });

  return { loadedReports, errorMessage: errors.join(" ") };
}

function displayValue(value, column, row) {
  if (column === "name") {
    return `${row.first_name || ""} ${row.last_name || ""}`.trim() || "—";
  }

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (["attendance_date", "check_in_time", "start_date", "due_date"].includes(column)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return column === "check_in_time"
      ? date.toLocaleString()
      : date.toLocaleDateString();
  }

  return String(value);
}

export default function Reports() {
  const [activeReport, setActiveReport] = useState("staff");
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadReports(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const { loadedReports, errorMessage } = await requestReports();
    setReports(loadedReports);
    setError(errorMessage);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    let cancelled = false;
    requestReports().then(({ loadedReports, errorMessage }) => {
      if (cancelled) return;
      setReports(loadedReports);
      setError(errorMessage);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedReport = reportDefinitions.find(
    (report) => report.key === activeReport,
  );
  const rows = reports[activeReport] || [];
  const query = search.trim().toLowerCase();
  const filteredRows = rows.filter((row) =>
    selectedReport.columns.some(([, column]) =>
      displayValue(row[column], column, row)
        .toLowerCase()
        .includes(query),
    ),
  );

  return (
    <div className="bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-slate-600">
              View and search reports from your saved records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadReports(true)}
            disabled={refreshing}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh reports"}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {reportDefinitions.map((report) => (
            <button
              key={report.key}
              type="button"
              onClick={() => {
                setActiveReport(report.key);
                setSearch("");
              }}
              className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                activeReport === report.key
                  ? "border-[#800000] ring-2 ring-[#800000]/10"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="block text-sm font-medium text-slate-500">
                {report.label}
              </span>
              <span className="mt-1 block text-2xl font-bold text-slate-800">
                {loading ? "…" : (reports[report.key]?.length ?? 0)}
              </span>
              <span className="text-xs text-slate-400">records</span>
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {selectedReport.label} Report
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading report..."
                  : `${filteredRows.length} of ${rows.length} record(s)`}
              </p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${selectedReport.label.toLowerCase()}...`}
              aria-label={`Search ${selectedReport.label.toLowerCase()} report`}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 sm:max-w-xs"
            />
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading reports...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {selectedReport.columns.map(([label]) => (
                      <th key={label} className="px-5 py-4 font-semibold">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row, index) => (
                    <tr
                      key={row.id ?? `${activeReport}-${index}`}
                      className="align-top hover:bg-slate-50"
                    >
                      {selectedReport.columns.map(([, column]) => (
                        <td key={column} className="max-w-sm px-5 py-4 text-slate-700">
                          {displayValue(row[column], column, row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!filteredRows.length && (
                    <tr>
                      <td
                        colSpan={selectedReport.columns.length}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        {rows.length
                          ? "No records match your search."
                          : `No ${selectedReport.label.toLowerCase()} records are available.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
