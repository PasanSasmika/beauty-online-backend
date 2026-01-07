import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const user = process.env.SMTP_EMAIL;
const pass = process.env.SMTP_PASSWORD;

if (!pass) {
  console.error("❌ FATAL: SMTP_PASSWORD is missing in .env");
} else {
}

const transporter = nodemailer.createTransport({
  service: 'gmail', // Let Nodemailer handle the ports/security automatically
  auth: {
    user: user,
    pass: pass 
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error.message);
  } else {
    console.log('✅ SMTP Server Connected Successfully');
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
    return true;
  } catch (error: any) {
    console.error("❌ Send Failed:", error.message);
    return false;
  }
};