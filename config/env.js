import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

const requiredEnvVars = [
  'PORT',
  'JWT_SECRET',
  'CLIENT_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const hasMongo = process.env.MONGO_URI || process.env.MONGODB_URI;

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (!hasMongo) {
  missing.push('MONGO_URI / MONGODB_URI');
}

if (missing.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '==================================================');
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: MISSING REQUIRED ENVIRONMENT VARIABLES');
  console.error('\x1b[31m%s\x1b[0m', '==================================================');
  missing.forEach((variable) => {
    console.error('\x1b[31m%s\x1b[0m', ` - ${variable}`);
  });
  console.error('\x1b[31m%s\x1b[0m', '==================================================');
  process.exit(1);
}

console.log('Environment variables validated successfully.');
