const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 👉 Serve static files
app.use(express.static(path.join(__dirname, "public")));

// 👉 Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------- MongoDB Connection ---------------------
mongoose.connect(
  "mongodb+srv://mohan:mohanmongo11@cluster0.77a0nem.mongodb.net/pastproject",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB Error:", err));

// --------------------- User Schema ---------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// --------------------- Project Schema ---------------------
const projectSchema = new mongoose.Schema({
  title: String,
  year: String,
  tech: String,
  contributors: String,
  summary: String,
  category: String,
  github: String,
  filePath: String,
  username: String,
  createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model("Project", projectSchema);

// --------------------- Multer Config ---------------------
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// --------------------- Signup Route ---------------------
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error signing up" });
  }
});

// --------------------- Login Route ---------------------
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }
    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
});

// --------------------- Submit Project Route ---------------------
app.post("/submit-project", upload.single("file"), async (req, res) => {
  try {
    const { title, year, tech, contributors, summary, category, github, username } = req.body;
    const newProject = new Project({
      title,
      year,
      tech,
      contributors,
      summary,
      category,
      github,
      username,
      filePath: req.file ? `/uploads/${req.file.filename}` : null
    });
    await newProject.save();
    res.json({ message: "✅ Project submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error submitting project" });
  }
});

// --------------------- Get All Projects Route ---------------------
app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// --------------------- Get All Users Route (NEW - REQUIRED) ---------------------
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // exclude passwords for security
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// --------------------- Root Route ---------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// --------------------- Start Server ---------------------
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
