const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActiveItem = require('../models/ActiveItem');
const { generateBarcodeAndUpload } = require('./barcodeAndUpload');

module.exports = async function seed() {
  try {
    console.log('🌱 Starting user seeding...');
    
    // Clear existing users first to ensure clean state
    await User.deleteMany({});
    console.log('🧹 Cleared existing users');
    
    // Create guaranteed working test users
    const testUsers = [
      {
        username: process.env.ADMIN1_USERNAME,
        password: process.env.ADMIN1_PASSWORD,
        role: 'admin',
        isApproved: true
      },
      {
        username: process.env.EMPLOYEE1_USERNAME,
        password: process.env.EMPLOYEE1_PASSWORD,
        role: 'employee',
        isApproved: true
      },
      {
        username: process.env.ADMIN2_USERNAME,
        password: process.env.ADMIN2_PASSWORD,
        role: 'admin',
        isApproved: true
      },
      {
        username: process.env.EMPLOYEE2_USERNAME,
        password: process.env.EMPLOYEE2_PASSWORD,
        role: 'employee',
        isApproved: true
      },
      {
        username: process.env.ADMIN3_USERNAME,
        password: process.env.ADMIN3_PASSWORD,
        role: 'admin',
        isApproved: true
      }
    ];

    console.log('📝 Creating test users...');

    for (const user of testUsers) {
      try {
        const newUser = await User.create(user);
        console.log('✅ Created user:', newUser.username, 'Role:', newUser.role, 'ID:', newUser._id);
      } catch (error) {
        console.error('❌ Error creating user:', user.username, error.message);
      }
    }
    
    // Verify users were created
    const userCount = await User.countDocuments();
    console.log('🎉 User seeding completed! Total users:', userCount);
    
    // List all users for verification
    const allUsers = await User.find({}, 'username role isApproved');
    console.log('📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - Approved: ${user.isApproved}`);
    });
    
    // Seed some sample ActiveItems for testing
    console.log('📦 Seeding sample ActiveItems...');
    await ActiveItem.deleteMany({}); // Clear existing items
    
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      const sampleItems = [
        {
          uniqueCode: 'TEST001_20241212_123456',
          name: 'Brake Pads - Front',
          price: 45.99,
          quantity: 2, // Low stock
          brand: 'AutoParts Pro',
          tags: ['brake', 'front', 'pads'],
          isTaxable: true,
          addedBy: adminUser._id,
          approvedBy: adminUser._id
        },
        {
          uniqueCode: 'TEST002_20241212_123457',
          name: 'Oil Filter',
          price: 12.50,
          quantity: 1, // Low stock
          brand: 'FilterMax',
          tags: ['oil', 'filter', 'maintenance'],
          isTaxable: true,
          addedBy: adminUser._id,
          approvedBy: adminUser._id
        },
        {
          uniqueCode: 'TEST003_20241212_123458',
          name: 'Air Filter',
          price: 18.75,
          quantity: 15, // Normal stock
          brand: 'AirFlow',
          tags: ['air', 'filter', 'engine'],
          isTaxable: true,
          addedBy: adminUser._id,
          approvedBy: adminUser._id
        },
        {
          uniqueCode: 'TEST004_20241212_123459',
          name: 'Spark Plugs (Set of 4)',
          price: 32.00,
          quantity: 3, // Low stock
          brand: 'SparkPro',
          tags: ['spark', 'plugs', 'ignition'],
          isTaxable: true,
          addedBy: adminUser._id,
          approvedBy: adminUser._id
        }
      ];
      
      for (const item of sampleItems) {
        try {
          // Generate barcode for the item (use only the last part of uniqueCode for barcode)
          const barcodeCode = item.uniqueCode.split('_').pop(); // Extract last part (e.g., OIDJRX from 20250912_002147_OIDJRX)
          const barcodeUrl = await generateBarcodeAndUpload(barcodeCode);
          const itemWithBarcode = { ...item, barcodeUrl };
          
          await ActiveItem.create(itemWithBarcode);
          console.log(`✅ Created ActiveItem: ${item.name} (Qty: ${item.quantity}) with barcode`);
        } catch (error) {
          console.error(`❌ Error creating ActiveItem ${item.name}:`, error.message);
        }
      }
      
      const activeItemCount = await ActiveItem.countDocuments();
      console.log(`🎉 ActiveItem seeding completed! Total items: ${activeItemCount}`);
    } else {
      console.log('⚠️ No admin user found, skipping ActiveItem seeding');
    }
    
  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
};

