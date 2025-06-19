export const API_URL = 'https://nusprofs-api.onrender.com';

async function requestJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    ...opts,
  });

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Server returned non-JSON (status ${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || `Request failed (status ${res.status})`);
  }
  return data;
}

export async function registerUser({ username, email, password, confirm_password }) {
  return requestJSON(`${API_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username, email, password, confirm_password }),
  });
}

export async function loginUser(username, password) {
  return requestJSON(`${API_URL}/auth/token`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then(data => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  });
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error('No refresh token stored');
  const data = await requestJSON(`${API_URL}/auth/token/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });
  localStorage.setItem('access_token', data.access);
  return data.access;
}

export async function getCurrentUser() {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Not authenticated');
  return requestJSON(`${API_URL}/auth/whoami`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logoutUser() {
  const token   = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');

  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ refresh }),
  }).catch(() => {});

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function changeUsername(username) {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Not authenticated');

  return requestJSON(`${API_URL}/auth/change_username`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',    
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username }),
  });
}
