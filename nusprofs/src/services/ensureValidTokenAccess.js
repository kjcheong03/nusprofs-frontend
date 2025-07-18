export async function ensureValidAccessToken() {
  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  const verifyRes = await fetch("https://nusprofs-api.onrender.com/auth/token/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: access }),
  });
  if (verifyRes.ok) return access;

  const refreshRes = await fetch("https://nusprofs-api.onrender.com/auth/token/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!refreshRes.ok) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }

  const data = await refreshRes.json();
  localStorage.setItem("access_token", data.access);
  return data.access;
}
