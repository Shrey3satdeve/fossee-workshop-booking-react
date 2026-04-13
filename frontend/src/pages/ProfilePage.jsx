/**
 * ProfilePage.jsx
 * Own-profile view and edit form. Instructors viewing coordinator also use this.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { User, Edit2, Check, X, Calendar } from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import styles from './ProfilePage.module.css';

export default function ProfilePage({ user }) {
  const { id }               = useParams();           // undefined = own profile
  const isOwnProfile         = !id;
  const [profile, setProfile] = useState(null);
  const [workshops, setWs]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [editing, setEdit]   = useState(false);
  const [form, setForm]      = useState({});
  const [saving, setSave]    = useState(false);
  const [msg, setMsg]        = useState('');
  const [error, setError]    = useState('');

  useEffect(() => {
    const url = id ? `/api/profile/${id}/` : '/api/profile/me/';
    const wsUrl = id ? `/api/workshops/by-coordinator/${id}/` : '/api/workshops/my/';
    Promise.all([api.get(url), api.get(wsUrl)])
      .then(([pRes, wRes]) => {
        setProfile(pRes.data);
        setForm(pRes.data);
        setWs(wRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSave(true);
    try {
      await api.post('/api/profile/me/', new URLSearchParams(form));
      setProfile(form);
      setEdit(false);
      setMsg('Profile updated successfully.');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSave(false);
    }
  }

  if (loading) return <div className="page-shell"><div className="container"><p>Loading profile…</p></div></div>;
  if (!profile)  return <div className="page-shell"><div className="container"><div className="alert alert-danger">{error}</div></div></div>;

  const p = editing ? form : profile;
  const F = ({ name, label }) => (
    editing ? (
      <input name={name} value={p[name] || ''} onChange={handleChange} className={styles.editInput} aria-label={label} />
    ) : (
      <span className={styles.fieldVal}>{p[name] || <em className={styles.empty}>Not set</em>}</span>
    )
  );

  return (
    <>
      <Helmet>
        <title>{isOwnProfile ? 'My Profile' : `${profile.user_first_name}'s Profile`} — FOSSEE</title>
      </Helmet>
      <div className="page-shell">
        <div className="container">
          {msg && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}
          {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          <div className={styles.card}>
            {/* Avatar row */}
            <div className={styles.avatarRow}>
              <div className={styles.avatar}>
                {(profile.user_first_name?.[0] || profile.username?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <h1 className={styles.name}>
                  {profile.user_first_name} {profile.user_last_name}
                </h1>
                <p className={styles.position}>{profile.position}</p>
                <p className={styles.email}>{profile.user_email}</p>
              </div>
              {isOwnProfile && !editing && (
                <button className={`btn btn-ghost btn-sm ${styles.editBtn}`} onClick={() => setEdit(true)}>
                  <Edit2 size={14} /> Edit
                </button>
              )}
              {editing && (
                <div className={styles.editActions}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEdit(false); setForm(profile); }}>
                    <X size={14} /> Cancel
                  </button>
                  <button className="btn btn-accent btn-sm" onClick={handleSave} disabled={saving}>
                    <Check size={14} /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Info grid */}
            <form onSubmit={handleSave}>
              <div className={styles.infoGrid}>
                <InfoRow label="Phone Number">   <F name="phone_number"  label="Phone Number" /></InfoRow>
                <InfoRow label="Institute">       <F name="institute"     label="Institute" /></InfoRow>
                <InfoRow label="Department">      <F name="department"    label="Department" /></InfoRow>
                <InfoRow label="Location">        <F name="location"      label="Location" /></InfoRow>
                <InfoRow label="State">           <F name="state"         label="State" /></InfoRow>
              </div>
            </form>
          </div>

          {/* Workshops table */}
          {workshops.length > 0 && (
            <section aria-labelledby="ws-h" style={{ marginTop: 'calc(var(--sp) * 5)' }}>
              <h2 className="section-title" id="ws-h">
                <span>Workshop</span> History
              </h2>
              <div className={styles.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workshop</th>
                      <th>Date</th>
                      <th>Instructor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshops.map((w) => (
                      <tr key={w.id}>
                        <td data-label="Workshop">{w.workshop_type_name}</td>
                        <td data-label="Date">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={12} />
                            {new Date(w.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </span>
                        </td>
                        <td data-label="Instructor">{w.instructor_name || '—'}</td>
                        <td data-label="Status"><StatusBadge status={w.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      {children}
    </div>
  );
}
