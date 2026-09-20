require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const salt = bcrypt.genSaltSync(10);
  const hashPass = bcrypt.hashSync("Password123!", salt);

  const res2 = await User.updateOne(
    { email: "betauser2@flydna.com" },
    { $set: { password: hashPass, isDeleted: false } }
  );
  console.log("Update betauser2 result:", res2);

  const res1 = await User.updateOne(
    { email: "betauser1@flydna.com" },
    { $set: { password: hashPass, isDeleted: false } }
  );
  console.log("Update betauser1 result:", res1);

  // Verify
  const user2 = await User.findOne({ email: "betauser2@flydna.com" });
  console.log("Verification betauser2 Bcrypt match:", bcrypt.compareSync("Password123!", user2.password));

  process.exit(0);
}

reset();
