const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `avatar_${req.user._id}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

// GET /api/users/freelancers — search/filter freelancers
router.get('/freelancers', async (req, res) => {
  try {
    const { skill, category, rating, search, page = 1, limit = 12 } = req.query;
    const query = { role: 'freelancer', isActive: true, isBanned: false };

    if (skill) query.skills = { $in: [new RegExp(skill, 'i')] };
    if (category) query.category = category;
    if (rating) query.rating = { $gte: Number(rating) };
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { skills: { $in: [new RegExp(search, 'i')] } },
      { bio: new RegExp(search, 'i') }
    ];

    const total = await User.countDocuments(query);
    const freelancers = await User.find(query)
      .select('-password -notifications')
      .sort({ rating: -1, completedProjects: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, freelancers, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -notifications -walletBalance');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const reviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, user, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/profile — update own profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name','bio','location','skills','hourlyRate','experience',
                     'category','company','website','portfolio'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/avatar — upload avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl });
    res.json({ success: true, avatar: avatarUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/notifications/all
router.get('/notifications/all', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user.notifications.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/notifications/read
router.put('/notifications/read', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'notifications.$[].isRead': true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
