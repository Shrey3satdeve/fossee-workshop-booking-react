/**
 * LoginPage.jsx
 *
 * Design rationale:
 * - Split layout on desktop: decorative panel left, form right.
 *   The left panel reinforces brand identity without needing uploaded images.
 * - On mobile the decorative panel disappears — students on phones get a
 *   compact, full-screen form with no distractions.
 * - Floating labels reduce form height significantly vs stacked label+input
 *   pairs — important on small screens with limited vertical space.
 * - The "shake" animation on error is a subtle, standard UI pattern that
 *   instantly communicates failure without a wall of red text.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LogIn, BookOpen, AlertCircle } from 'lucide-react';
import api from '../api';
import styles from './LoginPage.module.css';

export default function LoginPage({ onLogin }) {
  const [form, setForm]     = useState({ username: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoad]  = useState(false);
  const [shake, setShake]   = useState(false);
  const navigate             = useNavigate();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please enter your username and password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoad(true);
    setError('');
    try {
      // Ensure CSRF cookie is set first
      await api.get('/api/csrf/');
      // Use our JSON login endpoint
      const res = await api.post('/api/login/', new URLSearchParams(form));
      onLogin(res.data);
      const dest = res.data.position === 'instructor' ? '/instructor' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoad(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Sign In — FOSSEE Workshops</title>
        <meta name="description" content="Sign in to FOSSEE Workshops to propose and track workshops at your institute." />
      </Helmet>

      <main className={styles.page}>
        {/* Decorative left panel */}
        <section className={styles.panel} aria-hidden="true">
          <div className={styles.panelContent}>
            <div className={styles.panelLogo}>
              <BookOpen size={36} />
            </div>
            <h1 className={styles.panelTitle}>FOSSEE Workshops</h1>
            <p className={styles.panelSub}>
              Connecting instructors and coordinators across Indian institutions
              to bring open-source software education where it matters most.
            </p>
            <ul className={styles.featureList}>
              <li>Propose workshops in 3 steps</li>
              <li>Real-time booking status</li>
              <li>Direct instructor communication</li>
              <li>Developed at IIT Bombay</li>
            </ul>
          </div>
          {/* Decorative grid */}
          <div className={styles.grid} aria-hidden="true" />
        </section>

        {/* Form panel */}
        <section className={styles.formPanel}>
          <div className={`${styles.card} ${shake ? styles.shake : ''}`}>
            <div className={styles.cardHead}>
              <span className={styles.cardIcon}><LogIn size={18} /></span>
              <h2>Sign in</h2>
            </div>
            <p className={styles.subLine}>
              Welcome back — let's get you to your dashboard.
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className={`field-wrap ${form.username ? 'has-value' : ''}`}>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <label htmlFor="username">Username</label>
              </div>

              <div className={`field-wrap ${form.password ? 'has-value' : ''}`}>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
                <label htmlFor="password">Password</label>
              </div>

              <div className={styles.actions}>
                <Link to="/password-reset" className={styles.forgot}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} aria-label="Signing in…" />
                ) : (
                  <>
                    <LogIn size={16} aria-hidden="true" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className={styles.divider} />
            <p className={styles.registerPrompt}>
              New to FOSSEE Workshops?{' '}
              <Link to="/register">Create a coordinator account</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
