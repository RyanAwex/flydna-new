require("dotenv").config({ override: true });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // TODO: Replace with real key

const User = require("./models/User");
const Message = require("./models/Message");
const CallLog = require("./models/CallLog");
const Notification = require("./models/Notification");

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/flydna")
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    try {
      // Clean status on startup
      await User.updateMany({}, { status: "offline" });
      console.log("🧹 Reset all users' statuses to offline in DB on startup.");

      // Sync local users array with database
      const dbUsers = await User.find({});
      if (dbUsers.length > 0) {
        dbUsers.forEach(dbU => {
          const idx = users.findIndex(u => u._id === dbU._id);
          const uObj = {
            _id: dbU._id,
            name: dbU.name,
            email: dbU.email,
            password: dbU.password,
            phone: dbU.phone || "",
            profileImage: dbU.img || "assets/images/profile.png",
            role: dbU._id === "user_123" ? "admin" : "user",
            dob: dbU.dob || null,
            status: "offline",
            is_online: false,
            city: dbU.city || null,
            state: dbU.state || null,
            purchasedScenes: dbU.purchasedScenes || [],
            activeSceneId: dbU.activeSceneId || dbU.selectedSceneId || 3,
            createdAt: dbU.createdAt ? dbU.createdAt.toISOString() : new Date().toISOString(),
          };
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...uObj };
          } else {
            users.push(uObj);
          }
        });
        console.log(`📡 Synced ${dbUsers.length} users from MongoDB database.`);
      }
    } catch (err) {
      console.error("❌ Error syncing users from MongoDB:", err);
    }
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Mount modular socket handlers
require("./socket/index")(io);

// Share io instance with Express middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());

const GOOGLE_CONTACTS_SCOPE = ["https://www.googleapis.com/auth/contacts.readonly"];
const googleAuthStateCache = new Map();

function sanitizeOrigin(origin) {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function resolveGoogleRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  const host = req.get("host") || "127.0.0.1:3000";
  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  return `${protocol}://${host}/api/google/callback`;
}

function createGoogleOAuthClient(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, resolveGoogleRedirectUri(req));
}

