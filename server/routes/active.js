const express = require('express');
const router = express.Router();
const { getActiveItems, getActiveItemByUniqueCode, getActiveItemByBarcodeCode, updateActiveItemQuantity, updateActiveItem, deleteActiveItem } = require('../controllers/activeItemController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, authorize('admin', 'employee'), getActiveItems);

router.route('/search-by-barcode/:barcodeCode')
  .get(protect, authorize('admin', 'employee'), getActiveItemByBarcodeCode);

router.route('/:uniqueCode')
  .get(protect, authorize('admin', 'employee'), getActiveItemByUniqueCode);

router.route('/:id/quantity')
  .put(protect, authorize('admin', 'employee'), updateActiveItemQuantity);

router.route('/:id')
  .put(protect, authorize('admin'), updateActiveItem)
  .delete(protect, authorize('admin'), deleteActiveItem);

module.exports = router;
