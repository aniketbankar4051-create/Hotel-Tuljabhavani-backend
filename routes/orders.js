const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE or GET active order
router.post("/create", (req, res) => {
  const { table_id } = req.body;
  if (!table_id) return res.status(400).json({ error: "table_id is required" });

  const checkQuery = `
    SELECT * FROM orders
    WHERE table_id = ? AND order_status = 'OPEN'
    LIMIT 1
  `;

  db.query(checkQuery, [table_id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0) return res.json(results[0]);

    db.query(
      `INSERT INTO orders (table_id) VALUES (?)`,
      [table_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ id: result.insertId, table_id, order_status: "OPEN" });
      }
    );
  });
});

// ADD item to order
router.post("/add-item", (req, res) => {
  const { order_id, menu_item_id, quantity } = req.body;
  if (!order_id || !menu_item_id || !quantity)
    return res.status(400).json({ error: "Missing required fields" });

  db.query(
    `SELECT price FROM menu_items WHERE id = ?`,
    [menu_item_id],
    (err, priceResult) => {
      if (err || priceResult.length === 0)
        return res.status(500).json({ error: "Menu item not found" });

      const price = priceResult[0].price;

      db.query(
        `SELECT * FROM order_items WHERE order_id = ? AND menu_item_id = ?`,
        [order_id, menu_item_id],
        (err, itemResult) => {
          if (err) return res.status(500).json({ error: "Database error" });

          if (itemResult.length > 0) {
            db.query(
              `UPDATE order_items SET quantity = quantity + ? WHERE id = ?`,
              [quantity, itemResult[0].id],
              () => res.json({ message: "Item quantity updated" })
            );
          } else {
            db.query(
              `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
               VALUES (?, ?, ?, ?)`,
              [order_id, menu_item_id, quantity, price],
              () => res.json({ message: "Item added to order" })
            );
          }
        }
      );
    }
  );
});

// GET order details + total
router.get("/:order_id", (req, res) => {
  const order_id = req.params.order_id;

  const query = `
    SELECT o.table_id, m.item_name, oi.quantity, oi.price,
           (oi.quantity * oi.price) AS item_total
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE o.id = ?
  `;

  db.query(query, [order_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });

   let total = 0;
const items = rows.map(r => {
  const itemTotal = Number(r.item_total); // 🔥 FIX
  total += itemTotal;

  return {
    item_name: r.item_name,
    quantity: r.quantity,
    price: Number(r.price),
    item_total: itemTotal
  };
});


    res.json({
      order_id: Number(order_id),
      table_id: rows.length ? rows[0].table_id : null,
      items,
      total_amount: total
    });
  });
});

// GENERATE FINAL BILL
router.post("/:order_id/bill", (req, res) => {
  const order_id = req.params.order_id;

  const totalQuery = `
    SELECT SUM(quantity * price) AS total
    FROM order_items
    WHERE order_id = ?
  `;

  db.query(totalQuery, [order_id], (err, result) => {
    if (err || !result[0].total)
      return res.status(400).json({ error: "No items in order" });

    const total = result[0].total;

    // Save bill
    db.query(
      `INSERT INTO bills (order_id, total_amount) VALUES (?, ?)`,
      [order_id, total],
      () => {
        // Close order
        db.query(
          `UPDATE orders SET order_status = 'CLOSED' WHERE id = ?`,
          [order_id]
        );

        // Free table
        db.query(
          `UPDATE hotel_tables SET status = 'EMPTY'
           WHERE id = (SELECT table_id FROM orders WHERE id = ?)`,
          [order_id]
        );

        res.json({
          message: "Bill generated successfully",
          order_id,
          total_amount: total
        });
      }
    );
  });
});

module.exports = router;
