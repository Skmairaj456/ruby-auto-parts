const ActiveItem = require('../models/ActiveItem');

// @desc    Get all Active Items
// @route   GET /api/active
// @access  Private/Admin, Employee
const getActiveItems = async (req, res) => {
  const { name, tag, brand } = req.query;
  let query = {};

  if (name) {
    query.name = { $regex: name, $options: 'i' };
  }
  if (tag) {
    query.tags = { $in: [tag] };
  }
  if (brand) {
    query.brand = { $regex: brand, $options: 'i' };
  }

  try {
    const activeItems = await ActiveItem.find(query).populate('addedBy', 'username').populate('approvedBy', 'username').sort({ createdAt: -1 });
    res.json(activeItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not retrieve Active Inventory' });
  }
};

// @desc    Get single Active Item by uniqueCode
// @route   GET /api/active/:uniqueCode
// @access  Private/Admin, Employee
const getActiveItemByUniqueCode = async (req, res) => {
  try {
    const activeItem = await ActiveItem.findOne({ uniqueCode: req.params.uniqueCode }).populate('addedBy', 'username').populate('approvedBy', 'username');

    if (!activeItem) {
      return res.status(404).json({ message: 'Active Item not found' });
    }

    res.json(activeItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not retrieve Active Item' });
  }
};

// @desc    Get single Active Item by barcode code (last part of uniqueCode)
// @route   GET /api/active/search-by-barcode/:barcodeCode
// @access  Private/Admin, Employee
const getActiveItemByBarcodeCode = async (req, res) => {
  try {
    const barcodeCode = req.params.barcodeCode;
    
    // Find item where uniqueCode ends with the barcodeCode
    const activeItem = await ActiveItem.findOne({ 
      uniqueCode: { $regex: `_${barcodeCode}$` } 
    }).populate('addedBy', 'username').populate('approvedBy', 'username');

    if (!activeItem) {
      return res.status(404).json({ message: 'Active Item not found for barcode code' });
    }

    res.json(activeItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not retrieve Active Item by barcode' });
  }
};

// @desc    Update Active Item quantity (e.g., after a sale)
// @route   PUT /api/active/:id/quantity
// @access  Private/Admin, Employee
const updateActiveItemQuantity = async (req, res) => {
  const { quantitySold } = req.body;

  try {
    const activeItem = await ActiveItem.findById(req.params.id);

    if (!activeItem) {
      return res.status(404).json({ message: 'Active Item not found' });
    }

    if (activeItem.quantity < quantitySold) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    activeItem.quantity -= quantitySold;
    await activeItem.save();

    res.json({ message: 'Active Item quantity updated', activeItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not update quantity' });
  }
};

// @desc    Update Active Item details (Admin only)
// @route   PUT /api/active/:id
// @access  Private/Admin
const updateActiveItem = async (req, res) => {
  const { name, price, tags, brand, quantity, isTaxable } = req.body;

  try {
    const activeItem = await ActiveItem.findById(req.params.id);

    if (!activeItem) {
      return res.status(404).json({ message: 'Active Item not found' });
    }

    activeItem.name = name || activeItem.name;
    activeItem.price = price || activeItem.price;
    activeItem.tags = tags || activeItem.tags;
    activeItem.brand = brand || activeItem.brand;
    activeItem.quantity = quantity || activeItem.quantity;
    activeItem.isTaxable = isTaxable !== undefined ? isTaxable : activeItem.isTaxable;

    const updatedActiveItem = await activeItem.save();
    res.json(updatedActiveItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not update item' });
  }
};

// @desc    Delete an Active Item (Admin only)
// @route   DELETE /api/active/:id
// @access  Private/Admin
const deleteActiveItem = async (req, res) => {
  try {
    const activeItem = await ActiveItem.findById(req.params.id);

    if (!activeItem) {
      return res.status(404).json({ message: 'Active Item not found' });
    }

    await activeItem.deleteOne();

    res.json({ message: 'Active Item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not delete item' });
  }
};

module.exports = { getActiveItems, getActiveItemByUniqueCode, getActiveItemByBarcodeCode, updateActiveItemQuantity, updateActiveItem, deleteActiveItem };
