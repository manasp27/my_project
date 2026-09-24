const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project:        { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  content:        { type: String, required: true },
  isRead:         { type: Boolean, default: false },
  conversationId: { type: String, required: true },
  attachment:     { filename: String, path: String }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
