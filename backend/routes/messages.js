const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const getConvId = (a, b) => [a, b].sort().join('_');

const addNotification = async (userId, message, type = 'message', link = '') => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, type, link, createdAt: new Date() } }
  });
};

// GET /api/messages/conversations — list conversations
router.get('/conversations', protect, async (req, res) => {
  try {
    const uid = req.user._id.toString();
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    }).sort('-createdAt');

    const convMap = {};
    for (const msg of messages) {
      if (!convMap[msg.conversationId]) convMap[msg.conversationId] = msg;
    }

    // Populate other user
    const conversations = await Promise.all(Object.values(convMap).map(async (msg) => {
      const otherId = msg.sender.toString() === uid ? msg.receiver : msg.sender;
      const other = await User.findById(otherId).select('name avatar role');
      const unread = await Message.countDocuments({
        conversationId: msg.conversationId, receiver: req.user._id, isRead: false
      });
      return { conversationId: msg.conversationId, lastMessage: msg, other, unread };
    }));

    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/messages/:userId — get messages with a user
router.get('/:userId', protect, async (req, res) => {
  try {
    const convId = getConvId(req.user._id.toString(), req.params.userId);
    const messages = await Message.find({ conversationId: convId })
      .populate('sender', 'name avatar')
      .sort('createdAt');

    // Mark as read
    await Message.updateMany(
      { conversationId: convId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages — send message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content, projectId } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver and content required' });
    }
    const convId = getConvId(req.user._id.toString(), receiverId);
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      conversationId: convId,
      project: projectId || null
    });
    await message.populate('sender', 'name avatar');

    await addNotification(receiverId,
      `New message from ${req.user.name}: "${content.substring(0, 50)}..."`,
      'message', `/messages/${req.user._id}`);

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
