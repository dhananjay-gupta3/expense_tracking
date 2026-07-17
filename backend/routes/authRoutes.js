const express = require('express');
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  googleAuth,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/google', googleAuth);
router.route('/me').get(protect, getMe).put(protect, updateMe);

module.exports = router;
