import { Request, Response } from 'express';
import pool from '../config/db.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export const addProduct = async (req: Request, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); 

    const { name, description, category, brand, country, is_koko_enabled, variants } = req.body;
    
    const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;

    const files = req.files as Express.Multer.File[];
    const imagePaths = files ? files.map(file => `/uploads/${file.filename}`) : [];

    const [prodResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO products 
      (name, description, category, brand, country, is_koko_enabled, images) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description, 
        category, 
        brand, 
        country || null, 
        is_koko_enabled === 'true' ? 1 : 0,
        JSON.stringify(imagePaths)
      ]
    );

    const productId = prodResult.insertId;

    // parsedVariants shape: [{ size: '50ml', price: '3000', quantity: '10', original_price: '4000' }]
    if (parsedVariants && parsedVariants.length > 0) {
      const variantValues = parsedVariants.map((v: any) => [
        productId, 
        v.size, 
        v.price, 
        v.original_price || null, 
        v.quantity
      ]);

      await connection.query(
        `INSERT INTO product_variants (product_id, size, price, original_price, quantity) VALUES ?`,
        [variantValues]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Product added successfully', productId });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to add product' });
  } finally {
    connection.release();
  }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query;

    let query = `
      SELECT 
        p.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', v.id,
            'size', v.size,
            'price', v.price,
            'original_price', v.original_price,
            'quantity', v.quantity
          )
        ) as variants
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.brand LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
      conditions.push('p.category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};


export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        p.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'size', v.size,
            'price', v.price,
            'original_price', v.original_price,
            'quantity', v.quantity
          )
        ) as variants
      FROM products p
      LEFT JOIN product_variants v ON p.id = v.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    
    const [rows] = await pool.query(query, [req.params.id]);
    
    
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM products WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction(); 

    const { id } = req.params;
    const { 
      name, description, category, brand, country, is_koko_enabled, variants 
    } = req.body;

    const files = req.files as Express.Multer.File[];
    let imageUpdateSql = "";
    const queryParams = [
        name, description, category, brand, country || null, 
        is_koko_enabled === 'true' ? 1 : 0
    ];

    if (files && files.length > 0) {
        const imagePaths = files.map(file => `/uploads/${file.filename}`);
        imageUpdateSql = ", images = ?";
        queryParams.push(JSON.stringify(imagePaths));
    }

    queryParams.push(id); // ID for the WHERE clause

    // 2. Update Main Product Data
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE products SET 
       name=?, description=?, category=?, brand=?, country=?, is_koko_enabled=? 
       ${imageUpdateSql}
       WHERE id = ?`,
      queryParams
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // 3. Update Variants (Strategy: Delete All Old -> Insert All New)
    // This is safer and easier than trying to match IDs for update
    if (variants) {
       // Parse if sent as JSON string
       const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
       
       if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
          // A. Delete Old Variants
          await connection.query('DELETE FROM product_variants WHERE product_id = ?', [id]);

          // B. Prepare New Variants
          const variantValues = parsedVariants.map((v: any) => [
            id, 
            v.size, 
            v.price, 
            v.original_price || null, 
            v.quantity
          ]);

          // C. Insert New Variants
          await connection.query(
            `INSERT INTO product_variants (product_id, size, price, original_price, quantity) VALUES ?`,
            [variantValues]
          );
       }
    }

    await connection.commit(); // Save Changes
    res.json({ message: 'Product updated successfully' });

  } catch (error) {
    await connection.rollback(); // Undo if error
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  } finally {
    connection.release();
  }
};