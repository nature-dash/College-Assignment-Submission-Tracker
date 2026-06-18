const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "college-assignment-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.set("view engine", "ejs");

app.use("/", require("./routes/auth"));
app.use("/teacher", require("./routes/teacher"));
app.use("/student", require("./routes/student"));
app.use("/admin", require("./routes/admin"));

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});