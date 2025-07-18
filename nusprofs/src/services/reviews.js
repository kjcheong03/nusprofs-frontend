import { API_URL } from './auth';
import buildHeaders from '../components/buildHeaders';

async function requestJSON(url, opts = {}, authRequired = false) {
  const baseHeaders = await buildHeaders(authRequired);
  const headers = {
    'Content-Type': 'application/json',
    ...baseHeaders,
    ...(opts.headers || {}),
  };

  const res = await fetch(url, { ...opts, headers });
  if (res.status === 204) return {};
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

export function getUserReviews(username) {
  const url = username
    ? `${API_URL}/reviews/users/${encodeURIComponent(username)}`
    : `${API_URL}/reviews/users/`;
  return requestJSON(url, { method: 'GET' }, false).then(d => d.results || []);
}

export function getReviewsForProfessor(prof_id) {
  return requestJSON(
    `${API_URL}/reviews/professors/${encodeURIComponent(prof_id)}`,
    { method: 'GET' },
    false
  ).then(d => d.results || []);
}

export function getReplies(review_id) {
  return requestJSON(
    `${API_URL}/reviews/${encodeURIComponent(review_id)}/replies`,
    { method: 'GET' },
    false
  ).then(d => d.results || []);
}

export function createReview({ prof_id, module_code, text, rating }) {
  return requestJSON(
    `${API_URL}/reviews/create`,
    {
      method: 'POST',
      body: JSON.stringify({ prof_id, module_code, text, rating }),
    },
    true
  );
}

export function editReview(id, { module_code, text, rating }) {
  return requestJSON(
    `${API_URL}/reviews/${id}/edit`,
    {
      method: 'PATCH',
      body: JSON.stringify({ module_code, text, rating }),
    },
    true
  );
}

export function deleteReview(id) {
  return requestJSON(
    `${API_URL}/reviews/${id}/delete`,
    { method: 'DELETE' },
    true
  );
}

export function likeReview(id) {
  return requestJSON(
    `${API_URL}/reviews/${id}/like`,
    { method: 'POST' },
    true
  );
}

export function createReply(review_id, text) {
  return requestJSON(
    `${API_URL}/reviews/${review_id}/reply`,
    {
      method: 'POST',
      body: JSON.stringify({ review_id, text }),
    },
    true
  );
}

export function editReply(id, { text }) {
  return requestJSON(
    `${API_URL}/reviews/reply/${id}/edit`,
    {
      method: 'PUT',
      body: JSON.stringify({ text }),
    },
    true
  );
}

export function deleteReply(id) {
  return requestJSON(
    `${API_URL}/reviews/reply/${id}/delete`,
    { method: 'DELETE' },
    true
  );
}

export function likeReply(id) {
  return requestJSON(
    `${API_URL}/reviews/reply/${id}/like`,
    { method: 'POST' },
    true
  );
}