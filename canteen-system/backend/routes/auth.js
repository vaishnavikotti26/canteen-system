const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const httpError = require('../middleware/httpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  rollNumber: u.rollNumber,
});

// POST /api/auth/register  (students only - admins are created via seed script)
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const rollNumber = String(req.body.rollNumber || '').trim();

    if (name.length < 2) throw httpError(400, 'Name must be at least 2 characters.');
    if (!EMAIL_RE.test(email)) throw httpError(400, 'Please enter a valid email address.');
    if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters.');
    if (await User.findOne({ email })) throw httpError(409, 'An account with this email already exists.');

    const user = await User.create({ name, email, password, rollNumber, role: 'student' });
    res.status(201).json({ token: sign(user._id), user: publicUser(user) });
  })
);

// POST /api/auth/login   body: { email, password, portal: 'student' | 'admin' }
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const portal = req.body.portal === 'admin' ? 'admin' : 'student';

    if (!EMAIL_RE.test(email) || !password) throw httpError(400, 'Email and password are required.');

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) throw httpError(401, 'Invalid email or password.');

    if (portal === 'admin' && user.role !== 'admin') throw httpError(403, 'This account is not an admin.');
    if (portal === 'student' && user.role === 'admin')
      throw httpError(403, 'Admins must log in through the Admin Login page.');

    res.json({ token: sign(user._id), user: publicUser(user) });
  })
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
