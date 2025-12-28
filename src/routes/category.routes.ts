import { Router } from 'express';
import { getAllCategories, addCategory, deleteCategory } from '../controllers/category.controller.js';

const Categoryrouter = Router();

Categoryrouter.get('/', getAllCategories);
Categoryrouter.post('/', addCategory);
Categoryrouter.delete('/:id', deleteCategory);

export default Categoryrouter;