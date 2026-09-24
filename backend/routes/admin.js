const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');

const guard = [protect, authorize('admin')];

// GET /api/admin/stats
router.get('/stats', ...guard, async (req, res) => {
  try {
    const [users, projects, payments, freelancers, clients] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      User.countDocuments({ role: 'freelancer' }),
      User.countDocuments({ role: 'client' }),
    ]);
    const openProjects = await Project.countDocuments({ status: 'open' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    res.json({
      success: true,
      stats: {
        users, projects, freelancers, clients,
        openProjects, completedProjects,
        totalRevenue: payments[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', ...guard, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', ...guard, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', ...guard, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', ...guard, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/projects
router.get('/projects', ...guard, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('client', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, projects, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/projects/:id/flag
router.put('/projects/:id/flag', ...guard, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id, { isFlagged: true }, { new: true }
    );
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/projects/:id
router.delete('/projects/:id', ...guard, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
