const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  client:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String, required: true,
    enum: ['Web Development','Mobile Development','Design','Writing',
           'Marketing','Data Science','Video & Animation','Photography','Other']
  },
  skills:     [String],
  budgetType: { type: String, enum: ['fixed','hourly'], default: 'fixed' },
  budgetMin:  { type: Number, required: true },
  budgetMax:  { type: Number, required: true },
  deadline:   { type: Date, required: true },
  status: {
    type: String,
    enum: ['open','in_progress','completed','cancelled'],
    default: 'open'
  },
  assignedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  proposals:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' }],
  proposalCount:{ type: Number, default: 0 },
  isUrgent:     { type: Boolean, default: false },
  views:        { type: Number, default: 0 },
  isFlagged:    { type: Boolean, default: false },
}, { timestamps: true });

projectSchema.index({ title: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('Project', projectSchema);
