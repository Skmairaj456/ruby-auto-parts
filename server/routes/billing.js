const express = require('express');
const router = express.Router();
const { createBill, getBills, getBillById } = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('admin', 'employee'), createBill)
  .get(protect, authorize('admin', 'employee'), getBills);

router.route('/:id')
  .get(protect, authorize('admin', 'employee'), getBillById);

module.exports = router;
