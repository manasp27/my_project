const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// POST /api/reviews — submit review
router.post('/', protect, async (req, res) => {
  try {
    const { projectId, revieweeId, rating, comment } = req.body;
    if (!projectId || !revieweeId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const project = await Project.findById(projectId);
    if (!project || project.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Project must be completed' });
    }

    const existing = await Review.findOne({ project: projectId, reviewer: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed' });

    const type = req.user.role === 'client' ? 'client_to_freelancer' : 'freelancer_to_client';
    const review = await Review.create({
      project: projectId, reviewer: req.user._id,
      reviewee: revieweeId, rating, comment, type
    });

    // Update reviewee rating
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar role')
      .populate('project', 'title')
      .sort('-createdAt');
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
