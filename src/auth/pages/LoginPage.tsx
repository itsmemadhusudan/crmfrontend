import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../auth.store';
import { ROUTES } from '../../config/constants';
import loginBgImage from '../../images/login.jpg';

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
    <div className="auth-page login-split-page">
      <div className="login-split-card">
        {/* Left: Member Login */}
        <div className="login-split-left">
          <h1 className="login-split-title">Member Login</h1>
          <p className="login-split-subtitle">Please fill in your basic info</p>
          {error && <div className="auth-error login-split-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="login-split-form">
            <label className="login-split-field">
              <span className="login-split-input-wrap">
                <span className="login-split-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marj.navasca"
                  required
                  autoComplete="email"
                />
              </span>
            </label>
            <label className="login-split-field">
              <span className="login-split-input-wrap">
                <span className="login-split-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
              </span>
            </label>
            <button type="submit" className="login-split-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'LOGIN'}
            </button>
            <p className="login-split-forgot">
              <Link to={ROUTES.forgotPassword}>Forgot Password?</Link>
            </p>
          </form>
        </div>

        {/* Right: Sign Up with background image */}
        <div
          className="login-split-right"
          style={{ backgroundImage: `url(${loginBgImage})` }}
        >
          <div className="login-split-right-overlay" />
          <div className="login-split-right-content">
            <h2 className="login-split-right-title">Sign Up</h2>
            <p className="login-split-right-subtitle">Using your social media account</p>
            <div className="login-split-social">
              <a href="#" className="login-split-social-btn" aria-label="Gmail" onClick={(e) => e.preventDefault()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 5.457v13.909c0 .857-.737 1.545-1.636 1.545H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.857.737-1.545 1.636-1.545h2.727v10.909l6.545-4.091 6.545 4.091V3.912h2.727c.899 0 1.636.688 1.636 1.545z" />
                </svg>
                <span>Gmail</span>
              </a>
              <a href="#" className="login-split-social-btn" aria-label="Facebook" onClick={(e) => e.preventDefault()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </a>
              <a href="#" className="login-split-social-btn" aria-label="Twitter" onClick={(e) => e.preventDefault()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Twitter</span>
              </a>
            </div>
            <label className="login-split-terms">
              <input type="checkbox" className="login-split-checkbox" />
              <span>By signing up I agree with <a href="#">terms and conditions</a></span>
            </label>
            <p className="login-split-create">
              <Link to={ROUTES.register}>Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
