const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['client', 'freelancer', 'admin'], default: 'freelancer' },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '' },
  location: { type: String, default: '' },
  isActive: { type: Boolean, default: true },

  // Freelancer fields
  skills:      [String],
  hourlyRate:  { type: Number, default: 0 },
  experience:  { type: String, default: '' },
  category:    { type: String, default: '' },
  portfolio: [{
    title: String, description: String, link: String
  }],

  // Client fields
  company: { type: String, default: '' },
  website: { type: String, default: '' },

  // Stats
  rating:           { type: Number, default: 0 },
  reviewCount:      { type: Number, default: 0 },
  completedProjects:{ type: Number, default: 0 },
  totalEarnings:    { type: Number, default: 0 },
  totalSpent:       { type: Number, default: 0 },
  walletBalance:    { type: Number, default: 0 },

  // Notifications
  notifications: [{
    message: String,
    type: { type: String, default: 'info' },
    isRead: { type: Boolean, default: false },
    link: String,
    createdAt: { type: Date, default: Date.now }
  }],

  isBanned: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(pass) {
  return bcrypt.compare(pass, this.password);
};

module.exports = mongoose.model('User', userSchema);
