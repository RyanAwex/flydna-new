const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  img: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'live', 'story'],
    default: 'offline',
  },
  socketId: {
    type: String,
    default: null, // Used to track active connection
  },
  selectedScene: {
    type: String,
    default: '/assets/scenes/user-scene.mp4',
  },
  activeSceneId: { type: Number, default: 3 },
  selectedSceneId: { type: Number, default: 3 },
  country: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  purchasedScenes: [{ type: Number }],
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  contacts: [{ type: String, ref: 'User' }],
  username: { type: String, default: null },
  verifiedTraveler: { type: Boolean, default: false },
  flydnaId: { type: String, default: null },
  rating: { type: Number, default: 4.9 },
  cards: { type: Array, default: [] },
  balance: {
    total: { type: Number, default: 0 },
    usd: { type: Number, default: 0 },
    dxa: { type: Number, default: 0 },
    btc: { type: Number, default: 0 }
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Admin-manageable fields
  membershipTier: { type: String, enum: ['free', 'nasc', 'vip'], default: 'free' },
  nascAccess: { type: Boolean, default: false },
  totalSpent: { type: Number, default: 0 },
  rewardPoints: { type: Number, default: 0 },
  lastLoginAt: { type: Date, default: null },
  loginCount: { type: Number, default: 0 },
  isSuspended: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
