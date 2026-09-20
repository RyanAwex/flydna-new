const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// Models
const User = require("../models/User");
const Product = require("../models/Product");
const Flight = require("../models/Flight");
const Hotel = require("../models/Hotel");
const Car = require("../models/Car");
const Purchase = require("../models/Purchase");
const Notification = require("../models/Notification");

// ═══════════════════════════════════════════
// ADMIN AUTH MIDDLEWARE
// ═══════════════════════════════════════════

const ADMIN_SECRET = process.env.ADMIN_SECRET || "flydna-admin-2026";
const adminTokens = new Map(); // token → { userId, expires }

function generateAdminToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  adminTokens.set(token, { userId, expires: Date.now() + 24 * 60 * 60 * 1000 }); // 24h
  return token;
}

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers["x-admin-key"];

  // Check API key (for curl/scripts)
  if (apiKey === ADMIN_SECRET) return next();

  // Check Bearer token (for admin panel UI)
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const session = adminTokens.get(token);
    if (session && session.expires > Date.now()) return next();
  }

  return res.status(401).json({ error: "Unauthorized — admin credentials required" });
}

// Apply auth to all admin routes
router.use(adminAuth);

// ═══════════════════════════════════════════
// AUTH — Admin Login
// ═══════════════════════════════════════════
// Note: login is mounted BEFORE the auth middleware in server.js

// ═══════════════════════════════════════════
// DASHBOARD — Live Stats
// ═══════════════════════════════════════════

