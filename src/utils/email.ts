import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const user = process.env.SMTP_EMAIL;
const pass = process.env.SMTP_PASSWORD;

// --- SAFETY CHECK ---
if (!user || !pass) {
  console.error("❌ FATAL: SMTP credentials missing in .env");
}

// 1. Create Transporter with HOSTINGER Settings
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com', // <--- Explicit Host
  port: 465,                  // <--- Explicit Port for SSL
  secure: true,               // <--- Must be true for port 465
  auth: {
    user: user,
    pass: pass 
  }
});

// 2. Verify Connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error.message);
  } else {
    console.log('✅ Connected to Hostinger SMTP Successfully');
  }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Skincares Support" <${user}>`,
      to,
      subject,
      text
    });
    console.log("✅ Email sent: %s", info.messageId);
    return true;
  } catch (error: any) {
    console.error("❌ Send Failed:", error.message);
    return false;
  }
};