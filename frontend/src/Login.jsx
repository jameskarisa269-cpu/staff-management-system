import { useState } from "react";
import { apiFetch } from "./services/api";

const AUTH_URL = "/api/auth";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("staff");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const signup = mode === "signup";
      const response = await apiFetch(
        signup ? `${AUTH_URL}/account-requests` : `${AUTH_URL}/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            signup
              ? { first_name: firstName, last_name: lastName, email, password }
              : { email, password, role },
          ),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || (signup ? "Unable to submit your request." : "Unable to sign in."));
      }

      if (signup) {
        setMessage(data.message);
        setPassword("");
      } else {
        onLogin(data);
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  const isSignup = mode === "signup";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#800000]">
            Elimu
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Staff Management System
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            {isSignup ? "Request an account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignup
              ? "Your request will be sent to an administrator for approval."
              : "Access your staff management workspace."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {isSignup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="signup-first-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  First name
                </label>
                <input
                  id="signup-first-name"
                  type="text"
                  autoComplete="given-name"
                  maxLength={100}
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />
              </div>
              <div>
                <label htmlFor="signup-last-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  Last name
                </label>
                <input
                  id="signup-last-name"
                  type="text"
                  autoComplete="family-name"
                  maxLength={100}
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />
              </div>
            </div>
          ) : (
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
          )}
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              maxLength={254}
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
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
            {isSignup && (
              <p className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#800000] px-5 py-3 font-semibold text-white transition hover:bg-[#650000] disabled:opacity-60"
          >
            {submitting
              ? isSignup ? "Sending request..." : "Signing in..."
              : isSignup ? "Send account request" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isSignup ? "Already have an account?" : "New to Elimu?"}{" "}
          <button
            type="button"
            onClick={() => changeMode(isSignup ? "login" : "signup")}
            className="font-semibold text-[#800000] underline underline-offset-2"
          >
            {isSignup ? "Sign in" : "Request an account"}
          </button>
        </p>
      </section>
    </main>
  );
}
