const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  from: { type: String, ref: 'User', required: true },
  to: { type: String, ref: 'User', required: true },
  fromUserId: { type: String }, // For compatibility
  toUserId: { type: String }, // For compatibility
  text: { type: String, required: true },
  message: { type: String }, // For compatibility
  timestamp: { type: Date, default: Date.now },
  type: { type: String, default: 'text' },
  read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);