function popupResponseHtml({ success, contacts = [], error = "", targetOrigin = "*" }) {
  const payload = {
    type: success ? "google-contacts-imported" : "google-contacts-import-error",
    contacts,
    error,
  };

  const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");
  const safeOrigin = JSON.stringify(targetOrigin || "*");
  const statusText = success
    ? `Imported ${contacts.length} contact(s). You can close this window.`
    : `Import failed: ${error || "Unknown error"}`;
  const safeStatusText = JSON.stringify(statusText);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Google Contacts</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f7fb; }
      .card { width: min(92vw, 440px); background: #fff; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); padding: 20px; }
      h3 { margin: 0 0 10px; font-size: 18px; color: #111827; }
      p { margin: 0 0 14px; color: #374151; line-height: 1.45; }
      button { border: 0; border-radius: 10px; padding: 10px 14px; cursor: pointer; background: #2563eb; color: #fff; }
    </style>
  </head>
  <body>
    <div class="card">
      <h3>Google Contacts</h3>
      <p id="status"></p>
      <button id="close-btn" type="button">Close</button>
    </div>
    <script>
      (function () {
        var payload = ${safePayload};
        var statusText = ${safeStatusText};
        var targetOrigin = ${safeOrigin};
        document.getElementById('status').textContent = statusText;

        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(payload, targetOrigin);
            setTimeout(function () { window.close(); }, 350);
          } catch (e) {
            // If posting to opener fails, allow manual close.
          }
        }

        document.getElementById('close-btn').addEventListener('click', function () {
          window.close();
        });
      })();
    </script>
  </body>
</html>`;
}

// Helper to extract user ID from auth token
function getCurrentUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  const token = parts[1] || parts[0];
  if (!token) return null;
  return token.replace(/^token_/, "");
}

// Helper to format a user object consistently for frontend consumption
function formatUserResponse(u) {
  if (!u) return null;
  const obj = typeof u.toObject === "function" ? u.toObject() : { ...u };
  
  // Resolve image to all variants
  const img = obj.img || obj.profileImage || obj.image || obj.avatarUrl || "assets/images/profile.png";
  obj.profileImage = img;
  obj.avatarUrl = img;
  obj.img = img;
  obj.userId = obj._id;
  
  // Make sure address fields exist and are structured if needed
  if (!obj.address) {
    obj.address = {
      country: obj.country || "",
      city: obj.city || "",
      state: obj.state || "",
      phone: obj.phone || "",
      address: "",
    };
  } else {
    obj.address = {
      ...obj.address,
      country: obj.address.country || obj.country || "",
      city: obj.address.city || obj.city || "",
      state: obj.address.state || obj.state || "",
      phone: obj.address.phone || obj.phone || "",
    };
  }

  // Set top-level city and state for consistency
  obj.city = obj.city || obj.address.city || null;
  obj.state = obj.state || obj.address.state || null;
  obj.country = obj.country || obj.address.country || null;
  obj.purchasedScenes = obj.purchasedScenes || [];
  obj.activeSceneId = obj.activeSceneId || obj.selectedSceneId || 3;

  delete obj.password;
  return obj;
}

// User Databases (caches populated at startup and maintained in sync with MongoDB)
let users = [];
let contacts = [];
let chatMessages = [];
let callLogs = [];

// Active Socket Connections
let activeConnections = {};

// REST API ENDPOINTS ---------------

// ---- ADMIN PANEL ROUTES ----
const adminRouter = require("./routes/admin");
const { generateAdminToken } = adminRouter;

// Admin login (NOT behind admin auth middleware)
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  // Find admin user in DB (case-insensitive email match)
  const user = await User.findOne({ email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }).lean();
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  // Compare password with bcrypt (same as regular login)
  const bcrypt = require("bcryptjs");
  let isValid = false;
  try {
    isValid = bcrypt.compareSync(password, user.password);
  } catch {
    // Fallback to raw comparison for unhashed passwords
    isValid = user.password === password;
  }
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (!user.isAdmin) {
    return res.status(403).json({ error: "Not an admin account" });
  }
  const token = generateAdminToken(user._id);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: "admin" },
  });
});

// Mount all admin CRUD routes (auth middleware is inside the router)
app.use("/api/admin", adminRouter);

// ---- AUTH ENDPOINTS ----
app.post("/api/auth/register", async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    dob,
    sex,
    country,
    address,
    city,
    state,
  } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "name, email, and password are required",
    });
  }

  // Check unique constraints in memory cache and database
  const emailTaken = users.some(
    (u) => String(u.email || "").toLowerCase() === String(email).toLowerCase(),
  ) || (await User.findOne({ email: email.toLowerCase() }));
  if (emailTaken) {
    return res.status(409).json({ success: false, error: "Email already registered" });
  }

  // Only check phone uniqueness if a phone number was actually provided
  if (phone) {
    const phoneTaken = users.some((u) => String(u.phone || "") === String(phone)) || (await User.findOne({ phone }));
    if (phoneTaken) {
      return res.status(409).json({ success: false, error: "Phone already registered" });
    }
  }

  const newUser = {
    _id: `u_${uuidv4()}`,
    name,
    email,
    phone,
    password,
    role: "user",
    dob: dob || null,
    profileImage: "assets/images/profile.png",
    address: {
      country: country || "",
      state: state || "",
      city: city || "",
      phone,
      address: address || "",
    },
    sex: sex || "other",
    is_online: false,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  try {
    const dbUser = new User({
      _id: newUser._id,
      email: newUser.email,
      password: newUser.password,
      name: newUser.name,
      phone: newUser.phone,
      img: newUser.profileImage,
      status: "offline",
      createdAt: new Date(newUser.createdAt),
    });
    await dbUser.save();
    
    // Push to memory cache
    users.push(newUser);
  } catch (err) {
    console.error("❌ Error saving registered user to MongoDB:", err);
    return res.status(500).json({ success: false, error: "Database error during registration" });
  }

  const formatted = formatUserResponse(newUser);

  return res.status(201).json({
    success: true,
    data: {
      ...formatted,
      token: `token_${newUser._id}`,
    },
    message: "Registration successful",
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, email, phone, password } = req.body || {};
  const loginKey = (identifier || email || phone || "").trim();

  if (!loginKey || !password) {
    return res.status(400).json({
      success: false,
      error: "identifier/email/phone and password are required",
    });
  }

  console.log("[LOGIN DEBUG] Incoming req.body:", req.body, "loginKey:", loginKey, "password:", password);

  // 1. Try finding in memory cache
  let user = users.find((u) => {
    const byEmail = String(u.email || "").toLowerCase() === String(loginKey).toLowerCase();
    const byPhone = String(u.phone || "") === String(loginKey);
    return byEmail || byPhone;
  });

  console.log("[LOGIN DEBUG] User in memory cache:", user ? { email: user.email, password: user.password } : null);

  // 2. Fallback to MongoDB query if not yet cached in memory
  if (!user) {
    try {
      const dbUser = await User.findOne({
        $or: [
          { email: { $regex: "^" + loginKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" } },
          { phone: loginKey }
        ]
      });
      console.log("[LOGIN DEBUG] User in MongoDB:", dbUser ? { email: dbUser.email, password: dbUser.password } : null);
      if (dbUser) {
        user = {
          _id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          password: dbUser.password,
          phone: dbUser.phone || "",
          profileImage: dbUser.img || "assets/images/profile.png",
          role: "user",
          dob: dbUser.dob || null,
          status: "online",
          is_online: true,
          purchasedScenes: dbUser.purchasedScenes || [],
          createdAt: dbUser.createdAt ? dbUser.createdAt.toISOString() : new Date().toISOString(),
        };
        users.push(user);
      }
    } catch (e) {
      console.warn("MongoDB login fallback error:", e);
    }
  }

  if (user) {
    let isValid = String(user.password) === String(password);
    console.log("[LOGIN DEBUG] Plain text compare result:", isValid);
    if (!isValid && user.password && (user.password.startsWith("$2b$") || user.password.startsWith("$2a$"))) {
      try {
        const bcrypt = require("bcryptjs");
        isValid = bcrypt.compareSync(password, user.password);
        console.log("[LOGIN DEBUG] Bcrypt compare result:", isValid);
      } catch (err) {
        console.error("[LOGIN DEBUG] Bcrypt error:", err);
      }
    }
    if (!isValid) {
      user = null;
    }
  }

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid credentials" });
  }

  user.is_online = true;
  user.lastSeen = new Date().toISOString();

  const formatted = formatUserResponse(user);

  return res.json({
    success: true,
    data: {
      ...formatted,
      token: `token_${user._id}`,
    },
  });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }
  return res.json({ success: true, message: "Password reset link sent (mock)" });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required" });
  }

  const user = users.find(
    (u) => String(u.email || "").toLowerCase() === String(email).toLowerCase(),
  );
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  try {
    await User.findOneAndUpdate(
      { email: String(email).toLowerCase() },
      { password }
    );
    user.password = password;
  } catch (err) {
    console.error("❌ Error updating password in MongoDB:", err);
    return res.status(500).json({ success: false, error: "Database error during password reset" });
  }

  return res.json({ success: true, message: "Password reset successful" });
});

app.get("/api/google/auth", (req, res) => {
  const token = String(req.query.token || "");
  if (!token) {
    return res.status(400).send("Missing token");
  }

  const requestedOrigin = sanitizeOrigin(String(req.query.origin || ""));
  const headerOrigin = sanitizeOrigin(req.get("origin") || "");
  const fallbackOrigin = sanitizeOrigin(process.env.FRONTEND_ORIGIN || "") || "http://127.0.0.1:4200";
  const targetOrigin = requestedOrigin || headerOrigin || fallbackOrigin;

  let oauth2Client;
  try {
    oauth2Client = createGoogleOAuthClient(req);
  } catch (err) {
    return res.status(500).type("html").send(
      popupResponseHtml({
        success: false,
        error: err.message,
        targetOrigin,
      }),
    );
  }

  const sid = uuidv4();
  googleAuthStateCache.set(sid, {
    token,
    targetOrigin,
    createdAt: Date.now(),
  });

  const statePayload = Buffer.from(JSON.stringify({ sid }), "utf8").toString("base64url");
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_CONTACTS_SCOPE,
    include_granted_scopes: true,
    state: statePayload,
  });

  return res.redirect(authUrl);
});

app.get("/api/google/callback", async (req, res) => {
  const { code, state, error } = req.query || {};

  let sid = null;
  try {
    if (state) {
      const decoded = JSON.parse(Buffer.from(String(state), "base64url").toString("utf8"));
      sid = decoded.sid;
    }
  } catch {
    sid = null;
  }

  const stateEntry = sid ? googleAuthStateCache.get(sid) : null;
  if (sid) {
    googleAuthStateCache.delete(sid);
  }

  const targetOrigin = stateEntry?.targetOrigin || sanitizeOrigin(process.env.FRONTEND_ORIGIN || "") || "*";

  if (error) {
    return res.type("html").send(
      popupResponseHtml({
        success: false,
        error: String(error),
        targetOrigin,
      }),
    );
  }

  if (!code || !stateEntry) {
    return res.type("html").send(
      popupResponseHtml({
        success: false,
        error: "Invalid or expired Google auth state.",
        targetOrigin,
      }),
    );
  }

  try {
    const oauth2Client = createGoogleOAuthClient(req);
    const { tokens } = await oauth2Client.getToken(String(code));
    oauth2Client.setCredentials(tokens);

    const people = google.people({ version: "v1", auth: oauth2Client });
    const contacts = [];
    let pageToken = undefined;

    do {
      const response = await people.people.connections.list({
        resourceName: "people/me",
        pageSize: 1000,
        pageToken,
        personFields: "names,emailAddresses,phoneNumbers",
      });

      const connections = response.data.connections || [];
      connections.forEach((person) => {
        const name = person.names?.[0]?.displayName || "";
        const email = person.emailAddresses?.[0]?.value || "";
        const phone = person.phoneNumbers?.[0]?.value || "";
        if (!name && !email && !phone) {
          return;
        }
        contacts.push({ name, email, phone });
      });

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    const uniqueContacts = [];
    const seen = new Set();
    contacts.forEach((contact) => {
      const key = `${String(contact.name || "").toLowerCase()}|${String(contact.email || "").toLowerCase()}|${String(contact.phone || "")}`;
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      uniqueContacts.push(contact);
    });

    return res.type("html").send(
      popupResponseHtml({
        success: true,
        contacts: uniqueContacts,
        targetOrigin,
      }),
    );
  } catch (err) {
    const errorMessage = err?.response?.data?.error_description || err?.message || "Google contacts import failed.";
    return res.type("html").send(
      popupResponseHtml({
        success: false,
        error: errorMessage,
        targetOrigin,
      }),
    );
  }
});

// ---- USER ENDPOINTS ----
app.get("/api/user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, error: "Unauthorized" });

  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const user = users.find((u) => u._id === userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  const formatted = formatUserResponse(user);

  res.json({
    success: true,
    data: formatted,
  });
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    let user = users.find((u) => String(u._id) === String(targetId));
    if (!user) {
      user = await User.findById(targetId).lean();
    }
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/user/find-by-contact", (req, res) => {
  const contactId = req.query.contactId;
  const user = users.find((u) => u._id === contactId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

  const formatted = formatUserResponse(user);

  res.json({
    success: true,
    data: formatted,
  });
});

app.put("/api/user/updateProfile", async (req, res) => {
  const { name, dob, address, profileImage, image, country, city, state } = req.body;
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const user = users.find((u) => u._id === userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  const finalImage = profileImage || image;
  const finalCity = city || address?.city;
  const finalState = state || address?.state;

  if (name) user.name = name;
  if (dob) user.dob = dob;
  if (finalImage) user.profileImage = finalImage;
  if (country) user.country = country;
  if (finalCity) user.city = finalCity;
  if (finalState) user.state = finalState;

  if (address || finalCity || finalState) {
    user.address = {
      ...user.address,
      ...address,
      ...(finalCity ? { city: finalCity } : {}),
      ...(finalState ? { state: finalState } : {}),
    };
  }

  try {
    await User.findByIdAndUpdate(user._id, {
      name: user.name,
      dob: user.dob,
      img: user.profileImage,
      country: user.country,
      city: user.city,
      state: user.state,
    });
  } catch (err) {
    console.error("❌ Error updating user profile in MongoDB:", err);
    return res.status(500).json({ success: false, error: "Database error during profile update" });
  }

  const formatted = formatUserResponse(user);

  res.json({
    success: true,
    data: formatted,
    message: "Profile updated successfully",
  });
});

// ---- CONTACTS ENDPOINTS ----
app.get("/api/contacts", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const currentUserDoc = await User.findById(userId);
    if (!currentUserDoc) {
      return res.json({ success: true, data: [] });
    }

    const userContacts = await User.find({ _id: { $in: currentUserDoc.contacts || [] } });
    
    const formattedContacts = userContacts.map((contact) => {
      const formatted = formatUserResponse(contact);
      return {
        ...formatted,
        isFavorite: false,
        is_online: contact.status === "online" || contact.status === "live",
      };
    });

    res.json({
      success: true,
      data: formattedContacts,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/contacts", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    let { userId, name, email, phone, status } = req.body;

    if (!userId && (!name || !email)) {
      return res.status(400).json({ success: false, error: "userId or name and email are required" });
    }

    if (!userId) {
      // Find if user with this email already exists
      let existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        // Create a new placeholder/guest user
        const newId = `u_${uuidv4()}`;
        const newUserObj = {
          _id: newId,
          name,
          email: email.toLowerCase(),
          phone: phone || "",
          password: "temp_password_123", // Dummy password
          role: "user",
          dob: null,
          profileImage: "assets/images/profile.png",
          status: status || "offline",
          is_online: status === "online" || status === "live",
          createdAt: new Date().toISOString(),
        };

        const dbUser = new User({
          _id: newId,
          email: newUserObj.email,
          password: newUserObj.password,
          name: newUserObj.name,
          phone: newUserObj.phone,
          img: newUserObj.profileImage,
          status: newUserObj.status,
          createdAt: new Date(newUserObj.createdAt),
        });
        await dbUser.save();

        // Push to memory cache
        users.push(newUserObj);
        userId = newId;
      } else {
        userId = existingUser._id;
      }
    }

    // Add contactId to current user's contacts list uniquely
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { contacts: userId }
    });

    // Also add current user to contact's contacts list (reciprocal)
    await User.findByIdAndUpdate(userId, {
      $addToSet: { contacts: currentUserId }
    });

    // Emit live contactsUpdated and newNotification socket events to both clients immediately
    const senderStr = String(currentUserId);
    const receiverStr = String(userId);

    io.to(senderStr).to(`user:${senderStr}`).emit("contactsUpdated");
    io.to(receiverStr).to(`user:${receiverStr}`).emit("contactsUpdated");
    io.to(receiverStr).to(`user:${receiverStr}`).emit("newNotification", {
      message: `Contact request received`,
      fromUserId: currentUserId,
    });

    const contactUser = await User.findById(userId);
    res.json({
      success: true,
      data: contactUser ? formatUserResponse(contactUser) : null,
      message: "Contact added successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/contacts/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const results = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    });

    const formatted = results.map((u) => formatUserResponse(u));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/contacts/sync", async (req, res) => {
  try {
    const { contacts: phoneContacts } = req.body;
    const registered = [];
    const unregistered = [];

    const emails = phoneContacts.map(c => c.email).filter(Boolean);
    const foundUsers = await User.find({ email: { $in: emails } });

    phoneContacts.forEach((contact) => {
      const matchingUser = foundUsers.find((u) => u.email.toLowerCase() === String(contact.email).toLowerCase());
      if (matchingUser) {
        registered.push({
          ...matchingUser.toObject(),
          userId: matchingUser._id,
          profileImage: matchingUser.img || "assets/images/profile.png"
        });
      } else {
        unregistered.push(contact);
      }
    });

    res.json({
      success: true,
      data: { registered, unregistered },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/contacts/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const updatedUser = await User.findByIdAndUpdate(id, { name }, { new: true });
    
    res.json({
      success: true,
      data: updatedUser ? { ...updatedUser.toObject(), userId: updatedUser._id } : null,
      message: "Contact updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/contacts/:id/block", async (req, res) => {
  const { id } = req.params;
  // Placeholder block action for production compatibility
  res.json({
    success: true,
    message: "Contact blocked successfully",
  });
});

app.delete("/api/contacts/:id", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { id } = req.params;

    // Remove from contacts array
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { contacts: id }
    });

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- CONTACT REQUESTS & SCENE PURCHASES ----
app.post("/api/contact-requests", async (req, res) => {
  try {
    const senderId = getCurrentUserId(req);
    const { receiverId } = req.body;
    if (!senderId) return res.status(401).json({ success: false, error: "Unauthorized" });
    if (!receiverId) return res.status(422).json({ success: false, error: "receiverId is required" });
    if (senderId === receiverId) return res.status(400).json({ success: false, error: "Cannot send request to yourself" });

    // Check if they are already contacts
    const senderUser = await User.findById(senderId);
    if (senderUser.contacts && senderUser.contacts.includes(receiverId)) {
      return res.status(400).json({ success: false, error: "Already in contacts" });
    }

    const ContactRequest = require("./models/ContactRequest");
    // Check if there is already a pending request
    const existing = await ContactRequest.findOne({ senderId, receiverId, status: "pending" });
    if (existing) {
      return res.status(400).json({ success: false, error: "Request already sent" });
    }

    const request = new ContactRequest({ senderId, receiverId });
    await request.save();

    // Create notification for receiver
    const senderName = senderUser?.name || "Someone";
    const newNotification = new Notification({
      userId: receiverId,
      type: "contact_request",
      message: `${senderName} wants to connect with you`,
      fromUserId: senderId,
      data: { requestId: request._id, senderId },
    });
    await newNotification.save();

    // Emit live notification if receiver is connected
    const recipientSocketId = activeConnections[receiverId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newNotification", {
        message: `${senderName} wants to connect with you`
      });
    }

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/contacts/requests/accept", async (req, res) => {
  try {
    const receiverId = getCurrentUserId(req);
    const { senderId } = req.body;
    if (!receiverId) return res.status(401).json({ success: false, error: "Unauthorized" });
    if (!senderId) return res.status(422).json({ success: false, error: "senderId is required" });

    // Update the contact request if exists
    const ContactRequest = require("./models/ContactRequest");
    const request = await ContactRequest.findOne({ senderId, receiverId, status: "pending" });
    if (request) {
      request.status = "accepted";
      await request.save();
    }

    // Add each other to contacts (both arrays in User and separate Contact models)
    await User.findByIdAndUpdate(receiverId, { $addToSet: { contacts: senderId } });
    await User.findByIdAndUpdate(senderId, { $addToSet: { contacts: receiverId } });

    // Update users memory cache
    const cachedReceiver = users.find(u => u._id === receiverId);
    if (cachedReceiver) {
      if (!cachedReceiver.contacts) cachedReceiver.contacts = [];
      if (!cachedReceiver.contacts.includes(senderId)) cachedReceiver.contacts.push(senderId);
    }
    const cachedSender = users.find(u => u._id === senderId);
    if (cachedSender) {
      if (!cachedSender.contacts) cachedSender.contacts = [];
      if (!cachedSender.contacts.includes(receiverId)) cachedSender.contacts.push(receiverId);
    }

    // Also populate Contact model for index.js compatibility
    const Contact = require("./models/Contact");
    await new Contact({ belongToUserId: receiverId, userId: senderId }).save().catch(() => {});
    await new Contact({ belongToUserId: senderId, userId: receiverId }).save().catch(() => {});

    // Remove notification to prevent it from persisting
    await Notification.deleteMany({
      userId: receiverId,
      fromUserId: senderId,
      type: "contact_request"
    });

    // Emit live contactsUpdated socket event to both clients
    const senderSocketId = activeConnections[senderId];
    if (senderSocketId) io.to(senderSocketId).emit("contactsUpdated");
    const receiverSocketId = activeConnections[receiverId];
    if (receiverSocketId) io.to(receiverSocketId).emit("contactsUpdated");

    res.json({ success: true, message: "Contact request accepted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/contacts/requests/decline", async (req, res) => {
  try {
    const receiverId = getCurrentUserId(req);
    const { senderId } = req.body;
    if (!receiverId) return res.status(401).json({ success: false, error: "Unauthorized" });
    if (!senderId) return res.status(422).json({ success: false, error: "senderId is required" });

    // Update the contact request if exists
    const ContactRequest = require("./models/ContactRequest");
    const request = await ContactRequest.findOne({ senderId, receiverId, status: "pending" });
    if (request) {
      request.status = "rejected";
      await request.save();
    }

    // Remove notification
    await Notification.deleteMany({
      userId: receiverId,
      fromUserId: senderId,
      type: "contact_request"
    });

    res.json({ success: true, message: "Contact request declined" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/user/purchase-scene", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const { sceneId } = req.body;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    if (sceneId === undefined) return res.status(422).json({ success: false, error: "sceneId is required" });

    const numId = Number(sceneId);

    const user = users.find((u) => u._id === userId);
    if (user) {
      user.activeSceneId = numId;
      if (!user.purchasedScenes) user.purchasedScenes = [];
      if (!user.purchasedScenes.includes(numId)) {
        user.purchasedScenes.push(numId);
      }
    }

    // Update DB
    await User.findByIdAndUpdate(userId, {
      activeSceneId: numId,
      selectedSceneId: numId,
      $addToSet: { purchasedScenes: numId }
    });

    res.json({ success: true, message: "Scene equipped successfully", activeSceneId: numId, purchasedScenes: user ? user.purchasedScenes : [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- CHAT ENDPOINTS ----
app.get("/api/chat", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const userId = req.query.userId;
    
    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: userId },
        { from: userId, to: currentUserId }
      ]
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      data: messages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { userId, text, type } = req.body;

    const newMessage = new Message({
      _id: `msg_${uuidv4()}`,
      from: currentUserId,
      to: userId,
      fromUserId: currentUserId,
      toUserId: userId,
      text,
      message: text,
      timestamp: new Date().toISOString(),
      type: type || "text",
      read: false,
    });

    await newMessage.save();

    res.json({
      success: true,
      data: newMessage,
      message: "Message sent successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/chat/recent", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const recentChats = [];
    const seenUsers = new Set();
    
    // Fetch all messages for the current user, sorted newest first
    const messages = await Message.find({
      $or: [{ from: currentUserId }, { to: currentUserId }]
    }).sort({ timestamp: -1 });

    for (const msg of messages) {
      const otherUserId = msg.from === currentUserId ? msg.to : msg.from;

      if (!seenUsers.has(otherUserId)) {
        seenUsers.add(otherUserId);
        const user = await User.findById(otherUserId);
        
        recentChats.push({
          userId: otherUserId,
          name: user?.name || "Unknown",
          profileImage: user?.profileImage || "assets/images/profile.png",
          lastMessage: { text: msg.text, time: moment(msg.timestamp).fromNow() },
          is_online: user?.status === "online" || user?.status === "live",
        });
      }
    }

    res.json({ success: true, data: recentChats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- CALL LOGS ENDPOINTS ----
app.get("/api/voice-call/history", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const calls = await CallLog.find({
      $or: [{ callerId: currentUserId }, { receiverId: currentUserId }]
    }).sort({ startTime: -1 });

    const callHistory = await Promise.all(calls.map(async (call) => {
      const caller = await User.findById(call.callerId);
      const receiver = await User.findById(call.receiverId);

      return {
        _id: call._id,
        caller: caller?.name || "Unknown",
        receiver: receiver?.name || "Unknown",
        type: call.type,
        status: call.status,
        duration: `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`,
        startTime: moment(call.startTime).format("MMM DD, YYYY HH:mm"),
      };
    }));

    res.json({
      success: true,
      data: callHistory,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- FILE UPLOAD ENDPOINT ----
const upload = require("./middlewares/file-upload");
app.post("/api/file-upload", (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error("File Upload Error:", err);
      return res.status(err.code === "AccessDenied" ? 403 : 500).json({
        success: false,
        error: "Upload failed",
        details: err.message,
        code: err.code
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(422).json({ success: false, error: "Please select at least one file to upload" });
    }

    const file = req.files[0];
    res.json({
      success: true,
      photo: file.location,
      name: file.originalname,
      data: {
        filename: file.key,
        url: file.location
      }
    });
  });
});

// ---- STATS ENDPOINTS ----
app.get("/api/stats/currencies", (req, res) => {
  res.json({
    success: true,
    data: {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
    },
  });
});

app.get("/api/stats/weather", (req, res) => {
  const { lat, long } = req.query;
  res.json({
    success: true,
    data: {
      temp: 72,
      condition: "Partly Cloudy",
      humidity: 65,
    },
  });
});

app.get("/api/stats/time", (req, res) => {
  const { q } = req.query;
  res.json({
    success: true,
    data: {
      city: q,
      time: new Date().toISOString(),
      timezone: "UTC-5",
    },
  });
});

app.get("/api/stats/leagues", (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: "Premier League" },
      { id: 2, name: "La Liga" },
      { id: 3, name: "Serie A" },
    ],
  });
});

app.get("/api/stats/news", (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, title: "Latest News 1", date: new Date().toISOString() },
      { id: 2, title: "Latest News 2", date: new Date().toISOString() },
    ],
  });
});

// ---- GEOGRAPHY ENDPOINTS ----
app.get("/api/geography/countries", (req, res) => {
  res.json({
    success: true,
    data: [
      { code: "US", name: "United States" },
      { code: "CA", name: "Canada" },
      { code: "GB", name: "United Kingdom" },
      { code: "AU", name: "Australia" },
    ],
  });
});

app.get("/api/geography/countries/:countrycode/states", (req, res) => {
  const { countrycode } = req.params;

  const statesByCountry = {
    US: [
      { code: "CA", name: "California" },
      { code: "TX", name: "Texas" },
      { code: "NY", name: "New York" },
    ],
    CA: [
      { code: "ON", name: "Ontario" },
      { code: "QC", name: "Quebec" },
    ],
  };

  res.json({
    success: true,
    data: statesByCountry[countrycode] || [],
  });
});

app.get(
  "/api/geography/countries/:countrycode/states/:statecode/cities",
  (req, res) => {
    const { countrycode, statecode } = req.params;

    const citiesByLocation = {
      "US-CA": ["Los Angeles", "San Francisco", "San Diego"],
      "US-TX": ["Dallas", "Houston", "Austin"],
      "US-NY": ["New York City", "Buffalo", "Albany"],
    };

    const key = `${countrycode}-${statecode}`;
    res.json({
      success: true,
      data: citiesByLocation[key] || [],
    });
  },
);

// ---- NOTIFICATION ENDPOINTS ----
app.get("/api/notifications", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      data: notifications,
      total: unreadCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/notifications", async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    await Notification.deleteMany({ userId });

    res.json({
      success: true,
      message: "Notifications cleared",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================
// WEBSOCKET (SOCKET.IO) - Real-time Features
// ========================================

io.on("connection", (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  // Store connection with user ID
  socket.on("authenticate", async (data, callback) => {
    const token = data.token || "";
    const userId = data.userId || token.replace(/^token_/, "");

    activeConnections[userId] = socket.id;
    activeConnections[String(userId)] = socket.id;
    socket.userId = String(userId);
    socket.join(String(userId));
    socket.join(`user:${String(userId)}`);

    console.log(
      `🔐 User ${userId} authenticated with token: ${token?.substring(0, 10)}...`,
    );

    // Update Cache and MongoDB online status
    let user = users.find((u) => u._id === userId);
    if (!user) {
      try {
        const dbU = await User.findById(userId);
        if (dbU) {
          user = {
            _id: dbU._id,
            name: dbU.name,
            email: dbU.email,
            password: dbU.password,
            phone: dbU.phone || "",
            profileImage: dbU.img || "assets/images/profile.png",
            role: dbU._id === "user_123" ? "admin" : "user",
            dob: dbU.dob || null,
            status: "offline",
            is_online: false,
            city: dbU.city || null,
            state: dbU.state || null,
            purchasedScenes: dbU.purchasedScenes || [],
            createdAt: dbU.createdAt ? dbU.createdAt.toISOString() : new Date().toISOString(),
          };
          users.push(user);
        }
      } catch (err) {
        console.error("Cache populate DB error:", err.message);
      }
    }

    if (user) {
      user.status = "online";
      user.is_online = true;
    }

    try {
      await User.findByIdAndUpdate(userId, { status: "online", socketId: socket.id });
      // Broadcast to everyone that this user is now online!
      io.emit("userStatusChanged", { userId, status: "online" });
    } catch (err) {
      console.error("DB Error on authenticate:", err.message);
    }

    if (callback) {
      callback({ statusCode: 200, message: "Authenticated successfully" });
    }
  });

  // ---- STATUS SETTING / STEALTH MODE ----
  socket.on("setStatus", async (data, callback) => {
    try {
      const { status } = data || {};
      const userId = socket.userId;
      if (!userId) return;

      const allowed = ["online", "offline", "invisible", "live"];
      const newStatus = allowed.includes(status) ? status : "online";

      const user = users.find((u) => u._id === userId);
      if (user) {
        user.status = newStatus;
        user.is_online = newStatus === "online" || newStatus === "live";
      }

      await User.findByIdAndUpdate(userId, { status: newStatus });

      if (newStatus === "invisible") {
        // Emit to sender only
        socket.emit("userStatusChanged", { userId, status: "invisible" });
      } else {
        io.emit("userStatusChanged", { userId, status: newStatus });
      }

      if (callback) callback({ success: true });
    } catch (err) {
      console.error("setStatus error:", err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ---- CHAT MESSAGING ----
  socket.on("chatMessage", async (data, callback) => {
    const { toUserId, message, type } = data;
    const fromUserId = socket.userId;
    if (!fromUserId) {
      if (callback) callback({ success: false, error: "Unauthorized" });
      return;
    }

    console.log(
      `💬 Chat Message from ${fromUserId} to ${toUserId} (Type: ${type || "text"}): ${message.substring(0, 60)}...`,
    );

    const msgId = `msg_${uuidv4()}`;
    const timestamp = new Date().toISOString();

    const newMessage = new Message({
      _id: msgId,
      from: fromUserId,
      to: toUserId,
      fromUserId, // Keep for compatibility
      toUserId, // Keep for compatibility
      text: message,
      message, // Keep for compatibility
      timestamp,
      type: type || "text",
    });

    try {
      // Save to database
      await newMessage.save();

      // Create notification for the recipient
      const senderUser = await User.findById(fromUserId);
      const senderName = senderUser?.name || "Someone";
      
      const newNotification = new Notification({
        userId: toUserId,
        message: type === "voice" ? `${senderName} sent you a voice message.` : `${senderName} sent you a message.`,
        type: "message",
        relationUserName: senderName,
        fromUserId: fromUserId,
      });
      await newNotification.save();

      // Send to recipient if they're connected
      const recipientSocketId = activeConnections[toUserId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("incomingMessage", {
          _id: msgId,
          fromUserId,
          userId: fromUserId,
          from: fromUserId,
          message,
          text: message,
          timestamp,
          type: type || "text",
        });
      }

      if (callback) {
        callback({ statusCode: 200, success: true, data: newMessage });
      }
    } catch (err) {
      console.error("Error saving chat message:", err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ---- TYPING INDICATOR ----
  socket.on("typing", (data) => {
    const { toUserId, isTyping } = data;
    const fromUserId = socket.userId;
    if (!fromUserId) return;

    const recipientSocketId = activeConnections[toUserId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("userTyping", {
        userId: fromUserId,
        isTyping,
      });
    }
  });

  // ---- CALL INITIATION ----
  socket.on("initiateCall", async (data, callback) => {
    const { toUser, isVideoEnabled } = data || {};
    const fromUser = socket.userId;
    if (!fromUser) {
      if (callback) callback({ success: false, error: "Unauthorized" });
      return;
    }

    let callerName = "FlyDnA Traveler";
    try {
      const cached = users.find((u) => String(u._id) === String(fromUser));
      if (cached?.name) {
        callerName = cached.name;
      } else {
        const dbU = await User.findById(fromUser).lean();
        if (dbU?.name) callerName = dbU.name;
      }
    } catch (e) {}

    console.log(
      `📞 Call Initiated from ${fromUser} (${callerName}) to ${toUser} (Video: ${isVideoEnabled})`,
    );

    const callData = {
      callId: `call_${uuidv4()}`,
      callerId: String(fromUser),
      receiverId: String(toUser),
      toUser: String(toUser),
      callerName,
      fromUserObj: { name: callerName, _id: String(fromUser) },
      isVideoEnabled: !!isVideoEnabled,
      timestamp: new Date().toISOString(),
    };

    // 1. Send to recipient socket mapping
    const recipientSocketId = activeConnections[toUser] || activeConnections[String(toUser)];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("incomingCall", callData);
      io.to(recipientSocketId).emit("incomingCallHandler", callData);
    }

    // 2. Instant room/user socket iteration to guarantee 0ms delay delivery
    io.sockets.sockets.forEach((s) => {
      if (s.userId && (String(s.userId) === String(toUser) || String(s.userId) === String(toUser).replace("usr_", ""))) {
        s.emit("incomingCall", callData);
        s.emit("incomingCallHandler", callData);
      }
    });

    if (callback) {
      callback({ handlerCode: "SUCCESS", data: callData });
    }
  });

  // ---- CALL ACCEPTANCE ----
  socket.on("incomingCallAcceptEvent", (data, callback) => {
    const { caller, isVideoEnabled } = data || {};
    const calleeId = socket.userId;
    if (!calleeId) {
      if (callback) callback({ success: false, error: "Unauthorized" });
      return;
    }

    console.log(`✅ Call Accepted: ${calleeId} accepted call from ${caller}`);

    const rtcToken = `token_${uuidv4()}`;
    const rtcUid = Math.floor(Math.random() * 1000000);
    const channelId = `call_${Math.random().toString(36).substring(7)}`;

    const acceptPayload = {
      calleeId: String(calleeId),
      callerId: String(caller),
      callerRtcToken: rtcToken,
      callerRtcUid: rtcUid,
      rtcToken,
      rtcUid,
      channelId,
      isVideoEnabled: !!isVideoEnabled,
    };

    // Notify caller via direct socket mapping & socket iteration
    const callerSocketId = activeConnections[caller] || activeConnections[String(caller)];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", acceptPayload);
      io.to(callerSocketId).emit("incomingCallAcceptEventHandler", acceptPayload);
    }

    io.sockets.sockets.forEach((s) => {
      if (s.userId && (String(s.userId) === String(caller) || String(s.userId) === String(caller).replace("usr_", ""))) {
        s.emit("callAccepted", acceptPayload);
        s.emit("incomingCallAcceptEventHandler", acceptPayload);
      }
    });

    if (callback) {
      callback({
        success: true,
        data: acceptPayload,
      });
    }
  });

  // ---- SCENE / BACKDROP SYNC ----
  socket.on("updateUserScene", async (data, callback) => {
    const { sceneId, hatId, contactId } = data || {};
    const userId = socket.userId;
    if (!userId) return;

    console.log(`🎬 User ${userId} updated scene to ${sceneId}, hat to ${hatId}`);

    const numericSceneId = Number(sceneId);

    // Save to memory cache & MongoDB database
    const user = users.find((u) => String(u._id) === String(userId));
    if (user && !isNaN(numericSceneId)) {
      user.activeSceneId = numericSceneId;
    }

    try {
      if (!isNaN(numericSceneId)) {
        await User.findByIdAndUpdate(userId, { activeSceneId: numericSceneId, selectedSceneId: numericSceneId });
      }
    } catch (err) {
      console.warn("DB Error updating user scene:", err.message);
    }

    const payload = {
      userId: String(userId),
      sceneId: numericSceneId,
      hatId,
      contactId,
    };

    // Single broadcast to ALL connected clients — every device picks it up
    io.emit("userSceneChanged", payload);

    if (callback) callback({ success: true });
  });

  socket.on("chatCleared", (data) => {
    const { contactId } = data || {};
    const userId = socket.userId;
    if (!contactId || !userId) return;
    const recipientStr = String(contactId);
    const senderStr = String(userId);
    io.to(recipientStr).to(`user:${recipientStr}`).emit("newNotification", {
      message: `A chat thread was cleared by contact`,
      fromUserId: senderStr,
    });
  });

  // ---- CALL REJECTION ----
  socket.on("incomingCallRejectEvent", (data, callback) => {
    const { callerId } = data;
    const calleeId = socket.userId;
    if (!calleeId) {
      if (callback) callback({ success: false, error: "Unauthorized" });
      return;
    }

    console.log(`❌ Call Rejected: ${calleeId} rejected call from ${callerId}`);

    const callerSocketId = activeConnections[callerId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected", { calleeId });
    }

    if (callback) {
      callback({ success: true });
    }
  });

  // ---- CALL END ----
  socket.on("callEnded", async (data, callback) => {
    const { toUserId, duration } = data;
    const fromUserId = socket.userId;
    if (!fromUserId) {
      if (callback) callback({ success: false, error: "Unauthorized" });
      return;
    }

    console.log(
      `🏁 Call Ended between ${fromUserId} and ${toUserId} (Duration: ${duration}s)`,
    );

    const callLog = new CallLog({
      _id: `call_${uuidv4()}`,
      callerId: fromUserId,
      receiverId: toUserId,
      duration: duration || 0,
      type: "video", // Can be dynamic if data.type is provided
      status: "completed",
      startTime: moment().subtract(duration || 0, "seconds").toISOString(),
      endTime: new Date().toISOString(),
    });

    try {
      await callLog.save();

      const recipientSocketId = activeConnections[toUserId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("callEnded", { fromUserId, duration });
      }

      if (callback) {
        callback({ success: true });
      }
    } catch (err) {
      console.error("Error saving call log:", err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ---- TYPING INDICATOR ----
  socket.on("typeIndication", (data) => {
    const { toUserId, isTyping } = data;
    const fromUserId = socket.userId;
    if (!fromUserId) return;

    const recipientSocketId = activeConnections[toUserId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("typingIndicator", {
        fromUserId,
        isTyping,
      });
    }
  });

  // ---- ONLINE USER STATUS ----
  socket.on("emitGetOnlineUserEvent", async (data, callback) => {
    try {
      const onlineUsers = await User.find({ status: { $in: ["online", "live"] } }).select("_id");
      const onlineIds = onlineUsers.map((u) => u._id);
      if (callback) {
        callback({ success: true, data: onlineIds });
      }
    } catch (err) {
      console.error("Error fetching online users:", err.message);
      if (callback) callback({ success: false, data: [] });
    }
  });

  // ---- DISCONNECT ----
  socket.on("disconnect", async () => {
    console.log(`👋 User Disconnected: ${socket.id}`);

    // Remove from active connections
    if (socket.userId) {
      delete activeConnections[socket.userId];

      // Update MongoDB offline status
      try {
        await User.findByIdAndUpdate(socket.userId, { status: "offline", socketId: null });
        // Broadcast to everyone that this user is now offline
        io.emit("userStatusChanged", { userId: socket.userId, status: "offline" });
      } catch (err) {
        console.error("DB Error on disconnect:", err.message);
      }
    }
  });

  // ---- LOGOUT EVENT ----
  socket.on("logoutEvent", async (data, callback) => {
    const userId = socket.userId;
    if (!userId) {
      if (callback) callback({ success: false, error: "Unauthorized" });
      return;
    }
    delete activeConnections[userId];

    console.log(`🚪 User ${userId} logged out`);

    // Update MongoDB offline status
    try {
      await User.findByIdAndUpdate(userId, { status: "offline", socketId: null });
      io.emit("userStatusChanged", { userId, status: "offline" });
    } catch (err) {
      console.error("DB Error on logout:", err.message);
    }

    if (callback) {
      callback({ success: true });
    }
  });
});

// ========================================
// STRIPE PAYMENT API
// ========================================

app.post("/create-payment-intent", async (req, res) => {
  const { items, currency } = req.body;

  try {
    // In a real app, calculate order total based on items securely on the backend
    const amount = 5000; // $50.00 in cents

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || "usd",
      // Optional: add automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// ========================================
// DEBUG ENDPOINTS
// ========================================
app.get("/api/debug/call", (req, res) => {
  const callerId = req.query.caller || "u1";
  const calleeId = req.query.callee || "user_123";
  const isVideo = req.query.video !== "false"; // Default to true

  const callData = {
    callId: `call_${uuidv4()}`,
    callerId: callerId,
    receiverId: calleeId,
    isVideoEnabled: isVideo,
    timestamp: new Date().toISOString(),
  };

  // Broadcast to all connected sockets to guarantee it hits the frontend
  io.emit("incomingCall", callData);
  res.json({ success: true, message: `Call from ${callerId} dispatched to everyone!` });
});

// ========================================
// SERVER STARTUP
// ========================================

const PORT = process.env.PORT || process.env.APP_PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`🚀 Production-Ready Dummy Backend Active`);
  console.log(`🚀 Running on http://127.0.0.1:${PORT}`);
  console.log(`🚀 Socket.IO listening for real-time connections`);
  console.log(`🚀 Ready to serve: Chat, Calls, Contacts, Stats`);
  console.log(`🚀 ========================================\n`);
  console.log("📝 IMPORTANT:");
  console.log("   - When integrating real backend, replace API endpoints");
  console.log("   - Frontend logic remains unchanged");
  console.log("   - Chat sender logic uses receiverId 'u1', 'u2', etc.");
  console.log(
    "   - Backend will seamlessly replace bot responses with real users\n",
  );
});

