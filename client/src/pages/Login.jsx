import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.username, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card p-4">
          <h3 className="fw-bold text-center mb-3">
            <i className="bi bi-shield-lock me-2"></i>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h3>

          <div className="btn-group w-100 mb-4">
            <button
              className={`btn ${mode === 'login' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`btn ${mode === 'register' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label">Username</label>
            <input
              className="form-control mb-3"
              name="username"
              value={form.username}
              onChange={onChange}
              required
              placeholder="coach_arnav"
            />
            {mode === 'register' && (
              <>
                <label className="form-label">Email</label>
                <input
                  className="form-control mb-3"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  placeholder="you@example.com"
                />
              </>
            )}
            <label className="form-label">Password</label>
            <input
              className="form-control mb-4"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
              placeholder="••••••••"
            />
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <button className="btn btn-brand w-100" disabled={busy}>
              {busy ? <span className="spinner-border spinner-border-sm"></span> : (
                <>{mode === 'login' ? 'Sign In' : 'Register'}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

