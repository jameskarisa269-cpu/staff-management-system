import { useState } from "react";

const LOGIN_URL = "http://localhost:5000/api/auth/login";

export default function Login({ onLogin }) {
  const [role, setRole] = useState("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in.");
      }
      onLogin(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#800000]">
            StaffHub
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">
            Access your staff management workspace.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="login-role" className="mb-2 block text-sm font-semibold text-slate-700">
              Sign in as
            </label>
            <select
              id="login-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white transition hover:bg-[#650000] disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