// ---- GROUP CHAT ENDPOINTS ----
app.post("/api/groups/create", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { groupName, memberIds = [] } = req.body;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ success: false, error: "groupName is required" });
    }

    const uniqueMembers = Array.from(new Set([currentUserId, ...memberIds]));
    const Group = require('./models/Group');

    const group = await Group.create({
      groupName: groupName.trim(),
      creatorId: currentUserId,
      memberIds: uniqueMembers,
      adminIds: [currentUserId],
    });

    if (req.io) {
      uniqueMembers.forEach((userId) => {
        req.io.to(`user:${userId}`).emit('groupCreated', group);
        req.io.in(`user:${userId}`).socketsJoin(String(group._id));
      });
    }

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/groups", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    
    const Group = require('./models/Group');
    const groups = await Group.find({ memberIds: currentUserId }).sort({ updatedAt: -1 });

    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/groups/:groupId/messages", async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const { groupId } = req.params;
    const { before, limit = 50 } = req.query;

    const Group = require('./models/Group');
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, error: "Group not found" });
    if (!group.memberIds.map(String).includes(currentUserId)) {
      return res.status(403).json({ success: false, error: "Not a member of this group" });
    }

    const query = { groupId };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100));

    res.json({ success: true, data: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- CALENDAR EVENTS ENDPOINT ----
app.get("/api/calendar/events", async (req, res) => {
  try {
    const { city, startDate, endDate, keyword } = req.query;
    const apiKey = process.env.TICKETMASTER_API_KEY;
    const params = new URLSearchParams({
      apikey: apiKey,
      city: city || 'Atlanta',
      size: 50,
      sort: 'date,asc'
    });
    if (keyword) params.append('keyword', keyword);
    params.delete('sort');
    params.append('sort', 'date,asc');
    if (startDate) params.append('startDateTime', `${startDate}T00:00:00Z`);
    if (endDate) params.append('endDateTime', `${endDate}T23:59:59Z`);
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
    const response = await axios.get(url);
    const data = response.data;
    const events = (data._embedded?.events || [])
      .filter(e => {
        const v = e._embedded?.venues?.[0]?.name || '';
        if (/test/i.test(e.name || '')) return false;
        if (v === 'Ticketmaster Test Arena') return false;
        if ((e.url || '').includes('universe.com')) return false;
        return true;
      })
      .map(event => {
        const venue = event._embedded?.venues?.[0];
        return {
          id: event.id,
          name: event.name,
          date: event.dates?.start?.localDate,
          time: event.dates?.start?.localTime,
          venue: venue?.name,
          city: venue?.city?.name,
          lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
          lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null,
          image: event.images?.[0]?.url,
          url: event.url,
          priceMin: event.priceRanges?.[0]?.min,
          priceMax: event.priceRanges?.[0]?.max,
          category: event.classifications?.[0]?.segment?.name
        };
      });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount modular v1 API routes for local testing parity with index.js
const verifyToken = (req, res, next) => {
  // simple token verify fallback for server.js
  next();
};
app.use('/api/v1/flights', require('./routes/flights.routes'));
app.use('/api/v1/hotels', require('./routes/hotels.routes'));
app.use('/api/v1/bookings', require('./routes/bookings.routes'));
app.use('/api/v1/venue-inquiries', require('./routes/venueInquiry.routes'));
app.use('/api/v1/nasc/tickets', require('./routes/nascTickets.routes'));
app.use('/api/v1/payments', require('./routes/payments.routes'));
