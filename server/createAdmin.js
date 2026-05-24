require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const run = async () => {
  await connectDB();
  const email = 'admin@example.com';
  const password = 'admin123';
  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    await user.save();
    console.log('Updated existing user to admin:', email);
  } else {
    user = await User.create({ name: 'Admin', email, password, role: 'admin' });
    console.log('Created admin user:', email);
  }
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
