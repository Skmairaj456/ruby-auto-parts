const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testLogin() {
  try {
    console.log('🔍 Testing login system...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruby-auto-parts');
    console.log('✅ Connected to MongoDB');
    
    // Check if users exist
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('❌ No users found! Running seed script...');
      const seed = require('./utils/seed');
      await seed();
    }
    
    // List all users
    const users = await User.find({}, 'username role isApproved');
    console.log('👥 All users:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - Approved: ${user.isApproved}`);
    });
    
    // Test login with known credentials
    const testCredentials = [
      { username: 'admin@test.com', password: 'password123' },
      { username: 'employee@test.com', password: 'password123' },
      { username: 'admin1@example.com', password: 'password123' },
      { username: 'employee1@example.com', password: 'password123' }
    ];
    
    console.log('\n🧪 Testing login credentials...');
    for (const cred of testCredentials) {
      const user = await User.findOne({ username: cred.username });
      if (user) {
        const passwordMatch = await user.matchPassword(cred.password);
        console.log(`✅ ${cred.username}: ${passwordMatch ? 'PASSWORD MATCH' : 'PASSWORD MISMATCH'} (Approved: ${user.isApproved})`);
      } else {
        console.log(`❌ ${cred.username}: USER NOT FOUND`);
      }
    }
    
    console.log('\n🎯 Recommended login credentials:');
    console.log('Username: admin@test.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testLogin();
