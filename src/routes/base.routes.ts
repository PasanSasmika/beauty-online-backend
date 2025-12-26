import { Router, Request, Response } from 'express';
import pool from '../config/db.js';

const Baserouter = Router();

Baserouter.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Beauty Online API is running 🚀' });
});

Baserouter.get('/test-db', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ message: 'Database is working!', result: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

export default Baserouter;