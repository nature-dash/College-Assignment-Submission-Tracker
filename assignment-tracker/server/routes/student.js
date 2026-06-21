const express = require("express");
const router = express.Router();
const { readData, writeData } = require("./util");

router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "student") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

router.get("/dashboard", (req, res) => {
  const user = req.session.user;
  const assignments = readData("assignments");
  const submissions = readData("submissions");
  const myAssignments = assignments.filter(a => a.department === user.department && a.year == user.year);
  const { subject, status } = req.query;

  let assignmentsWithStatus = myAssignments.map(a => {
    const sub = submissions.find(s => s.assignmentId == a.id && s.studentId == user.id);
    let stat = "Pending";
    let isLate = false;
    const dueDate = new Date(a.dueDate);
    dueDate.setHours(23, 59, 59, 999);
    if (sub) {
      stat = "Submitted";
      if (new Date(sub.submittedAt) > dueDate) isLate = true;
    } else if (new Date() > dueDate) {
      stat = "Late";
    }
    const order = stat === "Late" ? 0 : stat === "Pending" ? 1 : 2;
    return { ...a, status: stat, isLate, submission: sub, sortOrder: order };
  });

  if (subject && subject !== "All Subjects") assignmentsWithStatus = assignmentsWithStatus.filter(a => a.subject === subject);
  if (status && status !== "All Statuses") assignmentsWithStatus = assignmentsWithStatus.filter(a => a.status === status);
  assignmentsWithStatus.sort((a, b) => a.sortOrder - b.sortOrder);

  const subjects = [...new Set(myAssignments.map(a => a.subject))].sort();
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6b9d", "#c084fc", "#fb923c", "#2dd4bf"];

  res.json({ user, assignments: assignmentsWithStatus, subjects, tailColor: colors[Math.floor(Math.random() * colors.length)] });
});

router.get("/calendar", (req, res) => {
  const user = req.session.user;
  const assignments = readData("assignments");
  const submissions = readData("submissions");
  const myAssignments = assignments.filter(a => a.department === user.department && a.year == user.year);
  const assignmentsWithStatus = myAssignments.map(a => {
    const sub = submissions.find(s => s.assignmentId == a.id && s.studentId == user.id);
    let status = "Pending";
    const dueDate = new Date(a.dueDate);
    dueDate.setHours(23, 59, 59, 999);
    if (sub) status = "Submitted";
    else if (new Date() > dueDate) status = "Late";
    return { ...a, status };
  });
  res.json({ user, assignments: assignmentsWithStatus });
});

router.post("/submit/:id", (req, res) => {
  let submissions = readData("submissions");
  const assignmentId = Number(req.params.id);
  const studentId = req.session.user.id;
  const index = submissions.findIndex(s => s.assignmentId === assignmentId && s.studentId === studentId);
  const submissionData = { assignmentId, studentId, link: req.body.link || "", submittedAt: new Date().toISOString() };
  if (index !== -1) {
    submissionData.checked = submissions[index].checked || false;
    submissions[index] = submissionData;
  } else {
    submissionData.checked = false;
    submissions.push(submissionData);
  }
  writeData("submissions", submissions);
  if (index === -1) {
    let studentLogs = readData("studentLogs");
    const log = studentLogs.find(l => l.studentId === studentId);
    if (log) log.totalCompleted++;
    else studentLogs.push({ studentId, totalAssigned: 0, totalCompleted: 1 });
    writeData("studentLogs", studentLogs);
  }
  res.json({ ok: true });
});

module.exports = router;
