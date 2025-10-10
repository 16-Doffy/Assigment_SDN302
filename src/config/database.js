const mongoose = require('mongoose');

let connected = false;

async function connectToDatabase() {
  if (connected) return mongoose.connection;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/PE_SDN302_TrialTest_StudentCodeDB';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  connected = true;
  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = { connectToDatabase };


