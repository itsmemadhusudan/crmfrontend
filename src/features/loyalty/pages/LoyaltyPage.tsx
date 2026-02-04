import { useEffect, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { searchCustomersAndMemberships } from '../../../api/search';
import {
  getLoyalty,
  earnLoyaltyPoints,
  redeemLoyaltyPoints,
  getLoyaltyInsights,
  type RepeatedCustomer,
  type MembershipUpgrader,
} from '../../../api/loyalty.api';

function formatDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function LoyaltyPage() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [points, setPoints] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<{ id: string; points: number; type: string; reason?: string; branchName?: string; createdAt: string }[]>([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [earnPoints, setEarnPoints] = useState('');
  const [earnReason, setEarnReason] = useState('');
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemReason, setRedeemReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [repeatedCustomers, setRepeatedCustomers] = useState<RepeatedCustomer[]>([]);
  const [membershipUpgraders, setMembershipUpgraders] = useState<MembershipUpgrader[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    let cancelled = false;
    setInsightsLoading(true);
    getLoyaltyInsights()
      .then((r) => {
        if (cancelled) return;
        setInsightsLoading(false);
        if (r.success) {
          setRepeatedCustomers(r.repeatedCustomers ?? []);
          setMembershipUpgraders(r.membershipUpgraders ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setInsightsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const runSearch = () => {
    if (debouncedQuery.trim().length < 2) {
      setCustomers([]);
      return;
    }
    setSearching(true);
    searchCustomersAndMemberships(debouncedQuery.trim())
      .then((r) => {
        setSearching(false);
        if (r.success && r.customers) setCustomers(r.customers);
        else setCustomers([]);
      })
      .catch(() => setSearching(false));
  };

  const loadLoyalty = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const c = customers.find((x) => x.id === customerId);
    setSelectedCustomerName(c ? c.name : '');
    setLoadingLoyalty(true);
    getLoyalty(customerId)
      .then((r) => {
        setLoadingLoyalty(false);
        if (r.success) {
          setPoints(r.points ?? 0);
          setTransactions(r.transactions ?? []);
        } else {
          setPoints(0);
          setTransactions([]);
        }
      })
      .catch(() => setLoadingLoyalty(false));
  };

  const handleEarn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !earnPoints) return;
    const p = parseInt(earnPoints, 10);
    if (isNaN(p) || p <= 0) return;
    const r = await earnLoyaltyPoints(selectedCustomerId, p, earnReason || undefined);
    setActionMessage(r.success ? `Added ${p} points. New balance: ${r.points}` : r.message || 'Failed');
    if (r.success) {
      setPoints(r.points ?? 0);
      setEarnPoints('');
      setEarnReason('');
      getLoyalty(selectedCustomerId).then((res) => res.success && setTransactions(res.transactions ?? []));
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !redeemPoints) return;
    const p = parseInt(redeemPoints, 10);
    if (isNaN(p) || p <= 0) return;
    const r = await redeemLoyaltyPoints(selectedCustomerId, p, redeemReason || undefined);
    setActionMessage(r.success ? `Redeemed ${p} points. New balance: ${r.points}` : r.message || 'Failed');
    if (r.success) {
      setPoints(r.points ?? 0);
      setRedeemPoints('');
      setRedeemReason('');
      getLoyalty(selectedCustomerId).then((res) => res.success && setTransactions(res.transactions ?? []));
    }
  };

  return (
    <div className="dashboard-content">
      <section className="content-card loyalty-intro">
        <h2>Loyalty program</h2>
        <p>See repeated customers and those who upgrade memberships, then search to manage points.</p>
      </section>

      <div className="loyalty-insights-grid">
        <section className="content-card loyalty-insights-card">
          <h3>Repeated customers</h3>
          <p className="loyalty-card-desc">Customers with 2+ completed visits (appointments).</p>
          {insightsLoading ? (
            <p className="text-muted">Loading...</p>
          ) : repeatedCustomers.length === 0 ? (
            <p className="text-muted">No repeated customers yet.</p>
          ) : (
            <div className="loyalty-table-wrap">
              <table className="loyalty-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Visits</th>
                    <th>Last visit</th>
                  </tr>
                </thead>
                <tbody>
                  {repeatedCustomers.map((row) => (
                    <tr key={row.customerId}>
                      <td><strong>{row.customerName}</strong></td>
                      <td>{row.phone}</td>
                      <td>{row.visitCount}</td>
                      <td>{formatDate(row.lastVisitAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="content-card loyalty-insights-card">
          <h3>Membership upgraders</h3>
          <p className="loyalty-card-desc">Customers who have purchased 2+ memberships over time.</p>
          {insightsLoading ? (
            <p className="text-muted">Loading...</p>
          ) : membershipUpgraders.length === 0 ? (
            <p className="text-muted">No membership upgraders yet.</p>
          ) : (
            <div className="loyalty-table-wrap">
              <table className="loyalty-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Memberships</th>
                    <th>Last purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipUpgraders.map((row) => (
                    <tr key={row.customerId}>
                      <td><strong>{row.customerName}</strong></td>
                      <td>{row.phone}</td>
                      <td>{row.membershipCount}</td>
                      <td>{formatDate(row.lastPurchaseAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="content-card loyalty-search-card">
        <h3>Manage points</h3>
        <p>Search by phone, name, or membership card. Earn or redeem points.</p>
        <label className="loyalty-search-label">
          <span>Search customer</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            placeholder="Phone, name, or membership card"
            className="loyalty-search-input"
          />
        </label>
        <button type="button" className="auth-submit loyalty-search-btn" onClick={runSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
        {customers.length > 0 && (
          <ul className="report-list loyalty-customer-list">
            {customers.map((c) => (
              <li key={c.id}>
                <button type="button" className="filter-btn" onClick={() => loadLoyalty(c.id)}>
                  {c.name} {c.phone && `(${c.phone})`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedCustomerId && (
        <section className="content-card loyalty-detail-card">
          <h3>{selectedCustomerName} — Loyalty</h3>
          {loadingLoyalty ? (
            <p className="text-muted">Loading...</p>
          ) : (
            <>
              <p><strong>Balance: {points ?? 0} points</strong></p>
              {actionMessage && <p className="text-muted">{actionMessage}</p>}
              <div className="loyalty-actions-grid">
                <form onSubmit={handleEarn} className="auth-form">
                  <h4>Earn points</h4>
                  <label><span>Points</span><input type="number" min={1} value={earnPoints} onChange={(e) => setEarnPoints(e.target.value)} placeholder="e.g. 10" /></label>
                  <label><span>Reason (optional)</span><input type="text" value={earnReason} onChange={(e) => setEarnReason(e.target.value)} placeholder="Visit / spend" /></label>
                  <button type="submit" className="auth-submit">Add points</button>
                </form>
                <form onSubmit={handleRedeem} className="auth-form">
                  <h4>Redeem points</h4>
                  <label><span>Points</span><input type="number" min={1} value={redeemPoints} onChange={(e) => setRedeemPoints(e.target.value)} placeholder="e.g. 50" /></label>
                  <label><span>Reason (optional)</span><input type="text" value={redeemReason} onChange={(e) => setRedeemReason(e.target.value)} placeholder="Free eyebrow service" /></label>
                  <button type="submit" className="auth-submit">Redeem</button>
                </form>
              </div>
              <h4 className="loyalty-transactions-heading">Recent transactions</h4>
              {transactions.length === 0 ? (
                <p className="text-muted">No transactions yet.</p>
              ) : (
                <ul className="report-list">
                  {transactions.slice(0, 20).map((t) => (
                    <li key={t.id}>
                      {new Date(t.createdAt).toLocaleString()} — {t.type === 'earn' ? '+' : ''}{t.points} {t.reason && `(${t.reason})`}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
