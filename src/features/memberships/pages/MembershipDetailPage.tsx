import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMembership, recordMembershipUsage } from '../../../api/memberships';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency } from '../../../utils/money';
import type { Membership, MembershipUsage } from '../../../types/common';

export default function MembershipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [usageHistory, setUsageHistory] = useState<MembershipUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useCredits, setUseCredits] = useState(1);
  const [useNotes, setUseNotes] = useState('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const basePath = user?.role === 'admin' ? '/admin' : '/vendor';
  const isOtherBranchPackage = Boolean(
    user?.branchId && membership?.soldAtBranchId && String(user.branchId) !== String(membership.soldAtBranchId)
  );

  useEffect(() => {
    if (!id) return;
    getMembership(id).then((r) => {
      setLoading(false);
      if (r.success) {
        setMembership(r.membership || null);
        setUsageHistory(r.usageHistory || []);
      } else setError(r.message || 'Failed to load');
    });
  }, [id]);

  async function handleUse(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !membership) return;
    const remaining = (membership.remainingCredits ?? membership.totalCredits - membership.usedCredits);
    if (useCredits > remaining) {
      setError(`Only ${remaining} credit(s) remaining.`);
      return;
    }
    const isOtherBranch = Boolean(user?.branchId && membership.soldAtBranchId && String(user.branchId) !== String(membership.soldAtBranchId));
    if (isOtherBranch && !serviceDetails.trim()) {
      setError('Please enter service/visit details when using a package from another branch.');
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await recordMembershipUsage(id, { creditsUsed: useCredits, notes: useNotes, serviceDetails: serviceDetails.trim() || undefined });
    setSubmitting(false);
    if (res.success) {
      getMembership(id).then((r) => {
        if (r.success) {
          setMembership(r.membership || null);
          setUsageHistory(r.usageHistory || []);
          setUseCredits(1);
          setUseNotes('');
          setServiceDetails('');
        }
      });
    } else setError((res as { message?: string }).message || 'Failed to record usage');
  }

  if (loading || !id) {
    return (
      <div className="dashboard-content">
        <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
      </div>
    );
  }

  if (error && !membership) {
    return (
      <div className="dashboard-content">
        <div className="auth-error">{error}</div>
        <button type="button" className="auth-submit" style={{ marginTop: '1rem' }} onClick={() => navigate(`${basePath}/memberships`)}>Back to memberships</button>
      </div>
    );
  }

  const remaining = membership!.remainingCredits ?? membership!.totalCredits - membership!.usedCredits;
  const canUse = remaining > 0 && membership!.status === 'active';

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <div className="vendors-header">
          <button type="button" className="vendor-name-btn" style={{ marginBottom: '0.5rem' }} onClick={() => navigate(`${basePath}/memberships`)}>← Back to memberships</button>
          <h2>Membership details</h2>
        </div>
        <dl className="vendor-detail-dl">
          <dt>Customer</dt>
          <dd>{membership!.customer?.name || '—'} {membership!.customer?.phone && `(${membership!.customer.phone})`}</dd>
          <dt>Total credits</dt>
          <dd>{membership!.totalCredits}</dd>
          <dt>Used</dt>
          <dd>{membership!.usedCredits}</dd>
          <dt>Remaining</dt>
          <dd>{remaining}</dd>
          <dt>Package price</dt>
          <dd>{membership!.packagePrice != null ? formatCurrency(membership!.packagePrice) : '—'}</dd>
          <dt>Sold at branch</dt>
          <dd>{membership!.soldAtBranch || '—'}</dd>
          <dt>Purchase date</dt>
          <dd>{membership!.purchaseDate ? new Date(membership!.purchaseDate).toLocaleDateString() : '—'}</dd>
          <dt>Expiry</dt>
          <dd>{membership!.expiryDate ? new Date(membership!.expiryDate).toLocaleDateString() : '—'}</dd>
          <dt>Status</dt>
          <dd><span className={`status-badge status-${membership!.status === 'active' ? 'approved' : membership!.status === 'used' ? 'rejected' : 'pending'}`}>{membership!.status}</span></dd>
        </dl>
        {canUse && (
          <form onSubmit={handleUse} className="auth-form" style={{ marginTop: '1.5rem', maxWidth: '480px' }}>
            <h3>{isOtherBranchPackage ? 'Record service (package from another branch)' : 'Use credits (at this branch)'}</h3>
            {isOtherBranchPackage && (
              <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
                This package was sold at <strong>{membership!.soldAtBranch}</strong>. Please enter the full service/visit details below.
              </p>
            )}
            {error && <div className="auth-error">{error}</div>}
            <label><span>Credits to use</span><input type="number" min={1} max={remaining} value={useCredits} onChange={(e) => setUseCredits(Number(e.target.value))} /></label>
            <label>
              <span>Service / visit details {isOtherBranchPackage ? '(required for other-branch package)' : '(optional)'}</span>
              <textarea value={serviceDetails} onChange={(e) => setServiceDetails(e.target.value)} placeholder="e.g. service name, staff, date/time, any other details" rows={3} style={{ width: '100%', resize: 'vertical' }} />
            </label>
            <label><span>Notes (optional)</span><input type="text" value={useNotes} onChange={(e) => setUseNotes(e.target.value)} placeholder="Notes" /></label>
            <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? 'Recording...' : 'Record usage'}</button>
          </form>
        )}
        <h3 style={{ marginTop: '1.5rem' }}>Usage history</h3>
        {usageHistory.length === 0 ? <p className="text-muted">No usage recorded yet.</p> : (
          <ul className="report-list">
            {usageHistory.map((u) => (
              <li key={u.id}>
                {u.usedAtBranch} — {u.creditsUsed} credit(s) — {u.usedBy && `${u.usedBy}, `}{new Date(u.usedAt).toLocaleString()}
                {u.serviceDetails && <><br /><span className="text-muted">Details: {u.serviceDetails}</span></>}
                {u.notes && <> — {u.notes}</>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
