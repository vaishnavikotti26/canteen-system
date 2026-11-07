import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import StatusBadge from '../components/StatusBadge.jsx';
import { fmtDate, rupee } from '../utils';

const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () =>
      api.get('/admin/stats').then((r) => setS(r.data)).catch((e) => setError(errMsg(e)));
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!s) return <div className="center-page"><div className="spinner" /></div>;

  const cards = [
    { label: 'Total Orders', value: s.totalOrders, icon: '🧾' },
    { label: 'Orders Today', value: s.ordersToday, icon: '📅' },
    { label: 'Revenue', value: rupee(s.revenue), icon: '💰' },
    { label: 'Students', value: s.totalStudents, icon: '🎓' },
    { label: 'Food Items', value: s.totalFoods, icon: '🍛' },
    { label: 'Pending Orders', value: s.byStatus.Pending, icon: '⏳' },
  ];
  const maxStatus = Math.max(1, ...Object.values(s.byStatus));
  const maxTop = Math.max(1, ...s.topItems.map((t) => t.quantity));

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Live overview of the canteen (revenue excludes cancelled orders).</p>
        </div>
        <Link to="/admin/orders" className="btn btn-primary">Manage orders</Link>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <div className="card stat" key={c.label}>
            <div className="stat-icon">{c.icon}</div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="muted small">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Orders by status</h3>
          {STATUSES.map((st) => (
            <div className="bar-row" key={st}>
              <span className="bar-label">{st}</span>
              <div className="bar-track">
                <div className={`bar-fill bar-${st.toLowerCase()}`} style={{ width: `${(s.byStatus[st] / maxStatus) * 100}%` }} />
              </div>
              <span className="bar-num">{s.byStatus[st]}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>Top selling items</h3>
          {s.topItems.length === 0 && <p className="muted">No sales yet.</p>}
          {s.topItems.map((t) => (
            <div className="bar-row" key={t.name}>
              <span className="bar-label">{t.name}</span>
              <div className="bar-track">
                <div className="bar-fill bar-top" style={{ width: `${(t.quantity / maxTop) * 100}%` }} />
              </div>
              <span className="bar-num">{t.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Recent orders</h3>
        {s.recentOrders.length === 0 && <p className="muted">No orders yet.</p>}
        {s.recentOrders.map((o) => (
          <div className="recent-row" key={o._id}>
            <div>
              <strong>{o.orderId}</strong>
              <div className="muted small">{o.user ? o.user.name : 'Deleted user'} · {fmtDate(o.createdAt)}</div>
            </div>
            <div className="row gap center">
              <strong>{rupee(o.total)}</strong>
              <StatusBadge status={o.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
