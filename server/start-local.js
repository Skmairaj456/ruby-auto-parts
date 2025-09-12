// Alternative server startup with local MongoDB fallback
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

// Try multiple MongoDB connection options
const mongoOptions = [
  "mongodb://localhost:27017/ruby_auto_parts",
  "mongodb://127.0.0.1:27017/ruby_auto_parts",
  "mongodb://localhost:27017/ruby-auto-parts"
];

async function connectToMongoDB() {
  for (const uri of mongoOptions) {
    try {
      console.log(`🔄 Trying to connect to: ${uri}`);
      await mongoose.connect(uri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000 // 5 second timeout
      });
      console.log('✅ MongoDB connected successfully!');
      await seed();
      return true;
    } catch (error) {
      console.log(`❌ Failed to connect to ${uri}:`, error.message);
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
    }
  }
  
  console.log('❌ Could not connect to any MongoDB instance');
  console.log('💡 Please install MongoDB locally or check your Atlas connection');
  return false;
}

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

// Start server
connectToMongoDB().then(connected => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on ${PORT}`);
      console.log(`🌐 Access your app at: http://localhost:5173`);
      console.log(`🔧 API available at: http://localhost:${PORT}`);
    });
  } else {
    console.log('❌ Server not started due to database connection issues');
    process.exit(1);
  }
});
