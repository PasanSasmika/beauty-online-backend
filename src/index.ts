import dotenv from 'dotenv';
import pool from './config/db.js';
import app from './app.js';
import fs from 'fs';  
import path from 'path';
dotenv.config();

const PORT = process.env.PORT || 5000;


const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('📂 Created "uploads" folder');
}

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected Successfully!');
    connection.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database. Server not started.', error);
    process.exit(1);
  }
};

startServer();