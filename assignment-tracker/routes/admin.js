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
  res.render("admin/addUser", { ref, config, error: null, form: null });
});

// Add User (POST)
router.post("/users/add", (req, res) => {
  let users = readData("users");
  const config = readConfig();
  const ref = req.body.ref || '';

  const existing = users.find(u => u.username === req.body.username);
  if (existing) {
    return res.render("admin/addUser", {
      ref, config,
      error: `Username "${req.body.username}" is already taken by a ${existing.role}. Please use a different ID.`,
      form: req.body
    });
  }

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
  res.render("admin/editUser", { editUser, ref, config, error: null });
});

// Edit User (POST)
router.post("/users/edit/:id", (req, res) => {
  let users = readData("users");
  const config = readConfig();
  const ref = req.body.ref || '';
  const index = users.findIndex(u => u.id == req.params.id);
  if (index === -1) return res.redirect("/admin/users");

  const editUser = users[index];
  const existing = users.find(u => u.username === req.body.username && u.id != req.params.id);
  if (existing) {
    return res.render("admin/editUser", {
      editUser, ref, config,
      error: `Username "${req.body.username}" is already taken by a ${existing.role}. Please use a different ID.`
    });
  }

  users[index].username = req.body.username;
  users[index].password = req.body.password;
  users[index].name = req.body.name;
  if (users[index].role === 'student') {
    users[index].department = req.body.department;
    users[index].year = Number(req.body.year);
    users[index].level = req.body.level;
  }
  writeData("users", users);
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

// Student Promotion
router.get("/promote", (req, res) => {
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const config = readConfig();
  const passedOut = readData("passedout");

  const { level, department } = req.query;

  let filtered = students;
  if (level) {
    filtered = filtered.filter(s => (s.level || "UG") === level);
  }
  if (department && department !== "All Departments") {
    filtered = filtered.filter(s => s.department === department);
  }

  const maxYear = {};
  config.years.forEach(y => {
    if (!maxYear[y.level] || y.year > maxYear[y.level]) {
      maxYear[y.level] = y.year;
    }
  });

  const preview = {};
  let promoteCount = 0;
  let passOutCount = 0;
  filtered.forEach(s => {
    const sLevel = s.level || "UG";
    const sYear = s.year;
    if (sYear < maxYear[sLevel]) {
      const key = `${sLevel} Year ${sYear} → Year ${sYear + 1}`;
      preview[key] = (preview[key] || 0) + 1;
      promoteCount++;
    } else {
      const key = `${sLevel} Year ${sYear} → Passed Out (${new Date().getFullYear()})`;
      preview[key] = (preview[key] || 0) + 1;
      passOutCount++;
    }
  });

  const ref = req.query.ref || '';
  res.render("admin/promote", {
    config, level, department, preview,
    promoteCount, passOutCount, totalCount: filtered.length,
    success: req.query.success, ref,
    passedOutCount: passedOut.length
  });
});

router.post("/promote", (req, res) => {
  let users = readData("users");
  let passedOut = readData("passedout");
  const config = readConfig();
  const currentYear = new Date().getFullYear();

  const { level, department } = req.body;

  const maxYear = {};
  config.years.forEach(y => {
    if (!maxYear[y.level] || y.year > maxYear[y.level]) {
      maxYear[y.level] = y.year;
    }
  });

  const newUsers = [];
  users.forEach(u => {
    if (u.role !== "student") {
      newUsers.push(u);
      return;
    }
    const sLevel = u.level || "UG";
    if (level && sLevel !== level) {
      newUsers.push(u);
      return;
    }
    if (department && department !== "All Departments" && u.department !== department) {
      newUsers.push(u);
      return;
    }
    if (u.year < maxYear[sLevel]) {
      u.year = u.year + 1;
      newUsers.push(u);
    } else {
      passedOut.push({
        id: u.id,
        username: u.username,
        password: u.password,
        role: "student",
        name: u.name,
        department: u.department,
        year: u.year,
        level: sLevel,
        passedOutYear: currentYear
      });
    }
  });

  writeData("users", newUsers);
  writeData("passedout", passedOut);

  const ref = req.body.ref || '';
  res.redirect(ref ? "/admin/promote?success=1&ref=" + encodeURIComponent(ref) : "/admin/promote?success=1");
});

// Passed Out Students
router.get("/passedout", (req, res) => {
  const passedOut = readData("passedout");
  const config = readConfig();
  const ref = req.query.ref || '';
  passedOut.sort((a, b) => (b.passedOutYear || 0) - (a.passedOutYear || 0));
  res.render("admin/passedout", { passedOut, config, ref });
});

module.exports = router;
