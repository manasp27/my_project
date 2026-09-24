const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const addNotification = async (userId, message, type = 'info', link = '') => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, type, link, createdAt: new Date() } }
  });
};

// GET /api/projects — browse/search/filter
router.get('/', async (req, res) => {
  try {
    const { search, category, budgetMin, budgetMax, status = 'open',
            skills, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const query = { status };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (skills) query.skills = { $in: skills.split(',').map(s => new RegExp(s.trim(), 'i')) };
    if (budgetMin || budgetMax) {
      query.budgetMin = {};
      if (budgetMin) query.budgetMin.$gte = Number(budgetMin);
      if (budgetMax) query.budgetMax = { $lte: Number(budgetMax) };
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('client', 'name avatar rating company')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, projects, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('client', 'name avatar rating company location reviewCount completedProjects');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects — create project (client only)
router.post('/', protect, authorize('client', 'admin'), async (req, res) => {
  try {
    const { title, description, category, skills, budgetType,
            budgetMin, budgetMax, deadline, isUrgent } = req.body;
    if (!title || !description || !category || !budgetMin || !budgetMax || !deadline) {
      return res.status(400).json({ success: false, message: 'Fill all required fields' });
    }
    const project = await Project.create({
      title, description, category,
      skills: skills || [],
      budgetType: budgetType || 'fixed',
      budgetMin, budgetMax, deadline,
      isUrgent: isUrgent || false,
      client: req.user._id
    });
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/projects/:id — edit project
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (project.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Can only edit open projects' });
    }
    const allowed = ['title','description','category','skills','budgetMin','budgetMax','deadline','isUrgent'];
    allowed.forEach(f => { if (req.body[f] !== undefined) project[f] = req.body[f]; });
    await project.save();
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/projects/my/posted — client's own projects
router.get('/my/posted', protect, authorize('client','admin'), async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user._id }).sort('-createdAt');
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/projects/:id/complete — mark project complete
router.post('/:id/complete', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only client can mark complete' });
    }
    project.status = 'completed';
    await project.save();

    // Update stats
    await User.findByIdAndUpdate(project.client, { $inc: { completedProjects: 1 } });
    if (project.assignedFreelancer) {
      await User.findByIdAndUpdate(project.assignedFreelancer, { $inc: { completedProjects: 1 } });
      await addNotification(project.assignedFreelancer,
        `Project "${project.title}" marked complete! Payment released.`, 'success', `/project/${project._id}`);
    }
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
