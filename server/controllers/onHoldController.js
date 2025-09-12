const OnHoldItem = require('../models/OnHoldItem');
const ActiveItem = require('../models/ActiveItem');
const { generateBarcodeAndUpload } = require('../utils/barcodeAndUpload');
const { generateThermalPrintData, formatForWebPrint } = require('../utils/thermalPrinter');

// @desc    Add item to On-Hold Inventory
// @route   POST /api/onhold
// @access  Private/Employee
const addOnHoldItem = async (req, res) => {
  const { name, price, tags, brand, quantity, isTaxable } = req.body;

  // Generate unique code with timestamp for DB but shorter code for barcode
  const timestamp = new Date();
  const date = timestamp.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const time = timestamp.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
  const randomString = Math.random().toString(36).substring(2, 9).toUpperCase(); // Increased to 7 characters
  const uniqueCode = `${date}_${time}_${randomString}`;
  const barcodeCode = randomString; // Only use the 7-character random string for barcode

  try {
    const barcodeUrl = await generateBarcodeAndUpload(barcodeCode);

    const onHoldItem = await OnHoldItem.create({
      uniqueCode,
      name,
      price,
      tags,
      brand,
      quantity,
      barcodeUrl,
      isTaxable,
      addedBy: req.user._id, // Assuming req.user is set by auth middleware
      status: 'pending',
    });

    res.status(201).json(onHoldItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not add item to On-Hold Inventory' });
  }
};

// @desc    Get all On-Hold Items
// @route   GET /api/onhold
// @access  Private/Admin, Employee
const getOnHoldItems = async (req, res) => {
  try {
    const onHoldItems = await OnHoldItem.find({})
      .populate('addedBy', 'username')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
    res.json(onHoldItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not retrieve On-Hold Inventory' });
  }
};

// @desc    Approve an On-Hold Item (move to Active Inventory)
// @route   PUT /api/onhold/:id/approve
// @access  Private/Admin
const approveOnHoldItem = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    // Create ActiveItem
    const activeItem = await ActiveItem.create({
      uniqueCode: onHoldItem.uniqueCode,
      name: onHoldItem.name,
      price: onHoldItem.price,
      tags: onHoldItem.tags,
      brand: onHoldItem.brand,
      quantity: onHoldItem.quantity,
      barcodeUrl: onHoldItem.barcodeUrl,
      isTaxable: onHoldItem.isTaxable,
      addedBy: onHoldItem.addedBy,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    // Update OnHoldItem status
    onHoldItem.status = 'approved';
    onHoldItem.approvedBy = req.user._id;
    await onHoldItem.save();
    await onHoldItem.deleteOne(); // Delete the on-hold item after it's approved

    res.json({ message: 'Item approved and moved to Active Inventory', activeItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not approve item' });
  }
};

// @desc    Reject an On-Hold Item
// @route   PUT /api/onhold/:id/reject
// @access  Private/Admin
const rejectOnHoldItem = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    onHoldItem.status = 'rejected';
    await onHoldItem.save();

    res.json({ message: 'On-Hold Item rejected', onHoldItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not reject item' });
  }
};

// @desc    Delete an On-Hold Item
// @route   DELETE /api/onhold/:id
// @access  Private/Admin
const deleteOnHoldItem = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    await onHoldItem.deleteOne();

    res.json({ message: 'On-Hold Item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not delete item' });
  }
};

// @desc    Print single label
// @route   POST /api/onhold/:id/print-single
// @access  Private/Employee
const printSingleLabel = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    // Check if we can print more labels - COMMENTED OUT FOR UNLIMITED PRINTS
    // if (onHoldItem.printedLabels >= onHoldItem.quantity) {
    //   return res.status(400).json({ 
    //     message: `Cannot print more labels. Already printed ${onHoldItem.printedLabels}/${onHoldItem.quantity} labels` 
    //   });
    // }

    // Update print tracking - COMMENTED OUT FOR UNLIMITED PRINTS
    // onHoldItem.printedLabels += 1;
    // onHoldItem.lastPrintedAt = new Date();
    // onHoldItem.printHistory.push({
    //   quantity: 1,
    //   printedBy: req.user._id
    // });

    // await onHoldItem.save();

    // Generate print data for thermal printer (2-inch format)
    const printData = {
      uniqueCode: onHoldItem.uniqueCode,
      name: onHoldItem.name,
      brand: onHoldItem.brand || '',
      price: onHoldItem.price,
      barcodeUrl: onHoldItem.barcodeUrl,
      type: 'single',
      quantity: 1
    };

    // Generate thermal printer commands
    const thermalData = generateThermalPrintData(printData);
    const webPrintHTML = formatForWebPrint(printData);

    res.json({ 
      message: 'Label printed successfully',
      printData,
      thermalCommands: thermalData.rawCommands,
      webPrintHTML: webPrintHTML,
      remainingLabels: 'unlimited' // onHoldItem.quantity - onHoldItem.printedLabels
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not print label' });
  }
};

// @desc    Print quantity labels (remaining labels based on quantity)
// @route   POST /api/onhold/:id/print-quantity
// @access  Private/Employee
const printQuantityLabels = async (req, res) => {
  try {
    const onHoldItem = await OnHoldItem.findById(req.params.id);

    if (!onHoldItem) {
      return res.status(404).json({ message: 'On-Hold Item not found' });
    }

    // Calculate remaining labels that can be printed - COMMENTED OUT FOR UNLIMITED PRINTS
    const remainingLabels = onHoldItem.quantity; // Print all quantity requested

    // if (remainingLabels <= 0) {
    //   return res.status(400).json({ 
    //     message: `Cannot print more labels. Already printed ${onHoldItem.printedLabels}/${onHoldItem.quantity} labels` 
    //   });
    // }

    // Update print tracking - COMMENTED OUT FOR UNLIMITED PRINTS
    // onHoldItem.printedLabels += remainingLabels;
    // onHoldItem.lastPrintedAt = new Date();
    // onHoldItem.printHistory.push({
    //   quantity: remainingLabels,
    //   printedBy: req.user._id
    // });

    // await onHoldItem.save();

    // Generate print data for thermal printer (2-inch format)
    const printData = {
      uniqueCode: onHoldItem.uniqueCode,
      name: onHoldItem.name,
      brand: onHoldItem.brand || '',
      price: onHoldItem.price,
      barcodeUrl: onHoldItem.barcodeUrl,
      quantity: remainingLabels,
      type: 'quantity'
    };

    // Generate thermal printer commands for multiple labels
    const thermalData = generateThermalPrintData(printData);
    const webPrintHTML = formatForWebPrint(printData);

    res.json({ 
      message: `${remainingLabels} labels printed successfully`,
      printData,
      thermalCommands: thermalData.rawCommands,
      webPrintHTML: webPrintHTML,
      totalPrinted: 'unlimited' // onHoldItem.printedLabels
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not print labels' });
  }
};


module.exports = { 
  addOnHoldItem, 
  getOnHoldItems, 
  approveOnHoldItem, 
  rejectOnHoldItem, 
  deleteOnHoldItem,
  printSingleLabel,
  printQuantityLabels
};
