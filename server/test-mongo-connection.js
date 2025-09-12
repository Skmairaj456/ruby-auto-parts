const mongoose = require('mongoose');

async function testMongoConnection() {
  console.log('🔍 Testing MongoDB connections...');
  
  const connections = [
    'mongodb://localhost:27017/ruby_auto_parts',
    'mongodb://127.0.0.1:27017/ruby_auto_parts',
    'mongodb://localhost:27017/ruby-auto-parts'
  ];
  
  for (const uri of connections) {
    try {
      console.log(`\n🔄 Trying: ${uri}`);
      await mongoose.connect(uri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000
      });
      console.log('✅ SUCCESS! Connected to MongoDB');
      console.log('📊 Database name:', mongoose.connection.name);
      console.log('🔗 Connection state:', mongoose.connection.readyState);
      
      // Test a simple operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📁 Collections:', collections.map(c => c.name));
      
      await mongoose.disconnect();
      console.log('🔌 Disconnected successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed:', error.message);
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
    }
  }
  
  console.log('\n❌ No MongoDB connection worked');
  console.log('\n💡 Solutions:');
  console.log('1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
  console.log('2. Use MongoDB Atlas: https://cloud.mongodb.com/');
  console.log('3. Use MongoDB Compass: https://www.mongodb.com/products/compass');
  
  return false;
}

testMongoConnection();
