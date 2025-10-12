require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('../src/models/Member');
const Product = require('../src/models/Product');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/PE_SDN302_TrialTest_StudentCodeDB';

async function run() {
  await mongoose.connect(uri, {});

  // tạo admin nếu chưa có
  const usersToEnsure = [
    { username: 'admin', password: 'Admin@123', role: 'admin', fullname: 'Administrator', birthYear: 1990 },
    { username: 'member1', password: 'Member@123', role: 'member', fullname: 'Nguyen Van A', birthYear: 1995 },
    { username: 'guest1', password: 'Guest@123', role: 'guest', fullname: 'Guest User', birthYear: 2000 }
  ];

  for (const u of usersToEnsure) {
    let m = await Member.findOne({ username: u.username });
    if (!m) {
      const hash = bcrypt.hashSync(u.password, 10);
      m = new Member({ 
        username: u.username, 
        password: hash, 
        role: u.role,
        fullname: u.fullname,
        birthYear: u.birthYear
      });
      await m.save();
      console.log('Created user:', u.username, '/', u.password, 'role=', u.role);
    } else {
      console.log('User exists:', u.username, 'role=', m.role);
    }
  }

  // tạo sample product nếu chưa có (gán cho admin)
  const admin = await Member.findOne({ username: 'admin' });
  const count = await Product.countDocuments();
  if (count === 0 && admin) {
    const p = new Product({ name: 'Sample Product', price: 9.99, description: 'Sản phẩm mẫu', createdBy: admin._id });
    await p.save();
    console.log('Sample product created');
  }

  await mongoose.disconnect();
  console.log('Seed finished');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});


