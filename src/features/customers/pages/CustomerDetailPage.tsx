import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/hooks/useAuth';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'admin' ? '/admin' : '/vendor';

  return (
    <div className="dashboard-content">
      <section className="content-card">
        <button type="button" className="auth-submit" style={{ marginBottom: '1rem' }} onClick={() => navigate(`${basePath}/customers`)}>
          Back to customers
        </button>
        <h2>Customer detail</h2>
        <p>Customer ID: {id ?? '—'}. Detail view coming soon.</p>
      </section>
    </div>
  );
}
