import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer } from '../../../api/customers';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency } from '../../../utils/money';
import type { Customer, Branch } from '../../../types/common';

export default function CustomersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [primaryBranchId, setPrimaryBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilterId, setBranchFilterId] = useState('');
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/vendor';

  const isPackageExpired = (expiry: string | undefined) => expiry && new Date(expiry) < new Date(new Date().setHours(0, 0, 0, 0));
  const expiredCount = customers.filter((c) => c.customerPackage && isPackageExpired(c.customerPackageExpiry)).length;

  const selectedBranchName = branchFilterId ? branches.find((b) => b.id === branchFilterId)?.name : null;
  const byBranch = branchFilterId
    ? customers.filter((c) => c.primaryBranch === selectedBranchName)
    : customers;

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredCustomers = searchLower
    ? byBranch.filter((c) => {
        const card = (c.membershipCardId || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        const p = (c.phone || '').toLowerCase();
        const e = (c.email || '').toLowerCase();
        return card.includes(searchLower) || n.includes(searchLower) || p.includes(searchLower) || e.includes(searchLower);
      })
    : byBranch;

  function fetchCustomers() {
    getCustomers().then((r) => {
      setLoading(false);
      if (r.success && r.customers) setCustomers(r.customers);
      else setError(r.message || 'Failed to load');
    });
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchCustomers();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    getBranches({ all: true }).then((r) => r.success && r.branches && setBranches(r.branches || []));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await createCustomer({
      name,
      phone,
      email: email || undefined,
      primaryBranchId: primaryBranchId || (user?.branchId || undefined),
      notes: notes || undefined,
    });
    if (res.success) {
      setName('');
      setPhone('');
      setEmail('');
      setPrimaryBranchId('');
      setNotes('');
      setShowForm(false);
      getCustomers().then((r) => r.success && r.customers && setCustomers(r.customers));
    } else setError((res as { message?: string }).message || 'Failed to create');
  }

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="vendors-loading"><div className="spinner" /><span>Loading customers...</span></div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <header className="page-hero">
        <h1 className="page-hero-title">Customers</h1>
        <p className="page-hero-subtitle">Customer list. Add customers here; assign package and membership from the Memberships page.</p>
      </header>
      <section className="content-card">
        <button type="button" className="auth-submit" style={{ marginBottom: '1rem', width: 'auto' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add customer'}
        </button>
        {showForm && (
          <form onSubmit={handleCreate} className="auth-form" style={{ marginBottom: '1rem', maxWidth: '400px' }}>
            <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
            <label><span>Phone</span><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
            <label><span>Email (optional)</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label><span>Notes (optional)</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></label>
            <p className="form-hint">Card ID is auto-generated from the branch (e.g. tes-00001) after you create the customer.</p>
            {isAdmin && (
              <label>
                <span>Primary branch</span>
                <select value={primaryBranchId} onChange={(e) => setPrimaryBranchId(e.target.value)}>
                  <option value="">—</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            )}
            <button type="submit" className="auth-submit">Create customer</button>
          </form>
        )}
        {isAdmin && expiredCount > 0 && (
          <div className="package-expired-alert" role="alert">
            <strong>Package expired:</strong> {expiredCount} customer{expiredCount !== 1 ? 's have' : ' has'} a package that has expired. Please renew from Memberships.
          </div>
        )}
        {error && <div className="auth-error vendors-error">{error}</div>}
        {customers.length > 0 ? (
          <>
            <div className="customers-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
              {isAdmin && (
                <label style={{ minWidth: '180px' }}>
                  <span>Branch</span>
                  <select
                    value={branchFilterId}
                    onChange={(e) => setBranchFilterId(e.target.value)}
                    aria-label="Filter customers by branch"
                    style={{ width: '100%' }}
                  >
                    <option value="">All customers</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="customers-search-label" style={{ flex: '1', minWidth: '200px' }}>
                <span>Search by Card ID, name, phone or email</span>
                <input
                  type="search"
                  className="customers-search-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search customers by card ID, name, phone or email"
                />
              </label>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Card ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    {isAdmin && (
                      <>
                        <th>Package</th>
                        <th>Price</th>
                        <th>Expiry</th>
                      </>
                    )}
                    <th>Branch</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => {
                    const expired = isAdmin && c.customerPackage && isPackageExpired(c.customerPackageExpiry);
                    return (
                      <tr key={c.id} className={expired ? 'package-expired-row' : ''}>
                        <td>{c.membershipCardId || '—'}</td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.phone}</td>
                        <td>{c.email || '—'}</td>
                        {isAdmin && (
                          <>
                            <td>{c.customerPackage ? (expired ? <span>{c.customerPackage} <span className="status-badge status-expired">Expired</span></span> : c.customerPackage) : '—'}</td>
                            <td>{c.customerPackagePrice != null ? formatCurrency(c.customerPackagePrice) : '—'}</td>
                            <td>{c.customerPackageExpiry ? (expired ? <span className="text-expired">{c.customerPackageExpiry}</span> : c.customerPackageExpiry) : '—'}</td>
                          </>
                        )}
                        <td>{c.primaryBranch || '—'}</td>
                        <td>
                          <Link to={`${basePath}/customers/${c.id}`} className="filter-btn" style={{ marginRight: '0.5rem' }}>View</Link>
                          <button type="button" className="filter-btn" onClick={() => navigate(`${basePath}/customers/${c.id}?edit=1`)}>Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredCustomers.length === 0 && (
              <p className="vendors-empty">
                {searchQuery.trim()
                  ? `No customers match "${searchQuery.trim()}".`
                  : branchFilterId
                    ? `No customers in this branch.`
                    : 'No customers.'}
              </p>
            )}
          </>
        ) : !showForm && <p className="vendors-empty">No customers. Add a customer, then assign package and membership from the Memberships page.</p>}
      </section>
    </div>
  );
}
