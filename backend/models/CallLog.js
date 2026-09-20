const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  callerId: { type: String, ref: 'User', required: true },
  receiverId: { type: String, ref: 'User', required: true },
  duration: { type: Number, default: 0 },
  type: { type: String, enum: ['voice', 'video'], default: 'video' },
  status: { type: String, enum: ['completed', 'missed', 'rejected', 'ongoing'], default: 'completed' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date }
});

module.exports = mongoose.model('CallLog', callLogSchema);
