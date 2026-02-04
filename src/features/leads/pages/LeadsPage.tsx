import { useEffect, useState } from 'react';
import { getLeads } from '../../../api/leads';
import { getLeadStatuses } from '../../../api/leadStatuses';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../auth/hooks/useAuth';
import { Link } from 'react-router-dom';
import type { Lead, Branch } from '../../../types/common';
import type { LeadStatusItem } from '../../../api/leadStatuses';

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusItem[]>([]);
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const basePath = user?.role === 'admin' ? '/admin' : '/vendor';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
    getLeadStatuses().then((r) => r.success && r.leadStatuses && setLeadStatuses(r.leadStatuses));
  }, [isAdmin]);

  useEffect(() => {
    setLoading(true);
    getLeads({ branchId: branchId || undefined, status: status || undefined }).then((r) => {
      setLoading(false);
      if (r.success && r.leads) setLeads(r.leads);
      else setError(r.message || 'Failed to load');
    });
  }, [branchId, status]);

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <h2>Lead inbox</h2>
        <p>{isAdmin ? 'All leads by branch. Each branch sees only its own leads.' : 'Your branch leads and follow-ups.'}</p>
        <div className="vendors-filters" style={{ marginTop: '1rem' }}>
          {isAdmin && (
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="filter-btn">
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-btn">
            <option value="">All statuses</option>
            {leadStatuses.length > 0
              ? leadStatuses.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)
              : ['New', 'Contacted', 'Call not Connected', 'Follow up', 'Booked', 'Lost'].map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        {error && <div className="auth-error vendors-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading leads...</span></div>
        ) : leads.length === 0 ? (
          <p className="vendors-empty">No leads.</p>
        ) : (
          <div className="vendors-table-wrap" style={{ marginTop: '1rem' }}>
            <table className="vendors-table">
              <thead>
                <tr><th>Name</th><th>Phone</th><th>Source</th>{isAdmin && <th>Branch</th>}<th>Status</th><th>Follow-ups</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>{l.phone || '—'}</td>
                    <td>{l.source}</td>
                    {isAdmin && <td>{l.branch || '—'}</td>}
                    <td><span className={`status-badge status-${l.status === 'Booked' ? 'approved' : l.status === 'Lost' ? 'rejected' : 'pending'}`}>{l.status}</span></td>
                    <td>{l.followUpsCount ?? (l.followUps?.length || 0)}</td>
                    <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td><Link to={`${basePath}/leads/${l.id}`}>View</Link></td>
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