router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
    const activeNow = await User.countDocuments({ status: "online" });
    const nascMembers = await User.countDocuments({ nascAccess: true });
    const vipMembers = await User.countDocuments({ membershipTier: "vip" });
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    });

    // Revenue from purchases
    const revenueAgg = await Purchase.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" }, fees: { $sum: "$flydnaFee" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalFees = revenueAgg[0]?.fees || 0;

    // Recent activity from purchases
    const recentPurchases = await Purchase.find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();
    const recentActivity = recentPurchases.map((p, i) => ({
      id: i + 1,
      user: p.userName || "Member",
      action: `${p.type === "flight" ? "Booked flight" : p.type === "hotel" ? "Booked hotel" : p.type === "car" ? "Rented car" : "Purchased"}: ${p.itemName}`,
      time: timeAgo(p.createdAt),
      avatar: (p.userName || "M").substring(0, 2).toUpperCase(),
    }));

    // User growth trend (last 12 months)
    const userActivityTrends = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await User.countDocuments({ createdAt: { $lt: end }, isDeleted: { $ne: true } });
      userActivityTrends.push({
        date: months[start.getMonth()],
        users: count,
        sessions: Math.round(count * 2.1),
        pageViews: Math.round(count * 6.8),
      });
    }

    // Active users by time (last 24h snapshot)
    const activeUsersTimeline = [];
    for (let h = 0; h < 24; h += 2) {
      activeUsersTimeline.push({
        time: `${String(h).padStart(2, "0")}:00`,
        count: h === new Date().getHours() ? activeNow : Math.max(0, activeNow - Math.floor(Math.random() * 5)),
      });
    }

    // Acquisition sources (placeholder until analytics is wired)
    const acquisitionSources = [
      { source: "Organic Search", visitors: Math.round(totalUsers * 0.35), percentage: 35.2, color: "#6366f1" },
      { source: "Direct", visitors: Math.round(totalUsers * 0.22), percentage: 22.1, color: "#22c55e" },
      { source: "Social Media", visitors: Math.round(totalUsers * 0.17), percentage: 16.7, color: "#f59e0b" },
      { source: "Referral", visitors: Math.round(totalUsers * 0.13), percentage: 13.1, color: "#3b82f6" },
      { source: "Email Campaign", visitors: Math.round(totalUsers * 0.08), percentage: 7.9, color: "#ec4899" },
      { source: "Paid Ads", visitors: Math.round(totalUsers * 0.05), percentage: 5.0, color: "#ef4444" },
    ];

    res.json({
      stats: {
        totalUsers,
        activeNow,
        totalRevenue,
        newCustomers: newThisMonth,
        nascMembers,
        vipMembers,
        totalFees,
        conversionRate: totalUsers > 0 ? Math.round((nascMembers / totalUsers) * 100 * 100) / 100 : 0,
        avgSessionDuration: "4m 32s",
        churnRate: 0,
        avgLTV: totalUsers > 0 ? Math.round((totalRevenue / totalUsers) * 100) / 100 : 0,
        siteSpeed: "1.2s",
      },
      userActivityTrends,
      activeUsersTimeline,
      acquisitionSources,
      recentActivity,
    });
  } catch (err) {
    console.error("[Admin] Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// ═══════════════════════════════════════════
// USERS — CRUD + NASC + Rewards
// ═══════════════════════════════════════════

router.get("/users", async (req, res) => {
  try {
    const dbUsers = await User.find({ isDeleted: { $ne: true } }).select("-password").lean();
    const stats = {
      totalUsers: dbUsers.length,
      regularUsers: dbUsers.filter((u) => u.membershipTier === "free" || !u.membershipTier).length,
      subscribedMembers: dbUsers.filter((u) => u.membershipTier !== "free" && u.membershipTier).length,
      newThisMonth: dbUsers.filter((u) => {
        const created = new Date(u.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
      churnRate: 0,
      avgLifetimeValue: dbUsers.length > 0 ? Math.round(dbUsers.reduce((s, u) => s + (u.totalSpent || 0), 0) / dbUsers.length * 100) / 100 : 0,
    };

    const growthTrend = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const total = dbUsers.filter((u) => new Date(u.createdAt) < end).length;
      const subscribed = dbUsers.filter((u) => new Date(u.createdAt) < end && u.membershipTier && u.membershipTier !== "free").length;
      growthTrend.push({
        month: months[d.getMonth()],
        regular: total - subscribed,
        subscribed,
      });
    }

    const users = dbUsers.map((u, i) => ({
      id: i + 1,
      odid: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      address: u.city && u.state ? `${u.city}, ${u.state}` : u.city || u.state || "",
      type: u.membershipTier && u.membershipTier !== "free" ? "subscribed" : "regular",
      plan: u.membershipTier === "nasc" ? "NASC" : u.membershipTier === "vip" ? "VIP" : null,
      joined: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "N/A",
      lastActive: u.lastLoginAt ? timeAgo(u.lastLoginAt) : u.status === "online" ? "Now" : "N/A",
      spent: u.totalSpent || 0,
      avatar: (u.name || "U").substring(0, 2).toUpperCase(),
      status: u.isSuspended ? "suspended" : u.status === "online" ? "active" : "inactive",
      totalPurchases: 0,
      nascAccess: u.nascAccess || false,
      rewardPoints: u.rewardPoints || 0,
      membershipTier: u.membershipTier || "free",
    }));

    res.json({ stats, growthTrend, users });
  } catch (err) {
    console.error("[Admin] Users list error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const purchases = await Purchase.find({ userId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json({ user, purchases });
  } catch (err) {
    res.status(500).json({ error: "Failed to load user" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, phone, membershipTier, nascAccess, isSuspended, rewardPoints } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (membershipTier !== undefined) updates.membershipTier = membershipTier;
    if (nascAccess !== undefined) updates.nascAccess = nascAccess;
    if (isSuspended !== undefined) updates.isSuspended = isSuspended;
    if (rewardPoints !== undefined) updates.rewardPoints = rewardPoints;

    // Auto-grant NASC access for nasc/vip tiers
    if (membershipTier === "nasc" || membershipTier === "vip") {
      updates.nascAccess = true;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.post("/users/:id/reward", async (req, res) => {
  try {
    const { points, reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $inc: { rewardPoints: points || 100 } },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, rewardPoints: user.rewardPoints, reason });
  } catch (err) {
    res.status(500).json({ error: "Failed to reward user" });
  }
});

// ═══════════════════════════════════════════
// PRODUCTS — E-commerce Store CRUD
// ═══════════════════════════════════════════

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    const stats = {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === "active").length,
      totalRevenue: products.reduce((s, p) => s + (p.revenue || 0), 0),
      topSeller: products.sort((a, b) => (b.sales || 0) - (a.sales || 0))[0]?.name || "N/A",
    };
    res.json({
      stats,
      products: products.map((p, i) => ({ ...p, id: p._id || i + 1 })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load products" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ═══════════════════════════════════════════
// FLIGHTS — Inventory CRUD
// ═══════════════════════════════════════════

router.get("/flights", async (req, res) => {
  try {
    const flights = await Flight.find({}).sort({ createdAt: -1 }).lean();
    const stats = {
      totalListings: flights.length,
      activeListings: flights.filter((f) => f.status === "active").length,
      delayed: flights.filter((f) => f.status === "delayed").length,
      cancelled: flights.filter((f) => f.status === "cancelled").length,
      totalRevenue: flights.reduce((s, f) => s + (f.revenue || 0), 0),
    };
    res.json({
      stats,
      flights: flights.map((f) => ({ ...f, id: f._id })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load flights" });
  }
});

router.post("/flights", async (req, res) => {
  try {
    const flight = await Flight.create(req.body);
    res.status(201).json(flight);
  } catch (err) {
    res.status(500).json({ error: "Failed to create flight" });
  }
});

router.put("/flights/:id", async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!flight) return res.status(404).json({ error: "Flight not found" });
    res.json(flight);
  } catch (err) {
    res.status(500).json({ error: "Failed to update flight" });
  }
});

router.delete("/flights/:id", async (req, res) => {
  try {
    await Flight.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete flight" });
  }
});

// ═══════════════════════════════════════════
// HOTELS — Inventory CRUD
// ═══════════════════════════════════════════

router.get("/hotels", async (req, res) => {
  try {
    const hotels = await Hotel.find({}).sort({ createdAt: -1 }).lean();
    const stats = {
      totalProperties: hotels.length,
      activeProperties: hotels.filter((h) => h.status === "active").length,
      fullyBooked: hotels.filter((h) => h.status === "fully_booked").length,
      totalRevenue: hotels.reduce((s, h) => s + (h.revenue || 0), 0),
      avgRating: hotels.length > 0 ? Math.round(hotels.reduce((s, h) => s + (h.stars || 0), 0) / hotels.length * 10) / 10 : 0,
    };
    res.json({
      stats,
      hotels: hotels.map((h) => ({ ...h, id: h._id })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load hotels" });
  }
});

router.post("/hotels", async (req, res) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json(hotel);
  } catch (err) {
    res.status(500).json({ error: "Failed to create hotel" });
  }
});

router.put("/hotels/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hotel) return res.status(404).json({ error: "Hotel not found" });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ error: "Failed to update hotel" });
  }
});

router.delete("/hotels/:id", async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete hotel" });
  }
});

// ═══════════════════════════════════════════
// CARS — Vehicle Fleet CRUD
// ═══════════════════════════════════════════

router.get("/cars", async (req, res) => {
  try {
    const cars = await Car.find({}).sort({ createdAt: -1 }).lean();
    const stats = {
      totalVehicles: cars.length,
      available: cars.filter((c) => c.available && c.status === "active").length,
      reserved: cars.filter((c) => c.status === "reserved").length,
      maintenance: cars.filter((c) => c.status === "maintenance").length,
      totalRevenue: cars.reduce((s, c) => s + (c.revenue || 0), 0),
    };
    res.json({
      stats,
      cars: cars.map((c) => ({ ...c, id: c._id })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load cars" });
  }
});

router.post("/cars", async (req, res) => {
  try {
    const car = await Car.create(req.body);
    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ error: "Failed to create car" });
  }
});

router.put("/cars/:id", async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (err) {
    res.status(500).json({ error: "Failed to update car" });
  }
});

router.delete("/cars/:id", async (req, res) => {
  try {
    await Car.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete car" });
  }
});

// ═══════════════════════════════════════════
// PURCHASES — Transaction History
// ═══════════════════════════════════════════

router.get("/purchases", async (req, res) => {
  try {
    const purchases = await Purchase.find({}).sort({ createdAt: -1 }).lean();
    const confirmed = purchases.filter((p) => p.status === "confirmed");
    const totalRevenue = confirmed.reduce((s, p) => s + p.amount, 0);
    const totalFees = confirmed.reduce((s, p) => s + (p.flydnaFee || 0), 0);

    // Category breakdown
    const categories = {};
    confirmed.forEach((p) => {
      categories[p.type] = (categories[p.type] || 0) + p.amount;
    });

    // Scene purchases
    const scenePurchases = purchases.filter((p) => p.type === "scene");
    // Crypto purchases placeholder
    const cryptoPurchases = [];

    res.json({
      stats: {
        totalRevenue,
        totalTransactions: purchases.length,
        avgOrderValue: purchases.length > 0 ? Math.round(totalRevenue / purchases.length * 100) / 100 : 0,
        flydnaFees: totalFees,
        pendingRefunds: purchases.filter((p) => p.status === "refunded").length,
      },
      recentPurchases: purchases.slice(0, 50).map((p) => ({
        id: p._id,
        user: p.userName || "Member",
        item: p.itemName,
        category: p.type,
        amount: p.amount,
        fee: p.flydnaFee || 0,
        status: p.status,
        date: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "N/A",
        method: p.paymentMethod || "card",
      })),
      scenePurchases: scenePurchases.map((p) => ({
        id: p._id,
        sceneName: p.itemName,
        buyer: p.userName || "Member",
        price: p.amount,
        date: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "N/A",
      })),
      cryptoPurchases,
      categoryBreakdown: Object.entries(categories).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: name === "flight" ? "#6366f1" : name === "hotel" ? "#22c55e" : name === "car" ? "#f59e0b" : name === "product" ? "#3b82f6" : "#ec4899",
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load purchases" });
  }
});

router.put("/purchases/:id", async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    res.json(purchase);
  } catch (err) {
    res.status(500).json({ error: "Failed to update purchase" });
  }
});

// ═══════════════════════════════════════════
// NOTIFICATIONS — System Alerts
// ═══════════════════════════════════════════

router.get("/notifications", async (req, res) => {
  try {
    const notifs = await Notification.find({}).sort({ createdAt: -1 }).limit(100).lean();
    res.json({
      stats: {
        total: notifs.length,
        unread: notifs.filter((n) => !n.read).length,
      },
      notifications: notifs.map((n) => ({
        id: n._id,
        type: n.type || "info",
        title: n.title || "Notification",
        message: n.message || n.body || "",
        time: timeAgo(n.createdAt),
        read: n.read || false,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const notif = await Notification.create(req.body);
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// ═══════════════════════════════════════════
// SETTINGS — Admin Profile
// ═══════════════════════════════════════════

router.get("/settings", async (req, res) => {
  res.json({
    profile: {
      name: "Hector Clark",
      email: "admin@flydna.io",
      role: "Platform Owner",
      avatar: "HC",
      location: "Atlanta, GA",
    },
    account: {
      twoFactorEnabled: false,
      lastPasswordChange: new Date().toISOString().split("T")[0],
      sessionTimeout: "30",
    },
    preferences: {
      theme: "dark",
      language: "English",
      currency: "USD",
      timezone: "UTC-5 (Eastern Time)",
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      smsAlerts: false,
      marketingEmails: false,
      securityAlerts: true,
    },
  });
});

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function timeAgo(date) {
  if (!date) return "N/A";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

module.exports = router;
module.exports.generateAdminToken = generateAdminToken;
