const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  userName: { type: String, default: '' },
  type: { type: String, enum: ['flight', 'hotel', 'car', 'product', 'scene', 'membership', 'other'], required: true },
  itemId: { type: String, default: null },
  itemName: { type: String, required: true },
  amount: { type: Number, required: true },
  flydnaFee: { type: Number, default: 0 }, // 2.5% treasury royalty fee
  paymentMethod: { type: String, default: 'card' },
  status: { type: String, enum: ['confirmed', 'pending', 'refunded', 'disputed'], default: 'confirmed' },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
