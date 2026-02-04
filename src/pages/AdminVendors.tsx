import { useEffect, useState, useCallback } from 'react';
import { getVendors, getVendor, approveVendor, rejectVendor, updateVendor } from '../api/vendors';
import { getBranches } from '../api/branches';
import type { VendorListItem, ApprovalStatus } from '../types/auth';
import type { Branch } from '../types/crm';

type FilterStatus = 'all' | ApprovalStatus;

export default function AdminVendors() {
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorListItem | null>(null);
  const [vendorDetail, setVendorDetail] = useState<VendorListItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingVendor, setEditingVendor] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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

  const closeModal = useCallback(() => {
    setSelectedVendor(null);
    setVendorDetail(null);
    setEditingVendor(false);
    setEditError('');
  }, []);

  useEffect(() => {
    getBranches().then((r) => { if (r.success && r.branches) setBranches(r.branches); });
  }, []);

  useEffect(() => {
    if (!selectedVendor) return;
    setDetailLoading(true);
    setVendorDetail(null);
    getVendor(selectedVendor.id).then((r) => {
      setDetailLoading(false);
      if (r.success && r.vendor) {
        setVendorDetail(r.vendor);
        setEditName(r.vendor.name);
        setEditEmail(r.vendor.email);
        setEditVendorName(r.vendor.vendorName || '');
        setEditBranchId(r.vendor.branchId || '');
      }
    });
  }, [selectedVendor?.id]);

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

  const handleSaveVendorEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;
    setEditError('');
    setEditSaving(true);
    const res = await updateVendor(selectedVendor.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      vendorName: editVendorName.trim() || undefined,
      branchId: editBranchId || null,
    });
    setEditSaving(false);
    if (res.success && res.vendor) {
      setVendorDetail(res.vendor);
      setEditingVendor(false);
      loadVendors();
      setSelectedVendor((prev) => prev && prev.id === selectedVendor.id ? { ...prev, ...res.vendor } : prev);
    } else {
      setEditError(res.message || 'Failed to update vendor');
    }
  };

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
            {detailLoading ? (
              <div className="vendors-loading" style={{ padding: '1.5rem' }}>
                <div className="spinner" />
                <span>Loading details…</span>
              </div>
            ) : editingVendor ? (
              <form onSubmit={handleSaveVendorEdit} className="vendor-modal-edit-form">
                {editError && <div className="auth-error vendors-error">{editError}</div>}
                <label className="auth-form-label">
                  <span>Name</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="appointment-form-input"
                    required
                  />
                </label>
                <label className="auth-form-label">
                  <span>Email</span>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="appointment-form-input"
                    required
                  />
                </label>
                <label className="auth-form-label">
                  <span>Vendor / business name</span>
                  <input
                    type="text"
                    value={editVendorName}
                    onChange={(e) => setEditVendorName(e.target.value)}
                    className="appointment-form-input"
                  />
                </label>
                <label className="auth-form-label">
                  <span>Branch</span>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="appointment-form-input"
                  >
                    <option value="">No branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </label>
                <div className="vendor-modal-actions">
                  <button type="button" className="filter-btn" onClick={() => setEditingVendor(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={editSaving}>
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            ) : vendorDetail ? (
              <>
                <dl className="vendor-detail-dl">
                  <dt>Name</dt>
                  <dd>{vendorDetail.name}</dd>
                  <dt>Email</dt>
                  <dd>{vendorDetail.email}</dd>
                  <dt>Vendor / business name</dt>
                  <dd>{vendorDetail.vendorName || '—'}</dd>
                  <dt>Branch</dt>
                  <dd>{vendorDetail.branchName || '—'}</dd>
                  <dt>Status</dt>
                  <dd>
                    <span className={`status-badge status-${vendorDetail.approvalStatus}`}>
                      {vendorDetail.approvalStatus}
                    </span>
                  </dd>
                  <dt>Registered</dt>
                  <dd>{new Date(vendorDetail.createdAt).toLocaleString()}</dd>
                </dl>
                <div className="vendor-modal-actions">
                  <button
                    type="button"
                    className="filter-btn"
                    onClick={() => setEditingVendor(true)}
                  >
                    Edit vendor
                  </button>
                  {vendorDetail.approvalStatus === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="btn-approve"
                        onClick={() => handleApproveFromModal(vendorDetail.id)}
                        disabled={actioningId !== null}
                      >
                        {actioningId === vendorDetail.id ? '…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="btn-reject"
                        onClick={() => handleRejectFromModal(vendorDetail.id)}
                        disabled={actioningId !== null}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="vendors-empty">Could not load vendor details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
