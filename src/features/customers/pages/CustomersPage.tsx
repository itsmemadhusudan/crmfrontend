import { useEffect, useState } from 'react';
import { getCustomers, createCustomer } from '../../../api/customers';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency } from '../../../utils/money';
import type { Customer, Branch } from '../../../types/common';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [membershipCardId, setMembershipCardId] = useState('');
  const [primaryBranchId, setPrimaryBranchId] = useState('');
  const [customerPackage, setCustomerPackage] = useState('');
  const [customerPackagePrice, setCustomerPackagePrice] = useState('');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    getCustomers().then((r) => {
      setLoading(false);
      if (r.success && r.customers) setCustomers(r.customers);
      else setError(r.message || 'Failed to load');
    });
  }, []);

  useEffect(() => {
    if (isAdmin) getBranches().then((r) => r.success && r.branches && setBranches(r.branches));
  }, [isAdmin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await createCustomer({
      name,
      phone,
      email: email || undefined,
      membershipCardId: membershipCardId || undefined,
      primaryBranchId: primaryBranchId || (user?.branchId || undefined),
      customerPackage: customerPackage.trim() || undefined,
      customerPackagePrice: customerPackagePrice !== '' ? Number(customerPackagePrice) : undefined,
    });
    if (res.success) {
      setName('');
      setPhone('');
      setEmail('');
      setMembershipCardId('');
      setCustomerPackage('');
      setCustomerPackagePrice('');
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
        <p className="page-hero-subtitle">Customer list and profiles. Add customers and link to memberships.</p>
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
            <label><span>Membership card ID (optional)</span><input value={membershipCardId} onChange={(e) => setMembershipCardId(e.target.value)} /></label>
            <label><span>Customer package (optional)</span><input value={customerPackage} onChange={(e) => setCustomerPackage(e.target.value)} placeholder="What type of package" /></label>
            <label>
              <span>Customer package price (optional)</span>
              <span className="input-prefix-dollar">
                <span className="input-prefix-symbol" aria-hidden>$</span>
                <input type="number" min={0} step="0.01" value={customerPackagePrice} onChange={(e) => setCustomerPackagePrice(e.target.value)} placeholder="0.00" />
              </span>
            </label>
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
        {error && <div className="auth-error vendors-error">{error}</div>}
        {customers.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Card ID</th>
                  <th>Package</th>
                  <th>Package price</th>
                  <th>Branch</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.phone}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.membershipCardId || '—'}</td>
                    <td>{c.customerPackage || '—'}</td>
                    <td>{c.customerPackagePrice != null ? formatCurrency(c.customerPackagePrice) : '—'}</td>
                    <td>{c.primaryBranch || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !showForm && <p className="vendors-empty">No customers.</p>}
      </section>
    </div>
  );
}
