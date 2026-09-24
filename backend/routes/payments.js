const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// POST /api/payments/deposit — add funds to wallet (simulated)
router.post('/deposit', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }
    await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: amount } });
    const payment = await Payment.create({
      payer: req.user._id,
      amount,
      type: 'deposit',
      status: 'completed',
      description: `Wallet top-up of $${amount}`
    });
    const user = await User.findById(req.user._id).select('walletBalance');
    res.json({ success: true, payment, walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/release/:projectId — release payment to freelancer
router.post('/release/:projectId', protect, authorize('client','admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (project.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Project must be completed first' });
    }

    const client = await User.findById(req.user._id);
    const amount = project.budgetMax; // agreed amount
    if (client.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Deduct from client, add to freelancer
    await User.findByIdAndUpdate(project.client, { $inc: { walletBalance: -amount, totalSpent: amount } });
    await User.findByIdAndUpdate(project.assignedFreelancer, {
      $inc: { walletBalance: amount, totalEarnings: amount }
    });

    const payment = await Payment.create({
      project: project._id,
      payer: project.client,
      payee: project.assignedFreelancer,
      amount,
      type: 'release',
      status: 'completed',
      description: `Payment released for "${project.title}"`
    });

    const updatedClient = await User.findById(req.user._id).select('walletBalance');
    res.json({ success: true, payment, walletBalance: updatedClient.walletBalance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/history — own transaction history
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({
      $or: [{ payer: req.user._id }, { payee: req.user._id }]
    })
      .populate('project', 'title')
      .populate('payer', 'name')
      .populate('payee', 'name')
      .sort('-createdAt');
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
