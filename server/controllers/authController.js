const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  const userExists = await User.findOne({ username });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    username,
    password,
    role,
    isApproved: role === 'employee' ? true : false, // Auto-approve employees on registration
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt for:', username);

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    console.log('📋 User details:', {
      username: user.username,
      role: user.role,
      isApproved: user.isApproved
    });

    const passwordMatch = await user.matchPassword(password);
    console.log('🔑 Password match:', passwordMatch ? 'Yes' : 'No');

    if (!passwordMatch) {
      console.log('❌ Password incorrect');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.isApproved) {
      console.log('❌ User not approved');
      return res.status(401).json({ message: 'User account is not approved' });
    }

    console.log('🎉 Login successful for:', username);
    res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

// @desc    Approve or disapprove user (Admin only)
// @route   PUT /api/auth/users/:id/approve
// @access  Private/Admin
const approveUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.isApproved = req.body.isApproved;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      role: updatedUser.role,
      isApproved: updatedUser.isApproved,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = { registerUser, loginUser, getUsers, approveUser };
