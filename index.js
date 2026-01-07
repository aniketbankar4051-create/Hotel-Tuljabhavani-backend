const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
require("./db");

// Routes
const tablesRoute = require("./routes/tables");
const menuRoute = require("./routes/menu");
const ordersRoute = require("./routes/orders");
const revenueRoute = require("./routes/revenue");
const authRoute = require("./routes/auth");
const excelRoute = require("./routes/excel");
app.use("/api/excel", excelRoute);
app.use("/api/auth", authRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/tables", tablesRoute);
app.use("/api/menu", menuRoute);
app.use("/api/revenue", revenueRoute);

// Test route
app.get("/", (req, res) => {
  res.send("Hotel TULJABHAVANI Backend Running");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
