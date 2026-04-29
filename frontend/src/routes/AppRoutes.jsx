import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import Layout    from '../components/layout/Layout';
import Login     from '../pages/Login';
import Register  from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ChatPage  from '../pages/ChatPage';
import Documents from '../pages/Documents';
import Profile   from '../pages/Profile';
import AdminPanel from '../pages/AdminPanel';
import NotFound  from '../pages/NotFound';

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}

function FullPageSpinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat"      element={<ChatPage />} />
          <Route path="chat/:sessionId" element={<ChatPage />} />

          {/* Documents */}
          <Route
            path="documents"
            element={
              <RequireAuth>
                <Documents />
              </RequireAuth>
            }
          />

          {/* Admin only */}
          <Route
            path="admin"
            element={
              <RequireRole roles={['admin']}>
                <AdminPanel />
              </RequireRole>
            }
          />

          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}