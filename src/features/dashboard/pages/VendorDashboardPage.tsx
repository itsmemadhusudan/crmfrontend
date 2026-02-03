import { useEffect, useState } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getBranches } from '../../../api/branches';

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBranches().then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.success && res.branches != null) setBranchCount(res.branches.length);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dashboard-content">
      <section className="welcome-card">
        <h2>Welcome, {user?.vendorName ?? user?.name}</h2>
        <p>Manage your branches and profile from here.</p>
      </section>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{loading ? '…' : branchCount ?? '—'}</span>
          <span className="stat-label">My Branches</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{branchCount != null ? branchCount : '—'}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">—</span>
          <span className="stat-label">Pending</span>
        </div>
      </div>
      <section className="content-card">
        <h3>Quick actions</h3>
        <ul className="quick-actions">
          <li>View and manage your branches</li>
          <li>Update profile and vendor details</li>
          <li>Reports (coming soon)</li>
        </ul>
      </section>
    </div>
  );
}
