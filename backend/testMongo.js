const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    console.log('✅ Connection successful!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.close();
  }
}

testConnection();
