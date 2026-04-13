/**
 * WorkshopTypeList.jsx
 *
 * Public list of available workshop types (accessible pre-login).
 *
 * Design decisions:
 * - Client-side search (no extra API call) — the list is typically short
 *   (< 100 items) and filtering instantly feels responsive.
 * - Card grid layout over a table — on mobile a card is far more scannable.
 * - Duration shown as a coloured pill — quick visual anchor for students
 *   deciding how many days they can commit.
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Clock, ArrowRight, PlusCircle } from 'lucide-react';
import api from '../api';
import styles from './WorkshopTypeList.module.css';

function WorkshopCard({ wt }) {
  return (
    <Link to={`/workshops/${wt.id}`} className={`card ${styles.wCard}`} aria-label={`View details for ${wt.name}`}>
      <div className={styles.wTop}>
        <span className={styles.wDuration}>
          <Clock size={12} /> {wt.duration} {wt.duration === 1 ? 'day' : 'days'}
        </span>
      </div>
      <h3 className={styles.wTitle}>{wt.name}</h3>
      <p className={styles.wDesc}>{wt.description?.slice(0, 100) || 'Click to view full details and materials.'}</p>
      <span className={styles.wCta}>
        View Details <ArrowRight size={14} />
      </span>
    </Link>
  );
}

export default function WorkshopTypeList({ user }) {
  const [types, setTypes]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [query, setQuery]   = useState('');
  const [error, setError]   = useState('');

  const isInstructor = user?.position === 'instructor';

  useEffect(() => {
    api.get('/api/workshop-types/')
      .then((r) => setTypes(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return types;
    const q = query.toLowerCase();
    return types.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [types, query]);

  return (
    <>
      <Helmet>
        <title>Workshop Types — FOSSEE</title>
        <meta name="description" content="Browse all available FOSSEE workshop types offered across Indian institutions." />
      </Helmet>

      <div className="page-shell">
        <div className="container">
          {/* Header */}
          <div className={styles.pageHead}>
            <div>
              <h1 className={styles.pageTitle}>Workshop Types</h1>
              <p className={styles.pageSub}>
                {loading ? 'Loading…' : `${types.length} workshops available`}
              </p>
            </div>
            {isInstructor && (
              <Link to="/workshops/add" className="btn btn-primary">
                <PlusCircle size={16} /> Add Workshop Type
              </Link>
            )}
          </div>

          {/* Search bar */}
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search workshops…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search workshop types"
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {/* Grid */}
          {loading ? (
            <div className="grid-auto" aria-busy="true" aria-label="Loading workshops">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 20, width: '75%', borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <p>{query ? `No workshops matched "${query}".` : 'No workshop types available yet.'}</p>
            </div>
          ) : (
            <div className="grid-auto">
              {filtered.map((wt) => <WorkshopCard key={wt.id} wt={wt} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
