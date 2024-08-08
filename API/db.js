// db.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Change as per your MongoDB URI
const dbName = 'studentDB';
let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
  }
};

const getDB = () => db;

module.exports = { connectDB, getDB };
