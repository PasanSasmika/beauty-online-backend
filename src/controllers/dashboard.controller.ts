import { Request, Response } from 'express';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Count Total Users
    const totalUsers = await User.countDocuments();

    // 2. Count Total Products
    const totalProducts = await Product.countDocuments();

    // 3. Count Total Orders
    const totalOrders = await Order.countDocuments();

    // 4. Calculate Revenue (Sum of total_amount for non-cancelled orders)
    const revenueAgg = await Order.aggregate([
      { 
        $match: { 
          order_status: { $ne: 'cancelled' } // Exclude cancelled orders
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: "$total_amount" } 
        } 
      }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // 5. Get Recent 5 Orders (For the overview table)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('id customer total_amount order_status createdAt');

    // 6. Get Order Status Counts (For a quick summary)
    const statusCounts = await Order.aggregate([
        { $group: { _id: "$order_status", count: { $sum: 1 } } }
    ]);

    res.json({
      stats: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        revenue: totalRevenue
      },
      recentOrders,
      statusCounts
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};