const express = require("express");
const router = express.Router();
const fs = require("fs");

function readData(file) {
  try {
    const data = fs.readFileSync(`./data/${file}.json`);
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

router.get("/", (req, res) => {
  res.render("home");
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password;

  const users = readData("users");

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.render("login", {
      error: "Invalid credentials"
    });
  }

  req.session.user = user;

  if (user.role === "admin") {
    return res.redirect("/admin");
  }

  if (user.role === "teacher") {
    return res.redirect("/teacher");
  }

  res.redirect("/student");
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;