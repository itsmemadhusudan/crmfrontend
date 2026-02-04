import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../auth/hooks/useAuth';
import { getCustomer, getCustomerVisitHistory } from '../../../api/customers';
import type { Customer } from '../../../types/common';
import type { VisitHistoryItem } from '../../../api/customers';
import { ROUTES } from '../../../config/constants';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [visitHistory, setVisitHistory] = useState<VisitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const basePath = user?.role === 'admin' ? '/admin' : '/vendor';

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getCustomer(id).then((r) => r.success && r.customer && setCustomer((r as { customer: Customer }).customer)),
      getCustomerVisitHistory(id).then((r) => r.success && r.visitHistory && setVisitHistory(r.visitHistory || [])),
    ]).finally(() => setLoading(false));
  }, [id]);

  if (loading || !id) {
    return (
      <div className="dashboard-content">
        <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="dashboard-content">
        <div className="auth-error">{error}</div>
        <button type="button" className="auth-submit" style={{ marginTop: '1rem' }} onClick={() => navigate(`${basePath}/customers`)}>Back to customers</button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="dashboard-content">
        <div className="auth-error">Customer not found.</div>
        <button type="button" className="auth-submit" style={{ marginTop: '1rem' }} onClick={() => navigate(`${basePath}/customers`)}>Back to customers</button>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <button type="button" className="vendor-name-btn" style={{ marginBottom: '0.5rem' }} onClick={() => navigate(`${basePath}/customers`)}>← Back to customers</button>
        <h2>Customer: {customer.name}</h2>
        <dl className="vendor-detail-dl">
          <dt>Phone</dt>
          <dd>{customer.phone || '—'}</dd>
          <dt>Email</dt>
          <dd>{customer.email || '—'}</dd>
          <dt>Membership card</dt>
          <dd>{customer.membershipCardId || '—'}</dd>
          <dt>Primary branch</dt>
          <dd>{customer.primaryBranch || '—'}</dd>
          <dt>Notes</dt>
          <dd>{customer.notes || '—'}</dd>
        </dl>
        <p style={{ marginTop: '1rem' }}>
          <Link to={`${basePath}/memberships`} className="filter-btn">View memberships</Link>
          {' '}
          <Link to={`${basePath}/appointments`} className="filter-btn">View appointments</Link>
        </p>
      </section>

      <section className="content-card" style={{ marginTop: '1rem' }}>
        <h3>Visit history & timeline</h3>
        <p className="text-muted">Services, branch, staff, and date for each visit.</p>
        {visitHistory.length === 0 ? (
          <p className="text-muted">No visit history yet.</p>
        ) : (
          <ul className="report-list">
            {visitHistory.map((v) => (
              <li key={`${v.type}-${v.id}`}>
                <strong>{new Date(v.date).toLocaleDateString()}</strong> — {v.service}
                {v.branch && ` @ ${v.branch}`}
                {v.staff && ` (${v.staff})`}
                {v.creditsUsed != null && ` · ${v.creditsUsed} credit(s)`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
