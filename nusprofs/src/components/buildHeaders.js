export default async function buildHeaders(authRequired = false) {
  const headers = { Accept: "application/json" };
  if (!authRequired) return headers;

  const access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  let validAccess = access;

  const verifyRes = await fetch(
    "https://nusprofs-api.onrender.com/auth/token/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: access }),
    }
  );

  if (!verifyRes.ok && refresh) {
    const refreshRes = await fetch(
      "https://nusprofs-api.onrender.com/auth/token/refresh",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      }
    );

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      validAccess = data.access;
      localStorage.setItem("access_token", validAccess);
    } else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return headers;
    }
  }

  headers.Authorization = `Bearer ${validAccess}`;
  return headers;
}
