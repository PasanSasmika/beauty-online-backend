import { Request, Response } from 'express';
import Product from '../models/Product.js';


const extractFiles = (req: Request) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const images = files?.['images'] ? files['images'].map(f => `/uploads/${f.filename}`) : [];
  const document = files?.['document']?.[0] ? `/uploads/${files['document'][0].filename}` : null;
  return { images, document };
};


export const addProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, howToUse, category, brand, country, is_koko_enabled, variants } = req.body;

    let parsedVariants = [];
    if (variants) {
      parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    const { images, document } = extractFiles(req); // ← NEW

    const newProduct = await Product.create({
      name,
      description,
      howToUse: howToUse || "",
      category,
      brand,
      country: country || null,
      is_koko_enabled: is_koko_enabled === 'true' || is_koko_enabled === true,
      images,
      document, // ← NEW
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
    const filter: any = {};

    if (search) {
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
    const { name, description, howToUse, category, brand, country, is_koko_enabled, variants } = req.body;

    const { images, document } = extractFiles(req); // ← NEW

    const updateData: any = {
      name, description, howToUse: howToUse || "", category, brand,
      country: country || null,
      is_koko_enabled: is_koko_enabled === 'true' || is_koko_enabled === true
    };

    if (images.length > 0) updateData.images = images;

    // Only overwrite document if a new one was uploaded
    if (document) updateData.document = document; // ← NEW

    if (variants) {
      updateData.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedProduct) { res.status(404).json({ error: 'Product not found' }); return; }

    res.json({ message: 'Product updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};