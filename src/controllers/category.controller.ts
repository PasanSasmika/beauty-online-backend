import { Request, Response } from 'express';
import Category from '../models/Category.js';

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // Sort by name ascending
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const addCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    // Check duplicate
    const exists = await Category.findOne({ name });
    if (exists) {
      res.status(400).json({ error: 'Category already exists' });
      return;
    }

    await Category.create({ name });
    res.status(201).json({ message: 'Category added' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add category' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};