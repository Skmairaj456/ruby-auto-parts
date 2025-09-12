import React, { useState, useEffect } from 'react';
import API from '../services/api.js'; // Corrected path (one level up)
import { useAuth } from '../contexts/AuthContext.jsx'; // Corrected path (one level up)
import '../styles.css';

const ActiveInventory = () => {
  const [activeItems, setActiveItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState({
    name: '',
    tag: '',
    brand: '',
  });
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    tags: '',
    brand: '',
    quantity: '',
    isTaxable: false,
  });
  const { user, isAdmin, isEmployee } = useAuth();

  const fetchActiveItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.name) params.append('name', searchQuery.name);
      if (searchQuery.tag) params.append('tag', searchQuery.tag);
      if (searchQuery.brand) params.append('brand', searchQuery.brand);

      const response = await API.get('/active', { params });
      setActiveItems(response.data);
    } catch (err) {
      setError('Failed to fetch active items.' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchActiveItems();
    }
  }, [user, searchQuery]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchQuery({
      ...searchQuery,
      [name]: value,
    });
  };

  const handleEditClick = (item) => {
    setEditingItem(item._id);
    setEditForm({
      name: item.name,
      price: item.price,
      tags: item.tags.join(', '),
      brand: item.brand,
      quantity: item.quantity,
      isTaxable: item.isTaxable,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const itemToSend = {
        ...editForm,
        price: parseFloat(editForm.price),
        quantity: parseInt(editForm.quantity),
        tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      };
      await API.put(`/active/${editingItem}`, itemToSend);
      setEditingItem(null);
      fetchActiveItems();
    } catch (err) {
      setError('Failed to update item.' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item from Active Inventory?')) {
      try {
        await API.delete(`/active/${id}`);
        fetchActiveItems();
      } catch (err) {
        setError('Failed to delete item.' + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="skeleton" style={{ height: '2rem', width: '300px', margin: '0 auto 1rem' }}></div>
          <div className="skeleton" style={{ height: '1rem', width: '200px', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container error-message">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h2>Active Inventory</h2>

      {/* Stats Overview */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{activeItems.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeItems.reduce((sum, item) => sum + item.quantity, 0)}</div>
          <div className="stat-label">Total Quantity</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</div>
          <div className="stat-label">Total Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeItems.filter(item => item.quantity <= 5).length}</div>
          <div className="stat-label">Low Stock</div>
        </div>
      </div>

      <div className="card mb-4">
        <h3>Search & Filter</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Name:</label>
            <input type="text" name="name" value={searchQuery.name} onChange={handleSearchChange} placeholder="Search by name" />
          </div>
          <div className="form-group">
            <label>Tag:</label>
            <input type="text" name="tag" value={searchQuery.tag} onChange={handleSearchChange} placeholder="Search by tag" />
          </div>
          <div className="form-group">
            <label>Brand:</label>
            <input type="text" name="brand" value={searchQuery.brand} onChange={handleSearchChange} placeholder="Search by brand" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Current Active Items ({activeItems.length})</h3>
        {activeItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary-500)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p>No active items found. Add some items to get started!</p>
          </div>
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
                  <th>Added By</th>
                  <th>Approved By</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => (
                  <tr key={item._id} className={item.quantity <= 5 ? 'status-warning' : ''}>
                    <td>
                      <code style={{ 
                        background: 'var(--secondary-100)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: 'var(--radius)',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {item.uniqueCode}
                      </code>
                    </td>
                    <td>
                      {item.barcodeUrl ? (
                        <img 
                          src={item.barcodeUrl} 
                          alt={`Barcode for ${item.name}`}
                          style={{ height: '40px', width: 'auto' }}
                          title={item.uniqueCode}
                          className="interactive"
                        />
                      ) : (
                        <span style={{ color: 'var(--secondary-400)', fontSize: '0.875rem' }}>No barcode</span>
                      )}
                    </td>
                    <td>
                      {editingItem === item._id ? (
                        <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange} className="form-control" />
                      ) : (
                        <strong>{item.name}</strong>
                      )}
                    </td>
                    <td>
                      {editingItem === item._id ? (
                        <input type="number" name="price" value={editForm.price} onChange={handleEditFormChange} step="0.01" className="form-control" />
                      ) : (
                        <span style={{ fontWeight: '600', color: 'var(--accent-green)' }}>₹{item.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td>
                      {editingItem === item._id ? (
                        <input type="number" name="quantity" value={editForm.quantity} onChange={handleEditFormChange} className="form-control" />
                      ) : (
                        <span className={item.quantity <= 5 ? 'status-warning' : item.quantity <= 10 ? 'status-warning' : 'status-online'}>
                          {item.quantity}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingItem === item._id ? (
                        <input type="text" name="tags" value={editForm.tags} onChange={handleEditFormChange} className="form-control" />
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {item.tags.map((tag, index) => (
                            <span key={index} style={{
                              background: 'var(--primary-100)',
                              color: 'var(--primary-700)',
                              padding: '0.125rem 0.5rem',
                              borderRadius: 'var(--radius)',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingItem === item._id ? (
                        <input type="text" name="brand" value={editForm.brand} onChange={handleEditFormChange} className="form-control" />
                      ) : (
                        <span style={{ fontWeight: '500' }}>{item.brand}</span>
                      )}
                    </td>
                    <td>
                      {editingItem === item._id ? (
                        <input type="checkbox" name="isTaxable" checked={editForm.isTaxable} onChange={handleEditFormChange} />
                      ) : (
                        <span className={item.isTaxable ? 'status-online' : 'status-offline'}>
                          {item.isTaxable ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--secondary-600)' }}>{item.addedBy?.username || 'N/A'}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--secondary-600)' }}>{item.approvedBy?.username || 'N/A'}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {editingItem === item._id ? (
                            <button onClick={handleUpdateItem} className="btn btn-success btn-sm">Save</button>
                          ) : (
                            <button onClick={() => handleEditClick(item)} className="btn btn-primary btn-sm">Edit</button>
                          )}
                          <button onClick={() => handleDeleteItem(item._id)} className="btn btn-danger btn-sm">Delete</button>
                        </div>
                      </td>
                    )}
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

export default ActiveInventory;
