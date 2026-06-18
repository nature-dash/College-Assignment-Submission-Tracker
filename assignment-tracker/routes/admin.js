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

function writeData(file, data) {
  fs.writeFileSync(`./data/${file}.json`, JSON.stringify(data, null, 2));
}

// Authentication middleware
router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  next();
});

// Dashboard
router.get("/", (req, res) => {
  let assignments = readData("assignments");
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = readData("submissions");

  const { department, year, subject, taskStatus } = req.query;

  if (department && department !== 'All Departments') {
    assignments = assignments.filter(a => a.department === department);
  }
  if (year && year !== 'All Years') {
    assignments = assignments.filter(a => a.year == year);
  }
  if (subject && subject !== 'All Subjects') {
    assignments = assignments.filter(a => a.subject === subject);
  }

  let submittedCount = 0;
  let pendingCount = 0;
  let lateCount = 0;
  let totalTasks = 0;
  const allTasks = [];

  const assignmentsWithProgress = assignments.map(a => {
    const applicableStudents = students.filter(s => s.department === a.department && s.year == a.year);
    const totalStudents = applicableStudents.length;
    let submittedStudents = 0;
    
    applicableStudents.forEach(s => {
      totalTasks++;
      const sub = submissions.find(sub => sub.assignmentId == a.id && sub.studentId == s.id);
      let status = "Pending";
      const isPastDue = new Date() > new Date(a.dueDate);
      
      if (sub) {
        submittedCount++;
        submittedStudents++;
        status = "Submitted";
      } else {
        if (isPastDue) { lateCount++; status = "Late"; }
        else { pendingCount++; status = "Pending"; }
      }
      allTasks.push({ student: s, assignment: a, status, submission: sub });
    });
    return { ...a, submittedStudents, totalStudents };
  });

  let displayTasks = null;
  if (taskStatus) {
    displayTasks = allTasks.filter(t => t.status === taskStatus);
    if (department && department !== 'All Departments') {
      displayTasks = displayTasks.filter(t => t.assignment.department === department);
    }
    if (year && year !== 'All Years') {
      displayTasks = displayTasks.filter(t => t.assignment.year == year);
    }
    if (subject && subject !== 'All Subjects') {
      displayTasks = displayTasks.filter(t => t.assignment.subject === subject);
    }
  }

  res.render("admin/dashboard", {
    user: req.session.user,
    assignments: assignmentsWithProgress,
    displayTasks,
    totalTasks,
    submittedCount,
    pendingCount,
    lateCount,
    filters: req.query || {}
  });
});

// Users Management
router.get("/users", (req, res) => {
  const users = readData("users");
  const { role, level, department } = req.query;
  let filteredUsers = users.filter(u => u.role !== 'admin');
  if (role && role !== 'All Roles') {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }
  if (level && level !== 'All Levels') {
    filteredUsers = filteredUsers.filter(u => u.level === level);
  }
  if (department && department !== 'All Departments') {
    filteredUsers = filteredUsers.filter(u => u.department === department);
  }
  const ref = req.query.ref || '';
  res.render("admin/users", { users: filteredUsers, filters: req.query || {}, ref });
});

// Add User (GET)
router.get("/users/add", (req, res) => {
  const ref = req.query.ref || '';
  const config = readConfig();
  res.render("admin/addUser", { ref, config });
});

// Add User (POST)
router.post("/users/add", (req, res) => {
  let users = readData("users");
  const newUser = {
    id: Date.now(),
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
    name: req.body.name
  };
  if (req.body.role === 'student') {
    newUser.department = req.body.department;
    newUser.year = Number(req.body.year);
    newUser.level = req.body.level;
  }
  users.push(newUser);
  writeData("users", users);
  res.redirect("/admin/users");
});

// Edit User (GET)
router.get("/users/edit/:id", (req, res) => {
  const users = readData("users");
  const editUser = users.find(u => u.id == req.params.id);
  if (!editUser) return res.redirect("/admin/users");
  const ref = req.query.ref || '';
  const config = readConfig();
  res.render("admin/editUser", { editUser, ref, config });
});

// Edit User (POST)
router.post("/users/edit/:id", (req, res) => {
  let users = readData("users");
  const index = users.findIndex(u => u.id == req.params.id);
  if (index !== -1) {
    users[index].username = req.body.username;
    users[index].password = req.body.password;
    users[index].name = req.body.name;
    if (users[index].role === 'student') {
      users[index].department = req.body.department;
      users[index].year = Number(req.body.year);
      users[index].level = req.body.level;
    }
    writeData("users", users);
  }
  res.redirect("/admin/users");
});

// Remove User (POST)
router.post("/users/remove/:id", (req, res) => {
  let users = readData("users");
  users = users.filter(u => u.id != req.params.id);
  writeData("users", users);
  res.redirect("/admin/users");
});

// Calendar
router.get("/calendar", (req, res) => {
  const assignments = readData("assignments");
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = readData("submissions");
  const ref = req.query.ref || '';
  res.render("admin/calendar", { assignments, students, submissions, ref });
});

// View Assignment (read-only)
router.get("/view/:id", (req, res) => {
  const assignments = readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.redirect("/admin");
  
  const users = readData("users");
  const students = users.filter(u => u.role === "student" && u.department === assignment.department && u.year == assignment.year);
  const submissions = readData("submissions");
  
  const studentSubmissions = students.map(s => {
    const sub = submissions.find(sub => sub.assignmentId == assignment.id && sub.studentId == s.id);
    return { student: s, submission: sub };
  });

  const ref = req.query.ref || '';
  res.render("admin/viewAssignment", { assignment, studentSubmissions, ref });
});

// Config Management
function readConfig() {
  try { return JSON.parse(fs.readFileSync('./data/config.json')); }
  catch (e) { return { levels: ['UG', 'PG'], years: [], departments: [] }; }
}
function writeConfig(data) {
  fs.writeFileSync('./data/config.json', JSON.stringify(data, null, 2));
}

router.get("/config", (req, res) => {
  const config = readConfig();
  const ref = req.query.ref || '';
  res.render("admin/config", { config, ref });
});

router.post("/config/department/add", (req, res) => {
  const config = readConfig();
  const dept = req.body.department.trim();
  if (dept && !config.departments.includes(dept)) {
    config.departments.push(dept);
    writeConfig(config);
  }
  const ref = req.body.ref || '';
  res.redirect(ref ? "/admin/config?ref=" + encodeURIComponent(ref) : "/admin/config");
});

router.post("/config/department/remove", (req, res) => {
  const config = readConfig();
  config.departments = config.departments.filter(d => d !== req.body.department);
  writeConfig(config);
  const ref = req.body.ref || '';
  res.redirect(ref ? "/admin/config?ref=" + encodeURIComponent(ref) : "/admin/config");
});

router.post("/config/year/add", (req, res) => {
  const config = readConfig();
  const level = req.body.level;
  const year = Number(req.body.year);
  if (level && year && !config.years.find(y => y.level === level && y.year === year)) {
    config.years.push({ level, year });
    writeConfig(config);
  }
  const ref = req.body.ref || '';
  res.redirect(ref ? "/admin/config?ref=" + encodeURIComponent(ref) : "/admin/config");
});

router.post("/config/year/remove", (req, res) => {
  const config = readConfig();
  config.years = config.years.filter(y => !(y.level === req.body.level && y.year == req.body.year));
  writeConfig(config);
  const ref = req.body.ref || '';
  res.redirect(ref ? "/admin/config?ref=" + encodeURIComponent(ref) : "/admin/config");
});

module.exports = router;
