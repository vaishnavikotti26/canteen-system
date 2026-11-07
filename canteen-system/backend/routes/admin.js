const router = require('express').Router();
const User = require('../models/User');
const Food = require('../models/Food');
const Order = require('../models/Order');
const { STATUSES } = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/admin/stats
router.get(
  '/stats',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalStudents, totalFoods, totalOrders, ordersToday, revenueAgg, statusAgg, topAgg, recentOrders] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        Food.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ createdAt: { $gte: startOfDay } }),
        Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, sum: { $sum: '$total' } } }]),
        Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Order.aggregate([
          { $match: { status: { $ne: 'Cancelled' } } },
          { $unwind: '$items' },
          { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' } } },
          { $sort: { quantity: -1 } },
          { $limit: 5 },
        ]),
        Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(5),
      ]);

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    statusAgg.forEach((s) => (byStatus[s._id] = s.count));

    res.json({
      totalStudents,
      totalFoods,
      totalOrders,
      ordersToday,
      revenue: revenueAgg[0] ? revenueAgg[0].sum : 0,
      byStatus,
      topItems: topAgg.map((t) => ({ name: t._id, quantity: t.quantity })),
      recentOrders,
    });
  })
);

module.exports = router;
