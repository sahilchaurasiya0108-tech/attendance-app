const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../config/database');
const User = require('../models/User');

const seed = async () => {
  await connectDB();

  try {
    // Check if admin exists
    const existing = await User.findOne({ email: 'admin@company.com' });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@company.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Management',
    });

    const emp = await User.create({
      name: 'Demo Employee',
      email: 'employee@company.com',
      password: 'Employee@123',
      role: 'employee',
      department: 'Engineering',
    });

    console.log('✅ Seed complete');
    console.log('Admin:', admin.email, '| Password: Admin@123');
    console.log('Employee:', emp.email, '| Password: Employee@123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
