import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../auth.store';
import { ROUTES } from '../../config/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  if (user) {
    const redirect = user.role === 'admin' ? ROUTES.admin.root : ROUTES.vendor.root;
    navigate(from || redirect, { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success && res.user) {
      const to = from || (res.user.role === 'admin' ? ROUTES.admin.root : ROUTES.vendor.root);
      navigate(to, { replace: true });
    } else setError(res.message || 'Login failed');
  }

  return (
    <div className="auth-page">
    <div className="auth-card">
      <h1>Sign in</h1>
      <p className="auth-subtitle">Lishnu Tech – Multi-vendor CRM</p>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="auth-footer">
        Don't have an account? <Link to={ROUTES.register}>Register</Link>
      </p>
    </div>
    </div>
  );
}
