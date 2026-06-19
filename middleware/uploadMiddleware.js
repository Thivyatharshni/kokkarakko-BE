import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const qrDir = path.join(__dirname, '../uploads/qr');
const menuDir = path.join(__dirname, '../uploads/menu');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir);
if (!fs.existsSync(menuDir)) fs.mkdirSync(menuDir);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Determine destination based on fieldname or route
    if (file.fieldname === 'qrImage') {
      cb(null, 'uploads/qr/');
    } else {
      cb(null, 'uploads/menu/');
    }
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'));
  }
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

export default upload;
