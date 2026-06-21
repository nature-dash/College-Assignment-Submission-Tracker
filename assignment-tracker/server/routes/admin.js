const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const { readData, writeData, readConfig, writeConfig } = require("./util");

router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

router.get("/dashboard", (req, res) => {
  const allAssignments = readData("assignments");
  let assignments = [...allAssignments];
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = readData("submissions");
  const config = readConfig();
  const allSubjects = [...new Set(allAssignments.map(a => a.subject))].sort();

  const { department, year, level, subject, taskStatus } = req.query;

  if (department && department !== "All Departments") {
    assignments = assignments.filter(a => a.department === department);
  }
  if (year && year !== "All Years") {
    assignments = assignments.filter(a => a.year == year);
  }
  if (level && level !== "All Levels") {
    assignments = assignments.filter(a => (a.level || "UG") === level);
  }
  if (subject && subject !== "All Subjects") {
    assignments = assignments.filter(a => a.subject === subject);
  }

  let submittedCount = 0, pendingCount = 0, lateCount = 0, totalTasks = 0;
  const allTasks = [];

  const assignmentsWithProgress = assignments.map(a => {
    const applicableStudents = students.filter(s =>
      s.department === a.department && s.year == a.year && (s.level || "UG") === (a.level || "UG")
    );
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
    if (department && department !== "All Departments") displayTasks = displayTasks.filter(t => t.assignment.department === department);
    if (year && year !== "All Years") displayTasks = displayTasks.filter(t => t.assignment.year == year);
    if (subject && subject !== "All Subjects") displayTasks = displayTasks.filter(t => t.assignment.subject === subject);
    if (level && level !== "All Levels") displayTasks = displayTasks.filter(t => (t.assignment.level || "UG") === level);
  }

  res.json({
    assignments: assignmentsWithProgress,
    displayTasks,
    totalTasks,
    submittedCount,
    pendingCount,
    lateCount,
    filters: req.query || {},
    config,
    allSubjects,
    user: req.session.user
  });
});

router.get("/users", (req, res) => {
  const users = readData("users");
  const config = readConfig();
  const { role, level, department } = req.query;
  let filtered = users.filter(u => u.role !== "admin");
  if (role && role !== "All Roles") filtered = filtered.filter(u => u.role === role);
  if (level && level !== "All Levels") filtered = filtered.filter(u => u.level === level);
  if (department && department !== "All Departments") filtered = filtered.filter(u => u.department === department);
  res.json({ users: filtered, config, filters: req.query || {} });
});

router.get("/users/add-data", (req, res) => {
  const config = readConfig();
  res.json({ config });
});

router.post("/users/add", (req, res) => {
  let users = readData("users");
  const config = readConfig();
  const passedOut = readData("passedout");
  const existing = users.find(u => u.username === req.body.username);
  const existingPassedOut = passedOut.find(u => u.username === req.body.username);
  if (existing) {
    return res.status(400).json({ error: `Username "${req.body.username}" is already taken by a ${existing.role}.` });
  }
  if (existingPassedOut) {
    return res.status(400).json({ error: `Username "${req.body.username}" is already taken by a passed out student.` });
  }

  const newUser = {
    id: Date.now(),
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
    name: req.body.name
  };
  if (req.body.role === "student") {
    newUser.department = req.body.department;
    newUser.level = req.body.level;
    newUser.semester = Number(req.body.semester);
    newUser.year = Math.ceil(newUser.semester / 2);
    let studentLogs = readData("studentLogs");
    const existingAssignments = readData("assignments");
    const totalAssigned = existingAssignments.filter(a =>
      a.department === newUser.department && a.year <= newUser.year && (a.level || "UG") === newUser.level
    ).length;
    studentLogs.push({ studentId: newUser.id, totalAssigned, totalCompleted: 0 });
    writeData("studentLogs", studentLogs);
  }
  users.push(newUser);
  writeData("users", users);
  res.json({ ok: true });
});

router.get("/users/edit/:id", (req, res) => {
  const users = readData("users");
  const editUser = users.find(u => u.id == req.params.id);
  if (!editUser) return res.status(404).json({ error: "Not found" });
  const config = readConfig();
  res.json({ editUser, config });
});

router.post("/users/edit/:id", (req, res) => {
  let users = readData("users");
  const config = readConfig();
  const index = users.findIndex(u => u.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  if (users.find(u => u.username === req.body.username && u.id != req.params.id)) {
    return res.status(400).json({ error: `Username "${req.body.username}" is already taken.` });
  }
  const passedOut = readData("passedout");
  if (passedOut.find(u => u.username === req.body.username)) {
    return res.status(400).json({ error: `Username "${req.body.username}" is already taken by a passed out student.` });
  }

  users[index].username = req.body.username;
  users[index].password = req.body.password;
  users[index].name = req.body.name;
  if (users[index].role === "student") {
    users[index].department = req.body.department;
    users[index].level = req.body.level;
    users[index].semester = Number(req.body.semester);
    users[index].year = Math.ceil(users[index].semester / 2);
    let studentLogs = readData("studentLogs");
    if (!studentLogs.some(l => l.studentId === users[index].id)) {
      studentLogs.push({ studentId: users[index].id, totalAssigned: 0, totalCompleted: 0 });
      writeData("studentLogs", studentLogs);
    }
  }
  writeData("users", users);
  res.json({ ok: true });
});

router.post("/users/remove/:id", (req, res) => {
  let users = readData("users");
  users = users.filter(u => u.id != req.params.id);
  writeData("users", users);
  res.json({ ok: true });
});

router.get("/calendar", (req, res) => {
  const assignments = readData("assignments");
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = readData("submissions");
  res.json({ assignments, students, submissions });
});

router.get("/view/:id", (req, res) => {
  const assignments = readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.status(404).json({ error: "Not found" });
  const users = readData("users");
  const students = users.filter(u => u.role === "student" && u.department === assignment.department && u.year == assignment.year && (u.level || "UG") === (assignment.level || "UG"));
  const submissions = readData("submissions");
  const studentSubmissions = students.map(s => {
    const sub = submissions.find(sub => sub.assignmentId == assignment.id && sub.studentId == s.id);
    return { student: s, submission: sub };
  });
  res.json({ assignment, studentSubmissions });
});

router.get("/config", (req, res) => {
  res.json({ config: readConfig() });
});

router.post("/config/department/add", (req, res) => {
  const config = readConfig();
  const dept = req.body.department.trim();
  if (dept && !config.departments.includes(dept)) {
    config.departments.push(dept);
    writeConfig(config);
  }
  res.json({ config });
});

router.post("/config/department/remove", (req, res) => {
  const config = readConfig();
  config.departments = config.departments.filter(d => d !== req.body.department);
  writeConfig(config);
  res.json({ config });
});

router.get("/promote", (req, res) => {
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const config = readConfig();
  const passedOut = readData("passedout");
  const { level, department } = req.query;
  let filtered = students;
  if (level) filtered = filtered.filter(s => (s.level || "UG") === level);
  if (department && department !== "All Departments") filtered = filtered.filter(s => s.department === department);

  const maxYear = {};
  config.years.forEach(y => {
    if (!maxYear[y.level] || y.year > maxYear[y.level]) maxYear[y.level] = y.year;
  });

  const preview = {};
  let promoteCount = 0, passOutCount = 0;
  filtered.forEach(s => {
    const sLevel = s.level || "UG";
    const sYear = s.year;
    if (sYear < maxYear[sLevel]) {
      const key = `${sLevel} Year ${sYear} \u2192 Year ${sYear + 1}`;
      preview[key] = (preview[key] || 0) + 1;
      promoteCount++;
    } else {
      const key = `${sLevel} Year ${sYear} \u2192 Passed Out (${new Date().getFullYear()})`;
      preview[key] = (preview[key] || 0) + 1;
      passOutCount++;
    }
  });

  res.json({ config, level, department, preview, promoteCount, passOutCount, totalCount: filtered.length, passedOutCount: passedOut.length });
});

router.post("/promote", (req, res) => {
  let users = readData("users");
  let passedOut = readData("passedout");
  const config = readConfig();
  const currentYear = new Date().getFullYear();
  const { level, department } = req.body;

  const maxYearForLevel = {};
  config.years.forEach(y => {
    if (!maxYearForLevel[y.level] || y.year > maxYearForLevel[y.level]) maxYearForLevel[y.level] = y.year;
  });

  const getSemestersPerYear = (level) => {
    const yc = config.years.find(y => y.level === level);
    return yc ? yc.semesters : 2;
  };

  let studentLogs = readData("studentLogs");
  const semesterOnlyIds = [], yearAdvanceIds = [], passedOutStudentIds = [];
  const allSnapshot = [];
  const newUsers = [];

  users.forEach(u => {
    if (u.role !== "student") { newUsers.push(u); return; }
    const sLevel = u.level || "UG";
    if (level && sLevel !== level) { newUsers.push(u); return; }
    if (department && department !== "All Departments" && u.department !== department) { newUsers.push(u); return; }
    const semPerYear = getSemestersPerYear(sLevel);
    const sSem = u.semester || ((u.year - 1) * semPerYear + 1);
    const maxSem = u.year * semPerYear;
    const isLastYear = u.year >= maxYearForLevel[sLevel];

    allSnapshot.push({ id: u.id, username: u.username, name: u.name, department: u.department, level: sLevel, year: u.year, semester: u.semester });

    if (sSem < maxSem) {
      u.semester = sSem + 1;
      newUsers.push(u);
      semesterOnlyIds.push(u.id);
    } else if (!isLastYear) {
      u.year = u.year + 1;
      u.semester = (u.year - 1) * semPerYear + 1;
      newUsers.push(u);
      yearAdvanceIds.push(u.id);
    } else {
      const allAssignments = readData("assignments");
      const allSubmissions = readData("submissions");
      const historyEntries = readData("assessmentHistory").filter(h => h.studentId === u.id);
      const allAssignmentIds = new Set();
      allAssignments.forEach(a => {
        if (a.department === u.department && a.year <= u.year && (a.level || "UG") === sLevel) allAssignmentIds.add(a.id);
      });
      historyEntries.forEach(h => allAssignmentIds.add(h.assignmentId));
      const totalAssigned = allAssignmentIds.size;
      const totalSubmitted = allSubmissions.filter(s => s.studentId === u.id).length;
      const historySubmitted = historyEntries.filter(h => h.submittedAt).length;
      passedOutStudentIds.push(u.id);
      passedOut.push({
        id: u.id, username: u.username, password: u.password,
        role: "student", name: u.name, department: u.department,
        year: u.year, level: sLevel, passedOutYear: currentYear,
        totalAssigned, totalCompleted: totalSubmitted + historySubmitted
      });
    }
  });

  writeData("users", newUsers);
  writeData("passedout", passedOut);

  const archiveStudentIds = [...yearAdvanceIds, ...passedOutStudentIds];
  if (archiveStudentIds.length > 0) {
    let history = readData("assessmentHistory");
    const assignments = readData("assignments");
    const submissions = readData("submissions");
    const now = new Date().toISOString();
    const allStudents = [...allSnapshot, ...passedOut.filter(p => archiveStudentIds.includes(p.id))];

    archiveStudentIds.forEach(studentId => {
      const student = allStudents.find(s => s.id === studentId);
      if (!student) return;
      const applicableAssignments = assignments.filter(a =>
        a.department === student.department && a.year == student.year && (a.level || "UG") === (student.level || "UG")
      );
      applicableAssignments.forEach(assignment => {
        if (history.some(h => h.assignmentId == assignment.id && h.studentId == studentId)) return;
        const sub = submissions.find(s => s.assignmentId == assignment.id && s.studentId == studentId);
        history.push({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          assignmentSubject: assignment.subject,
          assignmentDueDate: assignment.dueDate,
          assignmentDepartment: assignment.department,
          assignmentYear: assignment.year,
          assignmentLevel: assignment.level || "UG",
          studentId: student.id,
          studentUsername: student.username,
          studentName: student.name,
          studentDepartment: student.department,
          studentLevel: student.level || "UG",
          studentYear: student.year,
          studentSemester: student.semester,
          submissionLink: sub ? (sub.link || "") : "",
          submittedAt: sub ? sub.submittedAt : null,
          checked: sub ? (sub.checked || false) : false,
          archivedAt: now
        });
      });
    });
    writeData("assessmentHistory", history);
    const remaining = submissions.filter(sub => !archiveStudentIds.includes(sub.studentId));
    writeData("submissions", remaining);
  }

  const allAffectedIds = [...semesterOnlyIds, ...yearAdvanceIds, ...passedOutStudentIds];
  if (allAffectedIds.length > 0) {
    const currentStudents = readData("users").filter(u => u.role === "student");
    let updatedAssignments = readData("assignments");
    updatedAssignments = updatedAssignments.filter(a =>
      currentStudents.some(s => s.department === a.department && s.year == a.year && (s.level || "UG") === (a.level || "UG"))
    );
    writeData("assignments", updatedAssignments);
    studentLogs = studentLogs.filter(l => !passedOutStudentIds.includes(l.studentId));
    writeData("studentLogs", studentLogs);
  }

  res.json({ ok: true });
});

router.get("/passedout", (req, res) => {
  let passedOut = readData("passedout");
  const config = readConfig();
  const { level, department, passedOutYear } = req.query;
  if (level && level !== "All Levels") passedOut = passedOut.filter(s => s.level === level);
  if (department && department !== "All Departments") passedOut = passedOut.filter(s => s.department === department);
  if (passedOutYear && passedOutYear !== "All Years") passedOut = passedOut.filter(s => String(s.passedOutYear) === passedOutYear);

  const assignments = readData("assignments");
  const submissions = readData("submissions");
  const assessmentHistory = readData("assessmentHistory");

  passedOut = passedOut.map(s => {
    const historyEntries = assessmentHistory.filter(h => h.studentId === s.id);
    const allIds = new Set();
    assignments.forEach(a => {
      if (a.department === s.department && a.year <= s.year && (a.level || "UG") === (s.level || "UG")) allIds.add(a.id);
    });
    historyEntries.forEach(h => allIds.add(h.assignmentId));
    s.displayAssigned = allIds.size;
    s.displayCompleted = submissions.filter(sub => sub.studentId == s.id).length + historyEntries.filter(h => h.submittedAt).length;
    return s;
  });
  passedOut.sort((a, b) => (b.passedOutYear || 0) - (a.passedOutYear || 0));

  res.json({ passedOut, config, filters: req.query || {} });
});

router.get("/users/download", (req, res) => {
  const users = readData("users");
  const assignments = readData("assignments");
  const submissions = readData("submissions");
  const { role, level, department } = req.query;
  let filteredUsers = users.filter(u => u.role !== "admin");
  if (role && role !== "All Roles") filteredUsers = filteredUsers.filter(u => u.role === role);
  if (level && level !== "All Levels") filteredUsers = filteredUsers.filter(u => u.level === level);
  if (department && department !== "All Departments") filteredUsers = filteredUsers.filter(u => u.department === department);

  const data = filteredUsers.map(u => {
    const row = {
      Username: u.username, Name: u.name,
      Role: u.role === "teacher" ? "Teacher" : "Student",
      Password: u.password,
      Level: u.level || (u.role === "student" ? "UG" : "-"),
      Department: u.department || "-",
      Year: u.year || "-"
    };
    if (u.role === "student") {
      const assigned = assignments.filter(a => a.department === u.department && a.year == u.year).length;
      const completed = submissions.filter(s => s.studentId == u.id).length;
      row.Semester = u.semester || "-";
      row["Assessments Assigned"] = assigned;
      row["Assessments Completed"] = completed;
    } else if (u.role === "teacher") {
      row["Total Assessments Assigned"] = assignments.filter(a => a.assignedBy === u.name || a.assignedBy === u.username).length;
    }
    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  let nameParts = [];
  if (role && role !== "All Roles") nameParts.push(role === "student" ? "Students" : "Teachers");
  else nameParts.push("Users");
  if (level && level !== "All Levels") nameParts.push(level);
  if (department && department !== "All Departments") nameParts.push(department);
  const fileName = nameParts.join("_") + ".xlsx";
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

router.get("/passedout/download", (req, res) => {
  let passedOut = readData("passedout");
  const assignments = readData("assignments");
  const submissions = readData("submissions");
  const assessmentHistory = readData("assessmentHistory");
  const { level, department, passedOutYear } = req.query;
  if (level && level !== "All Levels") passedOut = passedOut.filter(s => s.level === level);
  if (department && department !== "All Departments") passedOut = passedOut.filter(s => s.department === department);
  if (passedOutYear && passedOutYear !== "All Years") passedOut = passedOut.filter(s => String(s.passedOutYear) === passedOutYear);
  passedOut.sort((a, b) => (b.passedOutYear || 0) - (a.passedOutYear || 0));

  const data = passedOut.map(s => {
    const historyEntries = assessmentHistory.filter(h => h.studentId === s.id);
    const allIds = new Set();
    assignments.forEach(a => {
      if (a.department === s.department && a.year <= s.year && (a.level || "UG") === (s.level || "UG")) allIds.add(a.id);
    });
    historyEntries.forEach(h => allIds.add(h.assignmentId));
    return {
      Username: s.username, Name: s.name, Department: s.department,
      Level: s.level || "UG", "Total Years": s.year,
      "Assessments Assigned": allIds.size,
      "Assessments Completed": submissions.filter(sub => sub.studentId == s.id).length + historyEntries.filter(h => h.submittedAt).length,
      "Passed Out Year": s.passedOutYear
    };
  });

  let nameParts = ["Passed_Out_Students"];
  if (level && level !== "All Levels") nameParts.push(level);
  if (department && department !== "All Departments") nameParts.push(department);
  if (passedOutYear && passedOutYear !== "All Years") nameParts.push("Year" + passedOutYear);
  const fileName = nameParts.join("_") + ".xlsx";
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "PassedOut");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

router.delete("/delete/:id", (req, res) => {
  let assignments = readData("assignments");
  assignments = assignments.filter(a => a.id != req.params.id);
  writeData("assignments", assignments);
  let submissions = readData("submissions");
  submissions = submissions.filter(s => s.assignmentId != req.params.id);
  writeData("submissions", submissions);
  res.json({ ok: true });
});

module.exports = router;
