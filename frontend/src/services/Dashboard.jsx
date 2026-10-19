import { useState } from "react";
import Staff from "../staff";

const modules = [
  { name: "Dashboard", icon: "▦" },
  { name: "Staff", icon: "👥" },
  { name: "Departments & Roles", icon: "🏢" },
  { name: "Attendance", icon: "📅" },
  { name: "Tasks", icon: "✓" },
  { name: "Assets", icon: "💼" },
  { name: "Reports", icon: "📊" },
  { name: "Notifications", icon: "🔔" },
  { name: "Audit Logs", icon: "📋" },
];

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState("Staff");

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      {/* MAIN SIDEBAR */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[#5c0011] px-4 py-6 text-white">
        <h1 className="mb-10 px-2 text-2xl font-bold">
          Staff<span className="text-[#e8a0b0]">Hub</span>
        </h1>

        <p className="mb-3 px-3 text-xs font-semibold tracking-widest text-slate-400">
          MAIN MENU
        </p>

        <nav className="flex flex-col gap-2">
          {modules.map((module) => (
            <button
              key={module.name}
              type="button"
              onClick={() => setActiveModule(module.name)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                activeModule === module.name
                  ? "bg-[#800000] font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="w-6 text-center text-lg">
                {module.icon}
              </span>
              <span>{module.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-700 px-2 pt-5">
          <p className="text-sm text-slate-300">
            Staff Management System
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Version 1.0.0
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#800000]">
              STAFF MANAGEMENT SYSTEM
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-800">
              {activeModule}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5e8eb] font-bold text-[#800000]">
              A
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Administrator</p>
              <p className="text-xs text-slate-500">System Admin</p>
            </div>
          </div>
        </header>

        {/* MODULE CONTENT */}
        <section
          className={`min-w-0 flex-1 ${
            activeModule === "Staff" ? "p-0" : "p-4 sm:p-6"
          }`}
        >
          {activeModule === "Staff" ? (
            <Staff />
          ) : activeModule === "Dashboard" ? (
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Welcome to StaffHub
              </h1>
              <p className="mt-2 text-slate-500">
                Manage your organisation's staff and daily operations
                from one place.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {modules
                  .filter((module) => module.name !== "Dashboard")
                  .map((module) => (
                    <button
                      key={module.name}
                      type="button"
                      onClick={() => setActiveModule(module.name)}
                      className="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#800000] hover:shadow-md"
                    >
                      <span className="text-3xl">{module.icon}</span>
                      <h3 className="mt-4 font-semibold text-slate-800">
                        {module.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Open module →
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <span className="text-5xl">
                {
                  modules.find(
                    (module) => module.name === activeModule
                  )?.icon
                }
              </span>

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