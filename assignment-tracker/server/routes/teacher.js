const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const { readData, writeData, readConfig } = require("./util");

router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "teacher") {
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

  if (department && department !== "All Departments") assignments = assignments.filter(a => a.department === department);
  if (year && year !== "All Years") assignments = assignments.filter(a => a.year == year);
  if (level && level !== "All Levels") assignments = assignments.filter(a => (a.level || "UG") === level);
  if (subject && subject !== "All Subjects") assignments = assignments.filter(a => a.subject === subject);

  let submittedCount = 0, pendingCount = 0, lateCount = 0, totalTasks = 0;
  const allTasks = [];

  const assignmentsWithProgress = assignments.map(a => {
    const applicableStudents = students.filter(s => s.department === a.department && s.year == a.year && (s.level || "UG") === (a.level || "UG"));
    const totalStudents = applicableStudents.length;
    let submittedStudents = 0;
    applicableStudents.forEach(s => {
      totalTasks++;
      const sub = submissions.find(sub => sub.assignmentId == a.id && sub.studentId == s.id);
      let status = "Pending";
      const isPastDue = new Date() > new Date(a.dueDate);
      if (sub) { submittedCount++; submittedStudents++; status = "Submitted"; }
      else { if (isPastDue) { lateCount++; status = "Late"; } else { pendingCount++; status = "Pending"; } }
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

  res.json({ assignments: assignmentsWithProgress, displayTasks, totalTasks, submittedCount, pendingCount, lateCount, filters: req.query || {}, config, allSubjects, user: req.session.user });
});

router.get("/config", (req, res) => {
  const assignments = readData("assignments");
  const allSubjects = [...new Set(assignments.map(a => a.subject))].sort();
  res.json({ config: readConfig(), allSubjects });
});

router.post("/add", (req, res) => {
  let assignments = readData("assignments");
  const newAssignment = {
    id: Date.now(),
    title: req.body.title,
    description: req.body.description || "",
    department: req.body.department,
    year: Number(req.body.year),
    level: req.body.level || "UG",
    subject: req.body.subject,
    dueDate: req.body.dueDate,
    assignedBy: req.session.user.name || req.session.user.username
  };
  assignments.push(newAssignment);
  writeData("assignments", assignments);

  let studentLogs = readData("studentLogs");
  const users = readData("users");
  const matchingStudents = users.filter(u =>
    u.role === "student" && u.department === newAssignment.department &&
    u.year == newAssignment.year && (u.level || "UG") === (newAssignment.level || "UG")
  );
  matchingStudents.forEach(s => {
    const log = studentLogs.find(l => l.studentId === s.id);
    if (log) log.totalAssigned++;
    else studentLogs.push({ studentId: s.id, totalAssigned: 1, totalCompleted: 0 });
  });
  writeData("studentLogs", studentLogs);
  res.json({ ok: true });
});

router.get("/edit/:id", (req, res) => {
  const assignments = readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.status(404).json({ error: "Not found" });
  const allSubjects = [...new Set(assignments.map(a => a.subject))].sort();
  res.json({ assignment, config: readConfig(), allSubjects });
});

router.post("/edit/:id", (req, res) => {
  let assignments = readData("assignments");
  const index = assignments.findIndex(a => a.id == req.params.id);
  if (index !== -1) {
    assignments[index].title = req.body.title;
    assignments[index].description = req.body.description || "";
    assignments[index].department = req.body.department;
    assignments[index].year = Number(req.body.year);
    assignments[index].level = req.body.level || "UG";
    assignments[index].subject = req.body.subject;
    assignments[index].dueDate = req.body.dueDate;
    writeData("assignments", assignments);
  }
  res.json({ ok: true });
});

router.get("/view/:id", (req, res) => {
  const assignments = readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.status(404).json({ error: "Not found" });
  const users = readData("users");
  const students = users.filter(u => u.role === "student" && u.department === assignment.department && u.year == assignment.year && (u.level || "UG") === (assignment.level || "UG"));
  const submissions = readData("submissions");
  const teacherId = req.session?.user?.id;
  const studentSubmissions = students.map(s => {
    const sub = submissions.find(sub => sub.assignmentId == assignment.id && sub.studentId == s.id);
    return { student: s, submission: sub };
  });
  res.json({ assignment, studentSubmissions });
});

router.post("/check/:assignmentId/:studentId", (req, res) => {
  let submissions = readData("submissions");
  const index = submissions.findIndex(s => s.assignmentId == req.params.assignmentId && s.studentId == req.params.studentId);
  if (index !== -1) {
    submissions[index].checked = req.body.checked === true;
  } else if (req.body.checked === true) {
    const assignments = readData("assignments");
    const assignment = assignments.find(a => a.id == req.params.assignmentId);
    let origStatus = "Pending";
    if (assignment && assignment.dueDate) {
      const due = new Date(assignment.dueDate);
      due.setHours(23, 59, 59, 999);
      if (new Date() > due) origStatus = "Late";
    }
    submissions.push({
      assignmentId: Number(req.params.assignmentId),
      studentId: Number(req.params.studentId),
      link: "",
      status: "Submitted",
      checked: true,
      originalStatus: origStatus,
      submittedAt: new Date().toISOString()
    });
  }
  writeData("submissions", submissions);
  res.json({ ok: true });
});

router.delete("/check/:assignmentId/:studentId", (req, res) => {
  let submissions = readData("submissions");
  submissions = submissions.filter(s => !(s.assignmentId == req.params.assignmentId && s.studentId == req.params.studentId && s.originalStatus));
  writeData("submissions", submissions);
  res.json({ ok: true });
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

router.get("/calendar", (req, res) => {
  const assignments = readData("assignments");
  const users = readData("users");
  const submissions = readData("submissions");
  res.json({ assignments, students: users.filter(u => u.role === "student"), submissions });
});

router.get("/students", (req, res) => {
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const config = readConfig();
  const { department, year, level } = req.query;
  let filtered = students;
  if (level && level !== "All Levels") filtered = filtered.filter(s => s.level === level);
  if (department && department !== "All Departments") filtered = filtered.filter(s => s.department === department);
  if (year && year !== "All Years") filtered = filtered.filter(s => s.year == year);
  res.json({ students: filtered, config, filters: req.query || {} });
});

router.get("/student/:id", (req, res) => {
  const users = readData("users");
  const student = users.find(u => u.id == req.params.id && u.role === "student");
  if (!student) return res.status(404).json({ error: "Not found" });
  const assignments = readData("assignments");
  const submissions = readData("submissions");
  const studentAssignments = assignments.filter(a => a.department === student.department && a.year == student.year);
  const assignmentsWithStatus = studentAssignments.map(a => {
    const sub = submissions.find(s => s.assignmentId == a.id && s.studentId == student.id);
    let status = "Pending";
    let isLate = false;
    const dueDate = new Date(a.dueDate);
    dueDate.setHours(23, 59, 59, 999);
    if (sub) {
      status = "Submitted";
      if (new Date(sub.submittedAt) > dueDate) isLate = true;
    } else if (new Date() > dueDate) {
      status = "Late";
    }
    return { ...a, status, isLate, submittedAt: sub ? sub.submittedAt : null, submission: sub };
  });
  res.json({ student, assignments: assignmentsWithStatus });
});

router.get("/history", (req, res) => {
  const history = readData("assessmentHistory");
  const config = readConfig();
  const { department, level } = req.query;
  let filtered = [...history];
  if (department && department !== "All Departments") filtered = filtered.filter(h => h.studentDepartment === department);
  if (level && level !== "All Levels") filtered = filtered.filter(h => h.studentLevel === level);
  filtered.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));
  res.json({ history: filtered, config, filters: req.query || {} });
});

router.get("/history/download", (req, res) => {
  let history = readData("assessmentHistory");
  const { department, level } = req.query;
  if (department && department !== "All Departments") history = history.filter(h => h.studentDepartment === department);
  if (level && level !== "All Levels") history = history.filter(h => h.studentLevel === level);
  history.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

  const data = history.map(h => ({
    "Student Name": h.studentName,
    "Reg No": h.studentUsername,
    "Assignment": h.assignmentTitle,
    "Subject": h.assignmentSubject,
    "Department": h.assignmentDepartment,
    "Level": h.assignmentLevel,
    "Year": h.assignmentYear,
    "Status": h.submittedAt ? (new Date(h.submittedAt) > new Date(h.assignmentDueDate) ? "Late" : "Submitted") : "Pending",
    "Submitted At": h.submittedAt ? new Date(h.submittedAt).toLocaleString() : "-",
    "Checked": h.checked ? "Yes" : "No",
    "Archived Date": h.archivedAt ? new Date(h.archivedAt).toLocaleDateString() : "-"
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Assessment History");
  let nameParts = ["Assessment_History"];
  if (department && department !== "All Departments") nameParts.push(department);
  if (level && level !== "All Levels") nameParts.push(level);
  const fileName = nameParts.join("_") + ".xlsx";
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

router.get("/students/download", (req, res) => {
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const assignments = readData("assignments");
  const submissions = readData("submissions");
  const { department, year, level } = req.query;
  let filtered = students;
  if (level && level !== "All Levels") filtered = filtered.filter(s => s.level === level);
  if (department && department !== "All Departments") filtered = filtered.filter(s => s.department === department);
  if (year && year !== "All Years") filtered = filtered.filter(s => s.year == year);

  const data = filtered.map(s => {
    const assigned = assignments.filter(a => a.department === s.department && a.year == s.year).length;
    const completed = submissions.filter(sub => sub.studentId == s.id).length;
    return { "Reg. Number": s.username, Name: s.name, Level: s.level || "UG", Department: s.department, Year: s.year, Semester: s.semester || "-", "Assessments Assigned": assigned, "Assessments Completed": completed };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  let nameParts = ["Students"];
  if (level && level !== "All Levels") nameParts.push(level);
  if (department && department !== "All Departments") nameParts.push(department);
  if (year && year !== "All Years") nameParts.push("Year" + year);
  const fileName = nameParts.join("_") + ".xlsx";
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

module.exports = router;
