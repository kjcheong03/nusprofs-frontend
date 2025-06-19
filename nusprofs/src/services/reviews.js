import { API_URL } from './auth';

async function requestJSON(url, opts = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
    ...(token && !opts.headers?.Authorization
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };

  const res = await fetch(url, { ...opts, headers });

  if (res.status === 204) {
    return {};
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Server returned non-JSON (status ${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.detail || data.error || `Request failed (status ${res.status})`
    );
  }

  return data;
}

export function getUserReviews(username) {
  const url = username
    ? `${API_URL}/reviews/users/${encodeURIComponent(username)}`
    : `${API_URL}/reviews/users/`;
  return requestJSON(url, { method: 'GET' })
    .then(d => d.results || []);
}

export function getReviewsForProfessor(prof_id) {
  return requestJSON(
    `${API_URL}/reviews/professors/${encodeURIComponent(prof_id)}`,
    { method: 'GET' }
  ).then(d => d.results || []);
}

export function getReplies(review_id) {
  return requestJSON(
    `${API_URL}/reviews/${encodeURIComponent(review_id)}/replies`,
    { method: 'GET' }
  ).then(d => d.results || []);
}

export function createReview({ prof_id, module_code, text, rating }) {
  return requestJSON(`${API_URL}/reviews/create`, {
    method: 'POST',
    body: JSON.stringify({ prof_id, module_code, text, rating }),
  });
}

export function editReview(id, { module_code, text, rating }) {
  return requestJSON(`${API_URL}/reviews/${id}/edit`, {
    method: 'PATCH',
    body: JSON.stringify({ module_code, text, rating }),
  });
}

export function deleteReview(id) {
  return requestJSON(`${API_URL}/reviews/${id}/delete`, {
    method: 'DELETE',
  });
}

export function likeReview(id) {
  return requestJSON(`${API_URL}/reviews/${id}/like`, {
    method: 'POST',
  });
}

export function createReply(review_id, text) {
  return requestJSON(`${API_URL}/reviews/${review_id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ review_id, text }),
  });
}

export function editReply(id, { text }) {
  return requestJSON(`${API_URL}/reviews/reply/${id}/edit`, {
    method: 'PUT',
    body: JSON.stringify({ text }),
  });
}

export function deleteReply(id) {
  return requestJSON(`${API_URL}/reviews/reply/${id}/delete`, {
    method: 'DELETE',
  });
}

export function likeReply(id) {
  return requestJSON(`${API_URL}/reviews/reply/${id}/like`, {
    method: 'POST',
  });
}
