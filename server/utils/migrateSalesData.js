const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const ActiveItem = require('../models/ActiveItem');
require('dotenv').config();

const migrateSalesData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ruby-auto-parts');
    console.log('📦 Connected to MongoDB for migration...');

    // Find all sales that don't have itemName in their itemsSold
    const salesWithoutItemNames = await Sale.find({
      'itemsSold.itemName': { $exists: false }
    }).populate('itemsSold.item');

    console.log(`🔍 Found ${salesWithoutItemNames.length} sales without item names`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const sale of salesWithoutItemNames) {
      let saleUpdated = false;
      
      for (let i = 0; i < sale.itemsSold.length; i++) {
        const itemSold = sale.itemsSold[i];
        
        // If itemName doesn't exist, try to add it
        if (!itemSold.itemName) {
          let itemName = 'Unknown Item';
          let itemBrand = '';
          let itemUniqueCode = '';
          
          // Try to get name from populated item
          if (itemSold.item && itemSold.item.name) {
            itemName = itemSold.item.name;
            itemBrand = itemSold.item.brand || '';
            itemUniqueCode = itemSold.item.uniqueCode || '';
          } else {
            // Try to find the item by ID in case population failed
            try {
              const activeItem = await ActiveItem.findById(itemSold.item);
              if (activeItem) {
                itemName = activeItem.name;
                itemBrand = activeItem.brand || '';
                itemUniqueCode = activeItem.uniqueCode || '';
              } else {
                // Item doesn't exist anymore, use a generic name with price info
                itemName = `Auto Part - ₹${itemSold.priceAtSale}`;
              }
            } catch (err) {
              itemName = `Auto Part - ₹${itemSold.priceAtSale}`;
            }
          }
          
          // Update the item in the sale
          sale.itemsSold[i].itemName = itemName;
          sale.itemsSold[i].itemBrand = itemBrand;
          sale.itemsSold[i].itemUniqueCode = itemUniqueCode;
          
          saleUpdated = true;
        }
      }
      
      if (saleUpdated) {
        await sale.save();
        updatedCount++;
        console.log(`✅ Updated sale ${sale._id}`);
      } else {
        unchangedCount++;
      }
    }

    console.log(`🎉 Migration completed!`);
    console.log(`   Updated: ${updatedCount} sales`);
    console.log(`   Unchanged: ${unchangedCount} sales`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateSalesData();
}

module.exports = migrateSalesData;
