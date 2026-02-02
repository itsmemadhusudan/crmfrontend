import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth.store';
import type { Role } from '../auth.types';
import { ROUTES } from '../../config/constants';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('vendor');
  const [vendorName, setVendorName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuthStore();
  const navigate = useNavigate();

  if (user) {
    navigate(user.role === 'admin' ? ROUTES.admin.root : ROUTES.vendor.root, { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await register({ name, email, password, role, vendorName: role === 'vendor' ? vendorName : undefined });
    setLoading(false);
    if (res.success && res.user) {
      if (res.user.role === 'vendor' && res.user.approvalStatus !== 'approved') {
        navigate(ROUTES.vendor.root, { replace: true });
      } else {
        navigate(res.user.role === 'admin' ? ROUTES.admin.root : ROUTES.vendor.root, { replace: true });
      }
    } else setError(res.message || 'Registration failed');
  }

  return (
    <div className="auth-page">
    <div className="auth-card auth-card--wide">
      <h1>Create account</h1>
      <p className="auth-subtitle">Lishnu Tech – Multi-vendor CRM</p>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label><span>Full name</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required autoComplete="name" /></label>
        <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" /></label>
        <label><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required autoComplete="new-password" /></label>
        <label><span>Role</span><select value={role} onChange={(e) => setRole(e.target.value as Role)}><option value="vendor">Vendor</option><option value="admin">Admin</option></select></label>
        {role === 'vendor' && (
          <label><span>Vendor name (optional)</span><input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Your business name" /></label>
        )}
        <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Creating account...' : 'Register'}</button>
      </form>
      <p className="auth-footer">Already have an account? <Link to={ROUTES.login}>Sign in</Link></p>
    </div>
    </div>
  );
}
