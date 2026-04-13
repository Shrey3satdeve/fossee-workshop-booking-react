/**
 * api/index.js
 *
 * Central Axios instance that communicates with the Django backend.
 *
 * Django uses session-based auth + CSRF tokens. Two things we must handle:
 *  1. Send cookies on every request           → `withCredentials: true`
 *  2. Attach the CSRF token on mutating reqs → read `csrftoken` cookie,
 *     place it in the `X-CSRFToken` header (Django's default header name).
 *
 * Why not use fetch()? Axios gives us request interceptors so we can
 * inject the CSRF header once globally rather than in every POST call.
 */

import axios from 'axios';

// Read Django's CSRF cookie (set on page load by the backend)
function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

const api = axios.create({
  baseURL: '/',
  withCredentials: true,        // carry session cookie cross-origin in dev
  timeout: 15_000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// Attach CSRF token to every state-mutating request
api.interceptors.request.use((config) => {
  const safeMethods = ['get', 'head', 'options', 'trace'];
  if (!safeMethods.includes(config.method?.toLowerCase())) {
    config.headers['X-CSRFToken'] = getCsrfToken();
  }
  return config;
});

// Surface Django's non-field error messages cleanly
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  }
);

export default api;
