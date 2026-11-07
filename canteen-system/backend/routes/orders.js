const router = require('express').Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { STATUSES } = require('../models/Order');
const Food = require('../models/Food');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const httpError = require('../middleware/httpError');

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// Unique, human-friendly order ID e.g. ORD-20261107-A3F9C1
const generateOrderId = async () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  for (let i = 0; i < 5; i++) {
    const id = `ORD-${stamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    if (!(await Order.exists({ orderId: id }))) return id;
  }
  throw httpError(500, 'Could not generate a unique order ID. Please try again.');
};

// POST /api/orders   body: { items: [{ foodId, quantity }], note }
router.post(
  '/',
  protect,
  studentOnly,
  asyncHandler(async (req, res) => {
    const { items, note } = req.body;
    if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'Your cart is empty.');
    if (items.length > 30) throw httpError(400, 'Too many different items in one order.');

    const merged = new Map(); // foodId -> quantity (merges duplicates)
    for (const it of items) {
      const qty = Number(it.quantity);
      if (!isId(it.foodId)) throw httpError(400, 'Invalid food item in cart.');
      if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw httpError(400, 'Quantity must be between 1 and 20.');
      merged.set(String(it.foodId), (merged.get(String(it.foodId)) || 0) + qty);
    }

    const foods = await Food.find({ _id: { $in: [...merged.keys()] } });
    if (foods.length !== merged.size) throw httpError(400, 'Some items in your cart no longer exist.');

    const orderItems = [];
    let total = 0;
    for (const food of foods) {
      if (!food.available) throw httpError(400, `"${food.name}" is currently unavailable. Please remove it from your cart.`);
      const quantity = merged.get(String(food._id));
      if (quantity > 20) throw httpError(400, 'Quantity must be between 1 and 20.');
      orderItems.push({ food: food._id, name: food.name, price: food.price, quantity });
      total += food.price * quantity; // price always taken from the database, never from the client
    }

    const order = await Order.create({
      orderId: await generateOrderId(),
      user: req.user._id,
      items: orderItems,
      total,
      note: String(note || '').slice(0, 200),
    });
    res.status(201).json({ order });
  })
);

// GET /api/orders/my  (student order history)
router.get(
  '/my',
  protect,
  studentOnly,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  })
);

// PUT /api/orders/:id/cancel  (student, only while status is Pending)
router.put(
  '/:id/cancel',
  protect,
  studentOnly,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw httpError(400, 'Invalid order id.');
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) throw httpError(404, 'Order not found.');
    if (order.status !== 'Pending')
      throw httpError(400, `This order is already "${order.status}" and can no longer be cancelled.`);
    order.status = 'Cancelled';
    await order.save();
    res.json({ order });
  })
);

// GET /api/orders/admin/all?status=  (admin)
router.get(
  '/admin/all',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const orders = await Order.find(filter).populate('user', 'name email rollNumber').sort({ createdAt: -1 });
    res.json({ orders });
  })
);

// PUT /api/orders/admin/:id/status  (admin)  body: { status }
router.put(
  '/admin/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) throw httpError(400, 'Invalid order id.');
    const { status } = req.body;
    if (!STATUSES.includes(status)) throw httpError(400, `Status must be one of: ${STATUSES.join(', ')}.`);
    const order = await Order.findById(req.params.id).populate('user', 'name email rollNumber');
    if (!order) throw httpError(404, 'Order not found.');
    if (['Cancelled', 'Completed'].includes(order.status))
      throw httpError(400, `A ${order.status.toLowerCase()} order cannot be changed.`);
    order.status = status;
    await order.save();
    res.json({ order });
  })
);

module.exports = router;
