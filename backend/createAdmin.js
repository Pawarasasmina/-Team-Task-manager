require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';

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
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('Email: admin@example.com');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin
    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com',
      contactNumber: '1234567890',
      password: hashedPassword,
      role: 'admin',
      isPasswordChanged: true
    });

    await admin.save();
    
    console.log('\n✅ Admin account created successfully!');
    console.log('═══════════════════════════════════');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('═══════════════════════════════════');
    console.log('\n⚠️  Please change the password after first login!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
