const express = require("express");
const router = express.Router();
const { readData } = require("./util");

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = readData("users");
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.user = user;
  res.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const users = readData("users");
  const user = users.find(u => u.id === req.session.user.id);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  req.session.user = user;
  res.json({ user });
});

router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

module.exports = router;
