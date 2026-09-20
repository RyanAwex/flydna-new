const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: { type: String, required: true },  // "Mercedes-Benz"
  model: { type: String, required: true }, // "Maybach S-Class"
  type: { type: String, enum: ['Sedan', 'SUV', 'Electric', 'Luxury', 'Van'], default: 'Sedan' },
  pricePerDay: { type: Number, required: true },
  image: { type: String, default: null },
  location: { type: String, default: 'Atlanta, GA' },
  available: { type: Boolean, default: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'reserved', 'maintenance'], default: 'active' },
  totalBookings: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
