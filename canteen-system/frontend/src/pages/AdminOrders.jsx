import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useToast } from '../context/ToastContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { fmtDate, rupee } from '../utils';

const STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');
  const toast = useToast();

  const load = useCallback(() => {
    api
      .get('/orders/admin/all')
      .then((r) => {
        setOrders(r.data.orders);
        setError('');
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const changeStatus = async (o, status) => {
    if (status === o.status) return;
    if (status === 'Cancelled' && !window.confirm(`Cancel order ${o.orderId}?`)) return;
    setUpdating(o._id);
    try {
      const r = await api.put(`/orders/admin/${o._id}/status`, { status });
      setOrders((list) => list.map((x) => (x._id === o._id ? r.data.order : x)));
      toast(`${o.orderId} → ${status}`);
    } catch (e) {
      toast(errMsg(e), 'error');
      load();
    } finally {
      setUpdating('');
    }
  };

  const s = search.trim().toLowerCase();
  const shown = orders.filter(
    (o) =>
      (filter === 'All' || o.status === filter) &&
      (!s ||
        o.orderId.toLowerCase().includes(s) ||
        (o.user && (o.user.name.toLowerCase().includes(s) || o.user.email.toLowerCase().includes(s))))
  );

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>All Orders</h1>
          <p className="muted">{orders.length} orders in total</p>
        </div>
        <div className="row gap">
          <input className="search" placeholder="🔍 Order ID or student…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-light" onClick={load}>↻</button>
        </div>
      </div>

      <div className="chips">
        {['All', ...STATUSES].map((st) => (
          <button key={st} className={`chip ${filter === st ? 'active' : ''}`} onClick={() => setFilter(st)}>
            {st} {st !== 'All' && <small>({orders.filter((o) => o.status === st).length})</small>}
          </button>
        ))}
      </div>

      {loading && <div className="center-page"><div className="spinner" /></div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && shown.length === 0 && <div className="empty">No orders found.</div>}

      <div className="stack">
        {shown.map((o) => {
          const locked = ['Completed', 'Cancelled'].includes(o.status);
          return (
            <div className="card order-card" key={o._id}>
              <div className="order-top">
                <div>
                  <div className="order-id">{o.orderId}</div>
                  <span className="muted small">{fmtDate(o.createdAt)}</span>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <p className="small">
                👤 <strong>{o.user ? o.user.name : 'Deleted user'}</strong>
                {o.user && <span className="muted"> · {o.user.email}{o.user.rollNumber ? ` · ${o.user.rollNumber}` : ''}</span>}
              </p>
              <ul className="order-items">
                {o.items.map((it, idx) => (
                  <li key={idx}>
                    <span>{it.quantity} × {it.name}</span>
                    <span>{rupee(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              {o.note && <p className="muted small">📝 {o.note}</p>}
              <div className="order-bottom">
                <strong>Total: {rupee(o.total)}</strong>
                {locked ? (
                  <span className="muted small">Final status</span>
                ) : (
                  <div className="row gap center">
                    <label className="inline-label">Update status</label>
                    <select value={o.status} disabled={updating === o._id} onChange={(e) => changeStatus(o, e.target.value)}>
                      {STATUSES.map((st) => <option key={st}>{st}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
