import { Router } from 'express';
import { createOrder, getAllOrders, updateOrderStatus, deleteOrder, getUserOrders, trackOrder } from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const Orderrouter = Router();
Orderrouter.post('/', createOrder);
Orderrouter.get('/track', trackOrder);              // ✅ Static routes FIRST
Orderrouter.get('/my-orders', protect, getUserOrders); // ✅ Static routes FIRST
Orderrouter.get('/', getAllOrders);
Orderrouter.put('/:id/status', updateOrderStatus);  // /:id params LAST
Orderrouter.delete('/:id', deleteOrder);

export default Orderrouter;