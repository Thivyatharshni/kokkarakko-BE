import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Menu from '../models/Menu.js';
import Order from '../models/Order.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Order.deleteMany();
    await Menu.deleteMany();
    await Shop.deleteMany();
    await User.deleteMany();

    console.log('Data Cleared...');

    // 1. Create Owner User
    const createdUser = await User.create({
      name: 'Admin',
      email: 'admin@kokkarakko.com',
      password: 'Admin@123', // Will be hashed by pre-save hook
      role: 'owner',
    });

    console.log('User Seeded...');

    // 2. Create Shop
    const createdShop = await Shop.create({
      shopName: 'Kokkarakko Fried Chicken',
      slug: 'kokkarakko-fried-chicken',
      ownerId: createdUser._id,
      address: '123 Food Street',
      qrUrl: '/menu/kokkarakko-fried-chicken',
    });

    console.log('Shop Seeded...');

    // 3. Create Menu Items
    const menuItems = [
      { name: 'Chicken Leg', description: 'Crispy fried chicken leg piece.', category: 'Chicken', price: 150, available: true },
      { name: 'Chicken Wings', description: 'Spicy and crispy chicken wings.', category: 'Chicken', price: 200, available: true },
      { name: 'Chicken Strips', description: 'Boneless chicken strips.', category: 'Snacks', price: 180, available: true },
      { name: 'Popcorn Chicken', description: 'Bite-sized fried chicken.', category: 'Snacks', price: 160, available: true },
      { name: 'Spicy Chicken Bites', description: 'Extra spicy chicken bites.', category: 'Snacks', price: 170, available: true },
      { name: 'Chicken Lollipop', description: 'Juicy chicken lollipops.', category: 'Chicken', price: 220, available: true },
      { name: 'Hot Wings Combo', description: 'Wings with fries and dip.', category: 'Combos', price: 300, available: true },
      { name: 'Bucket Meal', description: 'Family bucket of mixed chicken.', category: 'Combos', price: 800, available: true },
    ].map(item => ({
      ...item,
      shopId: createdShop._id,
      image: '', // image placeholder
    }));

    await Menu.insertMany(menuItems);

    console.log('Menu Items Seeded...');

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
