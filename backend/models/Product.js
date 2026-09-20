const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Apparel', 'Accessories', 'Digital', 'Merch', 'Premium'], default: 'Merch' },
  price: { type: Number, required: true },
  image: { type: String, default: null },
  description: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'draft', 'sold_out'], default: 'active' },
  sales: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
