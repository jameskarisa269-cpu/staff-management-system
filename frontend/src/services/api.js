
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

function resolveApiUrl(input) {
  if (
    typeof input === "string" &&
    (input === "/api" || input.startsWith("/api/"))
  ) {
    return `${API_BASE_URL}${input}`;
  }

  return input;
}

export function apiFetch(input, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = window.localStorage.getItem("staffhub_token");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(resolveApiUrl(input), {
    ...options,
    headers,
  }).then((response) => {
    if (response.status === 401) {
      window.dispatchEvent(new Event("staffhub:unauthorized"));
    }

    return response;
  });
}
