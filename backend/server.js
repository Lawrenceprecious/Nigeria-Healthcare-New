require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : true }));
app.use(express.json({ limit: "100kb" }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["patient", "provider", "admin"], default: "patient" }
}, { timestamps: true });

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, enum: ["Hospital", "Clinic", "Doctor", "Pharmacy", "Laboratory"], required: true },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  area: { type: String, trim: true, maxlength: 100 },
  address: { type: String, trim: true, maxlength: 300 },
  phone: { type: String, trim: true, maxlength: 30 },
  email: { type: String, trim: true, lowercase: true, maxlength: 160 },
  services: [{ type: String, maxlength: 100 }],
  verified: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, enum: ["Morning", "Afternoon", "Evening"], required: true },
  generalReason: { type: String, trim: true, maxlength: 300 },
  status: { type: String, enum: ["requested", "confirmed", "cancelled", "completed"], default: "requested" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Facility = mongoose.model("Facility", facilitySchema);
const Appointment = mongoose.model("Appointment", appointmentSchema);

function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Authentication required." });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ error: "You do not have permission for this action." });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired session." });
    }
  };
}

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "HealthConnect Nigeria API" }));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password are required." });
    if (String(password).length < 10) return res.status(400).json({ error: "Use a password with at least 10 characters." });
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: "patient" });
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: "2h" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "An account with this email already exists." });
    console.error(err);
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    const token = jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not log in." });
  }
});

app.get("/api/facilities", async (req, res) => {
  try {
    const filter = { verified: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.city) filter.city = new RegExp(String(req.query.city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (req.query.q) filter.$or = [
      { name: new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { services: new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
    ];
    const facilities = await Facility.find(filter).select("-__v").sort({ name: 1 }).limit(100);
    res.json({ facilities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not retrieve facilities." });
  }
});

app.post("/api/facilities", auth(["provider", "admin"]), async (req, res) => {
  try {
    const { name, category, city, area, address, phone, email, services } = req.body || {};
    if (!name || !category || !city) return res.status(400).json({ error: "Name, category and city are required." });
    const facility = await Facility.create({
      name, category, city, area, address, phone, email,
      services: Array.isArray(services) ? services.slice(0, 30) : [],
      verified: false,
      owner: req.user.sub
    });
    res.status(201).json({ facility, message: "Facility submitted for administrator review." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit facility." });
  }
});

app.post("/api/appointments", auth(), async (req, res) => {
  try {
    const { facilityId, preferredDate, preferredTime, generalReason } = req.body || {};
    if (!mongoose.isValidObjectId(facilityId) || !preferredDate || !preferredTime) {
      return res.status(400).json({ error: "A valid facility, preferred date and preferred time are required." });
    }
    const facility = await Facility.findOne({ _id: facilityId, verified: true });
    if (!facility) return res.status(404).json({ error: "Verified facility not found." });
    const date = new Date(preferredDate);
    if (Number.isNaN(date.getTime()) || date < new Date(new Date().toDateString())) {
      return res.status(400).json({ error: "Choose a valid future date." });
    }
    const appointment = await Appointment.create({
      patient: req.user.sub, facility: facility._id, preferredDate: date,
      preferredTime, generalReason: String(generalReason || "").slice(0, 300)
    });
    res.status(201).json({ appointment, message: "Appointment request submitted. The facility must confirm it." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not submit appointment request." });
  }
});

app.get("/api/appointments/mine", auth(), async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.sub })
      .populate("facility", "name city category phone").sort({ createdAt: -1 }).limit(100);
    res.json({ appointments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not retrieve appointment requests." });
  }
});

async function start() {
  if (!JWT_SECRET) {
    console.error("Missing JWT_SECRET. Copy .env.example to .env and set a long random JWT_SECRET.");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI. Set it in your .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");
    app.listen(PORT, () => console.log(`HealthConnect API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
}
start();
