import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminFoods from './pages/AdminFoods.jsx';
import AdminOrders from './pages/AdminOrders.jsx';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/menu'} replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<Login admin />} />

          <Route path="/menu" element={<ProtectedRoute role="student"><Menu /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute role="student"><Cart /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute role="student"><Orders /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/foods" element={<ProtectedRoute role="admin"><AdminFoods /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
