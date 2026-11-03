const TOKEN = 'majboot-admin';
const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'https://protein-9np5.onrender.com');

export function getToken() {
  return localStorage.getItem(TOKEN);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN, token);
  else localStorage.removeItem(TOKEN);
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong.');
    error.status = response.status;
    throw error;
  }
  return data;
}
