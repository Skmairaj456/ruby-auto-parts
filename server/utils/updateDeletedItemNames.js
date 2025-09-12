const mongoose = require('mongoose');
const Sale = require('../models/Sale');
require('dotenv').config();

const updateDeletedItemNames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ruby-auto-parts');
    console.log('📦 Connected to MongoDB for updating deleted item names...');

    // Find all sales that have "Deleted Item" in their itemName
    const salesWithDeletedItems = await Sale.find({
      'itemsSold.itemName': { $regex: /^Deleted Item/, $options: 'i' }
    });

    console.log(`🔍 Found ${salesWithDeletedItems.length} sales with "Deleted Item" names`);

    let updatedCount = 0;

    for (const sale of salesWithDeletedItems) {
      let saleUpdated = false;
      
      for (let i = 0; i < sale.itemsSold.length; i++) {
        const itemSold = sale.itemsSold[i];
        
        // If itemName starts with "Deleted Item", update it
        if (itemSold.itemName && itemSold.itemName.startsWith('Deleted Item')) {
          // Extract the price from the old format and create new format
          const priceMatch = itemSold.itemName.match(/₹([\d.]+)/);
          const price = priceMatch ? priceMatch[1] : itemSold.priceAtSale;
          
          sale.itemsSold[i].itemName = `Auto Part - ₹${price}`;
          saleUpdated = true;
        }
      }
      
      if (saleUpdated) {
        await sale.save();
        updatedCount++;
        console.log(`✅ Updated sale ${sale._id}`);
      }
    }

    console.log(`🎉 Update completed!`);
    console.log(`   Updated: ${updatedCount} sales`);
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
};

// Run update if called directly
if (require.main === module) {
  updateDeletedItemNames();
}

module.exports = updateDeletedItemNames;
