/**
 * RegisterPage.jsx
 *
 * Registration is only for coordinators (instructors are added by admins).
 * The form uses the same floating-label pattern as login for visual consistency.
 * Fields are grouped logically: account credentials → personal info → institute.
 *
 * FIX: FormField is defined at module level (not inside the component) so React
 * never unmounts/remounts it on each keystroke — which was causing focus loss.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';
import styles from './RegisterPage.module.css';

/**
 * Module-level field component — stable identity across renders.
 * Receives value, error, and onChange as explicit props instead of
 * closing over parent state, which caused React to treat it as a new
 * component type on every parent re-render (= unmount + remount = focus loss).
 */
function FormField({ name, label, type = 'text', autoComplete, value, error, onChange }) {
  return (
    <div className={`field-wrap ${value ? 'has-value' : ''}`}>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <label htmlFor={name}>{label}</label>
      {error && (
        <p className="field-error">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);   // 0: form, 1: email sent
  const [loading, setLoad]  = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    username: '',     password: '',   confirm: '',
    first_name: '',   last_name: '',  email: '',
    phone_number: '', institute: '',  department: '',
    position: 'coordinator', location: '', state: '',
  });

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((er) => ({ ...er, [field]: undefined, _global: undefined }));
    };
  }

  function validate() {
    const errs = {};
    if (!form.username)     errs.username     = 'Username is required';
    if (!form.password)     errs.password     = 'Password is required';
    if (form.password !== form.confirm)
                            errs.confirm      = 'Passwords do not match';
    if (!form.email)        errs.email        = 'Email is required';
    if (!form.first_name)   errs.first_name   = 'First name is required';
    if (!form.last_name)    errs.last_name    = 'Last name is required';
    if (!form.institute)    errs.institute    = 'Institute is required';
    if (!form.phone_number) errs.phone_number = 'Phone number is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoad(true);
    try {
      // Ensure CSRF cookie exists before POST
      await api.get('/api/csrf/');
      await api.post('/api/register/', new URLSearchParams(form));
      setStep(1);
    } catch (err) {
      // Handle field-level errors returned from the API
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ _global: err.response?.data?.error || err.message });
      }
    } finally {
      setLoad(false);
    }
  }

  // Shorthand so JSX stays readable
  const f = (name, label, extra = {}) => (
    <FormField
      name={name}
      label={label}
      value={form[name]}
      error={errors[name]}
      onChange={handleChange(name)}
      {...extra}
    />
  );

  if (step === 1) {
    return (
      <main className={styles.page}>
        <Helmet>
          <title>Registration Pending — FOSSEE Workshops</title>
        </Helmet>
        <div className={styles.successCard}>
          <CheckCircle size={48} color="var(--clr-accent)" />
          <h2>Check your inbox!</h2>
          <p>
            We've sent a verification email to <strong>{form.email}</strong>.
            Click the link in the email to activate your account before signing in.
          </p>
          <Link to="/login" className="btn btn-primary">Go to Sign In</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Account — FOSSEE Workshops</title>
        <meta name="description" content="Register as a coordinator to propose FOSSEE workshops at your institution." />
      </Helmet>

      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.head}>
            <span className={styles.icon}><UserPlus size={18} /></span>
            <h1>Coordinator Registration</h1>
          </div>
          <p className={styles.sub}>
            Fill in the form below to request an account. You'll receive a
            confirmation email before you can log in.
          </p>

          {errors._global && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={16} /> {errors._global}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Account Credentials ─────────────────── */}
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Account Credentials</legend>
              {f('username', 'Username', { autoComplete: 'username' })}
              <div className={styles.twoCol}>
                {f('password', 'Password',         { type: 'password', autoComplete: 'new-password' })}
                {f('confirm',  'Confirm Password',  { type: 'password', autoComplete: 'new-password' })}
              </div>
            </fieldset>

            {/* ── Personal Information ─────────────────── */}
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Personal Information</legend>
              <div className={styles.twoCol}>
                {f('first_name', 'First Name', { autoComplete: 'given-name' })}
                {f('last_name',  'Last Name',  { autoComplete: 'family-name' })}
              </div>
              {f('email',        'Email Address', { type: 'email', autoComplete: 'email' })}
              {f('phone_number', 'Phone Number',  { type: 'tel',   autoComplete: 'tel' })}
            </fieldset>

            {/* ── Institute Details ────────────────────── */}
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Institute Details</legend>
              {f('institute', 'Institute Name')}
              <div className={styles.twoCol}>
                {f('department', 'Department')}
                {f('position',   'Position / Role')}
              </div>
              <div className={styles.twoCol}>
                {f('location', 'City',  { autoComplete: 'address-level2' })}
                {f('state',    'State', { autoComplete: 'address-level1' })}
              </div>
            </fieldset>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submit}`}
              disabled={loading}
            >
              {loading
                ? <span className={styles.spinner} aria-hidden="true" />
                : <><UserPlus size={16} /> Create Account</>
              }
            </button>
          </form>

          <div className={styles.divider} />
          <p className={styles.loginLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </>
  );
}
