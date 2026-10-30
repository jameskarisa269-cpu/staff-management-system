import { useEffect, useRef, useState } from "react";
import Staff from "../staff";
import Departmental from "../departmental";
import Attendance from "../attendance";
import Tasks from "../tasks";
import Asset from "../asset";
import Reports from "../reports";
import Notifications from "../notifications";
import StaffAttendance from "../StaffAttendance";
import AuditLogs from "../auditlog";
import Icon from "../components/Icon";
import { apiFetch } from "./api";

const REPORTS_URL = "http://localhost:5000/api/reports";

async function fetchDashboardSummary() {
  const response = await apiFetch(`${REPORTS_URL}/dashboard`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Dashboard summary is unavailable (HTTP ${response.status}).`,
    );
  }

  if (!data.summary) {
    throw new Error("The dashboard summary response was incomplete.");
  }

  return data.summary;
}

const modules = [
  { name: "Dashboard", icon: "dashboard" },
  { name: "Staff", icon: "users" },
  { name: "Departments & Roles", icon: "building" },
  { name: "Attendance", icon: "calendar" },
  { name: "Tasks", icon: "checklist" },
  { name: "Assets", icon: "briefcase" },
  { name: "Reports", icon: "chart" },
  { name: "Notifications", icon: "bell" },
  { name: "Audit Logs", icon: "clipboard" },
];

const summaryCards = [
  {
    key: "staff",
    title: "Staff",
    module: "Staff",
    total: "total_staff",
    details: [
      ["Active", "active_staff"],
      ["Inactive", "inactive_staff"],
    ],
    color: "border-blue-500",
  },
  {
    key: "departments",
    title: "Departments",
    module: "Departments & Roles",
    total: "total_departments",
    details: [
      ["Active", "active_departments"],
      ["Inactive", "inactive_departments"],
    ],
    color: "border-violet-500",
  },
  {
    key: "attendance",
    title: "Attendance Records",
    module: "Attendance",
    total: "total_records",
    details: [
      ["Present", "present"],
      ["Late", "late"],
      ["Absent", "absent"],
    ],
    color: "border-green-500",
  },
  {
    key: "tasks",
    title: "Tasks",
    module: "Tasks",
    total: "total_tasks",
    details: [
      ["Pending", "pending"],
      ["In Progress", "in_progress"],
      ["Completed", "completed"],
      ["Cancelled", "cancelled"],
    ],
    color: "border-amber-500",
  },
  {
    key: "assets",
    title: "Assets",
    module: "Assets",
    total: "total_assets",
    details: [
      ["Available", "available"],
      ["Assigned", "assigned"],
      ["Maintenance", "under_maintenance"],
      ["Retired", "retired"],
      ["Lost", "lost"],
    ],
    color: "border-indigo-500",
  },
];

function countValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  const count = Number(value);
  return Number.isFinite(count) ? count : "—";
}

function DashboardOverview({ onOpenModule }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const data = await fetchDashboardSummary();
        if (active) {
          setSummary(data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load dashboard summary.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome to StaffHub
          </h1>
          <p className="mt-2 text-slate-500">
            Organisation overview from your current staff, attendance, tasks,
            and asset records.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            setError("");
            try {
              setSummary(await fetchDashboardSummary());
            } catch (requestError) {
              setError(requestError.message || "Unable to load dashboard summary.");
            } finally {
              setLoading(false);
            }
          }}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh summary
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const values = summary?.[card.key];
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onOpenModule(card.module)}
              className={`rounded-xl border border-slate-200 border-l-4 ${card.color} bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-700">{card.title}</h2>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                  View module <Icon name="arrowRight" size={14} />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {loading ? "…" : countValue(values?.[card.total])}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
                {card.details.map(([label, key]) => (
                  <span key={key} className="text-sm text-slate-500">
                    {label}:{" "}
                    <strong className="font-semibold text-slate-700">
                      {loading ? "…" : countValue(values?.[key])}
                    </strong>
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-800">Modules</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules
            .filter((module) => module.name !== "Dashboard")
            .map((module) => (
              <button
                key={module.name}
                type="button"
                onClick={() => onOpenModule(module.name)}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#800000] hover:shadow-md"
              >
                <Icon name={module.icon} size={30} className="text-[#800000]" />
                <h3 className="mt-3 font-semibold text-slate-800">
                  {module.name}
                </h3>
                <span className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                  Open module <Icon name="arrowRight" size={14} />
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const staffModules = [
    { name: "Attendance", icon: "calendar" },
    { name: "Tasks", icon: "checklist" },
    { name: "Reports", icon: "chart" },
    { name: "Notifications", icon: "bell" },
  ];
  const visibleModules = user.role === "admin" ? modules : staffModules;
  const [activeModule, setActiveModule] = useState(
    user.role === "admin" ? "Dashboard" : "Tasks",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);
  const mobileCloseButtonRef = useRef(null);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    mobileCloseButtonRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        mobileMenuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const drawer = document.getElementById("mobile-navigation");
        const focusable = drawer?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  function openModule(name) {
    setActiveModule(name);
    setMobileNavOpen(false);
    if (mobileNavOpen) mobileMenuButtonRef.current?.focus();
  }

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to main content
      </a>
      {/* MAIN SIDEBAR */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[#5c0011] px-4 py-6 text-white md:flex">
        <h1 className="mb-10 px-2 text-2xl font-bold">
          Staff<span className="text-[#e8a0b0]">Hub</span>
        </h1>

        <p className="mb-3 px-3 text-xs font-semibold tracking-widest text-slate-400">
          MAIN MENU
        </p>

        <nav aria-label="Main navigation" className="flex flex-col gap-2">
          {visibleModules.map((module) => (
            <button
              key={module.name}
              type="button"
              aria-current={activeModule === module.name ? "page" : undefined}
              onClick={() => openModule(module.name)}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                activeModule === module.name
                  ? "bg-[#800000] font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon name={module.icon} size={20} className="shrink-0" />
              <span>{module.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-700 px-2 pt-5">
          <p className="truncate text-sm text-slate-300">
            {user.role === "admin" ? "Administrator" : user.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Version 1.0.0
          </p>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="mobile-nav-layer md:hidden">
          <button
            type="button"
            className="mobile-nav-backdrop"
            aria-label="Close navigation menu"
            onClick={() => {
              setMobileNavOpen(false);
              mobileMenuButtonRef.current?.focus();
            }}
          />
          <aside
            id="mobile-navigation"
            className="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 id="mobile-navigation-title" className="px-2 text-2xl font-bold">
                Staff<span className="text-[#e8a0b0]">Hub</span>
              </h2>
              <button
                ref={mobileCloseButtonRef}
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  mobileMenuButtonRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-slate-800"
              >
                <Icon name="close" size={22} />
              </button>
            </div>
            <p className="mb-3 px-3 text-xs font-semibold tracking-widest text-slate-300">
              MAIN MENU
            </p>
            <nav aria-label="Main navigation" className="flex flex-col gap-2">
              {visibleModules.map((module) => (
                <button
                  key={module.name}
                  type="button"
                  aria-current={activeModule === module.name ? "page" : undefined}
                  onClick={() => openModule(module.name)}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${
                    activeModule === module.name
                      ? "bg-[#800000] font-semibold text-white"
                      : "text-slate-200 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon name={module.icon} size={20} className="shrink-0" />
                  <span>{module.name}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main
        id="main-content"
        aria-label="Main content"
        tabIndex={-1}
        className="flex min-w-0 flex-1 flex-col"
      >
        {/* HEADER */}
        <header className="app-header flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-2 sm:min-h-20 sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 md:hidden"
            >
              <Icon name="menu" size={22} />
            </button>
            <div className="min-w-0">
            <p className="hidden text-xs font-semibold tracking-wider text-[#800000] sm:block">
              STAFF MANAGEMENT SYSTEM
            </p>
            <h2 className="truncate text-base font-bold text-slate-800 sm:mt-1 sm:text-2xl">
              {activeModule}
            </h2>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            {user.role === "staff" && (
              <>
                <button
                  type="button"
                  onClick={() => openModule("Attendance")}
                  aria-label="Check in"
                  title="Check in"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#800000] text-sm font-semibold text-white hover:bg-[#650000] sm:h-11 sm:w-auto sm:px-3 sm:py-2"
                >
                  <Icon name="calendar" size={18} />
                  <span className="hidden sm:inline">Check in</span>
                </button>
                <button
                  type="button"
                  onClick={() => openModule("Notifications")}
                  aria-label="Open notifications"
                  title="Notifications"
                  className={`relative flex h-11 w-11 items-center justify-center rounded-lg border ${
                    activeModule === "Notifications"
                      ? "border-[#800000] bg-[#f5e8eb] text-[#800000]"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon name="bell" size={20} />
                  <span className="sr-only">Notifications</span>
                </button>
              </>
            )}
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5e8eb] font-bold text-[#800000] sm:flex">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-10 shrink-0 whitespace-nowrap rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:min-h-11 sm:px-3 sm:text-sm"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* MODULE CONTENT */}
        <section
          className={`min-w-0 flex-1 ${
            activeModule === "Staff" ? "p-0" : "p-4 sm:p-6"
          }`}
        >
          {user.role === "admin" && activeModule === "Staff" ? (
            <Staff />
          ) : user.role === "admin" && activeModule === "Departments & Roles" ? (
            <Departmental />
          ) : user.role === "admin" && activeModule === "Attendance" ? (
            <Attendance />
          ) : user.role === "staff" && activeModule === "Attendance" ? (
            <StaffAttendance user={user} />
          ) : activeModule === "Tasks" ? (
            <Tasks user={user} />
          ) : user.role === "admin" && activeModule === "Assets" ? (
            <Asset />
          ) : activeModule === "Reports" ? (
            <Reports user={user} />
          ) : activeModule === "Notifications" ? (
            <Notifications user={user} />
          ) : user.role === "admin" && activeModule === "Audit Logs" ? (
            <AuditLogs />
          ) : user.role === "admin" && activeModule === "Dashboard" ? (
            <DashboardOverview onOpenModule={setActiveModule} />
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Icon
                name={
                  modules.find((module) => module.name === activeModule)?.icon ||
                  "dashboard"
                }
                size={48}
                className="text-[#800000]"
              />

              <h2 className="mt-4 text-xl font-bold text-slate-800">
                {activeModule}
              </h2>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                This module will be developed here as we build the
                system one module at a time.
              </p>

              <button
                type="button"
                onClick={() => setActiveModule("Dashboard")}
                className="mt-6 rounded-lg bg-[#800000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#650000]"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
          Staff Management System © {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}