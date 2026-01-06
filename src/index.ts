import dotenv from 'dotenv';
import connectDB from './config/db.js'; // Import the new Mongoose connector
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
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database. Server not started.', error);
    process.exit(1);
  }
};

startServer();