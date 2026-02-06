import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getSettlements } from '../../../api/reports';
import { createCustomer, getCustomersForDropdown } from '../../../api/customers';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../auth/hooks/useAuth';
import { formatCurrency } from '../../../utils/money';
import type { Settlement } from '../../../types/common';
import type { Branch } from '../../../types/common';
import type { Customer } from '../../../types/common';

type CustomerOption = Customer & { primaryBranchId?: string | null };

export default function SettlementReportPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<{ from: string; to: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [allCustomers, setAllCustomers] = useState<CustomerOption[]>([]);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addPrimaryBranchId, setAddPrimaryBranchId] = useState('');
  const [addServiceTakenBranchId, setAddServiceTakenBranchId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState('');
  const [addSuccessJustNow, setAddSuccessJustNow] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  const nameSearch = addName.trim().toLowerCase();
  const filteredCustomers = nameSearch
    ? allCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(nameSearch) ||
          (c.phone && c.phone.includes(addName.trim())) ||
          (c.email && c.email.toLowerCase().includes(nameSearch))
      )
    : allCustomers;
  const showDropdown = nameDropdownOpen && (addName.length > 0 || filteredCustomers.length > 0);

  useEffect(() => {
    getSettlements().then((r) => {
      setLoading(false);
      if (r.success) {
        setSettlements(r.settlements || []);
        setSummary(r.summary || []);
      } else setError(r.message || 'Failed to load');
    });
  }, []);

  useEffect(() => {
    getBranches({ all: true }).then((r) => r.success && r.branches && setBranches(r.branches || []));
  }, []);

  useEffect(() => {
    if (showAddCustomer) getCustomersForDropdown().then((r) => r.success && r.customers && setAllCustomers(r.customers || []));
  }, [showAddCustomer]);

  useEffect(() => {
    if (showAddCustomer && !isAdmin && user?.branchId) setAddServiceTakenBranchId(user.branchId);
  }, [showAddCustomer, isAdmin, user?.branchId]);

  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target as Node) && nameInputRef.current && !nameInputRef.current.contains(ev.target as Node)) {
        setNameDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectCustomer(c: CustomerOption | null) {
    if (!c) {
      setSelectedCustomerId(null);
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setAddPrimaryBranchId('');
      setNameDropdownOpen(false);
      return;
    }
    setSelectedCustomerId(c.id);
    setAddName(c.name);
    setAddPhone(c.phone || '');
    setAddEmail(c.email || '');
    setAddPrimaryBranchId(c.primaryBranchId || '');
    setNameDropdownOpen(false);
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCustomerId) {
      setAddMessage('This customer is already in the system. Clear the name field and enter new details to add a different customer.');
      return;
    }
    if (!addName.trim() || !addPhone.trim()) {
      setAddMessage('Name and phone are required.');
      return;
    }
    if (!addEmail.trim()) {
      setAddMessage('Email is required.');
      return;
    }
    if (!addPrimaryBranchId) {
      setAddMessage('Primary branch is required.');
      return;
    }
    const effectiveServiceTakenBranchId = isAdmin ? addServiceTakenBranchId : (user?.branchId || addServiceTakenBranchId);
    if (!effectiveServiceTakenBranchId) {
      setAddMessage('Service taken branch is required.');
      return;
    }
    const serviceTakenBranch = branches.find((b) => b.id === effectiveServiceTakenBranchId);
    const serviceTakenName = serviceTakenBranch?.name || user?.branchName || effectiveServiceTakenBranchId;
    const notesWithService = addNotes.trim()
      ? `${addNotes.trim()}\nService taken at: ${serviceTakenName}`
      : `Service taken at: ${serviceTakenName}`;
    setAddSubmitting(true);
    setAddMessage('');
    const res = await createCustomer({
      name: addName.trim(),
      phone: addPhone.trim(),
      email: addEmail.trim(),
      notes: notesWithService,
      primaryBranchId: addPrimaryBranchId,
    });
    setAddSubmitting(false);
    if (res.success) {
      setAddMessage('');
      setAddSuccessJustNow(true);
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setAddNotes('');
      setAddPrimaryBranchId('');
      setAddServiceTakenBranchId('');
      setSelectedCustomerId(null);
      setShowAddCustomer(false);
      getCustomersForDropdown().then((r) => r.success && r.customers && setAllCustomers(r.customers || []));
    } else setAddMessage((res as { message?: string }).message || 'Failed to add customer.');
  }

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <h2>Cross-sales & internal settlement</h2>
        <p>Which branch owes another branch for memberships and referrals. No guessing, no disputes.</p>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Settlement entries are created when a membership is used at a different branch than where it was sold. The settlement percentage is set by admin in Settings.</p>
        {error && <div className="auth-error vendors-error">{error}</div>}
        {loading ? (
          <div className="vendors-loading"><div className="spinner" /><span>Loading...</span></div>
        ) : (
          <>
            {summary.length > 0 && (
              <div className="report-section" style={{ marginTop: '1rem' }}>
                <h3>Summary (who owes whom)</h3>
                <ul className="report-list">
                  {summary.map((s, i) => (
                    <li key={i}><strong>{s.from}</strong> owes <strong>{s.to}</strong>: {typeof s.amount === 'number' ? formatCurrency(s.amount) : s.amount}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="report-section" style={{ marginTop: '1rem' }}>
              <h3>Settlement entries</h3>
              {settlements.length === 0 ? <p className="text-muted">No settlement entries yet. They are created when a membership is used at a different branch than where it was sold.</p> : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>From branch</th><th>To branch</th><th className="num">Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {settlements.map((s) => (
                        <tr key={s.id}>
                          <td>{s.fromBranch}</td>
                          <td>{s.toBranch}</td>
                          <td className="num">{typeof s.amount === 'number' ? formatCurrency(s.amount) : s.amount}</td>
                          <td>{s.reason || '—'}</td>
                          <td><span className={`settlement-status settlement-status-${(s.status || '').toLowerCase()}`}>{s.status}</span></td>
                          <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--theme-border)' }} />
            <h3>Add customer to system</h3>
            <p className="text-muted">Insert new customer data here. Required for creating memberships and tracking. New customers appear on the Customers page.</p>
            {addSuccessJustNow && (
              <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
                Customer added successfully. <Link to={user?.role === 'admin' ? '/admin/customers' : '/vendor/customers'} className="filter-btn" style={{ marginLeft: '0.25rem' }}>View in Customers</Link>
                <button type="button" className="filter-btn" style={{ marginLeft: '0.5rem' }} onClick={() => setAddSuccessJustNow(false)} aria-label="Dismiss">×</button>
              </p>
            )}
            <button type="button" className="auth-submit" style={{ marginBottom: '1rem', width: 'auto' }} onClick={() => { setShowAddCustomer(!showAddCustomer); setAddMessage(''); setAddSuccessJustNow(false); }}>
              {showAddCustomer ? 'Cancel' : 'Add customer'}
            </button>
            {showAddCustomer && (
              <form onSubmit={handleAddCustomer} className="auth-form" style={{ maxWidth: '480px', marginTop: '0.5rem' }}>
                <label>
                  <span>Name (search or type new)</span>
                  <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={addName}
                      onChange={(e) => { setAddName(e.target.value); setSelectedCustomerId(null); setNameDropdownOpen(true); }}
                      onFocus={() => setNameDropdownOpen(true)}
                      placeholder="Search existing or type new customer name"
                      autoComplete="off"
                    />
                    {showDropdown && (
                      <ul className="customer-name-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, margin: 0, padding: 0, listStyle: 'none', background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', borderRadius: '6px', maxHeight: '220px', overflowY: 'auto', zIndex: 10 }}>
                        <li>
                          <button type="button" className="dropdown-item-new" onClick={() => selectCustomer(null)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            + New customer
                          </button>
                        </li>
                        {filteredCustomers.slice(0, 50).map((c) => (
                          <li key={c.id}>
                            <button type="button" className="dropdown-item" onClick={() => selectCustomer(c)} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer' }}>
                              {c.name} {c.phone && <span className="text-muted">({c.phone})</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>
                <label><span>Phone</span><input type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} required placeholder="Required for new customer" /></label>
                <label><span>Email (required)</span><input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required /></label>
                <label>
                  <span>Primary branch (required)</span>
                  <select value={addPrimaryBranchId} onChange={(e) => setAddPrimaryBranchId(e.target.value)} required>
                    <option value="">— Select —</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Service taken branch (required)</span>
                  {isAdmin ? (
                    <select value={addServiceTakenBranchId} onChange={(e) => setAddServiceTakenBranchId(e.target.value)} required>
                      <option value="">— Select —</option>
                      {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" readOnly value={user?.branchName || branches.find((b) => b.id === user?.branchId)?.name || 'Your branch'} style={{ background: 'var(--theme-bg)', cursor: 'default' }} />
                  )}
                </label>
                <label><span>Notes (optional)</span><textarea value={addNotes} onChange={(e) => setAddNotes(e.target.value)} rows={2} /></label>
                {addMessage && <p className="text-muted">{addMessage}</p>}
                <button type="submit" className="auth-submit" disabled={addSubmitting}>{addSubmitting ? 'Adding…' : 'Add customer'}</button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
