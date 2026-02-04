import { useEffect, useState } from 'react';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../api/branches';
import { useAuth } from '../auth/hooks/useAuth';
import type { Branch } from '../types/crm';

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  const loadBranches = () => {
    getBranches().then((r) => {
      setLoading(false);
      if (r.success && r.branches) setBranches(r.branches);
      else setError(r.message || 'Failed to load branches');
    });
  };

  useEffect(() => {
    loadBranches();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await createBranch({ name, code: code || undefined, address: address || undefined });
    if (res.success) {
      setName('');
      setCode('');
      setAddress('');
      setShowForm(false);
      loadBranches();
    } else setError((res as { message?: string }).message || 'Failed to create');
  }

  function openEdit(b: Branch) {
    setEditingBranch(b);
    setEditName(b.name);
    setEditCode(b.code || '');
    setEditAddress(b.address || '');
    setError('');
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBranch) return;
    setError('');
    const res = await updateBranch(editingBranch.id, {
      name: editName,
      code: editCode || undefined,
      address: editAddress || undefined,
    });
    if (res.success) {
      setEditingBranch(null);
      loadBranches();
    } else setError((res as { message?: string }).message || 'Failed to update');
  }

  async function handleDelete(id: string) {
    setError('');
    const res = await deleteBranch(id);
    if (res.success) {
      setDeletingBranchId(null);
      loadBranches();
    } else setError(res.message || 'Failed to delete');
  }

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="vendors-loading"><div className="spinner" /><span>Loading branches...</span></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <div className="vendors-header">
          <h2>{isAdmin ? 'Branches' : 'My branch'}</h2>
          <p className="vendors-subtitle">{isAdmin ? 'Manage all branches. View, edit, or delete a branch.' : 'Your assigned branch.'}</p>
          {isAdmin && (
            <button type="button" className="auth-submit" style={{ marginTop: '1rem', width: 'auto' }} onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Add branch'}
            </button>
          )}
        </div>
        {showForm && (
          <form onSubmit={handleCreate} className="auth-form" style={{ marginTop: '1rem', maxWidth: '400px' }}>
            <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tacoma" required /></label>
            <label><span>Code (optional)</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. TAC" /></label>
            <label><span>Address (optional)</span><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" /></label>
            <button type="submit" className="auth-submit">Create branch</button>
          </form>
        )}
        {error && <div className="auth-error vendors-error">{error}</div>}
        <div className="vendors-table-wrap branch-table-wrap" style={{ marginTop: '1rem' }}>
          <table className="vendors-table">
            <thead>
              <tr>
                <th>Name</th>
                {isAdmin && <th>Code</th>}
                <th>Address</th>
                {isAdmin && <th className="th-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  {isAdmin && <td>{b.code || '—'}</td>}
                  <td>{b.address || '—'}</td>
                  {isAdmin && (
                    <td className="branch-actions">
                      <button type="button" className="branch-action-btn branch-action-view" onClick={() => setViewingBranch(b)} title="View">View</button>
                      <button type="button" className="branch-action-btn branch-action-edit" onClick={() => openEdit(b)} title="Edit">Edit</button>
                      <button type="button" className="branch-action-btn branch-action-delete" onClick={() => setDeletingBranchId(b.id)} title="Delete">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {branches.length === 0 && <p className="vendors-empty">No branches.</p>}
      </section>

      {viewingBranch && (
        <div className="branch-modal-overlay" onClick={() => setViewingBranch(null)} role="dialog" aria-modal="true" aria-label="View branch">
          <div className="branch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="branch-modal-header">
              <h3>Branch details</h3>
              <button type="button" className="branch-modal-close" onClick={() => setViewingBranch(null)} aria-label="Close">×</button>
            </div>
            <dl className="branch-view-dl">
              <dt>Name</dt>
              <dd>{viewingBranch.name}</dd>
              <dt>Code</dt>
              <dd>{viewingBranch.code || '—'}</dd>
              <dt>Address</dt>
              <dd>{viewingBranch.address || '—'}</dd>
            </dl>
            <div className="branch-modal-footer">
              <button type="button" className="auth-submit" style={{ width: 'auto' }} onClick={() => setViewingBranch(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editingBranch && (
        <div className="branch-modal-overlay" onClick={() => setEditingBranch(null)} role="dialog" aria-modal="true" aria-label="Edit branch">
          <div className="branch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="branch-modal-header">
              <h3>Edit branch</h3>
              <button type="button" className="branch-modal-close" onClick={() => setEditingBranch(null)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleUpdate} className="auth-form">
              <label><span>Name</span><input value={editName} onChange={(e) => setEditName(e.target.value)} required /></label>
              <label><span>Code (optional)</span><input value={editCode} onChange={(e) => setEditCode(e.target.value)} /></label>
              <label><span>Address (optional)</span><input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} /></label>
              <div className="branch-modal-footer">
                <button type="button" className="branch-action-btn branch-action-cancel" onClick={() => setEditingBranch(null)}>Cancel</button>
                <button type="submit" className="auth-submit" style={{ width: 'auto' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingBranchId && (
        <div className="branch-modal-overlay" onClick={() => setDeletingBranchId(null)} role="dialog" aria-modal="true" aria-label="Confirm delete">
          <div className="branch-modal branch-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="branch-modal-header">
              <h3>Delete branch?</h3>
              <button type="button" className="branch-modal-close" onClick={() => setDeletingBranchId(null)} aria-label="Close">×</button>
            </div>
            <p className="branch-delete-message">This will deactivate the branch. You can no longer assign vendors or new data to it.</p>
            <div className="branch-modal-footer">
              <button type="button" className="branch-action-btn branch-action-cancel" onClick={() => setDeletingBranchId(null)}>Cancel</button>
              <button type="button" className="branch-action-btn branch-action-delete-confirm" onClick={() => handleDelete(deletingBranchId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
