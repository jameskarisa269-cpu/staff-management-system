export function apiFetch(input, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = window.localStorage.getItem("staffhub_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...options, headers }).then((response) => {
    if (response.status === 401) {
      window.dispatchEvent(new Event("staffhub:unauthorized"));
    }
    return response;
  });
}