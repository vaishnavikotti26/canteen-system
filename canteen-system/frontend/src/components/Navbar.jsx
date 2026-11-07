import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);
  const handleLogout = () => {
    const wasAdmin = user && user.role === 'admin';
    logout();
    close();
    navigate(wasAdmin ? '/admin/login' : '/login');
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-icon">🍽️</span>
          <span>
            SRKR Canteen
            <small>{user && user.role === 'admin' ? 'Admin Panel' : 'Pre-Order Portal'}</small>
          </span>
        </Link>

        {user && (
          <button className="menu-toggle" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
            {open ? '✕' : '☰'}
          </button>
        )}

        {user && (
          <nav className={`nav-links ${open ? 'open' : ''}`}>
            {user.role === 'student' ? (
              <>
                <NavLink to="/menu" onClick={close}>Menu</NavLink>
                <NavLink to="/cart" onClick={close}>
                  Cart {count > 0 && <span className="cart-badge">{count}</span>}
                </NavLink>
                <NavLink to="/orders" onClick={close}>My Orders</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/admin" end onClick={close}>Dashboard</NavLink>
                <NavLink to="/admin/foods" onClick={close}>Food Items</NavLink>
                <NavLink to="/admin/orders" onClick={close}>Orders</NavLink>
              </>
            )}
            <span className="nav-user">👤 {user.name.split(' ')[0]}</span>
            <button className="btn btn-light btn-sm" onClick={handleLogout}>Logout</button>
          </nav>
        )}
      </div>
    </header>
  );
}
