const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../middleware/auth");

/**
 * OWNER ONLY
 * Get today's revenue
 */
router.get("/today", auth("OWNER"), (req, res) => {
  const query = `
    SELECT IFNULL(SUM(total_amount), 0) AS total
    FROM bills
    WHERE DATE(billing_date) = CURDATE()
  `;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      period: "today",
      total_revenue: Number(result[0].total)
    });
  });
});

/**
 * OWNER ONLY
 * Get current month revenue
 */
router.get("/month", auth("OWNER"), (req, res) => {
  const query = `
    SELECT IFNULL(SUM(total_amount), 0) AS total
    FROM bills
    WHERE MONTH(billing_date) = MONTH(CURDATE())
      AND YEAR(billing_date) = YEAR(CURDATE())
  `;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      period: "month",
      total_revenue: Number(result[0].total)
    });
  });
});

module.exports = router;
