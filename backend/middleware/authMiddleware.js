const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Verifies the Bearer token and attaches the user to the request
const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    // The password hash is needed so sanitizeUser can report hasPassword;
    // it is never serialized into responses
    const user = await User.findById(decoded.id).select('+password');

    if (!user || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or not verified. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please log in again.',
    });
  }
};

module.exports = { protect, JWT_SECRET };
