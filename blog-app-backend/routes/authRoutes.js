const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered", user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login user
// Login user
// Login user
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      console.log("Login Request Received:", { email, password });
  
      // Check if user exists
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      console.log("User Query Result:", user.rows);
  
      if (user.rows.length === 0) {
        console.log("User not found");
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // Compare passwords
      const isValid = await bcrypt.compare(password, user.rows[0].password);
      console.log("Password Match:", isValid);
  
      if (!isValid) {
        console.log("Invalid password");
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // Generate token
      const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      console.log("Generated Token:", token);
  
      res.json({ token, user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email } });
  
    } catch (err) {
      console.error("Login Error:", err);  // This will print the exact error
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
module.exports = router;
