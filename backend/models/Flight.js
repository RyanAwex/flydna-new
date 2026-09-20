const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  airline: { type: String, required: true },
  route: { type: String, required: true }, // "ATL → MIA"
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  departDate: { type: String, default: null },
  returnDate: { type: String, default: null },
  price: { type: Number, required: true },
  seatsAvailable: { type: Number, default: 0 },
  class: { type: String, enum: ['Economy', 'Business', 'First'], default: 'Economy' },
  status: { type: String, enum: ['active', 'delayed', 'cancelled'], default: 'active' },
  image: { type: String, default: null },
  totalBookings: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
