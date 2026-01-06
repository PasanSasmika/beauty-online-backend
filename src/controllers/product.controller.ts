import { Request, Response } from 'express';
import Product from '../models/Product.js';

export const addProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, category, brand, country, is_koko_enabled, variants } = req.body;
    
    // Parse variants if they come as a JSON string (Multipart form data behavior)
    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    // Handle Images
    const files = req.files as Express.Multer.File[];
    const imagePaths = files ? files.map(file => `/uploads/${file.filename}`) : [];

    // Create Product with Embedded Variants
    const newProduct = await Product.create({
      name,
      description,
      category,
      brand,
      country: country || null,
      is_koko_enabled: is_koko_enabled === 'true' || is_koko_enabled === true,
      images: imagePaths,
      variants: parsedVariants
    });

    res.status(201).json({ message: 'Product added successfully', productId: newProduct.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add product' });
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query;

    // Build Query Filter
    const filter: any = {};

    if (search) {
      // Regex for case-insensitive LIKE query
      const regex = new RegExp(search as string, 'i');
      filter.$or = [{ name: regex }, { brand: regex }];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, description, category, brand, country, is_koko_enabled, variants 
    } = req.body;

    const files = req.files as Express.Multer.File[];

    // Prepare Update Object
    const updateData: any = {
      name, description, category, brand, country: country || null,
      is_koko_enabled: is_koko_enabled === 'true' || is_koko_enabled === true
    };

    // Only update images if new files exist
    if (files && files.length > 0) {
        const imagePaths = files.map(file => `/uploads/${file.filename}`);
        updateData.images = imagePaths;
    }

    // Update Variants if provided
    if (variants) {
       const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
       updateData.variants = parsedVariants;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};