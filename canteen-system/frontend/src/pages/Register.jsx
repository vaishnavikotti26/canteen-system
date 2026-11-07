import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', rollNumber: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Please enter your full name.');
    if (!EMAIL_RE.test(form.email.trim())) return setError('Please enter a valid email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        rollNumber: form.rollNumber.trim(),
        password: form.password,
      });
      navigate('/menu', { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-emoji">🎓</div>
          <h1>Student Registration</h1>
          <p>Create your account to start ordering</p>
        </div>
        <form onSubmit={submit} noValidate>
          {error && <div className="alert alert-error">{error}</div>}
          <label>Full name</label>
          <input name="name" value={form.name} onChange={onChange} placeholder="Your full name" />
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@srkr.edu" />
          <label>Roll number (optional)</label>
          <input name="rollNumber" value={form.rollNumber} onChange={onChange} placeholder="e.g. 22B91A05XX" />
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={onChange} placeholder="At least 6 characters" autoComplete="new-password" />
          <label>Confirm password</label>
          <input type="password" name="confirm" value={form.confirm} onChange={onChange} placeholder="Repeat password" autoComplete="new-password" />
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
        </form>
        <div className="auth-links">
          <span>Already registered? <Link to="/login">Login</Link></span>
        </div>
      </div>
    </div>
  );
}
