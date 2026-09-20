const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['message', 'call', 'system', 'contact_request'], default: 'message' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  relationUserName: { type: String, default: 'System' },
  fromUserId: { type: String, default: null },
  data: { type: mongoose.Schema.Types.Mixed, default: null },
});

module.exports = mongoose.model('Notification', notificationSchema);
