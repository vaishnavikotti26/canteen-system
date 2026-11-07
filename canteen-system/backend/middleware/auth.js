const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('./asyncHandler');
const httpError = require('./httpError');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw httpError(401, 'Not authorised. Please log in.');
  const token = header.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws on invalid/expired
  const user = await User.findById(decoded.id);
  if (!user) throw httpError(401, 'User no longer exists.');
  req.user = user;
  next();
});

exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return next(httpError(403, 'Admin access only.'));
  next();
};

exports.studentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') return next(httpError(403, 'Only students can do this.'));
  next();
};
