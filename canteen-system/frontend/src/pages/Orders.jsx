import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useToast } from '../context/ToastContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { fmtDate, rupee } from '../utils';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState('');
  const toast = useToast();

  const load = useCallback(() => {
    api
      .get('/orders/my')
      .then((r) => {
        setOrders(r.data.orders);
        setError('');
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // pick up status changes made by the admin
    return () => clearInterval(t);
  }, [load]);

  const cancel = async (o) => {
    if (!window.confirm(`Cancel order ${o.orderId}?`)) return;
    setCancelling(o._id);
    try {
      const r = await api.put(`/orders/${o._id}/cancel`);
      setOrders((list) => list.map((x) => (x._id === o._id ? r.data.order : x)));
      toast('Order cancelled');
    } catch (e) {
      toast(errMsg(e), 'error');
      load();
    } finally {
      setCancelling('');
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>My Orders</h1>
          <p className="muted">Orders can be cancelled only while they are still Pending.</p>
        </div>
        <button className="btn btn-light btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {loading && <div className="center-page"><div className="spinner" /></div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && orders.length === 0 && (
        <div className="card empty-card">
          <div className="success-emoji">📦</div>
          <h2>No orders yet</h2>
          <Link to="/menu" className="btn btn-primary">Order something</Link>
        </div>
      )}

      <div className="stack">
        {orders.map((o) => (
          <div className="card order-card" key={o._id}>
            <div className="order-top">
              <div>
                <div className="order-id">{o.orderId}</div>
                <span className="muted small">{fmtDate(o.createdAt)}</span>
              </div>
              <StatusBadge status={o.status} />
            </div>
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
              {o.status === 'Pending' && (
                <button className="btn btn-danger btn-sm" disabled={cancelling === o._id} onClick={() => cancel(o)}>
                  {cancelling === o._id ? 'Cancelling…' : 'Cancel order'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
