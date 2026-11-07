import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const MAX_QTY = 20;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = user ? `cart_${user.id}` : null;
  const [items, setItems] = useState([]);

  // Load this user's saved cart whenever the logged-in user changes
  useEffect(() => {
    if (!key) {
      setItems([]);
      return;
    }
    try {
      setItems(JSON.parse(localStorage.getItem(key)) || []);
    } catch {
      setItems([]);
    }
  }, [key]);

  const update = (fn) =>
    setItems((prev) => {
      const next = fn(prev);
      if (key) localStorage.setItem(key, JSON.stringify(next));
      return next;
    });

  const add = (food) =>
    update((prev) => {
      const found = prev.find((i) => i.food._id === food._id);
      if (found) {
        return prev.map((i) =>
          i.food._id === food._id ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + 1) } : i
        );
      }
      return [
        ...prev,
        { food: { _id: food._id, name: food.name, price: food.price, image: food.image, category: food.category }, quantity: 1 },
      ];
    });

  // quantity below 1 removes the item
  const setQty = (id, qty) =>
    update((prev) =>
      qty < 1
        ? prev.filter((i) => i.food._id !== id)
        : prev.map((i) => (i.food._id === id ? { ...i, quantity: Math.min(MAX_QTY, qty) } : i))
    );

  const remove = (id) => update((prev) => prev.filter((i) => i.food._id !== id));
  const clear = () => update(() => []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.food.price, 0);

  return (
    <CartContext.Provider value={{ items, count, total, add, setQty, remove, clear, MAX_QTY }}>
      {children}
    </CartContext.Provider>
  );
}
