import { Router } from 'express';
import { getMessages, replyToMessage, sendMessage } from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const Emailrouter = Router();

Emailrouter.post('/', sendMessage); 
Emailrouter.get('/', getMessages); 
Emailrouter.post('/:id/reply',protect, replyToMessage); 

export default Emailrouter;