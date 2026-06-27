import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Category from '../models/Category.js';
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
    await Category.deleteMany();
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

    // 3. Create Categories
    const chickenCategory = await Category.create({
      shopId: createdShop._id,
      name: 'Chicken',
      description: 'All items under Chicken',
    });

    const combosCategory = await Category.create({
      shopId: createdShop._id,
      name: 'Combos',
      description: 'All items under Combos',
    });

    const snacksCategory = await Category.create({
      shopId: createdShop._id,
      name: 'Snacks',
      description: 'All items under Snacks',
    });

    console.log('Categories Seeded...');

    const categoryMap = {
      'Chicken': chickenCategory._id,
      'Combos': combosCategory._id,
      'Snacks': snacksCategory._id,
    };

    // 4. Create Menu Items
    const menuImages = {
      'Chicken Leg': '/uploads/chicken-leg.png',
      'Chicken Wings': '/uploads/chicken-wings.jpg',
      'Chicken Strips': '/uploads/chicken-strips.jpg',
      'Popcorn Chicken': '/uploads/popcorn-chicken.jpg',
      'Spicy Chicken Bites': '/uploads/spicy-chicken-bites.jpg',
      'Chicken Lollipop': '/uploads/chicken-lollipop.jpg',
      'Hot Wings Combo': '/uploads/hot-wings-combo.svg',
      'Bucket Meal': '/uploads/bucket-meal.svg'
    };

    const menuItems = [
      { name: 'Chicken Leg', description: 'Crispy fried chicken leg piece.', category: 'Chicken', price: 150, available: true, featured: false },
      { name: 'Chicken Wings', description: 'Spicy and crispy chicken wings.', category: 'Chicken', price: 200, available: true, featured: true },
      { name: 'Chicken Strips', description: 'Boneless chicken strips.', category: 'Snacks', price: 180, available: true, featured: false },
      { name: 'Popcorn Chicken', description: 'Bite-sized fried chicken.', category: 'Snacks', price: 160, available: true, featured: false },
      { name: 'Spicy Chicken Bites', description: 'Extra spicy chicken bites.', category: 'Snacks', price: 170, available: true, featured: false },
      { name: 'Chicken Lollipop', description: 'Juicy chicken lollipops.', category: 'Chicken', price: 220, available: true, featured: true },
      { name: 'Hot Wings Combo', description: 'Wings with fries and dip.', category: 'Combos', price: 300, available: true, featured: true },
      { name: 'Bucket Meal', description: 'Family bucket of mixed chicken.', category: 'Combos', price: 800, available: true, featured: true },
    ].map(item => ({
      ...item,
      shopId: createdShop._id,
      category: categoryMap[item.category],
      image: menuImages[item.name] || '',
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
