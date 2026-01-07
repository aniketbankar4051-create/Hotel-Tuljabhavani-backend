const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all hotel tables
router.get("/", (req, res) => {
  const query = "SELECT * FROM hotel_tables ORDER BY table_number";

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

module.exports = router;
