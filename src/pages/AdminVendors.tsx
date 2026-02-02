import { useEffect, useState, useCallback } from 'react';
import { getVendors, approveVendor, rejectVendor } from '../api/vendors';
import type { VendorListItem, ApprovalStatus } from '../types/auth';

type FilterStatus = 'all' | ApprovalStatus;

export default function AdminVendors() {
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorListItem | null>(null);

  async function loadVendors() {
    setLoading(true);
    setError('');
    const status = filter === 'all' ? undefined : filter;
    const res = await getVendors(status);
    setLoading(false);
    if (res.success && res.vendors) setVendors(res.vendors);
    else setError(res.message || 'Failed to load vendors');
  }

  useEffect(() => {
    loadVendors();
  }, [filter]);

  const closeModal = useCallback(() => setSelectedVendor(null), []);

  useEffect(() => {
    if (!selectedVendor) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedVendor, closeModal]);

  async function handleApprove(id: string) {
    setActioningId(id);
    const res = await approveVendor(id);
    setActioningId(null);
    if (res.success) loadVendors();
    else setError(res.message || 'Failed to approve');
  }

  async function handleReject(id: string) {
    setActioningId(id);
    const res = await rejectVendor(id);
    setActioningId(null);
    if (res.success) {
      loadVendors();
      setSelectedVendor((prev) => (prev && prev.id === id ? { ...prev, approvalStatus: 'rejected' as const } : prev));
    } else setError(res.message || 'Failed to reject');
  }

  function handleApproveFromModal(id: string) {
    setSelectedVendor((prev) => (prev && prev.id === id ? { ...prev, approvalStatus: 'approved' as const } : prev));
    handleApprove(id);
  }

  function handleRejectFromModal(id: string) {
    handleReject(id);
  }

  const pendingCount = filter === 'all' ? vendors.filter((v) => v.approvalStatus === 'pending').length : 0;

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <div className="vendors-header">
          <h2>Vendor management</h2>
          <p className="vendors-subtitle">Approve or reject vendor registrations.</p>
        </div>

        <div className="vendors-filters">
          <button
            type="button"
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending {filter === 'all' && pendingCount > 0 ? `(${pendingCount})` : ''}
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button
            type="button"
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        {error && <div className="auth-error vendors-error">{error}</div>}

        {loading ? (
          <div className="vendors-loading">
            <div className="spinner" />
            <span>Loading vendors...</span>
          </div>
        ) : vendors.length === 0 ? (
          <p className="vendors-empty">No vendors found.</p>
        ) : (
          <div className="vendors-table-wrap">
            <table className="vendors-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Vendor name</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <button
                        type="button"
                        className="vendor-name-btn"
                        onClick={() => setSelectedVendor(v)}
                      >
                        {v.name}
                      </button>
                    </td>
                    <td>{v.email}</td>
                    <td>{v.vendorName || '—'}</td>
                    <td>
                      <span className={`status-badge status-${v.approvalStatus}`}>
                        {v.approvalStatus}
                      </span>
                    </td>
                    <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                    <td>
                      {v.approvalStatus === 'pending' && (
                        <div className="vendor-actions">
                          <button
                            type="button"
                            className="btn-approve"
                            onClick={() => handleApprove(v.id)}
                            disabled={actioningId !== null}
                          >
                            {actioningId === v.id ? '…' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="btn-reject"
                            onClick={() => handleReject(v.id)}
                            disabled={actioningId !== null}
                          >
                            {actioningId === v.id ? '…' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedVendor && (
        <div
          className="vendor-modal-backdrop"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="vendor-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-modal-title"
          >
            <div className="vendor-modal-header">
              <h2 id="vendor-modal-title">Vendor details</h2>
              <button
                type="button"
                className="vendor-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <dl className="vendor-detail-dl">
              <dt>Name</dt>
              <dd>{selectedVendor.name}</dd>
              <dt>Email</dt>
              <dd>{selectedVendor.email}</dd>
              <dt>Vendor / business name</dt>
              <dd>{selectedVendor.vendorName || '—'}</dd>
              <dt>Status</dt>
              <dd>
                <span className={`status-badge status-${selectedVendor.approvalStatus}`}>
                  {selectedVendor.approvalStatus}
                </span>
              </dd>
              <dt>Registered</dt>
              <dd>{new Date(selectedVendor.createdAt).toLocaleString()}</dd>
            </dl>
            {selectedVendor.approvalStatus === 'pending' && (
              <div className="vendor-modal-actions">
                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => handleApproveFromModal(selectedVendor.id)}
                  disabled={actioningId !== null}
                >
                  {actioningId === selectedVendor.id ? '…' : 'Approve'}
                </button>
                <button
                  type="button"
                  className="btn-reject"
                  onClick={() => handleRejectFromModal(selectedVendor.id)}
                  disabled={actioningId !== null}
                >
                  {actioningId === selectedVendor.id ? '…' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
