import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Category from '../models/Category.js';
import Menu from '../models/Menu.js';
import connectDB from '../config/db.js';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_ROOT = path.join(__dirname, '..');

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Starting migration...');

    // 1. Migrate Category Images
    const categories = await Category.find({});
    console.log(`Checking ${categories.length} categories...`);
    for (const cat of categories) {
      if (cat.image && (cat.image.startsWith('/uploads/') || cat.image.startsWith('uploads/'))) {
        const normalizedPath = cat.image.startsWith('/') ? cat.image : `/${cat.image}`;
        const localFilePath = path.join(SERVER_ROOT, normalizedPath);
        
        if (fs.existsSync(localFilePath)) {
          console.log(`Uploading local category image: ${localFilePath}`);
          try {
            const buffer = fs.readFileSync(localFilePath);
            const result = await uploadToCloudinary(buffer, 'categories');
            
            cat.image = result.secure_url;
            cat.cloudinaryPublicId = result.public_id;
            await cat.save();
            console.log(`Category "${cat.name}" updated with Cloudinary URL: ${result.secure_url}`);
          } catch (uploadError) {
            console.error(`Failed to upload image for category "${cat.name}":`, uploadError.message);
          }
        } else {
          console.log(`Local file not found for category "${cat.name}": ${localFilePath}`);
        }
      }
    }

    // 2. Migrate Menu Images
    const menuItems = await Menu.find({});
    console.log(`Checking ${menuItems.length} menu items...`);
    for (const item of menuItems) {
      if (item.image && (item.image.startsWith('/uploads/') || item.image.startsWith('uploads/'))) {
        const normalizedPath = item.image.startsWith('/') ? item.image : `/${item.image}`;
        const localFilePath = path.join(SERVER_ROOT, normalizedPath);
        
        if (fs.existsSync(localFilePath)) {
          console.log(`Uploading local menu image: ${localFilePath}`);
          try {
            const buffer = fs.readFileSync(localFilePath);
            const result = await uploadToCloudinary(buffer, 'menu');
            
            item.image = result.secure_url;
            item.cloudinaryPublicId = result.public_id;
            await item.save();
            console.log(`Menu item "${item.name}" updated with Cloudinary URL: ${result.secure_url}`);
          } catch (uploadError) {
            console.error(`Failed to upload image for menu item "${item.name}":`, uploadError.message);
          }
        } else {
          console.log(`Local file not found for menu item "${item.name}": ${localFilePath}`);
        }
      }
    }

    console.log('Migration Completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
