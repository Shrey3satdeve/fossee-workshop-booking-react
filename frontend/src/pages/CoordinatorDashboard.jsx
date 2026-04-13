/**
 * CoordinatorDashboard.jsx
 *
 * Landing page for logged-in coordinators.
 * Shows two sets of workshops:
 *   1. Accepted (instructor assigned)
 *   2. Proposed / pending
 *
 * Design decisions:
 * - Card grid instead of a table — on a 375px phone a table with 4 columns
 *   is unreadable without horizontal scroll (terrible UX). Cards collapse
 *   naturally and expose key data clearly.
 * - Stat counters at the top give coordinators an instant overview before
 *   they scroll. Useful for users who check in quickly between classes.
 * - Empty state illustrations (SVG inline, no external requests) prevent
 *   the dashboard from feeling broken when there's no data.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PlusCircle, Calendar, CheckCircle2, Clock } from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import styles from './Dashboard.module.css';

function StatCard({ icon, label, value, accent }) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: accent } : undefined}>
      <span className={styles.statIcon} style={accent ? { color: accent, background: `${accent}18` } : undefined}>
        {icon}
      </span>
      <div>
        <p className={styles.statVal}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
      </div>
    </div>
  );
}

function WorkshopCard({ workshop }) {
  return (
    <Link to={`/workshop/${workshop.id}`} className={`card ${styles.wCard}`}>
      <div className={styles.wCardTop}>
        <span className={styles.wName}>{workshop.workshop_type_name || 'Workshop'}</span>
        <StatusBadge status={workshop.status} />
      </div>
      <div className={styles.wCardMeta}>
        <span><Calendar size={13} /> {new Date(workshop.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        {workshop.instructor_name && (
          <span>Instructor: {workshop.instructor_name}</span>
        )}
      </div>
    </Link>
  );
}

export default function CoordinatorDashboard({ user }) {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/api/workshops/my/')
      .then((r) => setWorkshops(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const accepted = workshops.filter((w) => w.status === 1);
  const pending  = workshops.filter((w) => w.status === 0);

  return (
    <>
      <Helmet>
        <title>My Workshops — FOSSEE</title>
        <meta name="description" content="Track your proposed and accepted FOSSEE workshops." />
      </Helmet>

      <div className="page-shell">
        <div className="container">
          {/* Welcome hero */}
          <div className={styles.hero}>
            <div>
              <h1 className={styles.heroTitle}>
                Welcome back, <span>{user?.first_name || 'Coordinator'}</span>
              </h1>
              <p className={styles.heroSub}>
                Here's a snapshot of your workshop activity.
              </p>
            </div>
            <Link to="/propose" className="btn btn-primary">
              <PlusCircle size={16} /> Propose Workshop
            </Link>
          </div>

          {/* Stats row */}
          <div className={styles.stats}>
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Accepted"
              value={loading ? '—' : accepted.length}
              accent="hsl(158 72% 42%)"
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Pending"
              value={loading ? '—' : pending.length}
              accent="hsl(38 92% 55%)"
            />
            <StatCard
              icon={<Calendar size={20} />}
              label="Total Proposed"
              value={loading ? '—' : workshops.length}
              accent="hsl(218 90% 58%)"
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {/* Accepted workshops */}
          <section aria-labelledby="accepted-heading">
            <h2 className="section-title" id="accepted-heading">
              <span>Accepted</span> Workshops
            </h2>
            {loading ? (
              <SkeletonGrid />
            ) : accepted.length === 0 ? (
              <EmptyState message="No accepted workshops yet." />
            ) : (
              <div className="grid-auto">
                {accepted.map((w) => <WorkshopCard key={w.id} workshop={w} />)}
              </div>
            )}
          </section>

          <div className="divider" />

          {/* Pending workshops */}
          <section aria-labelledby="pending-heading">
            <h2 className="section-title" id="pending-heading">
              <span>Pending</span> Workshops
            </h2>
            {loading ? (
              <SkeletonGrid />
            ) : pending.length === 0 ? (
              <EmptyState message="No pending workshops. Propose one using the button above!" />
            ) : (
              <div className="grid-auto">
                {pending.map((w) => <WorkshopCard key={w.id} workshop={w} />)}
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
    <div className="grid-auto" aria-label="Loading…" aria-busy="true">
      {[1, 2, 3].map((n) => (
        <div key={n} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: 20, borderRadius: 6, width: '70%' }} />
          <div className="skeleton" style={{ height: 16, borderRadius: 6, width: '40%' }} />
          <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '55%' }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        <rect x="10" y="20" width="60" height="44" rx="6" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 32h60" stroke="currentColor" strokeWidth="2"/>
        <rect x="22" y="42" width="16" height="2" rx="1" fill="currentColor"/>
        <rect x="22" y="50" width="36" height="2" rx="1" fill="currentColor"/>
        <circle cx="58" cy="22" r="8" fill="var(--bg-page)" stroke="currentColor" strokeWidth="2"/>
        <path d="M55 22h6M58 19v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p>{message}</p>
    </div>
  );
}
