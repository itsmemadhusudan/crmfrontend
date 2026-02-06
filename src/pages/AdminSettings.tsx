import { useEffect, useState } from 'react';
import { getLeadStatuses, createLeadStatus, deleteLeadStatus } from '../api/leadStatuses';
import { getSettings, updateSettings } from '../api/settings';
import type { LeadStatusItem } from '../api/leadStatuses';

export default function AdminSettings() {
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [message, setMessage] = useState('');
  const [settlementPercentage, setSettlementPercentage] = useState('');
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    getLeadStatuses().then((r) => {
      setLoading(false);
      if (r.success && r.leadStatuses) setLeadStatuses(r.leadStatuses);
    });
  }, []);

  useEffect(() => {
    getSettings().then((r) => {
      setSettingsLoading(false);
      if (r.success && r.settings != null) {
        setSettlementPercentage(String(r.settings.settlementPercentage ?? 100));
      }
    });
  }, []);

  const refresh = () => getLeadStatuses().then((r) => r.success && r.leadStatuses && setLeadStatuses(r.leadStatuses));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const r = await createLeadStatus({ name: newName.trim(), order: newOrder ? parseInt(newOrder, 10) : undefined });
    setMessage(r.success ? 'Lead status added.' : r.message || 'Failed');
    if (r.success) {
      setNewName('');
      setNewOrder('');
      refresh();
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this lead status? Leads using it will keep the value but it will not appear in new dropdowns.')) return;
    const r = await deleteLeadStatus(id);
    setMessage(r.success ? 'Lead status deactivated.' : r.message || 'Failed');
    if (r.success) refresh();
  };

  const handleSaveSettlementPercentage = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(settlementPercentage);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      setMessage('Settlement percentage must be between 0 and 100.');
      return;
    }
    setSettlementSaving(true);
    setMessage('');
    const r = await updateSettings({ settlementPercentage: num });
    setSettlementSaving(false);
    setMessage(r.success ? 'Settlement percentage saved.' : r.message || 'Failed to save.');
  };

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <h2>Settings</h2>
        <p>System and role settings. Lead statuses control the options shown in the lead inbox.</p>
      </section>

      <section className="content-card" style={{ marginTop: '1rem' }}>
        <h3>Settlement percentage</h3>
        <p className="text-muted">
          When a membership is used at a different branch than where it was sold, the using branch owes the selling branch. This percentage (0–100) is applied to the per-credit value to compute the settlement amount. 100% = full value.
        </p>
        {settingsLoading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <form onSubmit={handleSaveSettlementPercentage} className="auth-form" style={{ maxWidth: '320px', marginTop: '0.5rem' }}>
            <label>
              <span>Settlement percentage (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={settlementPercentage}
                onChange={(e) => setSettlementPercentage(e.target.value)}
                placeholder="100"
              />
            </label>
            <button type="submit" className="auth-submit" disabled={settlementSaving}>
              {settlementSaving ? 'Saving...' : 'Save settlement percentage'}
            </button>
          </form>
        )}
      </section>

      <section className="content-card" style={{ marginTop: '1rem' }}>
        <h3>Lead statuses (admin only)</h3>
        <p className="text-muted">Create and edit lead statuses. These appear in the lead status dropdown.</p>
        {message && <p className="text-muted">{message}</p>}
        <form onSubmit={handleAdd} className="auth-form" style={{ maxWidth: '400px', marginTop: '0.5rem' }}>
          <label><span>New status name</span><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Follow up" /></label>
          <label><span>Order (optional)</span><input type="number" value={newOrder} onChange={(e) => setNewOrder(e.target.value)} placeholder="0" /></label>
          <button type="submit" className="auth-submit">Add lead status</button>
        </form>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <ul className="report-list" style={{ marginTop: '1rem' }}>
            {leadStatuses.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong> (order: {s.order})
                {' '}
                <button type="button" className="filter-btn" style={{ marginLeft: '0.5rem' }} onClick={() => handleDeactivate(s.id)}>Deactivate</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
