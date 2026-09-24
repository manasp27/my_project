// api.js — central fetch wrapper
const API_BASE = '/api';

const API = {
  async request(method, endpoint, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (data && method !== 'GET') config.body = JSON.stringify(data);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const json = await res.json();
      if (!json.success && res.status === 401) {
        Auth.logout();
        Router.navigate('/login');
      }
      return { ok: res.ok, status: res.status, ...json };
    } catch (err) {
      return { ok: false, message: 'Network error. Check your connection.' };
    }
  },

  get:    (ep)       => API.request('GET',    ep),
  post:   (ep, data) => API.request('POST',   ep, data),
  put:    (ep, data) => API.request('PUT',    ep, data),
  delete: (ep)       => API.request('DELETE', ep),

  async uploadFile(endpoint, formData) {
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });
      return await res.json();
    } catch (err) {
      return { ok: false, message: 'Upload failed' };
    }
  }
};
