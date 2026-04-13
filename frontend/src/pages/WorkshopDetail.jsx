/**
 * WorkshopDetail.jsx
 * Shows full workshop info and comment thread.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Send, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import styles from './WorkshopDetail.module.css';

export default function WorkshopDetail({ user }) {
  const { id }             = useParams();
  const [ws, setWs]        = useState(null);
  const [comments, setCom] = useState([]);
  const [loading, setLoad] = useState(true);
  const [comment, setCom2] = useState('');
  const [isPublic, setPub] = useState(true);
  const [posting, setPost] = useState(false);
  const [error, setError]  = useState('');

  const isInstructor = user?.position === 'instructor';

  useEffect(() => {
    Promise.all([
      api.get(`/api/workshops/${id}/`),
      api.get(`/api/workshops/${id}/comments/`),
    ]).then(([wsRes, comRes]) => {
      setWs(wsRes.data);
      setCom(comRes.data);
    }).catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, [id]);

  async function postComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPost(true);
    try {
      const payload = new URLSearchParams({ comment, public: isPublic ? 'on' : '' });
      const res = await api.post(`/api/workshops/${id}/comments/`, payload);
      setCom((c) => [...c, res.data]);
      setCom2('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPost(false);
    }
  }

  if (loading) return <div className="page-shell"><div className="container"><p>Loading…</p></div></div>;
  if (!ws)     return <div className="page-shell"><div className="container"><div className="alert alert-danger">{error || 'Workshop not found.'}</div></div></div>;

  return (
    <>
      <Helmet><title>{ws.workshop_type_name} — FOSSEE Workshop</title></Helmet>
      <div className="page-shell">
        <div className="container">
          <Link to={isInstructor ? '/instructor' : '/dashboard'} className={styles.back}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          {/* Detail card */}
          <div className={styles.detailCard}>
            <div className={styles.detailHead}>
              <div>
                <h1 className={styles.wsTitle}>{ws.workshop_type_name}</h1>
                <p className={styles.wsMeta}>
                  {new Date(ws.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}
                </p>
              </div>
              <StatusBadge status={ws.status} />
            </div>

            <div className={styles.detailGrid}>
              <DetailRow label="Coordinator" value={ws.coordinator_name} />
              <DetailRow label="Institute" value={ws.institute || '—'} />
              {ws.status === 1 && (
                <DetailRow label="Instructor" value={ws.instructor_name || '—'} />
              )}
              <DetailRow
                label="Type"
                value={<Link to={`/workshops/${ws.workshop_type_id}`}>{ws.workshop_type_name}</Link>}
              />
            </div>
          </div>

          {/* Comment section */}
          <section className={styles.commentSection} aria-labelledby="comments-h">
            <h2 id="comments-h" className={styles.commentsTitle}>
              Discussion ({comments.length})
            </h2>

            {/* Post form */}
            <form onSubmit={postComment} className={styles.commentForm}>
              <div className={styles.commentInputWrap}>
                <textarea
                  value={comment}
                  onChange={(e) => setCom2(e.target.value)}
                  placeholder="Write a comment…"
                  rows={3}
                  className={styles.commentInput}
                  aria-label="Write a comment"
                />
              </div>
              <div className={styles.commentActions}>
                {isInstructor && (
                  <button
                    type="button"
                    className={`btn btn-ghost btn-sm ${styles.visibilityBtn}`}
                    onClick={() => setPub((p) => !p)}
                    aria-pressed={!isPublic}
                    title={isPublic ? 'Currently public' : 'Currently hidden from coordinator'}
                  >
                    {isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
                    {isPublic ? 'Public' : 'Private'}
                  </button>
                )}
                <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !comment.trim()}>
                  <Send size={14} /> {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>

            {/* Comment list */}
            {comments.length === 0 ? (
              <p className={styles.noComments}>No comments yet. Start the conversation!</p>
            ) : (
              <div className={styles.commentList}>
                {comments.map((c) => (
                  <div key={c.id} className={styles.commentCard}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{c.author_name}</span>
                      {!c.public && (
                        <span className={styles.privateBadge}><EyeOff size={10} /> Private</span>
                      )}
                      <span className={styles.commentDate}>
                        {new Date(c.created_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className={styles.commentBody}>{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
