/**
 * RegisterPage.jsx
 *
 * Registration is only for coordinators (instructors are added by admins).
 * The form uses the same floating-label pattern as login for visual consistency.
 * Fields are grouped logically: account credentials → personal info → institute.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';
import styles from './RegisterPage.module.css';

const POSITIONS = [
  { value: 'coordinator', label: 'Coordinator (default)' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);  // 0: form, 1: email sent
  const [loading, setLoad]  = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    username: '',   password: '',   confirm: '',
    first_name: '', last_name: '',  email: '',
    phone_number: '', institute: '', department: '',
    position: 'coordinator', location: '', state: '',
  });

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: undefined, _global: undefined }));
    };
  }

  function validate() {
    const errs = {};
    if (!form.username)    errs.username   = 'Username is required';
    if (!form.password)    errs.password   = 'Password is required';
    if (form.password !== form.confirm)
                           errs.confirm    = 'Passwords do not match';
    if (!form.email)       errs.email      = 'Email is required';
    if (!form.first_name)  errs.first_name = 'First name is required';
    if (!form.last_name)   errs.last_name  = 'Last name is required';
    if (!form.institute)   errs.institute  = 'Institute is required';
    if (!form.phone_number) errs.phone_number = 'Phone number is required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoad(true);
    try {
      const payload = new URLSearchParams(form);
      await api.post('/accounts/register/', payload);
      setStep(1);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setLoad(false);
    }
  }

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

  const F = ({ name, label, type = 'text', autoComplete }) => (
    <div className={`field-wrap ${form[name] ? 'has-value' : ''}`}>
      <input id={name} name={name} type={type} autoComplete={autoComplete}
             value={form[name]} onChange={set(name)} />
      <label htmlFor={name}>{label}</label>
      {errors[name] && <p className="field-error"><AlertCircle size={12} />{errors[name]}</p>}
    </div>
  );

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
            <fieldset className={styles.section}>
              <legend className={styles.legend}>Account Credentials</legend>
              <F name="username"    label="Username"         autoComplete="username" />
              <div className={styles.twoCol}>
                <F name="password" label="Password"  type="password" autoComplete="new-password" />
                <F name="confirm"  label="Confirm Password" type="password" autoComplete="new-password" />
              </div>
            </fieldset>

            <fieldset className={styles.section}>
              <legend className={styles.legend}>Personal Information</legend>
              <div className={styles.twoCol}>
                <F name="first_name" label="First Name" autoComplete="given-name" />
                <F name="last_name"  label="Last Name"  autoComplete="family-name" />
              </div>
              <F name="email"        label="Email Address" type="email" autoComplete="email" />
              <F name="phone_number" label="Phone Number"  type="tel"   autoComplete="tel" />
            </fieldset>

            <fieldset className={styles.section}>
              <legend className={styles.legend}>Institute Details</legend>
              <F name="institute"  label="Institute Name" />
              <div className={styles.twoCol}>
                <F name="department" label="Department" />
                <F name="position"   label="Position / Role" />
              </div>
              <div className={styles.twoCol}>
                <F name="location" label="City" autoComplete="address-level2" />
                <F name="state"    label="State" autoComplete="address-level1" />
              </div>
            </fieldset>

            <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : <><UserPlus size={16} /> Create Account</>}
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
