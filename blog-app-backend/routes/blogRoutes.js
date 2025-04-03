const express = require("express");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Get all blogs (default)
router.get("/", async (req, res) => {
  try {
    const blogs = await pool.query("SELECT * FROM blogs ORDER BY created_at DESC");
    res.json(blogs.rows);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all blogs with pagination (public access)
router.get("/public", async (req, res) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1; // Default to page 1
  limit = parseInt(limit) || 5; // Default to 5 blogs per page
  const offset = (page - 1) * limit;

  try {
    console.log(`Fetching blogs: page=${page}, limit=${limit}, offset=${offset}`);

    const blogs = await pool.query(
      "SELECT * FROM blogs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    const countResult = await pool.query("SELECT COUNT(*) FROM blogs");
    const totalBlogs = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({ blogs: blogs.rows, totalPages, currentPage: page });
  } catch (err) {
    console.error("Error fetching public blogs:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Get a single blog by ID (must be below `/public`)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Validate that ID is a number
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid blog ID" });
  }

  try {
    const blog = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);

    if (blog.rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog.rows[0]);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Create a new blog (only for logged-in users)
router.post("/", authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: No user ID found" });
  }

  try {
    const newBlog = await pool.query(
      "INSERT INTO blogs (title, content, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, content, userId]
    );
    res.status(201).json(newBlog.rows[0]);
  } catch (err) {
    console.error("Error in blog creation:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update a blog (only for logged-in users)
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user?.id;

  try {
    const blog = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);

    if (blog.rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only edit your own blogs" });
    }

    const updatedBlog = await pool.query(
      "UPDATE blogs SET title = $1, content = $2 WHERE id = $3 RETURNING *",
      [title, content, id]
    );

    res.json(updatedBlog.rows[0]);
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete a blog (only for logged-in users)
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const blog = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);

    if (blog.rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.rows[0].user_id !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only delete your own blogs" });
    }

    await pool.query("DELETE FROM blogs WHERE id = $1", [id]);

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
