const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect(
  "mongodb+srv://mohan:mohanmongo11@cluster0.77a0nem.mongodb.net/pastproject"
)
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB Error:", err));

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Project schema and model updated to store file data and type
const projectSchema = new mongoose.Schema({
  title: String,
  year: String,
  tech: String,
  contributors: String,
  summary: String,
  category: String,
  github: String,
  username: String,
  fileData: Buffer,
  fileContentType: String,
  createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model("Project", projectSchema);

// Multer memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Signup route
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

// Login route
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

// Submit project route saving file buffer and content type in DB
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
      fileData: req.file ? req.file.buffer : null,
      fileContentType: req.file ? req.file.mimetype : null
    });
    await newProject.save();
    res.json({ message: "✅ Project submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error submitting project" });
  }
});

// Get all projects (omitting file data for lighter response)
app.get("/projects", async (req, res) => {
  try {
    // Exclude fileData field in the list response to reduce payload
    const projects = await Project.find().sort({ createdAt: -1 }).select("-fileData");
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching projects" });
  }
});

// Route to download/display a project file by project ID
app.get("/project-file/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select("fileData fileContentType title");
    if (!project || !project.fileData) {
      return res.status(404).json({ message: "File not found" });
    }
    res.set("Content-Type", project.fileContentType);
    res.set("Content-Disposition", `attachment; filename="${project.title}-document"`);
    res.send(project.fileData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving file" });
  }
});

// Get all users route
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // exclude passwords
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
