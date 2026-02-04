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
} from 'recharts';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getBranchDashboard } from '../../../api/dashboard.api';
import { getSalesDashboard } from '../../../api/reports';
import { getBranches } from '../../../api/branches';
import { getCustomers } from '../../../api/customers';
import { ROUTES } from '../../../config/constants';
import { formatCurrency } from '../../../utils/money';
import type { BranchDashboardData } from '../../../api/dashboard.api';
import type { SalesDashboard } from '../../../types/crm';
import type { Branch } from '../../../types/crm';
import type { Customer } from '../../../types/crm';

type DatePreset = '7d' | '30d';

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [from, setFrom] = useState(() => getDateRange('30d').from);
  const [to, setTo] = useState(() => getDateRange('30d').to);

  const [data, setData] = useState<BranchDashboardData | null>(null);
  const [salesData, setSalesData] = useState<SalesDashboard | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(() => {
    setLoading(true);
    setError('');
    getBranchDashboard({ from: new Date(from).toISOString(), to: new Date(to).toISOString() }).then((res) => {
      setLoading(false);
      if (res.success && res.data) setData(res.data);
      else setError(res.message || 'Failed to load dashboard');
    }).catch(() => setLoading(false));
  }, [from, to]);

  const loadSales = useCallback(() => {
    setSalesLoading(true);
    getSalesDashboard({ from: new Date(from).toISOString(), to: new Date(to).toISOString() }).then((r) => {
      setSalesLoading(false);
      if (r.success && r.data) setSalesData(r.data);
    }).catch(() => setSalesLoading(false));
  }, [from, to]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadSales(); }, [loadSales]);
  useEffect(() => {
    setBranchesLoading(true);
    setCustomersLoading(true);
    getBranches().then((r) => {
      setBranchesLoading(false);
      if (r.success && r.branches) setBranches(r.branches);
    }).catch(() => setBranchesLoading(false));
    getCustomers().then((r) => {
      setCustomersLoading(false);
      if (r.success && r.customers) setCustomers(r.customers);
    }).catch(() => setCustomersLoading(false));
  }, []);

  const chartServiceData = (salesData?.byService ?? []).map((x) => ({
    name: x.serviceCategory || 'Other',
    revenue: x.revenue,
  }));

  if (loading && !data) {
    return (
      <div className="dashboard-content">
        <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-content">
        <section className="welcome-card">
          <h2>Welcome, {user?.name}</h2>
          <p>Branch dashboard for {user?.branchName || 'your branch'}.</p>
        </section>
        <div className="auth-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content vendor-dashboard-full">
      <header className="vendor-dashboard-header">
        <div>
          <h1 className="vendor-dashboard-title">Welcome, {user?.name}</h1>
          <p className="vendor-dashboard-subtitle">Your branch: {user?.branchName ?? '—'}</p>
        </div>
        <div className="vendor-dashboard-filters">
          <span className="vendor-dashboard-period-label">Period</span>
          <div className="vendor-dashboard-presets">
            <button
              type="button"
              className={`vendor-dashboard-preset-btn ${datePreset === '7d' ? 'active' : ''}`}
              onClick={() => {
                setDatePreset('7d');
                const r = getDateRange('7d');
                setFrom(r.from);
                setTo(r.to);
              }}
            >
              7 days
            </button>
            <button
              type="button"
              className={`vendor-dashboard-preset-btn ${datePreset === '30d' ? 'active' : ''}`}
              onClick={() => {
                setDatePreset('30d');
                const r = getDateRange('30d');
                setFrom(r.from);
                setTo(r.to);
              }}
            >
              30 days
            </button>
          </div>
          <button type="button" className="vendor-dashboard-refresh" onClick={() => { loadDashboard(); loadSales(); }} aria-label="Refresh">
            ↻ Refresh
          </button>
        </div>
      </header>

      <section className="vendor-dashboard-kpis">
        <div className="vendor-kpi-card">
          <span className="vendor-kpi-value">{salesLoading ? '…' : formatCurrency(salesData?.totalRevenue ?? 0)}</span>
          <span className="vendor-kpi-label">Revenue (period)</span>
          <Link to={ROUTES.vendor.sales} className="vendor-kpi-link">View sales →</Link>
        </div>
        <div className="vendor-kpi-card">
          <span className="vendor-kpi-value">{data?.membershipSalesCount ?? 0}</span>
          <span className="vendor-kpi-label">Memberships sold</span>
          <Link to={ROUTES.vendor.memberships} className="vendor-kpi-link">View →</Link>
        </div>
        <div className="vendor-kpi-card">
          <span className="vendor-kpi-value">{data?.todayAppointments?.length ?? 0}</span>
          <span className="vendor-kpi-label">Today&apos;s appointments</span>
          <Link to={ROUTES.vendor.appointments} className="vendor-kpi-link">View →</Link>
        </div>
        <div className="vendor-kpi-card vendor-kpi-warning">
          <span className="vendor-kpi-value">{data?.leadsToFollowUp?.length ?? 0}</span>
          <span className="vendor-kpi-label">Leads to follow up</span>
          <Link to={ROUTES.vendor.leads} className="vendor-kpi-link">View →</Link>
        </div>
        <div className="vendor-kpi-card">
          <span className="vendor-kpi-value">{data?.servicesCompleted ?? 0}</span>
          <span className="vendor-kpi-label">Services completed</span>
        </div>
        <div className="vendor-kpi-card">
          <span className="vendor-kpi-value">{customersLoading ? '…' : customers.length}</span>
          <span className="vendor-kpi-label">My customers</span>
          <Link to={ROUTES.vendor.customers} className="vendor-kpi-link">View →</Link>
        </div>
      </section>

      <section className="content-card vendor-dashboard-chart-card">
        <h3>Revenue by service category</h3>
        {salesLoading ? (
          <div className="vendor-chart-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : chartServiceData.length > 0 ? (
          <div className="vendor-chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartServiceData} margin={{ top: 12, right: 12, left: 12, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--theme-text)', fontSize: 12 }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fill: 'var(--theme-text)', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 8 }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="revenue" fill="var(--theme-link)" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="vendor-chart-empty">No revenue data for this period.</p>
        )}
      </section>

      <h3 className="vendor-dashboard-section-title">Recent activity</h3>
      <div className="vendor-dashboard-activity-grid">
        <section className="content-card vendor-activity-card">
          <div className="vendor-activity-card-head">
            <h4>Today&apos;s appointments</h4>
            <Link to={ROUTES.vendor.appointments} className="vendor-activity-link">View all →</Link>
          </div>
          {!data?.todayAppointments || data.todayAppointments.length === 0 ? (
            <p className="text-muted">No appointments today.</p>
          ) : (
            <ul className="vendor-activity-list">
              {data.todayAppointments.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <span className="vendor-activity-time">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="vendor-activity-detail">{a.customer?.name ?? '—'} · {a.service ?? a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="content-card vendor-activity-card">
          <div className="vendor-activity-card-head">
            <h4>Leads to follow up</h4>
            <Link to={ROUTES.vendor.leads} className="vendor-activity-link">View all →</Link>
          </div>
          {!data?.leadsToFollowUp || data.leadsToFollowUp.length === 0 ? (
            <p className="text-muted">No leads to follow up.</p>
          ) : (
            <ul className="vendor-activity-list">
              {data.leadsToFollowUp.slice(0, 8).map((l) => (
                <li key={l.id}>
                  <Link to={ROUTES.vendor.leadDetail(l.id)} className="vendor-activity-lead">{l.name}</Link>
                  <span className="vendor-activity-status">{l.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="vendor-dashboard-info-row">
        <section className="content-card vendor-info-compact">
          <h4>Your account</h4>
          <dl className="vendor-info-dl vendor-info-dl-compact">
            <dt>Name</dt><dd>{user?.name ?? '—'}</dd>
            <dt>Branch</dt><dd>{user?.branchName ?? '—'}</dd>
            {user?.vendorName && (<><dt>Business</dt><dd>{user.vendorName}</dd></>)}
          </dl>
          <Link to={ROUTES.vendor.profile} className="vendor-kpi-link">Edit profile →</Link>
        </section>
        <section className="content-card vendor-info-compact">
          <h4>My branch</h4>
          {branchesLoading ? <p className="text-muted">Loading...</p> : branches.length === 0 ? (
            <p className="text-muted">No branch assigned.</p>
          ) : (
            <>
              {branches.map((b) => (
                <p key={b.id} className="vendor-branch-one"><strong>{b.name}</strong>{b.address ? ` — ${b.address}` : ''}</p>
              ))}
              <Link to={ROUTES.vendor.branches} className="vendor-kpi-link">View branches →</Link>
            </>
          )}
        </section>
        <section className="content-card vendor-info-compact">
          <h4>Quick links</h4>
          <div className="vendor-quick-links">
            <Link to={ROUTES.vendor.appointments}>Appointments</Link>
            <Link to={ROUTES.vendor.leads}>Leads</Link>
            <Link to={ROUTES.vendor.customers}>Customers</Link>
            <Link to={ROUTES.vendor.memberships}>Memberships</Link>
            <Link to={ROUTES.vendor.sales}>Sales</Link>
            <Link to={ROUTES.vendor.profile}>Profile</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
