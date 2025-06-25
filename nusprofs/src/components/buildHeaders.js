export default function buildHeaders() {
  const token = localStorage.getItem("access_token");
  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}