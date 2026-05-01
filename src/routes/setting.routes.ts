import express from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller.js';

const Settingrouter = express.Router();

Settingrouter.get('/', getSettings);
Settingrouter.put('/', updateSettings); // Add your admin auth middleware here if you have one! (e.g., router.put('/', verifyAdmin, updateSettings); )

export default Settingrouter;