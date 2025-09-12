const Sale = require('../models/Sale');
const ActiveItem = require('../models/ActiveItem');

// Utility function to generate bill number
const generateBillNumber = async () => {
  const lastSale = await Sale.findOne().sort({ createdAt: -1 });
  let nextBillNumber = 'BILL001';

  if (lastSale && lastSale.billNumber) {
    const lastNumber = parseInt(lastSale.billNumber.replace('BILL', ''));
    nextBillNumber = `BILL${String(lastNumber + 1).padStart(3, '0')}`;
  }
  return nextBillNumber;
};

// @desc    Create a new bill
// @route   POST /api/billing
// @access  Private/Employee, Admin
const createBill = async (req, res) => {
  const { customerName, customerMobile, items, discount } = req.body;

  try {
    const billNumber = await generateBillNumber();
    let totalPrice = 0;
    let gstAmount = 0;
    const updatedItems = [];

    for (const billItem of items) {
      const activeItem = await ActiveItem.findById(billItem.item);

      if (!activeItem) {
        return res.status(404).json({ message: `Item with ID ${billItem.item} not found` });
      }

      if (activeItem.quantity < billItem.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${activeItem.name}. Available: ${activeItem.quantity}` });
      }

      const itemTotal = activeItem.price * billItem.quantity;
      let itemGst = 0;
      if (activeItem.isTaxable) {
        // Assuming 18% GST for taxable items for example
        itemGst = itemTotal * 0.18;
      }

      totalPrice += itemTotal;
      gstAmount += itemGst;

      // Reduce active item quantity
      activeItem.quantity -= billItem.quantity;
      await activeItem.save();

      if (activeItem.quantity === 0) {
        await ActiveItem.findByIdAndDelete(activeItem._id);
        console.log(`Active item ${activeItem.name} removed from inventory as quantity reached 0.`);
      }

      updatedItems.push({
        item: activeItem._id,
        name: activeItem.name,
        price: activeItem.price,
        quantity: billItem.quantity,
        total: itemTotal,
      });
    }

    let finalPrice = totalPrice - discount + gstAmount;
    if (finalPrice < 0) finalPrice = 0; // Ensure final price is not negative

    const sale = await Sale.create({
      billNumber,
      customerName,
      customerMobile,
      items: updatedItems,
      totalPrice,
      discount,
      gstAmount,
      finalPrice,
      employee: req.user._id, // Assuming req.user is set by auth middleware
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not create bill' });
  }
};

// @desc    Get all bills
// @route   GET /api/billing
// @access  Private/Admin, Employee
const getBills = async (req, res) => {
  try {
    const bills = await Sale.find({}).populate('employee', 'username').populate('items.item', 'name uniqueCode');
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not retrieve bills' });
  }
};

// @desc    Get single bill by ID
// @route   GET /api/billing/:id
// @access  Private/Admin, Employee
const getBillById = async (req, res) => {
  try {
    const bill = await Sale.findById(req.params.id).populate('employee', 'username').populate('items.item', 'name uniqueCode');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error: Could not retrieve bill' });
  }
};

module.exports = { createBill, getBills, getBillById };
