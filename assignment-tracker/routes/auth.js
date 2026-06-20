const express = require("express");
const router = express.Router();
const { readData } = require("../db");

router.get("/", (req, res) => {
  res.render("home");
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password;

  const users = await readData("users");

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
  req.session.reset();
  res.redirect("/");
});

module.exports = router;
