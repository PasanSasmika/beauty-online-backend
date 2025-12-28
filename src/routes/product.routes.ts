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

const upload = multer({ storage: storage });

Productrouter.post('/', upload.array('images', 5), addProduct);
Productrouter.get('/', getAllProducts);
Productrouter.get('/:id', getProductById);        
Productrouter.put('/:id', upload.array('images', 5), updateProduct);
Productrouter.delete('/:id', deleteProduct);

export default Productrouter;