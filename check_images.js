import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/Category.js';
import Menu from './models/Menu.js';

dotenv.config();

const check = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to database...');

    const categories = await Category.find({});
    const menuItems = await Menu.find({});

    console.log(`\nChecking ${categories.length} categories:`);
    let catIssues = 0;
    categories.forEach(cat => {
      const isLocal = cat.image && (cat.image.includes('/uploads') || cat.image.includes('localhost') || cat.image.includes('127.0.0.1'));
      if (isLocal) {
        console.error(`❌ Category "${cat.name}" has local image reference: ${cat.image}`);
        catIssues++;
      } else {
        console.log(`✅ Category "${cat.name}": ${cat.image || '(No Image)'}`);
      }
    });

    console.log(`\nChecking ${menuItems.length} menu items:`);
    let menuIssues = 0;
    menuItems.forEach(item => {
      const isLocal = item.image && (item.image.includes('/uploads') || item.image.includes('localhost') || item.image.includes('127.0.0.1'));
      if (isLocal) {
        console.error(`❌ Menu Item "${item.name}" has local image reference: ${item.image}`);
        menuIssues++;
      } else {
        console.log(`✅ Menu Item "${item.name}": ${item.image || '(No Image)'}`);
      }
    });

    console.log('\n=========================================');
    console.log(`Total issues found: ${catIssues + menuIssues}`);
    console.log('=========================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during verification:', error.message);
    process.exit(1);
  }
};

check();
