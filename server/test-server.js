const express = require('express');
const cors = require('cors');

const app = express();

// Basic CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test endpoint working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.json({ 
    message: 'Login endpoint reached',
    body: req.body
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

module.exports = app;
