import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles.css';

const Home = () => {
  const { user, isAdmin, isEmployee } = useAuth();

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h1 style={{ 
          fontSize: '4rem', 
          fontWeight: '800',
          background: 'linear-gradient(135deg, var(--primary-600), var(--accent-purple))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem'
        }}>
          Ruby Auto Parts
        </h1>
        
        <div style={{ 
          fontSize: '1.5rem', 
          color: 'var(--secondary-600)', 
          marginBottom: '2rem',
          fontWeight: '500'
        }}>
          Your Trusted Auto Parts Partner
        </div>
        
        <div style={{ 
          fontSize: '1.2rem', 
          color: 'var(--secondary-700)', 
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem'
        }}>
          Located in <strong>Ram Nagar</strong>, we provide quality auto parts with professional service. 
          Our advanced inventory management system ensures quick and accurate service for all your automotive needs.
        </div>
      </div>

      {/* Services Section */}
      <div className="card">
        <h2 className="heading-with-line" style={{ textAlign: 'center', marginBottom: '2rem' }}>Our Services</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: 'var(--primary-50)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--primary-200)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
            <h3>Quality Auto Parts</h3>
            <p>Genuine and aftermarket parts for all vehicle makes and models</p>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#f0fdf4',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3>Inventory Management</h3>
            <p>Advanced digital inventory tracking with barcode scanning</p>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#fffbeb',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #fed7aa'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
            <h3>Fast Service</h3>
            <p>Quick order processing and efficient parts delivery</p>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Modern Technology</h2>
        <div style={{ textAlign: 'center', color: 'var(--secondary-600)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            We use cutting-edge technology to serve you better:
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            textAlign: 'left'
          }}>
            <div>✅ <strong>Barcode Scanning</strong> - Quick part identification</div>
            <div>✅ <strong>Digital Inventory</strong> - Real-time stock tracking</div>
            <div>✅ <strong>Thermal Printing</strong> - Professional labels</div>
            <div>✅ <strong>Sales Analytics</strong> - Data-driven insights</div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Visit Us</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📍</div>
            <h3>Location</h3>
            <p>Ram Nagar<br/>Your trusted neighborhood auto parts store</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📞</div>
            <h3>Contact</h3>
            <p>Phone: 9123456789<br/>Always ready to help</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🕒</div>
            <h3>Hours</h3>
            <p>Open Daily<br/>Professional service guaranteed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions for logged in users */}
      {user && (
        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Quick Access</h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {(isAdmin || isEmployee) && (
              <>
                <Link to="/active-inventory" className="btn btn-primary btn-lg">
                  📦 Active Inventory
                </Link>
                <Link to="/billing" className="btn btn-success btn-lg">
                  💰 Billing
                </Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin-dashboard" className="btn btn-outline btn-lg">
                📊 Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
