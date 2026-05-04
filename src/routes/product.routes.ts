import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { addProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from '../controllers/product.controller.js';

const Productrouter = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'document' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed for documents'));
    }
    cb(null, true);
  }
});

// ← Switch from upload.array to upload.fields
const uploadFields = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'document', maxCount: 1 },
]);

Productrouter.post('/', uploadFields, addProduct);
Productrouter.get('/', getAllProducts);
Productrouter.get('/:id', getProductById);
Productrouter.put('/:id', uploadFields, updateProduct);
Productrouter.delete('/:id', deleteProduct);

export default Productrouter;