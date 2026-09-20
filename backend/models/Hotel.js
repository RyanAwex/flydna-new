const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  pricePerNight: { type: Number, required: true },
  stars: { type: Number, default: 4, min: 1, max: 5 },
  roomsAvailable: { type: Number, default: 0 },
  image: { type: String, default: null },
  amenities: [{ type: String }],
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'fully_booked', 'maintenance'], default: 'active' },
  totalBookings: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
