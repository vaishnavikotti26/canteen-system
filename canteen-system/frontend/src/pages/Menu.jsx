
import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FoodImg from '../components/FoodImg.jsx';
import { rupee } from '../utils';

export default function Menu() {
  const [foods, setFoods] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cart = useCart();
  const toast = useToast();

  useEffect(() => {
    api
      .get('/foods')
      .then((r) => {
        const data = r.data;

        // Support both array and object API responses
        const foodList = Array.isArray(data)
          ? data
          : Array.isArray(data?.foods)
            ? data.foods
            : Array.isArray(data?.items)
              ? data.items
              : [];

        setFoods(foodList);

        // Use API categories or generate them from food items
        const categories = Array.isArray(data?.categories)
          ? data.categories
          : [...new Set(foodList.map((f) => f.category).filter(Boolean))];

        setCats(categories);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(
    () =>
      foods.filter(
        (f) =>
          (cat === 'All' || f.category === cat) &&
          (f.name || '').toLowerCase().includes(q.trim().toLowerCase())
      ),
    [foods, cat, q]
  );

  const qtyOf = (id) => {
    const found = cart.items.find((i) => i.food._id === id);
    return found ? found.quantity : 0;
  };

  const addToCart = (f) => {
    cart.add(f);
    if (!qtyOf(f._id)) {
      toast(`${f.name} added to cart`);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Today's Menu</h1>
          <p className="muted">
            Pick your favourites, add to cart and place your order.
          </p>
        </div>

        <input
          className="search"
          placeholder="🔍 Search food…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="chips">
        {['All', ...cats].map((c) => (
          <button
            key={c}
            className={`chip ${cat === c ? 'active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && (
        <div className="center-page">
          <div className="spinner" />
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && shown.length === 0 && (
        <div className="empty">No food items found.</div>
      )}

      <div className="grid">
        {shown.map((f) => {
          const qty = qtyOf(f._id);

          return (
            <div className="card food-card" key={f._id}>
              <FoodImg
                src={f.image}
                alt={f.name}
                className="food-img"
              />

              <div className="food-body">
                <span className="tag">{f.category}</span>
                <h3>{f.name}</h3>
                <p className="muted small">{f.description}</p>

                <div className="food-foot">
                  <strong className="price">{rupee(f.price)}</strong>

                  {qty === 0 ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => addToCart(f)}
                    >
                      Add to cart
                    </button>
                  ) : (
                    <div className="stepper">
                      <button
                        aria-label="Decrease"
                        onClick={() => cart.setQty(f._id, qty - 1)}
                      >
                        −
                      </button>

                      <span>{qty}</span>

                      <button
                        aria-label="Increase"
                        onClick={() => cart.setQty(f._id, qty + 1)}
                        disabled={qty >= cart.MAX_QTY}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}