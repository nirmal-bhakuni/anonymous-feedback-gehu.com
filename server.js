const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "your-secret-key", // Change this for production
    resave: false,
    saveUninitialized: true,
  })
);

const FEEDBACK_FILE = path.join(__dirname, "feedbacks.json");
if (!fs.existsSync(FEEDBACK_FILE)) fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([]));

// Admin credentials 
const ADMIN_CREDENTIALS = { username: "admin", password: "password" };
// Route to handle feedback form submission
app.post("/submit-feedback", (req, res) => {
  const { category, message } = req.body;

  if (!category || !message) {
    return res.status(400).send("Category and message are required.");
  }

  const feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE, "utf-8"));
  const newFeedback = {
    id: feedbacks.length + 1,
    category,
    message,
    timestamp: new Date().toISOString(),
  };

  feedbacks.push(newFeedback);
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2));
  res.sendFile(path.join(__dirname, "views", "thank-you.html"));

});

// Routes
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-login.html"));
});

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    req.session.isAdmin = true;
    res.redirect("/admin-dashboard");
  } else {
    res.send("Invalid credentials. <a href='/admin-login'>Try again</a>");
  }
}); 

app.get("/admin-dashboard", (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect("/admin-login");
  }
  res.sendFile(path.join(__dirname, "views", "admin-dashboard.html"));
});

// API to fetch feedbacks
app.get("/api/feedbacks", (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE, "utf-8"));
  res.json(feedbacks);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Serve the homepage (feedback submission form)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
