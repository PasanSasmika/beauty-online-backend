import { Request, Response } from 'express';
import path from 'path';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js'; // ← adjust path if different

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

    // ── Send product documents via email ─────────────────────────────
    if (customer?.email && items?.length > 0) {
      try {
        // Get unique product IDs (1 doc per unique product, regardless of qty)
        const uniqueProductIds: string[] = [
          ...new Set(
            (items as any[])
              .map((item) => item.product_id as string)
              .filter(Boolean)
          )
        ];

        // Fetch all products in parallel
        const products = await Promise.all(
          uniqueProductIds.map((pid: string) => Product.findById(pid))
        );

        // Collect valid document attachments
        const attachments = products
          .filter((p) => p && p.document)
          .map((p) => ({
            filename: `${p!.name.replace(/[^a-zA-Z0-9]/g, '_')}_Guide.pdf`,
            path: path.join(process.cwd(), p!.document!)
          }));

        if (attachments.length > 0) {
          const shortId = newOrder.id.slice(-8).toUpperCase();
          await sendEmail(
            customer.email,
            `Your Product Guide(s) — Order #${shortId}`,
            `Hi ${customer.firstName},\n\nThank you for your order! Please find the product guide(s) attached for the item(s) you purchased.\n\nOrder ID: ${shortId}\n\nIf you have any questions, visit skincares.lk/contact\n\n— Skincares.lk`,
            attachments
          );
          console.log(`✅ Sent ${attachments.length} document(s) to ${customer.email}`);
        }
      } catch (emailError) {
        console.error('⚠️ Document email failed (order still placed):', emailError);
      }
    }
    // ─────────────────────────────────────────────────────────────────

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

export const trackOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.query as { orderId: string };

    if (!orderId || orderId.trim().length < 4) {
      res.status(400).json({ error: 'Please provide a valid Order ID' });
      return;
    }

    const all = await Order.find({});
    const match = all.find(o =>
      o.id.toUpperCase().endsWith(orderId.trim().toUpperCase())
    );

    if (!match) {
      res.status(404).json({ error: 'No order found with that ID' });
      return;
    }

    res.json(match);
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
};