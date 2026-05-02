import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getSettings,
  updateSettings,
  addBanner,
  toggleBanner,
  deleteBanner,
} from '../controllers/setting.controller.js';

const Settingrouter = express.Router();

// ─── Multer config for banner images ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid = allowed.test(path.extname(file.originalname).toLowerCase());
    valid ? cb(null, true) : cb(new Error('Only images are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ─── Existing routes ─────────────────────────────────────────────────────────
Settingrouter.get('/', getSettings);
Settingrouter.put('/', updateSettings);

// ─── Banner routes ────────────────────────────────────────────────────────────
Settingrouter.post('/banners', upload.single('image'), addBanner);
Settingrouter.patch('/banners/:bannerId/toggle', toggleBanner);
Settingrouter.delete('/banners/:bannerId', deleteBanner);

export default Settingrouter;