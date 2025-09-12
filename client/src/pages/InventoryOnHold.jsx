import React, { useState, useEffect } from 'react';
import API, { printSingleLabel, printQuantityLabels } from '../services/api.js'; // Corrected path (one level up)
import { useAuth } from '../contexts/AuthContext.jsx'; // Added .jsx extension
import '../styles.css'; // Assuming shared styles

const InventoryOnHold = () => {
  const [onHoldItems, setOnHoldItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    price: '',
    tags: '',
    brand: '',
    quantity: 1,
    isTaxable: false,
  });
  const { user, isAdmin, isEmployee } = useAuth();

  const fetchOnHoldItems = async () => {
    setLoading(true);
    try {
      const response = await API.get('/onhold');
      setOnHoldItems(response.data);
    } catch (err) {
      setError('Failed to fetch on-hold items.' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchOnHoldItems();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemToSend = {
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      };
      await API.post('/onhold', itemToSend);
      setForm({
        name: '',
        price: '',
        tags: '',
        brand: '',
        quantity: 1,
        isTaxable: false,
      });
      fetchOnHoldItems();
    } catch (err) {
      setError('Failed to add item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/onhold/${id}/approve`);
      fetchOnHoldItems();
    } catch (err) {
      setError('Failed to approve item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/onhold/${id}/reject`);
      fetchOnHoldItems();
    } catch (err) {
      setError('Failed to reject item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item from On-Hold Inventory?')) {
      try {
        await API.delete(`/onhold/${id}`);
        fetchOnHoldItems();
      } catch (err) {
        setError('Failed to delete item.' + (err.response?.data?.message || err.message));
      }
    }
  };

  const openPrintWindow = (htmlContent, itemName) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    // Check if window opened successfully (not blocked by popup blocker)
    if (!printWindow) {
      // Fallback: Try alternative printing method
      try {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);
        
        const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
        frameDoc.write(htmlContent);
        frameDoc.close();
        
        setTimeout(() => {
          printFrame.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(printFrame);
            alert(`Label(s) sent to printer for ${itemName}!`);
          }, 1000);
        }, 500);
        
        return;
      } catch (fallbackError) {
        setError('Print failed. Please enable popups or try a different browser. Error: ' + fallbackError.message);
        return;
      }
    }
    
    try {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto-trigger print dialog
      setTimeout(() => {
        printWindow.print();
        alert(`Label(s) sent to printer for ${itemName}!`);
      }, 500);
      
    } catch (error) {
      setError('Failed to open print window: ' + error.message);
      if (printWindow) {
        printWindow.close();
      }
    }
  };

  const handlePrintSingle = async (id, itemName) => {
    try {
      const response = await printSingleLabel(id);
      
      // Open print window with the formatted label
      openPrintWindow(response.data.webPrintHTML, itemName);
      
      fetchOnHoldItems(); // Refresh to update print counts
    } catch (err) {
      setError('Failed to print label: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePrintQuantity = async (id, itemName) => {
    try {
      const response = await printQuantityLabels(id);
      
      // For multiple labels, we can either print them all at once or in a loop
      const quantity = response.data.printData.quantity;
      
      // Print all labels (the HTML already contains the quantity info)
      openPrintWindow(response.data.webPrintHTML, itemName);
      
      fetchOnHoldItems(); // Refresh to update print counts
    } catch (err) {
      setError('Failed to print labels: ' + (err.response?.data?.message || err.message));
    }
  };


  if (loading) {
    return <div className="container">Loading On-Hold Inventory...</div>;
  }

  if (error) {
    return <div className="container error-message">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h2>On-Hold Inventory</h2>

      {(isAdmin || isEmployee) && ( // Only employees/admins can add to on-hold
        <div className="card mb-4">
          <h3>Add New On-Hold Item</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name:</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Price:</label>
              <input 
                type="number" 
                name="price" 
                value={form.price} 
                onChange={handleChange} 
                onWheel={(e) => e.target.blur()} 
                required 
                min="0" 
                step="0.01" 
              />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated):</label>
              <input type="text" name="tags" value={form.tags} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Brand:</label>
              <input type="text" name="brand" value={form.brand} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Quantity:</label>
              <input 
                type="number" 
                name="quantity" 
                value={form.quantity} 
                onChange={handleChange} 
                onWheel={(e) => e.target.blur()} // Prevent scroll wheel interaction
                required 
                min="1" 
              />
            </div>
            <div className="form-group form-check">
              <input type="checkbox" id="isTaxable" name="isTaxable" checked={form.isTaxable} onChange={handleChange} />
              <label htmlFor="isTaxable">Is Taxable</label>
            </div>
            <button type="submit" className="btn btn-primary">Add Item to On-Hold</button>
          </form>
        </div>
      )}

      <h3>Current On-Hold Items</h3>
      {onHoldItems.length === 0 ? (
        <p>No items on hold.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
              <thead>
              <tr>
                <th>Code</th>
                <th>Barcode</th>
                <th>Name</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Tags</th>
                <th>Brand</th>
                <th>Taxable</th>
                <th>Status</th>
                <th>Added By</th>
                <th>Print Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {onHoldItems.map((item) => (
                <tr key={item._id}>
                  <td>{item.uniqueCode}</td>
                  <td>
                    {item.barcodeUrl ? (
                      <img 
                        src={item.barcodeUrl} 
                        alt={`Barcode for ${item.name}`}
                        style={{ height: '40px', width: 'auto' }}
                        title={item.uniqueCode}
                      />
                    ) : (
                      <span style={{ color: '#999' }}>No barcode</span>
                    )}
                  </td>
                  <td>{item.name}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.tags.join(', ')}</td>
                  <td>{item.brand}</td>
                  <td>{item.isTaxable ? 'Yes' : 'No'}</td>
                  <td>{item.status}</td>
                  <td>{item.addedBy?.username || 'N/A'}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      <div>Printed: {item.printedLabels || 0}/{item.quantity}</div>
                      {(item.printedLabels || 0) >= item.quantity ? (
                        <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>✓ Complete</span>
                      ) : (
                        <span style={{ color: 'var(--accent-yellow)', fontWeight: '600' }}>
                          {item.quantity - (item.printedLabels || 0)} remaining
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Print Button - Single option */}
                      <button 
                        onClick={() => handlePrintSingle(item._id, item.name)} 
                        className="btn btn-primary btn-sm"
                        title="Print label"
                      >
                        🖨️ Print
                      </button>
                      
                      {/* Admin Actions */}
                      {isAdmin && item.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button onClick={() => handleApprove(item._id)} className="btn btn-success btn-sm">Approve</button>
                          <button onClick={() => handleReject(item._id)} className="btn btn-warning btn-sm">Reject</button>
                        </div>
                      )}
                      {isAdmin && (item.status === 'approved' || item.status === 'rejected') && (
                        <button onClick={() => handleDelete(item._id)} className="btn btn-danger btn-sm">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryOnHold;