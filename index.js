const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db"); // single DB import

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= ENSURE DEFAULT USERS ================= */
async function ensureDefaultUsers() {
  const passwordHash = await bcrypt.hash("123456", 10);

  const users = [
    { username: "owner", role: "OWNER" },
    { username: "waiter", role: "WAITER" },
  ];

  for (const user of users) {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [user.username]
    );

    if (rows.length === 0) {
      await db.query(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [user.username, passwordHash, user.role]
      );
      console.log(`✅ Created user: ${user.username}`);
    } else {
      await db.query(
        "UPDATE users SET password = ? WHERE username = ?",
        [passwordHash, user.username]
      );
      console.log(`🔁 Reset password for: ${user.username}`);
    }
  }
}

/* ================= ROUTES ================= */
app.use("/api/tables", require("./routes/tables"));
app.use("/api/menu", require("./routes/menu"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/revenue", require("./routes/revenue"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/excel", require("./routes/excel"));

/* ================= START SERVER ================= */
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    await ensureDefaultUsers();
    console.log("👤 Default users ensured");
  } catch (err) {
    console.error("❌ Error ensuring users:", err.message);
  }
});
