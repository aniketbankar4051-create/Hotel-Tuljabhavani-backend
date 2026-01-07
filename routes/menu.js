const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all active menu items
router.get("/", (req, res) => {
  const query = `
    SELECT id, item_name, price 
    FROM menu_items 
    WHERE is_active = TRUE
    ORDER BY item_name
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

module.exports = router;
