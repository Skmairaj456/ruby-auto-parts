const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function debugLogin(username, password) {
  try {
    console.log(`🔍 Debugging login for: ${username}`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ruby-auto-parts');
    console.log('✅ Connected to MongoDB');
    
    // Check if user exists
    const user = await User.findOne({ username });
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found in database');
      console.log('📋 Available users:');
      const allUsers = await User.find({}, 'username role isApproved');
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role}) - Approved: ${u.isApproved}`);
      });
      return;
    }
    
    console.log('📋 User details:', {
      username: user.username,
      role: user.role,
      isApproved: user.isApproved,
      createdAt: user.createdAt
    });
    
    // Test password
    const passwordMatch = await user.matchPassword(password);
    console.log('🔑 Password match:', passwordMatch ? 'Yes' : 'No');
    
    if (!passwordMatch) {
      console.log('❌ Password is incorrect');
      console.log('💡 Try these working credentials:');
      console.log('  - admin@test.com / password123');
      console.log('  - employee@test.com / password123');
      return;
    }
    
    if (!user.isApproved) {
      console.log('❌ User account is not approved');
      return;
    }
    
    console.log('✅ Login should work! All checks passed.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node debug-login.js <username> <password>');
  console.log('Example: node debug-login.js admin@test.com password123');
  process.exit(1);
}

debugLogin(args[0], args[1]);
