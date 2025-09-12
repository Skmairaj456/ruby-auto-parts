import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles.css';

const Navbar = () => {
  const { user, logout, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>Ruby Auto Parts</Link>
      <ul className="navbar-nav">
        {user ? (
          <>
            {(isAdmin || isEmployee) && (
              <li className="nav-item">
                <Link to="/active-inventory" className="nav-link"><span>Active Inventory</span></Link>
              </li>
            )}
            {(isAdmin || isEmployee) && (
              <li className="nav-item">
                <Link to="/onhold-inventory" className="nav-link"><span>On-Hold Inventory</span></Link>
              </li>
            )}
            {(isAdmin || isEmployee) && (
              <li className="nav-item">
                <Link to="/billing" className="nav-link"><span>Billing</span></Link>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <Link to="/admin-dashboard" className="nav-link"><span>Admin Dashboard</span></Link>
              </li>
            )}
            {(isAdmin || isEmployee) && (
              <li className="nav-item">
                <Link to="/sales-history" className="nav-link"><span>Sales History</span></Link>
              </li>
            )}
            <li className="nav-item">
              <span className="nav-text">Welcome, {user.username} ({user.role})</span>
            </li>
            <li className="nav-item">
              <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
            </li>
          </>
        ) : (
          <li className="nav-item">
            <Link to="/login" className="nav-link">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
