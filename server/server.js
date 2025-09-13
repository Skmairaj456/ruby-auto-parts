require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN,
    'https://www.rubyautoparts.com',
    'https://rubyautoparts.com',
    'http://localhost:5173'
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200
};

const authRoutes = require('./routes/auth');
const onHoldRoutes = require('./routes/onHold');
const activeRoutes = require('./routes/active');
const billingRoutes = require('./routes/billing');
const salesRoutes = require('./routes/sales');
const adminRoutes = require('./routes/admin');

const seed = require('./utils/seed');

const app = express();

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5001;

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ruby_auto_parts";

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    try {
      await seed();
      console.log('✅ Database seeded successfully');
    } catch (seedError) {
      console.error('❌ Seeding error:', seedError);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connect error:', err);
    console.error('❌ Connection string:', mongoUri.replace(/\/\/.*@/, '//***:***@'));
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onhold', onHoldRoutes);
app.use('/api/active', activeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('RAP Server running'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cors_origin: process.env.CORS_ORIGIN,
    api_base_url: process.env.VITE_API_BASE_URL
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test endpoint to check users in database
app.get('/test-users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find({});
    res.json({
      message: 'Users in database',
      count: users.length,
      users: users.map(u => ({
        username: u.username,
        role: u.role,
        isApproved: u.isApproved
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple test login endpoint
app.post('/test-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const User = require('./models/User');
    
    console.log('🧪 Test login for:', username);
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Password incorrect' });
    }
    
    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for ActiveItem collection
app.get('/test-activeitems', async (req, res) => {
  try {
    const ActiveItem = require('./models/ActiveItem');
    const mongoose = require('mongoose');

    console.log('🧪 Testing ActiveItem collection...');
    console.log('Database state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);

    const count = await ActiveItem.countDocuments();
    const items = await ActiveItem.find({}).limit(5);

    res.json({
      message: 'ActiveItem collection test',
      count: count,
      sampleItems: items,
      databaseConnected: mongoose.connection.readyState === 1
    });
  } catch (error) {
    console.error('❌ ActiveItem test error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl
  });
});

// For Vercel deployment - always export the app
module.exports = app;

// Only start server in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}
