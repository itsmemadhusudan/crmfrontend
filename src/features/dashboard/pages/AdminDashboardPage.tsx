import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getVendors } from '../../../api/vendors';
import { getBranches } from '../../../api/branches';
import { getSalesDashboard, getOwnerOverview, getSettlements } from '../../../api/reports';
import type { SalesDashboard, OwnerOverviewBranch, Settlement } from '../../../types/crm';
import type { Branch } from '../../../types/crm';
import { ROUTES } from '../../../config/constants';
import { formatCurrency } from '../../../utils/money';
import { formatNumber } from '../../../utils/money';

type DatePreset = '7d' | '30d' | '90d' | 'custom';

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [from, setFrom] = useState(() => getDateRange('30d').from);
  const [to, setTo] = useState(() => getDateRange('30d').to);
  const [branchId, setBranchId] = useState('');
  const [totalVendors, setTotalVendors] = useState<number | null>(null);
  const [totalBranches, setTotalBranches] = useState<number | null>(null);
  const [pendingVendors, setPendingVendors] = useState<number | null>(null);
  const [salesData, setSalesData] = useState<SalesDashboard | null>(null);
  const [overview, setOverview] = useState<OwnerOverviewBranch[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCounts = useCallback(() => {
    setLoading(true);
    Promise.all([
      getVendors(),
      getVendors('pending'),
      getBranches(),
    ]).then(([allRes, pendingRes, branchesRes]) => {
      setLoading(false);
      if (allRes.success && allRes.vendors != null) setTotalVendors(allRes.vendors.length);
      if (pendingRes.success && pendingRes.vendors != null) setPendingVendors(pendingRes.vendors.length);
      if (branchesRes.success && branchesRes.branches != null) {
        setTotalBranches(branchesRes.branches.length);
        setBranches(branchesRes.branches);
      }
    }).catch(() => setLoading(false));
  }, []);

  const loadSales = useCallback(() => {
    setSalesLoading(true);
    setError('');
    getSalesDashboard({
      branchId: branchId || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
    }).then((r) => {
      setSalesLoading(false);
      if (r.success && r.data) setSalesData(r.data);
      else setError(r.message || 'Failed to load sales');
    });
  }, [branchId, from, to]);

  const loadOverview = useCallback(() => {
    setOverviewLoading(true);
    getOwnerOverview().then((r) => {
      setOverviewLoading(false);
      if (r.success && r.overview) setOverview(r.overview);
    });
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  useEffect(() => {
    loadOverview();
    getSettlements().then((r) => {
      if (r.success && r.settlements) setSettlements(r.settlements);
    });
  }, [loadOverview]);

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { from: f, to: t } = getDateRange(preset);
      setFrom(f);
      setTo(t);
    }
  };

  const chartBranchData = salesData?.byBranch?.map((x) => ({ name: x.branch, revenue: x.revenue })) ?? [];
  const chartServiceData = salesData?.byService?.map((x) => ({ name: x.serviceCategory || 'Other', revenue: x.revenue })) ?? [];
  const chartMembershipByBranch = overview.map((o) => ({ name: o.branchName, memberships: o.membershipsSold })).filter((d) => d.memberships > 0 || overview.length <= 10);
  const pieRevenueByBranch = (salesData?.byBranch ?? []).map((x) => ({ name: x.branch, value: x.revenue }));
  const totalLeads = overview.reduce((s, o) => s + (o.leads ?? 0), 0);
  const totalAppointments = overview.reduce((s, o) => s + (o.appointmentsThisMonth ?? 0), 0);
  const systemGrowthData = [
    { name: 'Vendors', value: totalVendors ?? 0, fill: 'var(--theme-link)' },
    { name: 'Branches', value: totalBranches ?? 0, fill: '#8b5cf6' },
    { name: 'Memberships sold', value: salesData?.totalMemberships ?? 0, fill: '#06b6d4' },
    { name: 'Total leads', value: totalLeads, fill: '#f59e0b' },
    { name: 'Appointments (month)', value: totalAppointments, fill: '#10b981' },
    { name: 'Pending approvals', value: pendingVendors ?? 0, fill: '#ef4444' },
  ].filter((d) => d.value > 0 || d.name === 'Vendors' || d.name === 'Branches');
  const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#84cc16', '#f97316'];

  return (
    <div className="dashboard-content admin-dashboard">
      <section className="welcome-card admin-dashboard-header">
        <div className="admin-dashboard-header-text">
          <h2>Welcome, {user?.name}</h2>
          <p>Overview of vendors, branches, sales, and performance.</p>
        </div>
        <div className="admin-dashboard-filters">
          <div className="filter-group">
            <label>Period</label>
            <div className="date-presets">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`preset-btn ${datePreset === p ? 'active' : ''}`}
                  onClick={() => applyPreset(p)}
                >
                  {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
                </button>
              ))}
            </div>
            <div className="date-inputs">
              <label>
                <span>From</span>
                <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setDatePreset('custom'); }} />
              </label>
              <label>
                <span>To</span>
                <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setDatePreset('custom'); }} />
              </label>
            </div>
          </div>
          <div className="filter-group">
            <label>Branch</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <button type="button" className="admin-dashboard-refresh" onClick={() => { loadCounts(); loadSales(); loadOverview(); }} aria-label="Refresh">
            ↻ Refresh
          </button>
        </div>
      </section>

      {error && <div className="auth-error admin-dashboard-error">{error}</div>}

      <div className="admin-dashboard-charts-section">
      <div className="admin-dashboard-charts">
        <section className="content-card admin-chart-card">
          <h3>Revenue by branch</h3>
          {salesLoading ? (
            <div className="admin-chart-loading"><div className="spinner" /><span>Loading...</span></div>
          ) : chartBranchData.length > 0 ? (
            <div className="admin-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartBranchData} margin={{ top: 12, right: 12, left: 12, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--theme-text)', fontSize: 12 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'var(--theme-text)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--theme-text-heading)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `Branch: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="var(--theme-link)" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="admin-chart-empty">No revenue data for this period.</p>
          )}
        </section>
        <section className="content-card admin-chart-card">
          <h3>Revenue by service category</h3>
          {salesLoading ? (
            <div className="admin-chart-loading"><div className="spinner" /><span>Loading...</span></div>
          ) : chartServiceData.length > 0 ? (
            <div className="admin-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartServiceData} margin={{ top: 12, right: 12, left: 12, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--theme-text)', fontSize: 12 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'var(--theme-text)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--theme-text-heading)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="var(--theme-border-accent)" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="admin-chart-empty">No service revenue data for this period.</p>
          )}
        </section>
      </div>

      <div className="admin-dashboard-charts">
        <section className="content-card admin-chart-card">
          <h3>Memberships by branch</h3>
          {overviewLoading ? (
            <div className="admin-chart-loading"><div className="spinner" /><span>Loading...</span></div>
          ) : chartMembershipByBranch.length > 0 ? (
            <div className="admin-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartMembershipByBranch} margin={{ top: 12, right: 12, left: 12, bottom: 60 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                  <XAxis type="number" tick={{ fill: 'var(--theme-text)', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'var(--theme-text)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8 }}
                    formatter={(value: number) => [formatNumber(value), 'Memberships']}
                    labelFormatter={(label) => `Branch: ${label}`}
                  />
                  <Bar dataKey="memberships" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Memberships sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="admin-chart-empty">No membership data by branch.</p>
          )}
        </section>
        <section className="content-card admin-chart-card">
          <h3>Vendor / branch income share</h3>
          {salesLoading ? (
            <div className="admin-chart-loading"><div className="spinner" /><span>Loading...</span></div>
          ) : pieRevenueByBranch.length > 0 ? (
            <div className="admin-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieRevenueByBranch}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'var(--theme-border)' }}
                  >
                    {pieRevenueByBranch.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8 }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="admin-chart-empty">No revenue data for this period.</p>
          )}
        </section>
      </div>

      <section className="content-card admin-chart-card admin-chart-card-full">
        <h3>System growth & platform overview</h3>
        {(loading || overviewLoading) ? (
          <div className="admin-chart-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : systemGrowthData.length > 0 ? (
          <div className="admin-chart-wrap admin-chart-wrap-horizontal">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={systemGrowthData} margin={{ top: 12, right: 24, left: 12, bottom: 24 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                <XAxis type="number" tick={{ fill: 'var(--theme-text)', fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'var(--theme-text)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8 }}
                  formatter={(value: number) => [formatNumber(value), 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Count">
                  {systemGrowthData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="admin-chart-empty">No platform data yet.</p>
        )}
      </section>
      </div>

      <div className="admin-dashboard-bottom">
      <h3 className="admin-dashboard-section-title">Summary &amp; quick links</h3>
      <div className="admin-dashboard-kpis stats-grid">
        <div className="stat-card admin-kpi">
          <span className="stat-value">{loading ? '…' : formatNumber(totalVendors ?? 0)}</span>
          <span className="stat-label">Total vendors</span>
          <Link to={ROUTES.admin.vendors} className="stat-link">View →</Link>
        </div>
        <div className="stat-card admin-kpi">
          <span className="stat-value">{loading ? '…' : formatNumber(totalBranches ?? 0)}</span>
          <span className="stat-label">Active branches</span>
          <Link to={ROUTES.admin.branches} className="stat-link">View →</Link>
        </div>
        <div className="stat-card admin-kpi admin-kpi-warning">
          <span className="stat-value">{loading ? '…' : formatNumber(pendingVendors ?? 0)}</span>
          <span className="stat-label">Pending approvals</span>
          <Link to={ROUTES.admin.vendors} className="stat-link">Review →</Link>
        </div>
        <div className="stat-card admin-kpi">
          <span className="stat-value">{salesLoading ? '…' : formatCurrency(salesData?.totalRevenue ?? 0)}</span>
          <span className="stat-label">Revenue (period)</span>
          <Link to={ROUTES.admin.sales} className="stat-link">Details →</Link>
        </div>
        <div className="stat-card admin-kpi">
          <span className="stat-value">{salesLoading ? '…' : formatNumber(salesData?.totalMemberships ?? 0)}</span>
          <span className="stat-label">Memberships sold</span>
          <Link to={ROUTES.admin.memberships} className="stat-link">View →</Link>
        </div>
      </div>

      <div className="admin-dashboard-tables">
        <section className="content-card admin-table-card">
          <div className="admin-table-header">
            <h3>Branch performance</h3>
            <button type="button" className="admin-table-refresh" onClick={loadOverview}>↻</button>
          </div>
          {overviewLoading ? (
            <div className="admin-chart-loading"><div className="spinner" /><span>Loading...</span></div>
          ) : overview.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Memberships sold</th>
                    <th>Leads</th>
                    <th>Leads booked</th>
                    <th>Appointments (month)</th>
                    <th>Completed</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.map((row) => (
                    <tr key={row.branchId}>
                      <td><strong>{row.branchName}</strong></td>
                      <td>{formatNumber(row.membershipsSold)}</td>
                      <td>{formatNumber(row.leads)}</td>
                      <td>{formatNumber(row.leadsBooked)}</td>
                      <td>{formatNumber(row.appointmentsThisMonth)}</td>
                      <td>{formatNumber(row.appointmentsCompleted)}</td>
                      <td className="branch-actions">
                        <Link to={ROUTES.admin.branches} className="branch-action-btn branch-action-view">Manage →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-chart-empty">No branch overview data.</p>
          )}
        </section>
        <section className="content-card admin-table-card">
          <div className="admin-table-header">
            <h3>Recent settlements</h3>
            <Link to={ROUTES.admin.settlements} className="stat-link">View all →</Link>
          </div>
          {settlements.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>From → To</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.slice(0, 5).map((s) => (
                    <tr key={s.id}>
                      <td>{s.fromBranch} → {s.toBranch}</td>
                      <td>{formatCurrency(s.amount)}</td>
                      <td><span className={`settlement-status settlement-status-${s.status?.toLowerCase()}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-chart-empty">No settlements.</p>
          )}
        </section>
      </div>

      <section className="content-card admin-quick-actions">
        <h3>Quick actions</h3>
        <div className="admin-quick-actions-grid">
          <Link to={ROUTES.admin.vendors} className="admin-quick-action">Staff & vendors</Link>
          <Link to={ROUTES.admin.branches} className="admin-quick-action">Branches</Link>
          <Link to={ROUTES.admin.sales} className="admin-quick-action">Sales dashboard</Link>
          <Link to={ROUTES.admin.overview} className="admin-quick-action">All branches overview</Link>
          <Link to={ROUTES.admin.leads} className="admin-quick-action">Leads inbox</Link>
          <Link to={ROUTES.admin.appointments} className="admin-quick-action">Appointments</Link>
          <Link to={ROUTES.admin.settlements} className="admin-quick-action">Settlements</Link>
          <Link to={ROUTES.admin.settings} className="admin-quick-action">Settings</Link>
        </div>
      </section>
      </div>
    </div>
  );
}
