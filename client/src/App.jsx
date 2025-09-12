import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, getLogout } from './contexts/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ActiveInventory from './pages/ActiveInventory.jsx';
import InventoryOnHold from './pages/InventoryOnHold.jsx';
import Billing from './pages/Billing.jsx';
import Navbar from './components/Navbar.jsx'; // Import Navbar
import SalesHistory from './pages/SalesHistory.jsx'; // Import new SalesHistory page
import { setAuthInterceptor } from './services/api.js';
// Import other pages as needed

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redirect unauthorized users
  }

  return <Outlet />;
};

function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const logout = getLogout();

  // Set up the Axios interceptor once when the component mounts
  useEffect(() => {
    setAuthInterceptor(logout, navigate);
  }, [logout, navigate]);
  
  // Public route for home page
  const HomeRoute = () => {
    if (!user) return <Navigate to="/login" replace />;
    return <Home />;
  };

  return (
    <div className="App">
      <Navbar /> {/* Add Navbar here */}
      <div className="content-area">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRoute />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            {/* Add other admin routes here */}
          </Route>

          {/* Protected Employee and Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'employee']} />}>
            <Route path="/active-inventory" element={<ActiveInventory />} />
            <Route path="/onhold-inventory" element={<InventoryOnHold />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/sales-history" element={<SalesHistory />} />
            {/* Add other shared routes here */}
          </Route>

          {/* Catch-all for undefined routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
