import { Request, Response } from 'express';
import path from 'path';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/email.js';

// Statuses where stock has already been deducted
const DEDUCTED_STATUSES = ['processing', 'shipped', 'delivered'];

// Statuses that restore stock (only if previously deducted)
const RESTORE_STATUSES   = ['cancelled', 'returned'];

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

    // ── Send product documents via email ──────────────────────────────
    if (customer?.email && items?.length > 0) {
      try {
        const uniqueProductIds: string[] = [
          ...new Set(
            (items as any[])
              .map((item) => item.product_id as string)
              .filter(Boolean)
          )
        ];

        const products = await Promise.all(
          uniqueProductIds.map((pid: string) => Product.findById(pid))
        );

        const attachments = products
          .filter((p) => p && p.document)
          .map((p) => ({
            filename: `${p!.name.replace(/[^a-zA-Z0-9]/g, '_')}_Guide.pdf`,
            path: path.join(process.cwd(), p!.document!)
          }));

        if (attachments.length > 0) {
          const shortId = newOrder.id.slice(-8).toUpperCase();
         const trackUrl = `${process.env.FRONTEND_URL}/track-order?orderId=${shortId}`;

          const plainText = `Hi ${customer.firstName},\n\nThank you for your order! Please find the product guide(s) attached for the item(s) you purchased.\n\nOrder ID: ${shortId}\nTrack your order: ${trackUrl}\n\nIf you have any questions, visit skincares.lk/contact\n\n— Skincares.lk`;

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3EF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EF;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">

          <!-- LOGO HEADER -->
          <tr>
            <td align="center" style="padding-bottom:28px">
              <img src="${process.env.FRONTEND_URL}/logo.png"
                   alt="Skincares.lk" height="48"
                   style="height:48px;object-fit:contain;display:block" />
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

              <!-- TOP ACCENT BAR -->
              <div style="height:5px;background:linear-gradient(90deg,#2D241E 0%,#ee3f5c 100%)"></div>

              <!-- BODY PADDING -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 40px 32px">

                <!-- CHECK ICON -->
                <tr>
                  <td align="center" style="padding-bottom:20px">
                    <div style="width:64px;height:64px;background:#F0FDF4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:64px">
                      <span style="font-size:30px;line-height:64px">✅</span>
                    </div>
                  </td>
                </tr>

                <!-- HEADLINE -->
                <tr>
                  <td align="center" style="padding-bottom:8px">
                    <h1 style="margin:0;font-size:26px;font-weight:800;color:#1C1917;letter-spacing:-0.5px">
                      Thank You, ${customer.firstName}!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:32px">
                    <p style="margin:0;font-size:15px;color:#78716c;line-height:1.6">
                      Your order has been confirmed and your product<br>guide(s) are attached to this email.
                    </p>
                  </td>
                </tr>

                <!-- ORDER ID PILL -->
                <tr>
                  <td align="center" style="padding-bottom:32px">
                    <div style="background:#FAF9F6;border:1.5px solid #E7E5E4;border-radius:16px;padding:20px 32px;display:inline-block">
                      <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#a8a29e;text-transform:uppercase;letter-spacing:0.12em">Order ID</p>
                      <p style="margin:0;font-size:28px;font-weight:800;font-family:monospace;color:#1C1917;letter-spacing:0.15em">${shortId}</p>
                    </div>
                  </td>
                </tr>

                <!-- DIVIDER -->
                <tr>
                  <td style="padding-bottom:28px">
                    <div style="height:1px;background:#F5F5F4"></div>
                  </td>
                </tr>

                <!-- WHAT HAPPENS NEXT -->
                <tr>
                  <td style="padding-bottom:28px">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#a8a29e;text-transform:uppercase;letter-spacing:0.12em">What happens next</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${[
                        ['📦', "We'll carefully prepare and pack your items"],
                        ['🚚', 'Your order will be dispatched for delivery'],
                        ['💵', 'Pay cash to the delivery rider upon arrival'],
                      ].map(([icon, text]) => `
                      <tr>
                        <td style="padding-bottom:12px">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="width:36px;height:36px;background:#FAF9F6;border-radius:10px;text-align:center;vertical-align:middle;font-size:16px">${icon}</td>
                              <td style="padding-left:12px;font-size:14px;color:#44403c;vertical-align:middle">${text}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>`).join('')}
                    </table>
                  </td>
                </tr>

                <!-- TRACK BUTTON -->
                <tr>
                  <td align="center" style="padding-bottom:8px">
                    <a href="${trackUrl}"
                       style="display:inline-block;background:#1C1917;color:#ffffff;text-decoration:none;
                              padding:16px 40px;border-radius:12px;font-size:15px;font-weight:700;
                              letter-spacing:0.02em">
                      Track My Order &rarr;
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:28px 0 8px">
              <p style="margin:0 0 6px;font-size:13px;color:#a8a29e">
                Questions? <a href="${process.env.FRONTEND_URL}/contact" style="color:#ee3f5c;text-decoration:none;font-weight:600">Contact us</a>
              </p>
              <p style="margin:0;font-size:12px;color:#c4bfbc">
                &copy; ${new Date().getFullYear()} Skincares.lk &nbsp;&middot;&nbsp; Sri Lanka's Premium Skincare
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

          await sendEmail(
            customer.email,
            `Your Product Guide(s) — Order #${shortId}`,
            plainText,
            attachments,
            emailHtml
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
    const { status: newStatus } = req.body;

    // Fetch full order so we have previous status + items
    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const prevStatus = order.order_status;

    // ── Stock adjustment logic ────────────────────────────────────────
    const wasDeducted = DEDUCTED_STATUSES.includes(prevStatus);
    const willDeduct  = DEDUCTED_STATUSES.includes(newStatus);
    const willRestore = RESTORE_STATUSES.includes(newStatus);

    if (!wasDeducted && willDeduct) {
      // pending → processing: DECREASE stock for each ordered item
      console.log(`📦 Deducting stock for order ${id}`);
      for (const item of order.items as any[]) {
        await Product.updateOne(
          { _id: item.product_id, 'variants.size': item.size },
          { $inc: { 'variants.$.quantity': -item.quantity } }
        );
      }
    } else if (wasDeducted && willRestore) {
      // processing/shipped → cancelled/returned: RESTORE stock
      console.log(`🔄 Restoring stock for order ${id}`);
      for (const item of order.items as any[]) {
        await Product.updateOne(
          { _id: item.product_id, 'variants.size': item.size },
          { $inc: { 'variants.$.quantity': item.quantity } }
        );
      }
    }
    // All other transitions (e.g. processing→shipped, pending→cancelled)
    // don't touch stock at all
    // ─────────────────────────────────────────────────────────────────

    order.order_status = newStatus;
    await order.save();

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