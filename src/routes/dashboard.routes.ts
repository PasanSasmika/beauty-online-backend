import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const Dashboardrouter = Router();

Dashboardrouter.get('/stats', protect, getDashboardStats); 
export default Dashboardrouter;