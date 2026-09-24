const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema({
  project:       { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  payer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payee:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount:        { type: Number, required: true },
  type:          { type: String, enum: ['deposit','release','refund','withdrawal'], required: true },
  status:        { type: String, enum: ['pending','completed','failed'], default: 'completed' },
  description:   { type: String },
  transactionId: { type: String, default: () => uuidv4() }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
