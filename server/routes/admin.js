const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Admin only routes
router.route('/users').get(protect, authorize(['admin']), authController.getUsers);
router.route('/users/:id/approve').put(protect, authorize(['admin']), authController.approveUser);

module.exports = router;
