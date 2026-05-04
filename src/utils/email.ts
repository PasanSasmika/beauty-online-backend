import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const user = process.env.SMTP_EMAIL;
const pass = process.env.SMTP_PASSWORD;

if (!user || !pass) {
  console.error("❌ FATAL: SMTP credentials missing in .env");
}

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: { user, pass }
});

transporter.verify((error) => {
  if (error) console.error('❌ SMTP Connection Failed:', error.message);
  else console.log('✅ Connected to Hostinger SMTP Successfully');
});

// ← attachments param added
export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  attachments?: { filename: string; path: string }[]
) => {
  try {
    const info = await transporter.sendMail({
      from: `"Skincares Support" <${user}>`,
      to,
      subject,
      text,
      attachments: attachments || []
    });
    console.log("✅ Email sent: %s", info.messageId);
    return true;
  } catch (error: any) {
    console.error("❌ Send Failed:", error.message);
    return false;
  }
};