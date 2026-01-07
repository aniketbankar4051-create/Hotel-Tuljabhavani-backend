const bcrypt = require("bcryptjs");
const db = require("./db");

const users = [
  { username: "owner", password: "owner123" },
  { username: "waiter", password: "waiter123" }
];

async function hashPasswords() {
  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);

    db.query(
      "UPDATE users SET password = ? WHERE username = ?",
      [hashed, user.username],
      (err) => {
        if (err) console.error(err);
        else console.log(`Password hashed for ${user.username}`);
      }
    );
  }
}

hashPasswords();
