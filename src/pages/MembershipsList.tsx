import { useEffect, useState } from 'react';
import { getMemberships } from '../api/memberships';
import { getBranches } from '../api/branches';
import { useAuth } from '../auth/hooks/useAuth';
import { Link, useSearchParams } from 'react-router-dom';
import type { Membership } from '../types/crm';
import type { Branch } from '../types/crm';

export default function MembershipsList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(searchParams.get('branchId') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const basePath = user?.role === 'admin' ? '/admin' : '/vendor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    getMemberships({ branchId: branchId || undefined, status: status || undefined }).then((r) => {
      setLoading(false);
      if (r.success && 'memberships' in r) setMemberships((r as { memberships: Membership[] }).memberships);
      else setError((r as { message?: string }).message || 'Failed to load');
    });
  }, [branchId, status]);

  return (
    <div className="dashboard-content">
      <header className="page-hero">
        <h1 className="page-hero-title">Memberships</h1>
        <p className="page-hero-subtitle">Membership records and usage history. Track where sold and where used.</p>
      </header>
      <section className="content-card">
        <div className="vendors-filters" style={{ marginBottom: '1rem' }}>
          {isAdmin && (
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="filter-btn">
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-btn">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        {error && <div className="auth-error vendors-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : memberships.length === 0 ? (
          <p className="vendors-empty">No memberships found.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type</th>
                  <th className="num">Total / Used / Remaining</th>
                  <th>Sold at</th>
                  <th>Purchase date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.customer?.name || '—'}</strong> {m.customer?.phone && `(${m.customer.phone})`}</td>
                    <td>{m.typeName || '—'}</td>
                    <td className="num">{m.totalCredits} / {m.usedCredits} / {(m.remainingCredits ?? m.totalCredits - m.usedCredits)}</td>
                    <td>{m.soldAtBranch || '—'}</td>
                    <td>{m.purchaseDate ? new Date(m.purchaseDate).toLocaleDateString() : '—'}</td>
                    <td><span className={`status-badge status-${m.status === 'active' ? 'approved' : m.status === 'used' ? 'rejected' : 'pending'}`}>{m.status}</span></td>
                    <td><Link to={`${basePath}/memberships/${m.id}`}>View / Use</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
