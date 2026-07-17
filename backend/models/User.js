const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name must be 60 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // Optional: Google-only accounts have no password
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    googleId: {
      type: String,
    },
    avatar: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Email OTP verification
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpLastSentAt: { type: Date, select: false },

    // Budget & alert preferences
    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },
    emailAlerts: {
      type: Boolean,
      default: true,
    },
    // Highest alert level (80 or 100) already emailed for a given month,
    // so the user is not spammed on every expense
    budgetAlert: {
      month: { type: String, default: '' }, // "YYYY-MM"
      level: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash the password whenever it is set or changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
