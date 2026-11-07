import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api';

export default function Login({ admin = false }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) return setError('Please enter your email and password.');
    setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password, admin ? 'admin' : 'student');
      navigate(u.role === 'admin' ? '/admin' : '/menu', { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-emoji">{admin ? '🛠️' : '🍛'}</div>
          <h1>{admin ? 'Admin Login' : 'Student Login'}</h1>
          <p>{admin ? 'Manage the canteen menu and orders' : 'Pre-order your food and skip the queue'}</p>
        </div>
        <form onSubmit={submit} noValidate>
          {error && <div className="alert alert-error">{error}</div>}
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@srkr.edu" autoComplete="email" />
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={onChange} placeholder="Your password" autoComplete="current-password" />
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        </form>
        <div className="auth-links">
          {admin ? (
            <Link to="/login">← Student login</Link>
          ) : (
            <>
              <span>New student? <Link to="/register">Create account</Link></span>
              <Link to="/admin/login">Admin login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
