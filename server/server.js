require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:5173',
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
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5001;

mongoose.connect("mongodb://localhost:27017/ruby_auto_parts", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    await seed();
  })
  .catch(err => console.error('MongoDB connect error', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onhold', onHoldRoutes);
app.use('/api/active', activeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('RAP Server running'));

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

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
