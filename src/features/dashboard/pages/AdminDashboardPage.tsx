import { useEffect, useState } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getVendors } from '../../../api/vendors';
import { getBranches } from '../../../api/branches';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [totalVendors, setTotalVendors] = useState<number | null>(null);
  const [totalBranches, setTotalBranches] = useState<number | null>(null);
  const [pendingVendors, setPendingVendors] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getVendors(),
      getVendors('pending'),
      getBranches(),
    ]).then(([allRes, pendingRes, branchesRes]) => {
      if (cancelled) return;
      setLoading(false);
      if (allRes.success && allRes.vendors != null) setTotalVendors(allRes.vendors.length);
      if (pendingRes.success && pendingRes.vendors != null) setPendingVendors(pendingRes.vendors.length);
      if (branchesRes.success && branchesRes.branches != null) setTotalBranches(branchesRes.branches.length);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="dashboard-content">
      <section className="welcome-card">
        <h2>Welcome, {user?.name}</h2>
        <p>Manage vendors and system settings from here.</p>
      </section>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{loading ? '…' : totalVendors ?? '—'}</span>
          <span className="stat-label">Total Vendors</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{loading ? '…' : totalBranches ?? '—'}</span>
          <span className="stat-label">Active Branches</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{loading ? '…' : pendingVendors ?? '—'}</span>
          <span className="stat-label">Pending Approvals</span>
        </div>
      </div>
      <section className="content-card">
        <h3>Quick actions</h3>
        <ul className="quick-actions">
          <li>View and manage vendors</li>
          <li>Configure system settings</li>
          <li>Reports (coming soon)</li>
        </ul>
      </section>
    </div>
  );
}
