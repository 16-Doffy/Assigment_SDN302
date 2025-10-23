require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('../src/models/Member');
const Product = require('../src/models/Product');
const Brand = require('../src/models/Brand');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/PE_SDN302_TrialTest_StudentCodeDB';

async function run() {
  await mongoose.connect(uri, {});

  // tạo admin nếu chưa có
  const usersToEnsure = [
    { username: 'admin', password: '123456', role: 'admin', fullname: 'Administrator', birthYear: 1990 },
    { username: 'user1', password: 'User@123', role: 'user', fullname: 'Nguyen Van A', birthYear: 1995 },
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

  // tạo sample brands nếu chưa có
  const brandsToEnsure = [
    { name: 'Dior', description: 'French luxury fashion house' },
    { name: 'Chanel', description: 'French luxury fashion house' },
    { name: 'Tom Ford', description: 'American luxury fashion brand' },
    { name: 'Yves Saint Laurent', description: 'French luxury fashion house' },
    { name: 'Versace', description: 'Italian luxury fashion house' }
  ];

  for (const b of brandsToEnsure) {
    let brand = await Brand.findOne({ name: b.name });
    if (!brand) {
      brand = new Brand(b);
      await brand.save();
      console.log('Created brand:', b.name);
    } else {
      console.log('Brand exists:', b.name);
    }
  }

  // tạo sample product nếu chưa có (gán cho admin)
  const admin = await Member.findOne({ username: 'admin' });
  const count = await Product.countDocuments();
  if (count === 0 && admin) {
    const diorBrand = await Brand.findOne({ name: 'Dior' });
    const chanelBrand = await Brand.findOne({ name: 'Chanel' });
    
    const productsToCreate = [
      { 
        name: 'Dior Sauvage', 
        price: 110, 
        description: 'Fresh spicy with ambroxan',
        brand: diorBrand ? diorBrand._id : 'Dior',
        category: 'Fresh',
        targetAudience: 'Nam',
        extrait: 'PARFUM',
        stock: 10,
        imageUrl: '/img/dior-sauvage.jpg'
      },
      { 
        name: 'Chanel No. 5', 
        price: 150, 
        description: 'Classic floral aldehyde',
        brand: chanelBrand ? chanelBrand._id : 'Chanel',
        category: 'Floral',
        targetAudience: 'Nữ',
        extrait: 'EDP',
        stock: 5,
        imageUrl: '/img/chanel-no5.jpg'
      }
    ];

    for (const productData of productsToCreate) {
      const p = new Product({ ...productData, createdBy: admin._id });
      await p.save();
      console.log('Created product:', productData.name);
    }
  }

  await mongoose.disconnect();
  console.log('Seed finished');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});


