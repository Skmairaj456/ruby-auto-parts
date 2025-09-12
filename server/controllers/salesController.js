const Sale = require('../models/Sale');
const ActiveItem = require('../models/ActiveItem');
const User = require('../models/User'); // Assuming User model is needed for billedBy population
const OnHoldItem = require('../models/OnHoldItem'); // Import OnHoldItem model
const mongoose = require('mongoose');

// @desc    Record a new sale
// @route   POST /api/sales
// @access  Private (Employee/Admin)
const recordSale = async (req, res) => {
  const { customerName, customerContact, itemsSold, discount, discountAmount } = req.body;

  if (!itemsSold || itemsSold.length === 0) {
    return res.status(400).json({ message: 'No items provided for sale' });
  }

  let totalAmount = 0;
  let subTotal = 0; // Initialize subTotal
  let gstAmount = 0; // Initialize gstAmount
  const soldItemsDetails = [];

  try {
    for (const item of itemsSold) {
      const activeItem = await ActiveItem.findById(item.item);

      if (!activeItem) {
        return res.status(404).json({ message: `Item with ID ${item.item} not found` });
      }
      if (activeItem.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${activeItem.name}. Available: ${activeItem.quantity}` });
      }

      // Reduce quantity in active inventory
      activeItem.quantity -= item.quantity;
      if (activeItem.quantity <= 0) {
        await ActiveItem.deleteOne({ _id: activeItem._id });
      } else {
        await activeItem.save();
      }

      // Delete corresponding item from on-hold inventory
      await OnHoldItem.deleteMany({ item: activeItem._id });

      // Add to sold items details for sale record
      soldItemsDetails.push({
        item: activeItem._id,
        itemName: activeItem.name,
        itemBrand: activeItem.brand || '',
        itemUniqueCode: activeItem.uniqueCode || '',
        quantity: item.quantity,
        priceAtSale: activeItem.price, // Use current price from active inventory
      });

      subTotal += activeItem.price * item.quantity; // Calculate subTotal

      if (activeItem.isTaxable) {
        gstAmount += activeItem.price * item.quantity * 0.18; // Assuming 18% GST
      }
    }

    // Apply discount to the subTotal before calculating final total
    const totalAfterDiscount = subTotal - discountAmount;
    const finalTotal = totalAfterDiscount + gstAmount;

    // Generate custom bill ID with timestamp and unique code
    const timestamp = new Date();
    const date = timestamp.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const time = timestamp.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const billId = `BILL_${date}_${time}_${randomString}`;

    const sale = await Sale.create({
      customerName,
      customerContact,
      itemsSold: soldItemsDetails,
      discount,
      discountAmount,
      subTotal, // Include subTotal in the sale object
      gstAmount, // Include gstAmount in the sale object
      totalAmount: finalTotal, // Use the calculated finalTotal
      billedBy: req.user._id, // User ID from authenticated request
      billId: billId, // Add custom bill ID
    });

    // Populate the sale with item details before sending response
    const populatedSale = await Sale.findById(sale._id)
      .populate('billedBy', 'username role')
      .populate('itemsSold.item', 'name price brand');

    res.status(201).json(populatedSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private (Employee/Admin)
const getSales = async (req, res) => {
  try {
    const { date } = req.query;
    console.log('📅 Sales request:', { date });
    let query = {};

    if (date) {
      // For filtering by a specific day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.saleDate = { $gte: startOfDay, $lte: endOfDay };
      console.log('🔍 Date query:', { startOfDay, endOfDay });
    }

    console.log('🔍 Final query:', JSON.stringify(query, null, 2));

    const sales = await Sale.find(query)
      .populate('billedBy', 'username role')
      .populate('itemsSold.item', 'name price brand uniqueCode')
      .sort({ saleDate: -1 }); // Sort by sale date, newest first
    
    console.log('📊 Found sales:', sales.length);
    
    // Debug: Show all sales with their dates
    if (sales.length > 0) {
      console.log('📋 Sample sales with dates:');
      sales.slice(0, 3).forEach(sale => {
        console.log(`  - Sale ID: ${sale._id}, Date: ${sale.saleDate}, Bill ID: ${sale.billId}`);
      });
    }
    
    // Process sales to ensure item names are available
    const processedSales = sales.map(sale => {
      const processedItemsSold = sale.itemsSold.map(itemSold => {
        // If itemName doesn't exist, try to get it from populated item or create fallback
        if (!itemSold.itemName) {
          let itemName = 'Unknown Item';
          if (itemSold.item && itemSold.item.name) {
            itemName = itemSold.item.name;
          } else {
            // Create a meaningful fallback name with price
            itemName = `Auto Part - ₹${itemSold.priceAtSale}`;
          }
          return {
            ...itemSold.toObject(),
            itemName: itemName,
            itemBrand: itemSold.itemBrand || itemSold.item?.brand || '',
            itemUniqueCode: itemSold.itemUniqueCode || itemSold.item?.uniqueCode || ''
          };
        }
        return itemSold;
      });
      
      return {
        ...sale.toObject(),
        itemsSold: processedItemsSold
      };
    });
    
    res.status(200).json(processedSales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single sale by ID
// @route   GET /api/sales/:id
// @access  Private (Employee/Admin)
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('billedBy', 'username role')
      .populate('itemsSold.item', 'name price brand uniqueCode');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get sales analytics (Daily, Monthly, Total, Filtered)
// @route   GET /api/sales/analytics
// @access  Private (Admin)
const getSalesAnalytics = async (req, res) => {
  try {
    const { year, month } = req.query;
    console.log('📊 Analytics request:', { year, month });
    
    let matchConditions = {};

    if (year) {
      matchConditions.$expr = {
        $eq: [{ $year: '$saleDate' }, parseInt(year)],
      };
    }
    if (month) {
      matchConditions.$expr = {
        ...matchConditions.$expr,
        $eq: [{ $month: '$saleDate' }, parseInt(month)],
      };
    }

    console.log('🔍 Match conditions:', JSON.stringify(matchConditions, null, 2));

    // First get total sales and bills
    const salesAnalytics = await Sale.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 },
        },
      },
    ]);

    console.log('💰 Sales analytics result:', salesAnalytics);

    // Then get total items sold
    const itemsAnalytics = await Sale.aggregate([
      { $match: matchConditions },
      { $unwind: '$itemsSold' },
      {
        $group: {
          _id: null,
          totalItemsSold: { $sum: '$itemsSold.quantity' },
        },
      },
    ]);

    console.log('📦 Items analytics result:', itemsAnalytics);

    const analytics = [{
      totalSales: salesAnalytics[0]?.totalSales || 0,
      totalBills: salesAnalytics[0]?.totalBills || 0,
      totalItemsSold: itemsAnalytics[0]?.totalItemsSold || 0,
    }];

    console.log('📈 Final analytics:', analytics[0]);

    res.status(200).json(analytics[0] || { totalSales: 0, totalItemsSold: 0, totalBills: 0 });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get low stock alerts
// @route   GET /api/sales/lowstock
// @access  Private (Admin)
const getLowStockAlerts = async (req, res) => {
  try {
    console.log('🔍 Fetching low stock alerts...');
    
    // Check if ActiveItem model is available
    if (!ActiveItem) {
      console.error('❌ ActiveItem model not found');
      return res.status(500).json({ message: 'ActiveItem model not available' });
    }
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ Database not connected. State:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection not available' });
    }
    
    console.log('📊 Querying for items with quantity <= 5...');
    const lowStockItems = await ActiveItem.find({ quantity: { $lte: 5 } }); // Threshold of 5
    
    console.log(`✅ Found ${lowStockItems.length} low stock items`);
    res.status(200).json(lowStockItems);
  } catch (error) {
    console.error('❌ Error fetching low stock alerts:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server Error fetching low stock alerts',
      error: error.message 
    });
  }
};

// @desc    Get all sales (debug endpoint)
// @route   GET /api/sales/debug
// @access  Private (Admin)
const getAllSalesDebug = async (req, res) => {
  try {
    const sales = await Sale.find({})
      .populate('billedBy', 'username role')
      .sort({ saleDate: -1 })
      .limit(10);
    
    console.log('🔍 All sales (debug):', sales.length);
    sales.forEach(sale => {
      console.log(`  - ${sale.billId || sale._id}: ${sale.saleDate} - ${sale.customerName} - ₹${sale.totalAmount}`);
    });
    
    res.status(200).json(sales);
  } catch (error) {
    console.error('❌ Debug sales error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { recordSale, getSales, getSaleById, getSalesAnalytics, getLowStockAlerts, getAllSalesDebug };
