const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const addNotification = async (userId, message, type = 'info', link = '') => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, type, link, createdAt: new Date() } }
  });
};

// POST /api/proposals — submit proposal (freelancer)
router.post('/', protect, authorize('freelancer'), async (req, res) => {
  try {
    const { projectId, coverLetter, bidAmount, deliveryDays } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Project is not open for proposals' });
    }

    const existing = await Proposal.findOne({ project: projectId, freelancer: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already submitted a proposal' });

    const proposal = await Proposal.create({
      project: projectId, freelancer: req.user._id,
      coverLetter, bidAmount, deliveryDays
    });
    await Project.findByIdAndUpdate(projectId, {
      $push: { proposals: proposal._id },
      $inc: { proposalCount: 1 }
    });

    await addNotification(project.client,
      `New proposal on "${project.title}" from ${req.user.name}`,
      'proposal', `/project/${project._id}`);

    res.status(201).json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/proposals/project/:projectId — get proposals for a project (client)
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const proposals = await Proposal.find({ project: req.params.projectId })
      .populate('freelancer', 'name avatar rating reviewCount skills hourlyRate completedProjects')
      .sort('-createdAt');
    res.json({ success: true, proposals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/proposals/my — freelancer's own proposals
router.get('/my', protect, authorize('freelancer'), async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate('project', 'title status budgetMin budgetMax deadline client')
      .sort('-createdAt');
    res.json({ success: true, proposals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/proposals/:id/accept — client accepts proposal
router.put('/:id/accept', protect, authorize('client','admin'), async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('project');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const project = proposal.project;
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Accept this, reject others
    await Proposal.updateMany(
      { project: project._id, _id: { $ne: proposal._id } },
      { status: 'rejected' }
    );
    proposal.status = 'accepted';
    await proposal.save();

    await Project.findByIdAndUpdate(project._id, {
      status: 'in_progress',
      assignedFreelancer: proposal.freelancer
    });

    await addNotification(proposal.freelancer,
      `Your proposal on "${project.title}" was accepted! 🎉`,
      'success', `/project/${project._id}`);

    res.json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/proposals/:id/reject
router.put('/:id/reject', protect, authorize('client','admin'), async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('project');
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });

    proposal.status = 'rejected';
    await proposal.save();

    await addNotification(proposal.freelancer,
      `Your proposal on "${proposal.project.title}" was not selected.`,
      'info', `/project/${proposal.project._id}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/proposals/:id — edit proposal (freelancer, pending only)
router.put('/:id', protect, authorize('freelancer'), async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });
    if (proposal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot edit after review' });
    }
    const { coverLetter, bidAmount, deliveryDays } = req.body;
    if (coverLetter) proposal.coverLetter = coverLetter;
    if (bidAmount) proposal.bidAmount = bidAmount;
    if (deliveryDays) proposal.deliveryDays = deliveryDays;
    await proposal.save();
    res.json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/proposals/:id — withdraw
router.delete('/:id', protect, authorize('freelancer'), async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ _id: req.params.id, freelancer: req.user._id });
    if (!proposal) return res.status(404).json({ success: false, message: 'Not found' });
    if (proposal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw after review' });
    }
    await Project.findByIdAndUpdate(proposal.project, {
      $pull: { proposals: proposal._id },
      $inc: { proposalCount: -1 }
    });
    await proposal.deleteOne();
    res.json({ success: true, message: 'Proposal withdrawn' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
