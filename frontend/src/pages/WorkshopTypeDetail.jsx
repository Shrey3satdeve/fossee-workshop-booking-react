/**
 * WorkshopTypeDetail.jsx — Shows details for a single workshop type.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Clock, FileText, Paperclip } from 'lucide-react';
import api from '../api';
import styles from './WorkshopTypeDetail.module.css';

export default function WorkshopTypeDetail() {
  const { id }            = useParams();
  const [wt, setWt]       = useState(null);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/workshop-types/${id}/`)
      .then((r) => setWt(r.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, [id]);

  if (loading) return <div className="page-shell"><div className="container"><p>Loading…</p></div></div>;
  if (!wt)     return <div className="page-shell"><div className="container"><div className="alert alert-danger">{error}</div></div></div>;

  return (
    <>
      <Helmet>
        <title>{wt.name} — FOSSEE Workshop Type</title>
        <meta name="description" content={wt.description || `Details about the ${wt.name} FOSSEE workshop.`} />
      </Helmet>
      <div className="page-shell">
        <div className="container">
          <Link to="/workshops" className={styles.back}><ArrowLeft size={16} /> All Workshops</Link>

          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.title}>{wt.name}</h1>
              <span className={styles.duration}><Clock size={14} /> {wt.duration} {wt.duration === 1 ? 'day' : 'days'}</span>
            </div>
            <Link to="/propose" className="btn btn-primary">Propose This Workshop</Link>
          </div>

          {wt.description && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}><FileText size={16} /> Description</h2>
              <p className={styles.description}>{wt.description}</p>
            </section>
          )}

          {wt.terms_and_conditions && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Terms &amp; Conditions</h2>
              <div
                className={styles.tnc}
                dangerouslySetInnerHTML={{ __html: wt.terms_and_conditions }}
              />
            </section>
          )}

          {wt.attachments?.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}><Paperclip size={16} /> Attachments</h2>
              <ul className={styles.attachList}>
                {wt.attachments.map((a, i) => (
                  <li key={i}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className={styles.attachLink}>
                      <Paperclip size={13} /> {a.name || `Attachment ${i + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
