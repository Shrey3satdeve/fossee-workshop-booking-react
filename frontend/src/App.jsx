/**
 * App.jsx
 *
 * Root component. Manages:
 *  - Global authentication state (stored in React state + re-hydrated on
 *    page reload by hitting /api/me/ — if the session cookie is still valid
 *    Django returns the user; if not, it 401s and we show the login page).
 *  - Route definitions via React Router v6.
 *  - Protected route wrapper that redirects unauthenticated users to /login.
 *
 * Why state and not localStorage? Session-based auth is the source of truth
 * on the backend. Caching user data in localStorage creates a mismatch risk
 * if the admin deactivates the account. The /api/me/ ping on mount is cheap
 * and keeps us in sync.
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import api from './api';
import Navbar    from './components/Navbar';
import Footer    from './components/Footer';

import LoginPage              from './pages/LoginPage';
import RegisterPage           from './pages/RegisterPage';
import CoordinatorDashboard   from './pages/CoordinatorDashboard';
import InstructorDashboard    from './pages/InstructorDashboard';
import WorkshopTypeList       from './pages/WorkshopTypeList';
import WorkshopTypeDetail     from './pages/WorkshopTypeDetail';
import ProposeWorkshop        from './pages/ProposeWorkshop';
import WorkshopDetail         from './pages/WorkshopDetail';
import ProfilePage            from './pages/ProfilePage';

/** Renders children only if authenticated; otherwise redirects to /login */
function Protected({ user, loading, children }) {
  const location = useLocation();
  if (loading) return <div className="page-shell"><div className="container"><p>Loading…</p></div></div>;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function App() {
  const [user, setUser]       = useState(undefined);   // undefined = still loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/me/')
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    api.post('/accounts/logout/').finally(() => setUser(null));
  }

  const isInstructor = user?.position === 'instructor';

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Navbar user={user} onLogout={handleLogout} />

        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage    onLogin={setUser} />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public workshop list (visible without login for browsing) */}
          <Route path="/workshops"     element={<WorkshopTypeList user={user} />} />
          <Route path="/workshops/:id" element={<WorkshopTypeDetail />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <Protected user={user} loading={loading}>
                <CoordinatorDashboard user={user} />
              </Protected>
            }
          />
          <Route
            path="/instructor"
            element={
              <Protected user={user} loading={loading}>
                <InstructorDashboard user={user} />
              </Protected>
            }
          />
          <Route
            path="/propose"
            element={
              <Protected user={user} loading={loading}>
                <ProposeWorkshop />
              </Protected>
            }
          />
          <Route
            path="/workshop/:id"
            element={
              <Protected user={user} loading={loading}>
                <WorkshopDetail user={user} />
              </Protected>
            }
          />
          <Route
            path="/profile"
            element={
              <Protected user={user} loading={loading}>
                <ProfilePage user={user} />
              </Protected>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <Protected user={user} loading={loading}>
                <ProfilePage user={user} />
              </Protected>
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={
              loading ? null : user
                ? <Navigate to={isInstructor ? '/instructor' : '/dashboard'} replace />
                : <Navigate to="/login" replace />
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="page-shell">
                <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                  <h1 style={{ fontSize: 'var(--fs-3xl)', color: 'var(--txt-muted)' }}>404</h1>
                  <p style={{ color: 'var(--txt-muted)', marginBottom: '2rem' }}>Page not found.</p>
                  <a href="/" className="btn btn-primary">Go Home</a>
                </div>
              </div>
            }
          />
        </Routes>

        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
