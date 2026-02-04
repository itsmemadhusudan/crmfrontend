import { useEffect, useState } from 'react';
import { getLeadStatuses, createLeadStatus, updateLeadStatus, deleteLeadStatus } from '../api/leadStatuses';
import type { LeadStatusItem } from '../api/leadStatuses';

export default function AdminSettings() {
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getLeadStatuses().then((r) => {
      setLoading(false);
      if (r.success && r.leadStatuses) setLeadStatuses(r.leadStatuses);
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

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <h2>Settings</h2>
        <p>System and role settings. Lead statuses control the options shown in the lead inbox.</p>
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
