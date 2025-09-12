const express = require('express');
const router = express.Router();
const { addOnHoldItem, getOnHoldItems, approveOnHoldItem, rejectOnHoldItem, deleteOnHoldItem, printSingleLabel, printQuantityLabels } = require('../controllers/onHoldController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('admin', 'employee'), addOnHoldItem)
  .get(protect, authorize('admin', 'employee'), getOnHoldItems);

router.route('/:id/approve').put(protect, authorize('admin'), approveOnHoldItem);
router.route('/:id/reject').put(protect, authorize('admin'), rejectOnHoldItem);
router.route('/:id/print-single').post(protect, authorize('admin', 'employee'), printSingleLabel);
router.route('/:id/print-quantity').post(protect, authorize('admin', 'employee'), printQuantityLabels);
router.route('/:id').delete(protect, authorize('admin'), deleteOnHoldItem);

module.exports = router;
