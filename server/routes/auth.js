const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers, approveUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/approve', protect, authorize('admin'), approveUser);

module.exports = router;
