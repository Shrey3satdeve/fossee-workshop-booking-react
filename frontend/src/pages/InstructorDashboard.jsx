/**
 * InstructorDashboard.jsx
 *
 * Instructors see:
 *   1. Workshops they've accepted (with date-change option for future workshops)
 *   2. Workshops proposed by coordinators waiting for acceptance
 *
 * The "Accept" action shows a confirmation modal rather than a native
 * browser confirm() — this gives a consistent dark-themed experience and
 * won't be blocked by browser popup blockers on some Android browsers.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Clock, Calendar, X, AlertCircle } from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import styles from './Dashboard.module.css';
import iStyles from './InstructorDashboard.module.css';

function ConfirmModal({ workshop, onConfirm, onCancel }) {
  return (
    <div className={iStyles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={iStyles.modal}>
        <button className={iStyles.closeBtn} onClick={onCancel} aria-label="Close"><X size={18} /></button>
        <div className={iStyles.modalIcon}><AlertCircle size={28} color="var(--clr-warning)" /></div>
        <h2 id="confirm-title">Accept Workshop?</h2>
        <p>
          You are about to accept <strong>{workshop.workshop_type_name}</strong> on{' '}
          <strong>{new Date(workshop.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>{' '}
          from <strong>{workshop.coordinator_name}</strong>.
        </p>
        <p className={iStyles.warning}>
          Once accepted, you must contact the coordinator directly to cancel.
        </p>
        <div className={iStyles.modalActions}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-accent" onClick={() => onConfirm(workshop.id)}>
            <CheckCircle2 size={16} /> Confirm Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InstructorDashboard({ user }) {
  const [workshops, setWorkshops]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [confirmWs, setConfirmWs]   = useState(null);
  const [actionMsg, setActionMsg]   = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const r = await api.get('/api/workshops/instructor/');
      setWorkshops(r.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id) {
    setConfirmWs(null);
    try {
      await api.get(`/workshop/accept/${id}/`);
      setActionMsg('Workshop accepted successfully!');
      fetchData();
    } catch (e) {
      setError(e.message);
    }
  }

  const accepted = workshops.filter((w) => w.status === 1);
  const pending  = workshops.filter((w) => w.status === 0);

  return (
    <>
      <Helmet>
        <title>Instructor Dashboard — FOSSEE</title>
      </Helmet>

      {confirmWs && (
        <ConfirmModal
          workshop={confirmWs}
          onConfirm={handleAccept}
          onCancel={() => setConfirmWs(null)}
        />
      )}

      <div className="page-shell">
        <div className="container">
          <div className={styles.hero}>
            <div>
              <h1 className={styles.heroTitle}>
                Welcome, <span>{user?.first_name || 'Instructor'}</span>
              </h1>
              <p className={styles.heroSub}>Manage your accepted and incoming workshop requests.</p>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statCard} style={{ borderColor: 'hsl(158 72% 42%)' }}>
              <span className={styles.statIcon} style={{ color: 'hsl(158 72% 42%)', background: 'hsl(158 72% 42% / 0.12)' }}>
                <CheckCircle2 size={20} />
              </span>
              <div>
                <p className={styles.statVal}>{loading ? '—' : accepted.length}</p>
                <p className={styles.statLabel}>Accepted</p>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderColor: 'hsl(38 92% 55%)' }}>
              <span className={styles.statIcon} style={{ color: 'hsl(38 92% 55%)', background: 'hsl(38 92% 55% / 0.12)' }}>
                <Clock size={20} />
              </span>
              <div>
                <p className={styles.statVal}>{loading ? '—' : pending.length}</p>
                <p className={styles.statLabel}>Awaiting Your Action</p>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}
          {actionMsg && <div className="alert alert-success" style={{ marginBottom: '2rem' }}>{actionMsg}</div>}

          {/* Requests waiting for acceptance */}
          <section aria-labelledby="pending-h">
            <h2 className="section-title" id="pending-h">
              <span>Pending</span> Requests
            </h2>
            {loading ? (
              <SkeletonGrid />
            ) : pending.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 0' }}>
                <p>No workshops awaiting your acceptance.</p>
              </div>
            ) : (
              <div className="grid-auto">
                {pending.map((w) => (
                  <div key={w.id} className={`card ${styles.wCard}`}>
                    <div className={styles.wCardTop}>
                      <span className={styles.wName}>{w.workshop_type_name}</span>
                      <StatusBadge status={0} />
                    </div>
                    <div className={styles.wCardMeta}>
                      <span><Calendar size={13} /> {new Date(w.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      <span>Coordinator: <Link to={`/profile/${w.coordinator_id}`}>{w.coordinator_name}</Link></span>
                      <span>Institute: {w.institute}</span>
                    </div>
                    <div className={styles.actionRow}>
                      <button className="btn btn-accent btn-sm" onClick={() => setConfirmWs(w)}>
                        <CheckCircle2 size={14} /> Accept
                      </button>
                      <Link to={`/profile/${w.coordinator_id}`} className="btn btn-ghost btn-sm">
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="divider" />

          {/* Accepted workshops */}
          <section aria-labelledby="accepted-h">
            <h2 className="section-title" id="accepted-h">
              <span>Accepted</span> Workshops
            </h2>
            {loading ? (
              <SkeletonGrid />
            ) : accepted.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 0' }}>
                <p>No accepted workshops to display yet.</p>
              </div>
            ) : (
              <div className="grid-auto">
                {accepted.map((w) => (
                  <Link key={w.id} to={`/workshop/${w.id}`} className={`card ${styles.wCard}`}>
                    <div className={styles.wCardTop}>
                      <span className={styles.wName}>{w.workshop_type_name}</span>
                      <StatusBadge status={1} />
                    </div>
                    <div className={styles.wCardMeta}>
                      <span><Calendar size={13} /> {new Date(w.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      <span>Coordinator: {w.coordinator_name}</span>
                      <span>{w.institute}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid-auto" aria-busy="true" aria-label="Loading workshops">
      {[1, 2, 3].map((n) => (
        <div key={n} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: 18, width: '65%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '45%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '55%', borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}
