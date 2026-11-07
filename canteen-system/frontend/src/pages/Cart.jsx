import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FoodImg from '../components/FoodImg.jsx';
import { rupee } from '../utils';

export default function Cart() {
  const { items, total, setQty, remove, clear, MAX_QTY } = useCart();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(null);

  const placeOrder = async () => {
    setBusy(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((i) => ({ foodId: i.food._id, quantity: i.quantity })),
        note: note.trim(),
      });
      setPlaced(res.data.order);
      clear();
      toast('Order placed successfully!');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    return (
      <div className="container narrow">
        <div className="card success-card">
          <div className="success-emoji">✅</div>
          <h2>Order placed!</h2>
          <p className="muted">Show this order ID at the canteen counter when you collect your food.</p>
          <div className="order-id-box">{placed.orderId}</div>
          <p>Total: <strong>{rupee(placed.total)}</strong></p>
          <div className="row center gap">
            <Link to="/orders" className="btn btn-primary">View my orders</Link>
            <Link to="/menu" className="btn btn-light">Order more</Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container narrow">
        <div className="card empty-card">
          <div className="success-emoji">🛒</div>
          <h2>Your cart is empty</h2>
          <p className="muted">Add something tasty from the menu.</p>
          <Link to="/menu" className="btn btn-primary">Browse menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Your Cart</h1>
        <button className="btn btn-light btn-sm" onClick={() => window.confirm('Remove all items from the cart?') && clear()}>
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <div className="card">
          {items.map((i) => (
            <div className="cart-row" key={i.food._id}>
              <FoodImg src={i.food.image} alt={i.food.name} className="cart-img" />
              <div className="cart-info">
                <h4>{i.food.name}</h4>
                <span className="muted small">{rupee(i.food.price)} each</span>
              </div>
              <div className="stepper">
                <button aria-label="Decrease" onClick={() => setQty(i.food._id, i.quantity - 1)}>−</button>
                <span>{i.quantity}</span>
                <button aria-label="Increase" onClick={() => setQty(i.food._id, i.quantity + 1)} disabled={i.quantity >= MAX_QTY}>+</button>
              </div>
              <strong className="cart-line">{rupee(i.food.price * i.quantity)}</strong>
              <button className="icon-btn" title="Remove" onClick={() => remove(i.food._id)}>🗑️</button>
            </div>
          ))}
        </div>

        <div className="card summary">
          <h3>Order Summary</h3>
          <div className="sum-row"><span>Items</span><span>{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
          <div className="sum-row total"><span>Total</span><span>{rupee(total)}</span></div>
          <label>Note for the canteen (optional)</label>
          <textarea rows="3" maxLength="200" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. less spicy, extra chutney" />
          <button className="btn btn-primary btn-block" onClick={placeOrder} disabled={busy}>
            {busy ? 'Placing order…' : 'Place Order'}
          </button>
          <p className="muted small center-text">Pay at the counter when you collect your order.</p>
        </div>
      </div>
    </div>
  );
}
