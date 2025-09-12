import React, { useEffect, useState } from 'react';
import { getSales } from '../services/api';
import '../styles.css';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Ensure we get the correct date in YYYY-MM-DD format
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }); // YYYY-MM-DD

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError(null);
      console.log('📅 Fetching sales for date:', selectedDate);
      try {
        const response = await getSales(selectedDate);
        console.log('📊 Sales response:', response.data);
        setSales(response.data);
      } catch (err) {
        console.error('❌ Sales fetch error:', err);
        setError('Failed to fetch sales history');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    const selectedDateValue = e.target.value;
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Always allow the date selection, but show warning for future dates
    setSelectedDate(selectedDateValue);
    
    if (selectedDateValue > todayString) {
      setError('Warning: You selected a future date. Results may be empty.');
    } else {
      setError(null); // Clear error when valid date is selected
    }
  };

  if (loading) return <div className="container">Loading sales history...</div>;
  
  // Show warning if it's a future date warning, but don't block the page
  const isWarning = error && error.includes('Warning:');
  
  const formattedDate = new Date(selectedDate).toLocaleDateString();

  return (
    <div className="container">
      <h2>Sales History</h2>
      
      {/* Show warning if it's a future date warning */}
      {isWarning && (
        <div className="alert alert-warning" style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          color: '#856404',
          padding: '0.75rem 1rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* Show error if it's a real error (not a warning) */}
      {error && !isWarning && (
        <div className="error-message">Error: {error}</div>
      )}
      
      <div className="card mb-4">
        <h3>Filter Sales</h3>
        <div className="form-group">
          <label htmlFor="saleDate">Select Date:</label>
          <input
            type="date"
            id="saleDate"
            className="form-control"
            value={selectedDate}
            onChange={handleDateChange}
            max={(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = String(today.getMonth() + 1).padStart(2, '0');
              const day = String(today.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()}
            style={{ width: '250px' }}
          />
        </div>
      </div>

      <div className="card">
        <h3>Sales for {formattedDate}</h3>
        {sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary-500)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <p>No sales recorded on {formattedDate}</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1rem', color: 'var(--secondary-600)' }}>
              <strong>{sales.length}</strong> sale{sales.length > 1 ? 's' : ''} found
            </div>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Sale ID</th>
                    <th>Customer Name</th>
                    <th>Contact</th>
                    <th>Items Sold</th>
                    <th>Total Amount</th>
                    <th>Billed By</th>
                    <th>Sale Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale._id}>
                      <td>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.9rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: 'var(--secondary-100)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--secondary-700)'
                        }}>
                          {sale.billId || sale._id.slice(-8)}
                        </span>
                      </td>
                      <td>
                        <strong>{sale.customerName}</strong>
                      </td>
                      <td>{sale.customerContact || 'N/A'}</td>
                      <td>
                        <div style={{ maxWidth: '300px' }}>
                          {sale.itemsSold.map((itemDetail, index) => (
                            <div key={itemDetail._id} style={{ 
                              marginBottom: index < sale.itemsSold.length - 1 ? '0.5rem' : '0',
                              padding: '0.5rem',
                              backgroundColor: 'var(--secondary-50)',
                              borderRadius: 'var(--radius)',
                              fontSize: '0.9rem'
                            }}>
                              <div style={{ fontWeight: '600', color: 'var(--secondary-800)' }}>
                                {itemDetail.itemName || itemDetail.item?.name || 'Unknown Item'}
                              </div>
                              <div style={{ color: 'var(--secondary-600)' }}>
                                Qty: {itemDetail.quantity} × ₹{itemDetail.priceAtSale?.toFixed(2)} = ₹{(itemDetail.quantity * itemDetail.priceAtSale)?.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary-600)', fontSize: '1.1rem' }}>
                          ₹{sale.totalAmount?.toFixed(2)}
                        </strong>
                      </td>
                      <td>{sale.billedBy ? sale.billedBy.username : 'N/A'}</td>
                      <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;
