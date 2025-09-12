import React, { useState, useEffect } from 'react';
import API from '../services/api.js'; // Corrected path (one level up)
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles.css';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState(() => {
    const today = new Date();
    return today.getFullYear();
  });
  const [filterMonth, setFilterMonth] = useState(() => {
    const today = new Date();
    return today.getMonth() + 1;
  });
  const { user, isAdmin } = useAuth();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    
    // Check if selected date is in the future
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Allow future dates but show warning
    if (filterYear > currentYear || (filterYear === currentYear && filterMonth > currentMonth)) {
      setError('Warning: You selected a future date. Results may be empty.');
      // Don't return, continue with the request
    } else {
      setError(''); // Clear error for valid dates
    }
    
    try {
      const params = new URLSearchParams();
      if (filterYear) params.append('year', filterYear);
      if (filterMonth) params.append('month', filterMonth);

      console.log('📊 Fetching analytics for:', { year: filterYear, month: filterMonth });
      const response = await API.get('/sales/analytics', { params });
      console.log('📈 Analytics response:', response.data);
      console.log('📈 Analytics type:', typeof response.data);
      console.log('📈 Analytics keys:', Object.keys(response.data || {}));
      setAnalytics(response.data);
    } catch (err) {
      console.error('❌ Analytics fetch error:', err);
      setError('Failed to fetch sales analytics.' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await API.get('/sales/lowstock');
      setLowStockItems(response.data);
    } catch (err) {
      setError('Failed to fetch low stock alerts.' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
      fetchLowStockAlerts();
    }
  }, [isAdmin, filterYear, filterMonth]);

  // Reset month if it becomes invalid when year changes
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    if (filterYear === currentYear && filterMonth > currentMonth) {
      setFilterMonth(currentMonth);
    }
  }, [filterYear, filterMonth]);

  if (!isAdmin) {
    return <div className="container error-message">You are not authorized to view this page.</div>;
  }

  if (loading) {
    return <div className="container">Loading Admin Dashboard...</div>;
  }

  if (error) {
    return <div className="container error-message">Error: {error}</div>;
  }

  const currentMonthName = new Date(filterYear, filterMonth - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      {/* Stats Overview */}
      {analytics && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">₹{analytics?.totalSales?.toFixed(2) || 0}</div>
            <div className="stat-label">Total Sales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics?.totalItemsSold || 0}</div>
            <div className="stat-label">Items Sold</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics?.totalBills || 0}</div>
            <div className="stat-label">Total Bills</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{lowStockItems.length}</div>
            <div className="stat-label">Low Stock Items</div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <h3>Sales Analytics</h3>
        <div className="form-inline mb-3">
          <label className="mr-2">Year:</label>
          <select
            className="form-control inline-input mr-3"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
          >
            {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i).reverse().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <label className="mr-2">Month:</label>
          <select
            className="form-control inline-input"
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1)
              .filter((monthNum) => {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1;
                // Show all months for past years, only up to current month for current year
                return filterYear < currentYear || monthNum <= currentMonth;
              })
              .map((monthNum) => (
                <option key={monthNum} value={monthNum}>
                  {new Date(0, monthNum - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
          </select>
        </div>

        {analytics ? (
          <div>
            <div className="dashboard-metric">
              <span>Total Sales ({currentMonthName} {filterYear})</span>
              <strong>₹{analytics?.totalSales?.toFixed(2) || 0}</strong>
            </div>
            <div className="dashboard-metric">
              <span>Items Sold ({currentMonthName} {filterYear})</span>
              <strong>{analytics?.totalItemsSold || 0} items</strong>
            </div>
            <div className="dashboard-metric">
              <span>Total Bills ({currentMonthName} {filterYear})</span>
              <strong>{analytics?.totalBills || 0} bills</strong>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary-500)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <p>No sales data available for {currentMonthName} {filterYear}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Try selecting a different month or make some sales to see analytics.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Low Stock Alerts ({lowStockItems.length} items)</h3>
        {lowStockItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary-500)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <p>All items are well stocked!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Quantity</th>
                  <th>Unique Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.brand}</td>
                    <td>
                      <span className={item.quantity <= 2 ? 'status-error' : 'status-warning'}>
                        {item.quantity}
                      </span>
                    </td>
                    <td>{item.uniqueCode}</td>
                    <td>
                      <span className={`status-${item.quantity <= 2 ? 'error' : 'warning'}`}>
                        {item.quantity <= 2 ? 'Critical' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
