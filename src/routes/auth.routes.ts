import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';

const Authrouter = Router();

Authrouter.post('/signup', signup);

Authrouter.post('/login', login);

export default Authrouter;