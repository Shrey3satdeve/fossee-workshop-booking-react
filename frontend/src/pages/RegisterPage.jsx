/**
 * RegisterPage.jsx
 *
 * Registration is only for coordinators (instructors are added by admins).
 * Uses select dropdowns for department, state, title and source — matching
 * the exact choice values expected by the Django UserRegistrationForm.
 *
 * FormField is defined at module level (NOT inside the component) so React
 * never unmounts/remounts it on each keystroke (which was causing focus loss).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';
import styles from './RegisterPage.module.css';

// ── Choice data (mirrors Django model constants exactly) ─────────────────────

const DEPARTMENTS = [
  ['', 'Select Department'],
  ['computer engineering',           'Computer Science'],
  ['information technology',         'Information Technology'],
  ['civil engineering',              'Civil Engineering'],
  ['electrical engineering',         'Electrical Engineering'],
  ['mechanical engineering',         'Mechanical Engineering'],
  ['chemical engineering',           'Chemical Engineering'],
  ['aerospace engineering',          'Aerospace Engineering'],
  ['biosciences and bioengineering', 'Biosciences and BioEngineering'],
  ['electronics',                    'Electronics'],
  ['energy science and engineering', 'Energy Science and Engineering'],
];

const STATES = [
  ['',      '---------'],
  ['IN-AP', 'Andhra Pradesh'],
  ['IN-AR', 'Arunachal Pradesh'],
  ['IN-AS', 'Assam'],
  ['IN-BR', 'Bihar'],
  ['IN-CT', 'Chhattisgarh'],
  ['IN-GA', 'Goa'],
  ['IN-GJ', 'Gujarat'],
  ['IN-HR', 'Haryana'],
  ['IN-HP', 'Himachal Pradesh'],
  ['IN-JK', 'Jammu and Kashmir'],
  ['IN-JH', 'Jharkhand'],
  ['IN-KA', 'Karnataka'],
  ['IN-KL', 'Kerala'],
  ['IN-MP', 'Madhya Pradesh'],
  ['IN-MH', 'Maharashtra'],
  ['IN-MN', 'Manipur'],
  ['IN-ML', 'Meghalaya'],
  ['IN-MZ', 'Mizoram'],
  ['IN-NL', 'Nagaland'],
  ['IN-OR', 'Odisha'],
  ['IN-PB', 'Punjab'],
  ['IN-RJ', 'Rajasthan'],
  ['IN-SK', 'Sikkim'],
  ['IN-TN', 'Tamil Nadu'],
  ['IN-TG', 'Telangana'],
  ['IN-TR', 'Tripura'],
  ['IN-UT', 'Uttarakhand'],
  ['IN-UP', 'Uttar Pradesh'],
  ['IN-WB', 'West Bengal'],
  ['IN-AN', 'Andaman and Nicobar Islands'],
  ['IN-CH', 'Chandigarh'],
  ['IN-DN', 'Dadra and Nagar Haveli'],
  ['IN-DD', 'Daman and Diu'],
  ['IN-DL', 'Delhi'],
  ['IN-LD', 'Lakshadweep'],
  ['IN-PY', 'Puducherry'],
];

const TITLES  = ['Professor', 'Doctor', 'Shriman', 'Shrimati', 'Kumari', 'Mr', 'Mrs', 'Miss'];
const SOURCES = ['FOSSEE website', 'Google', 'Social Media', 'From other College'];

// ── Reusable field components (module-level = stable identity) ───────────────

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
      {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}
    </div>
  );
}

function SelectField({ name, label, options, value, error, onChange }) {
  return (
    <div className={`field-wrap ${value ? 'has-value' : ''}`}>
      <select id={name} name={name} value={value} onChange={onChange}>
        {options.map(([val, display]) => (
          <option key={val} value={val}>{display}</option>
        ))}
      </select>
      <label htmlFor={name}>{label}</label>
      {error && <p className="field-error"><AlertCircle size={12} /> {error}</p>}
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep]     = useState(0);
  const [loading, setLoad]  = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    username: '',   password: '',   confirm_password: '',
    title: 'Mr',
    first_name: '', last_name: '',
    email: '',      phone_number: '',
    institute: '',  department: '', location: '', state: '',
    how_did_you_hear_about_us: 'FOSSEE website',
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
    if (!form.username)     errs.username          = 'Username is required';
    if (!form.password)     errs.password          = 'Password is required';
    if (form.password !== form.confirm_password)
                            errs.confirm_password  = 'Passwords do not match';
    if (!form.email)        errs.email             = 'Email is required';
    if (!form.first_name)   errs.first_name        = 'First name is required';
    if (!form.last_name)    errs.last_name         = 'Last name is required';
    if (!form.institute)    errs.institute         = 'Institute is required';
    if (!form.phone_number) errs.phone_number      = 'Phone number is required';
    if (!form.department)   errs.department        = 'Please select a department';
    if (!form.state)        errs.state             = 'Please select a state';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoad(true);
    try {
      await api.get('/api/csrf/');
      await api.post('/api/register/', new URLSearchParams(form));
      setStep(1);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ _global: err.response?.data?.error || err.message });
      }
    } finally {
      setLoad(false);
    }
  }

  // Shorthands
  const f = (name, label, extra = {}) => (
    <FormField name={name} label={label} value={form[name]}
               error={errors[name]} onChange={handleChange(name)} {...extra} />
  );
  const s = (name, label, options) => (
    <SelectField name={name} label={label} options={options}
                 value={form[name]} error={errors[name]} onChange={handleChange(name)} />
  );

  // ── Success state ────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <main className={styles.page}>
        <Helmet><title>Registration Pending — FOSSEE Workshops</title></Helmet>
        <div className={styles.successCard}>
          <CheckCircle size={48} color="var(--clr-accent)" />
          <h2>Check your inbox!</h2>
          <p>
            We've sent a verification email to <strong>{form.email}</strong>.
            Click the link in the email to activate your account.
          </p>
          <Link to="/login" className="btn btn-primary">Go to Sign In</Link>
        </div>
      </main>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
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

            {/* ── Account Credentials ─────────────────────────────── */}
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Account Credentials</legend>
              {f('username', 'Username', { autoComplete: 'username' })}
              <div className={styles.twoCol}>
                {f('password',         'Password',         { type: 'password', autoComplete: 'new-password' })}
                {f('confirm_password', 'Confirm Password', { type: 'password', autoComplete: 'new-password' })}
              </div>
            </fieldset>

            {/* ── Personal Information ─────────────────────────────── */}
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Personal Information</legend>
              <div className={styles.twoCol}>
                {s('title', 'Title', TITLES.map(t => [t, t]))}
                {f('phone_number', 'Phone Number', { type: 'tel', autoComplete: 'tel' })}
              </div>
              <div className={styles.twoCol}>
                {f('first_name', 'First Name', { autoComplete: 'given-name' })}
                {f('last_name',  'Last Name',  { autoComplete: 'family-name' })}
              </div>
              {f('email', 'Email Address', { type: 'email', autoComplete: 'email' })}
            </fieldset>

            {/* ── Institute Details ────────────────────────────────── */}
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Institute Details</legend>
              {f('institute', 'Institute Name')}
              <div className={styles.twoCol}>
                {s('department', 'Department',   DEPARTMENTS)}
                {f('location',   'City',         { autoComplete: 'address-level2' })}
              </div>
              {s('state', 'State', STATES)}
            </fieldset>

            {/* ── How did you hear ─────────────────────────────────── */}
            <fieldset className={styles.section}>
              <legend className={styles.legend}>One More Thing</legend>
              {s('how_did_you_hear_about_us', 'How did you hear about us?',
                 SOURCES.map(src => [src, src]))}
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
