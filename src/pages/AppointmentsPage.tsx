import { useEffect, useState } from 'react';
import { getAppointments } from '../api/appointments';
import { getBranches } from '../api/branches';
import { useAuth } from '../auth/hooks/useAuth';
import type { Appointment } from '../types/crm';
import type { Branch } from '../types/crm';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    getAppointments({ branchId: branchId || undefined, date }).then((r) => {
      setLoading(false);
      if (r.success && r.appointments) setAppointments(r.appointments);
      else setError(r.message || 'Failed to load');
    });
  }, [branchId, date]);

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <h2>Appointments</h2>
        <p>Book, reschedule, and manage appointments per branch and staff.</p>
        <div className="vendors-filters" style={{ marginTop: '1rem' }}>
          {isAdmin && (
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="filter-btn">
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="filter-btn" style={{ padding: '0.5rem' }} />
          </label>
        </div>
        {error && <div className="auth-error vendors-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : appointments.length === 0 ? (
          <p className="vendors-empty">No appointments for this date.</p>
        ) : (
          <div className="vendors-table-wrap" style={{ marginTop: '1rem' }}>
            <table className="vendors-table">
              <thead>
                <tr><th>Customer</th><th>Branch</th><th>Service</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.customer?.name || '—'} {a.customer?.phone && `(${a.customer.phone})`}</td>
                    <td>{a.branch || '—'}</td>
                    <td>{a.service || '—'}</td>
                    <td>{a.scheduledAt ? new Date(a.scheduledAt).toLocaleTimeString() : '—'}</td>
                    <td><span className={`status-badge status-${a.status === 'completed' ? 'approved' : a.status === 'no-show' || a.status === 'cancelled' ? 'rejected' : 'pending'}`}>{a.status}</span></td>
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
