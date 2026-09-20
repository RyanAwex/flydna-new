require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const User = require("./models/User");

async function seedBetaUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/FlyDnA";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const salt = await bcrypt.genSalt(10);
    const hashPassword123 = await bcrypt.hash("Password123!", salt);

    const betaUsers = [
      {
        email: "betauser1@flydna.com",
        name: "Beta User 1",
        password: hashPassword123,
        phone: "+15550001",
        status: "online",
      },
      {
        email: "betauser2@flydna.com",
        name: "Beta User 2",
        password: hashPassword123,
        phone: "+15550002",
        status: "online",
      },
      {
        email: "demo@flydna.com",
        name: "Demo User",
        password: hashPassword123,
        phone: "+15550003",
        status: "online",
      }
    ];

    for (const u of betaUsers) {
      let existing = await User.findOne({ email: u.email });
      if (existing) {
        existing.password = hashPassword123;
        existing.isDeleted = false;
        await existing.save();
        console.log(`✅ Updated existing user ${u.email} password to Password123!`);
      } else {
        const newUser = new User({
          _id: uuidv4(),
          name: u.name,
          email: u.email,
          password: hashPassword123,
          phone: u.phone,
          status: u.status,
          address: { address: "123 Beta Way", city: "Atlanta", state: "GA", country: "USA" }
        });
        await newUser.save();
        console.log(`🌱 Created new user ${u.email} with password Password123!`);
      }
    }

    console.log("🎉 Beta user seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding beta users:", err);
    process.exit(1);
  }
}

seedBetaUsers();
