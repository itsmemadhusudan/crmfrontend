import { useEffect, useState } from 'react';
import { getBranches, createBranch } from '../api/branches';
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
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    getBranches().then((r) => {
      setLoading(false);
      if (r.success && r.branches) setBranches(r.branches);
      else setError(r.message || 'Failed to load branches');
    });
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
      getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
    } else setError((res as { message?: string }).message || 'Failed to create');
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
          <p className="vendors-subtitle">{isAdmin ? 'Manage all branches. Vendors are assigned to a branch.' : 'Your assigned branch.'}</p>
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
        <div className="vendors-table-wrap" style={{ marginTop: '1rem' }}>
          <table className="vendors-table">
            <thead>
              <tr>
                <th>Name</th>
                {isAdmin && <th>Code</th>}
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  {isAdmin && <td>{b.code || '—'}</td>}
                  <td>{b.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {branches.length === 0 && <p className="vendors-empty">No branches.</p>}
      </section>
    </div>
  );
}
