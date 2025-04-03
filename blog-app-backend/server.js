const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

require("dotenv").config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/blogs", blogRoutes);
// Add this root route to test if the server is working
app.get("/", (req, res) => {
  res.send("Welcome to the Blog Application API!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
