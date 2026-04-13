/**
 * ProposeWorkshop.jsx
 *
 * A 3-step form that guides coordinators through proposing a workshop.
 *
 * Why multi-step?
 * - The original single-page form (type + date + T&C checkbox) gave no
 *   feedback about what "proposing" actually means until you scrolled down.
 * - Breaking it into steps lets us:
 *   1. Confirm the workshop type choice before the user picks a date.
 *   2. Show the actual terms & conditions text (not just a checkbox) so
 *      coordinators read it rather than reflexively checking a box.
 *   3. Provide clear progress feedback — especially important on mobile
 *      where scrolling back up to check progress is annoying.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Calendar, CheckSquare, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';
import styles from './ProposeWorkshop.module.css';

const STEPS = ['Select Workshop', 'Choose Date', 'Review & Submit'];

export default function ProposeWorkshop() {
  const navigate = useNavigate();

  const [step, setStep]           = useState(0);
  const [types, setTypes]         = useState([]);
  const [selectedType, setType]   = useState(null);
  const [date, setDate]           = useState('');
  const [tnc, setTnc]             = useState('');
  const [tncAccepted, setAccept]  = useState(false);
  const [loading, setLoading]     = useState(false);
  const [typesLoad, setTypesLoad] = useState(true);
  const [error, setError]         = useState('');

  // Min date = today + 3 days (mirrors the Django view logic)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 3);
  const minDateStr = minDate.toISOString().split('T')[0];

  useEffect(() => {
    api.get('/api/workshop-types/')
      .then((r) => setTypes(r.data))
      .finally(() => setTypesLoad(false));
  }, []);

  // Load T&C when type changes
  useEffect(() => {
    if (!selectedType) return;
    api.get(`/workshop/type_tnc/${selectedType.id}`)
      .then((r) => setTnc(r.data.tnc || 'No specific terms provided.'))
      .catch(() => setTnc('Unable to load terms. Please proceed to accept.'));
  }, [selectedType]);

  function goNext() {
    setError('');
    if (step === 0 && !selectedType) { setError('Please select a workshop type.'); return; }
    if (step === 1 && !date)          { setError('Please pick a date.'); return; }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    if (!tncAccepted) { setError('Please accept the terms and conditions.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = new URLSearchParams({
        workshop_type: selectedType.id,
        date,
        tnc_accepted: 'on',
      });
      await api.post('/workshop/propose/', payload);
      navigate('/dashboard', { state: { success: 'Workshop proposed successfully!' } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Propose a Workshop — FOSSEE</title>
        <meta name="description" content="Propose a FOSSEE workshop at your institution by selecting a type and date." />
      </Helmet>

      <div className="page-shell">
        <div className="container">
          <div className={styles.wrap}>
            <h1 className={styles.pageTitle}>Propose a Workshop</h1>

            {/* Step indicator */}
            <div className="step-bar" role="list" aria-label="Progress">
              {STEPS.map((label, i) => (
                <>
                  <div key={label} className={`step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} role="listitem">
                    <div className="step-num">
                      {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    <span className="step-label">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div key={`line-${i}`} className={`step-line ${i < step ? 'done' : ''}`} aria-hidden="true" />
                  )}
                </>
              ))}
            </div>

            {error && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* ── Step 0: Select type ─────────────────────── */}
            {step === 0 && (
              <section aria-labelledby="step0-h">
                <h2 className={styles.stepHead} id="step0-h">
                  <BookOpen size={18} /> Select Workshop Type
                </h2>
                {typesLoad ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="skeleton" style={{ height: 72, borderRadius: 'var(--r-md)' }} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.typeGrid} role="radiogroup" aria-labelledby="step0-h">
                    {types.map((t) => (
                      <label
                        key={t.id}
                        className={`${styles.typeOption} ${selectedType?.id === t.id ? styles.typeSelected : ''}`}
                      >
                        <input
                          type="radio"
                          name="workshop_type"
                          value={t.id}
                          checked={selectedType?.id === t.id}
                          onChange={() => setType(t)}
                          className={styles.hiddenRadio}
                        />
                        <div className={styles.typeOptionInner}>
                          <span className={styles.typeName}>{t.name}</span>
                          <span className={styles.typeDuration}>{t.duration} {t.duration === 1 ? 'day' : 'days'}</span>
                        </div>
                        {selectedType?.id === t.id && (
                          <span className={styles.typeCheck}><Check size={16} /></span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Step 1: Pick date ────────────────────────── */}
            {step === 1 && (
              <section aria-labelledby="step1-h">
                <h2 className={styles.stepHead} id="step1-h">
                  <Calendar size={18} /> Choose a Workshop Date
                </h2>
                <div className={styles.dateWrap}>
                  <p className={styles.dateSub}>
                    You've selected: <strong>{selectedType?.name}</strong> ({selectedType?.duration} {selectedType?.duration === 1 ? 'day' : 'days'})
                  </p>
                  <label htmlFor="ws-date" className={styles.dateLabel}>
                    Select preferred start date
                    <span className={styles.dateMuted}>(minimum 3 days from today; weekends excluded)</span>
                  </label>
                  <input
                    id="ws-date"
                    type="date"
                    min={minDateStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={styles.dateInput}
                    aria-required="true"
                  />
                </div>
              </section>
            )}

            {/* ── Step 2: T&C and submit ───────────────────── */}
            {step === 2 && (
              <section aria-labelledby="step2-h">
                <h2 className={styles.stepHead} id="step2-h">
                  <CheckSquare size={18} /> Review &amp; Confirm
                </h2>

                {/* Summary card */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Workshop Type</span>
                    <span className={styles.summaryVal}>{selectedType?.name}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Duration</span>
                    <span className={styles.summaryVal}>{selectedType?.duration} {selectedType?.duration === 1 ? 'day' : 'days'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Proposed Date</span>
                    <span className={styles.summaryVal}>
                      {new Date(date).toLocaleDateString('en-IN', { dateStyle: 'full' })}
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <div className={styles.tncWrap}>
                  <h3 className={styles.tncTitle}>Terms &amp; Conditions</h3>
                  <div
                    className={styles.tncBody}
                    dangerouslySetInnerHTML={{ __html: tnc || 'No terms provided for this workshop type.' }}
                  />
                </div>

                <label className={styles.tncCheck}>
                  <input
                    type="checkbox"
                    checked={tncAccepted}
                    onChange={(e) => setAccept(e.target.checked)}
                    aria-required="true"
                  />
                  <span>I have read and agree to the terms and conditions above.</span>
                </label>
              </section>
            )}

            {/* Navigation */}
            <div className={styles.navRow}>
              {step > 0 && (
                <button className="btn btn-ghost" onClick={() => { setStep(s => s - 1); setError(''); }}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <div style={{ marginLeft: 'auto' }}>
                {step < STEPS.length - 1 ? (
                  <button className="btn btn-primary" onClick={goNext}>
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn-accent" onClick={handleSubmit} disabled={loading}>
                    {loading ? <span className={styles.spinner} aria-hidden="true" /> : <Check size={16} />}
                    {loading ? 'Submitting…' : 'Submit Proposal'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
