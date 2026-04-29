// ── API Service Layer ─────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('knowledgeai_token');
}

async function request(method, path, body, isFormData = false) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

const get  = (path)       => request('GET',    path);
const post = (path, body) => request('POST',   path, body);
const put  = (path, body) => request('PUT',    path, body);
const del  = (path)       => request('DELETE', path);

// Search mode is always hybrid
export function getStoredPrefs() {
  try {
    const raw = localStorage.getItem('knowledgeai_prefs');
    if (!raw) return { ragMode: 'hybrid', resultCount: 5 };
    const parsed = JSON.parse(raw);
    return {
      ragMode: 'hybrid',
      resultCount: Number.isFinite(parseInt(parsed?.resultCount, 10)) ? parseInt(parsed.resultCount, 10) : 5,
    };
  } catch {
    return { ragMode: 'hybrid', resultCount: 5 };
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:             (email, password)      => post('/auth/login',           { email, password }),
  register:          (data)                 => post('/auth/register',        data),
  me:                ()                     => get('/auth/me'),
  logout:            ()                     => post('/auth/logout',          {}),
  updateProfile:     (data)                 => put('/auth/profile',          data),
  changePassword:    (data)                 => put('/auth/password',         data),
  getPreferences:    ()                     => get('/auth/preferences'),
  updatePreferences: (data)                 => put('/auth/preferences',      data),
  forgotPassword:    (email)                => post('/auth/forgot-password', { email }),
  resetPassword:     (token, newPassword)   => post('/auth/reset-password',  { token, newPassword }),
};

// ── Users (Admin) ─────────────────────────────────────────────────────────────
export const usersAPI = {
  list:       ()         => get('/users'),
  getById:    (id)       => get(`/users/${id}`),
  updateRole: (id, role) => put(`/users/${id}/role`, { role }),
  delete:     (id)       => del(`/users/${id}`),
  getStats:   ()         => get('/users/stats'),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsAPI = {
  list:   (workspace) => get(`/documents${workspace ? `?workspace=${workspace}` : ''}`),
  delete: (id)        => del(`/documents/${id}`),
  open:   (id)        => `${BASE_URL}/documents/${id}/open`,

  upload: (file, workspaceId, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/documents/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));

      const fd = new FormData();
      fd.append('file', file);
      if (workspaceId) fd.append('workspace', workspaceId);
      xhr.send(fd);
    });
  },
};

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  getSessions:       (workspaceId)          => get(`/chat/sessions?workspace=${workspaceId || ''}`),
  createSession:     (title, workspaceId)   => post('/chat/sessions', { title, workspaceId }),
  deleteSession:     (id)                   => del(`/chat/sessions/${id}`),
  getMessages:       (sessionId)            => get(`/chat/sessions/${sessionId}/messages`),
  sendMessage:       (sessionId, message, workspaceId, topK) =>
    post(`/chat/sessions/${sessionId}/messages`, {
      message,
      workspaceId,
      searchMode: 'hybrid', // always hybrid
      topK,
    }),
  deleteAllSessions: ()                     => del('/chat/sessions/all'),
  deleteAllMessages: (sessionId)            => del(`/chat/sessions/${sessionId}/messages`),
};

// ── Stats / Dashboard ─────────────────────────────────────────────────────────
export const statsAPI = {
  getDashboard: () => get('/stats/dashboard'),
};

// ── Workspaces ────────────────────────────────────────────────────────────────
export const workspacesAPI = {
  list:   ()         => get('/workspaces'),
  create: (data)     => post('/workspaces', data),
  update: (id, data) => put(`/workspaces/${id}`, data),
  delete: (id)       => del(`/workspaces/${id}`),
};