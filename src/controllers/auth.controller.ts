import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. SIGNUP LOGIC
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, password } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (existingUsers.length > 0) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert User (user_type defaults to 'customer' in DB)
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [full_name, email, hashedPassword]
    );

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: result.insertId 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

// 2. LOGIN LOGIC
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find User
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (users.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = users[0];

    // Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.user_type },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Send Response (Hide password)
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.user_type
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
};