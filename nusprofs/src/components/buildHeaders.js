export default async function buildHeaders(authRequired = false) {
  const headers = { Accept: "application/json" };
  if (!authRequired) return headers;

  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  const verifyRes = await fetch(
    "https://nusprofs-api.onrender.com/auth/token/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: access }),
    }
  );
  let tokenToUse = access;
  if (!verifyRes.ok) {
    const refreshRes = await fetch(
      "https://nusprofs-api.onrender.com/auth/token/refresh",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      }
    );
    if (!refreshRes.ok) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return headers;
    }
    const { access: newAccess } = await refreshRes.json();
    localStorage.setItem("access_token", newAccess);
    tokenToUse = newAccess;
  }

  headers.Authorization = `Bearer ${tokenToUse}`;
  return headers;
}
