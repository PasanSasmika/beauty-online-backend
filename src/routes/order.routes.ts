import { Router } from 'express';
import { createOrder, getAllOrders, updateOrderStatus, deleteOrder, getUserOrders } from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const Orderrouter = Router();
Orderrouter.post('/', createOrder); 
Orderrouter.get('/', getAllOrders); 
Orderrouter.put('/:id/status', updateOrderStatus); 
Orderrouter.delete('/:id', deleteOrder); 
Orderrouter.get('/my-orders', protect, getUserOrders);
export default Orderrouter;