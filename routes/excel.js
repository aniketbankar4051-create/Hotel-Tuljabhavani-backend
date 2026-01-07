const express = require("express");
const router = express.Router();
const db = require("../db");
const ExcelJS = require("exceljs");
const auth = require("../middleware/auth");

// Helper to build Excel
async function buildExcel(res, title, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");

  sheet.addRow([title]);
  sheet.addRow([]);
  sheet.addRow(["Date", "Order ID", "Amount"]);

  rows.forEach(r => {
    sheet.addRow([
      r.billing_date.toISOString().slice(0, 10),
      r.order_id,
      Number(r.total_amount)
    ]);
  });

  const total = rows.reduce((sum, r) => sum + Number(r.total_amount), 0);
  sheet.addRow([]);
  sheet.addRow(["TOTAL", "", total]);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title.replace(" ", "_")}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
}

// OWNER ONLY — Daily Excel
router.get("/daily", auth("OWNER"), (req, res) => {
  const query = `
    SELECT order_id, total_amount, billing_date
    FROM bills
    WHERE DATE(billing_date) = CURDATE()
  `;

  db.query(query, async (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    await buildExcel(res, "Daily_Revenue", rows);
  });
});

// OWNER ONLY — Monthly Excel
router.get("/monthly", auth("OWNER"), (req, res) => {
  const query = `
    SELECT order_id, total_amount, billing_date
    FROM bills
    WHERE MONTH(billing_date) = MONTH(CURDATE())
      AND YEAR(billing_date) = YEAR(CURDATE())
  `;

  db.query(query, async (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    await buildExcel(res, "Monthly_Revenue", rows);
  });
});

module.exports = router;
