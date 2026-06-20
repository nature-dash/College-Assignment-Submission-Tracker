const express = require("express");
const bodyParser = require("body-parser");
const clientSessions = require("client-sessions");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(clientSessions({
  cookieName: "session",
  secret: "college-assignment-secret",
  duration: 24 * 60 * 60 * 1000,
  activeDuration: 1000 * 60 * 5
}));

app.set("view engine", "ejs");

app.use("/", require("./routes/auth"));
app.use("/teacher", require("./routes/teacher"));
app.use("/student", require("./routes/student"));
app.use("/admin", require("./routes/admin"));

if (!process.env.NETLIFY) {
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}

module.exports = app;
