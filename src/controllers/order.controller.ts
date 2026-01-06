import { Request, Response } from 'express';
import Order from '../models/Order.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer, items, total_amount, shipping_cost, payment_method, userId } = req.body;

    const newOrder = await Order.create({
      user_id: userId || null,
      customer,
      items,
      total_amount,
      shipping_cost: shipping_cost || 500,
      payment_method: payment_method || 'cod',
      payment_status: 'pending', 
      order_status: 'pending'
    });

    res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.id });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ error: 'Failed to place order' });
  }
};


export const getUserOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id; 

    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
       res.status(404).json({ error: 'User account not found' });
       return;
    }

    
    const orders = await Order.find({
      $or: [
        { user_id: userId },
        { 'customer.email': currentUser.email }
      ]
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch your orders' });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); 
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const order = await Order.findByIdAndUpdate(id, { order_status: status }, { new: true });
    
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};