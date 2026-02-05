import { useEffect, useState } from 'react';
import { getSalesDashboard } from '../../../api/reports';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../auth/hooks/useAuth';
import type { SalesDashboard as SalesDashboardType } from '../../../types/common';
import type { Branch } from '../../../types/common';

export default function BranchDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<SalesDashboardType | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    getSalesDashboard({
      branchId: branchId || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
    }).then((r) => {
      setLoading(false);
      if (r.success && r.data) setData(r.data);
      else setError(r.message || 'Failed to load');
    });
  }, [branchId, from, to]);

  return (
    <div className="dashboard-content">
      <header className="page-hero">
        <h1 className="page-hero-title">Sales dashboard</h1>
        <p className="page-hero-subtitle">Revenue and memberships by branch, date range, and service category.</p>
      </header>
      <section className="content-card">
        <div className="sales-filters">
          {isAdmin && (
            <label>
              <span>Branch</span>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span>From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        {error && <div className="auth-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : data && (
          <>
            <div className="owner-hero-stats" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{data.totalRevenue}</span>
                <span className="owner-hero-stat-label">Total revenue</span>
              </div>
              <div className="owner-hero-stat">
                <span className="owner-hero-stat-value">{data.totalMemberships}</span>
                <span className="owner-hero-stat-label">Memberships sold</span>
              </div>
            </div>
            {data.byBranch && data.byBranch.length > 0 && (
              <div className="page-section">
                <h2 className="page-section-title">By branch</h2>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th className="num">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byBranch.map((x) => (
                        <tr key={x.branch}>
                          <td><strong>{x.branch}</strong></td>
                          <td className="num">{x.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {data.byService && data.byService.length > 0 && (
              <div className="page-section">
                <h2 className="page-section-title">By service category</h2>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Service category</th>
                        <th className="num">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byService.map((x) => (
                        <tr key={x.serviceCategory}>
                          <td><strong>{x.serviceCategory}</strong></td>
                          <td className="num">{x.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {(!data.byBranch || data.byBranch.length === 0) && (!data.byService || data.byService.length === 0) && (
              <p className="vendors-empty">No breakdown data for the selected filters.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
