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

router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "student") {
    return res.redirect("/login");
  }
  next();
});

router.get("/", (req, res) => {
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
      if (new Date(sub.submittedAt) > dueDate) {
        isLate = true;
      }
    } else {
      if (new Date() > dueDate) {
        stat = "Late";
      }
    }

    const order = stat === "Late" ? 0 : stat === "Pending" ? 1 : 2;
    return { ...a, status: stat, isLate, submission: sub, sortOrder: order };
  });

  if (subject && subject !== 'All Subjects') {
    assignmentsWithStatus = assignmentsWithStatus.filter(a => a.subject === subject);
  }
  if (status && status !== 'All Statuses') {
    assignmentsWithStatus = assignmentsWithStatus.filter(a => a.status === status);
  }

  assignmentsWithStatus.sort((a, b) => a.sortOrder - b.sortOrder);

  const subjects = [...new Set(myAssignments.map(a => a.subject))].sort();

  if (!req.session.tailColor) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#c084fc', '#fb923c', '#2dd4bf'];
    req.session.tailColor = colors[Math.floor(Math.random() * colors.length)];
  }

  res.render("student/dashboard", {
    user,
    assignments: assignmentsWithStatus,
    queryFilters: req.query || {},
    subjects,
    tailColor: req.session.tailColor
  });
});

// Student Calendar
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

    if (sub) {
      status = "Submitted";
    } else {
      if (new Date() > dueDate) {
        status = "Late";
      }
    }
    return { ...a, status };
  });

  res.render("student/calendar", {
    user,
    assignments: assignmentsWithStatus
  });
});

router.post("/submit/:id", (req, res) => {
  let submissions = readData("submissions");
  const assignmentId = Number(req.params.id);
  const studentId = req.session.user.id;
  
  const index = submissions.findIndex(s => s.assignmentId === assignmentId && s.studentId === studentId);
  
  const submissionData = {
    assignmentId,
    studentId,
    link: req.body.link,
    submittedAt: new Date().toISOString()
  };

  if (index !== -1) {
    submissionData.checked = submissions[index].checked || false;
    submissions[index] = submissionData;
  } else {
    submissionData.checked = false;
    submissions.push(submissionData);
  }

  writeData("submissions", submissions);
  res.redirect("/student");
});

module.exports = router;