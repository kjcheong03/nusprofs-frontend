export default function buildHeaders(authRequired = false) {
  const headers = {
    Accept: "application/json",
  };

  if (authRequired) {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}