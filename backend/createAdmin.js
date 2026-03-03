require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_CONTACT_NUMBER = process.env.ADMIN_CONTACT_NUMBER || '1234567890';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  contactNumber: String,
  password: String,
  role: String,
  isPasswordChanged: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    if (!MONGODB_URI) {
      console.error('MONGODB_URI is required in environment variables.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log('Admin account already exists.');
      console.log(`Email: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const admin = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      contactNumber: ADMIN_CONTACT_NUMBER,
      password: hashedPassword,
      role: 'admin',
      isPasswordChanged: true
    });

    await admin.save();

    console.log('Admin account created successfully.');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('Please change the password after first login.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
