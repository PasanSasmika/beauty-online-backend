import { Request, Response } from 'express';
import Message from '../models/Message.js';
import { sendEmail } from '../utils/email.js';

// 1. Public: Send Message
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    await Message.create({ name, email, subject, message });
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// 2. Admin: Get All Messages
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {

    const messages = await Message.find().sort({ createdAt: -1 });
    

    res.json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error); // <--- DEBUG LOG 3
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// 3. Admin: Reply to Message
export const replyToMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    const msg = await Message.findById(id);
    if (!msg) {
        res.status(404).json({ error: 'Message not found' });
        return;
    }

    // --- NEW: Format the Email Body ---
    const emailBody = `Dear ${msg.name},

${replyText}

Best regards,
Skincares.lk Support Team

------------------------------------------------------
Original Message:
From: ${msg.name} (${msg.email})
Date: ${new Date(msg.createdAt as any).toLocaleString()}
Subject: ${msg.subject}

"${msg.message}"
------------------------------------------------------`;

    // Send Email with the formatted body
    const emailSent = await sendEmail(
      msg.email, 
      `Re: ${msg.subject} - Skincares.lk Support`, 
      emailBody
    );

    if (emailSent) {
      msg.status = 'replied';
      msg.adminReply = replyText; // We still save only the new reply in DB
      await msg.save();
      
      res.json({ message: 'Reply sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};