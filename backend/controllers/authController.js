const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendOtpEmail, sendPasswordChangedEmail } = require('../utils/sendEmail');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

const signToken = (user) =>
  jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  monthlyBudget: user.monthlyBudget,
  emailAlerts: user.emailAlerts,
  hasPassword: Boolean(user.password),
  googleLinked: Boolean(user.googleId),
  createdAt: user.createdAt,
});

// Generates, stores and emails a fresh OTP for the user
const issueOtp = async (user) => {
  const otp = crypto.randomInt(100000, 1000000); // 6 digits
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpLastSentAt = new Date();
  await user.save();
  await sendOtpEmail(user.email, user.name, otp);
};

// @desc    Register with email + password, then email an OTP
// @route   POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail }).select(
      '+password +otpLastSentAt'
    );

    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    if (user) {
      // Unverified leftover signup — refresh it instead of blocking the email
      user.name = String(name).trim();
      user.password = password;
    } else {
      user = new User({
        name: String(name).trim(),
        email: normalizedEmail,
        password,
      });
    }

    await issueOtp(user);

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      data: { email: user.email },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    // SMTP unreachable/misconfigured — the account was saved, only the email failed
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION' || error.command) {
      console.error('OTP email failed:', error.message);
      return res.status(502).json({
        success: false,
        message:
          'Could not send the verification email right now. Please try again in a minute.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message,
    });
  }
};

// @desc    Verify the emailed OTP and activate the account
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
      '+otpHash +otpExpiresAt +password'
    );

    if (!user || !user.otpHash) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification for this email. Please sign up again.',
      });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This code has expired. Please request a new one.',
      });
    }

    if (hashOtp(String(otp).trim()) !== user.otpHash) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please try again.',
      });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: { token: signToken(user), user: sanitizeUser(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during verification',
      error: error.message,
    });
  }
};

// @desc    Re-send the verification OTP (60s cooldown)
// @route   POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: String(email || '').toLowerCase().trim() }).select(
      '+otpLastSentAt'
    );

    if (!user || user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification for this email.',
      });
    }

    if (
      user.otpLastSentAt &&
      Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({
        success: false,
        message: 'Please wait a minute before requesting another code.',
      });
    }

    await issueOtp(user);

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while resending the code',
      error: error.message,
    });
  }
};

// @desc    Login with email + password
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select(
      '+password +otpLastSentAt'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please continue with Google.',
      });
    }

    const passwordMatches = await user.matchPassword(password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isVerified) {
      // Nudge them back into the OTP flow with a fresh code
      const canResend =
        !user.otpLastSentAt ||
        Date.now() - user.otpLastSentAt.getTime() >= OTP_RESEND_COOLDOWN_MS;
      if (canResend) await issueOtp(user);

      return res.status(403).json({
        success: false,
        needsVerification: true,
        message: 'Please verify your email. We just sent you a new code.',
        data: { email: user.email },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: { token: signToken(user), user: sanitizeUser(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Login/signup with a Google ID token (Google Identity Services)
// @route   POST /api/auth/google
const googleAuth = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(503).json({
        success: false,
        message: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID to backend/.env.',
      });
    }

    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required',
      });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] }).select(
      '+password'
    );

    if (user) {
      // Link Google to an existing email account on first Google login
      user.googleId = payload.sub;
      user.isVerified = true; // Google has verified the email
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId: payload.sub,
        avatar: payload.picture || '',
        isVerified: true,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged in with Google',
      data: { token: signToken(user), user: sanitizeUser(user) },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Google sign-in failed. Please try again.',
      error: error.message,
    });
  }
};

// @desc    Current user's profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: sanitizeUser(req.user) },
  });
};

// @desc    Update profile (name, monthly budget, email alerts)
// @route   PUT /api/auth/me
const updateMe = async (req, res) => {
  try {
    const { name, monthlyBudget, emailAlerts } = req.body;
    const user = req.user;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      }
      user.name = String(name).trim();
    }

    if (monthlyBudget !== undefined) {
      const budget = Number(monthlyBudget);
      if (!Number.isFinite(budget) || budget < 0) {
        return res.status(400).json({ success: false, message: 'Invalid budget amount' });
      }
      user.monthlyBudget = budget;
      // A new budget means alert thresholds should be re-evaluated fresh
      user.budgetAlert = { month: '', level: 0 };
    }

    if (emailAlerts !== undefined) {
      user.emailAlerts = Boolean(emailAlerts);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message,
    });
  }
};

// @desc    Change password (or set one on a Google-only account)
// @route   PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user; // loaded with +password by the auth middleware

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Google-only accounts have no password yet — they may set one directly
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required',
        });
      }

      const matches = await user.matchPassword(currentPassword);
      if (!matches) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from the current one',
        });
      }
    }

    user.password = newPassword;
    await user.save();

    // Best-effort security notification — never fail the request over email
    sendPasswordChangedEmail(user.email, user.name).catch((err) =>
      console.error('Password-changed email failed:', err.message)
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: { user: sanitizeUser(user) },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  verifyOtp,
  resendOtp,
  login,
  googleAuth,
  getMe,
  updateMe,
  changePassword,
};
