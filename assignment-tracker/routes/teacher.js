const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const { readData, writeData, readConfig } = require("../db");

router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "teacher") {
    return res.redirect("/login");
  }
  next();
});

router.get("/", async (req, res) => {
  const allAssignments = await readData("assignments");
  let assignments = [...allAssignments];
  const users = await readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = await readData("submissions");
  const config = await readConfig();
  const allSubjects = [...new Set(allAssignments.map(a => a.subject))].sort();

  const { department, year, level, subject, taskStatus } = req.query;

  if (department && department !== 'All Departments') {
    assignments = assignments.filter(a => a.department === department);
  }
  if (year && year !== 'All Years') {
    assignments = assignments.filter(a => a.year == year);
  }
  if (level && level !== 'All Levels') {
    assignments = assignments.filter(a => (a.level || 'UG') === level);
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
    const applicableStudents = students.filter(s => s.department === a.department && s.year == a.year && (s.level || 'UG') === (a.level || 'UG'));
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
        if (isPastDue) {
          lateCount++;
          status = "Late";
        } else {
          pendingCount++;
          status = "Pending";
        }
      }

      allTasks.push({
        student: s,
        assignment: a,
        status: status,
        submission: sub
      });
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
    if (level && level !== 'All Levels') {
      displayTasks = displayTasks.filter(t => (t.assignment.level || 'UG') === level);
    }
  }

  res.render("teacher/dashboard", {
    user: req.session.user,
    assignments: assignmentsWithProgress,
    displayTasks,
    totalTasks,
    submittedCount,
    pendingCount,
    lateCount,
    filters: req.query || {},
    config,
    allSubjects
  });
});

router.get("/add", async (req, res) => {
  const config = await readConfig();
  res.render("teacher/addAssignment", { config });
});

router.post("/add", async (req, res) => {
  let assignments = await readData("assignments");

  const newAssignment = {
    id: Date.now(),
    title: req.body.title,
    department: req.body.department,
    year: Number(req.body.year),
    level: req.body.level || 'UG',
    subject: req.body.subject,
    dueDate: req.body.dueDate,
    assignedBy: req.session.user.name || req.session.user.username
  };

  assignments.push(newAssignment);
  await writeData("assignments", assignments);

  let studentLogs = await readData("studentLogs");
  const users = await readData("users");
  const matchingStudents = users.filter(u =>
    u.role === "student" &&
    u.department === newAssignment.department &&
    u.year == newAssignment.year &&
    (u.level || 'UG') === (newAssignment.level || 'UG')
  );
  matchingStudents.forEach(s => {
    const log = studentLogs.find(l => l.studentId === s.id);
    if (log) {
      log.totalAssigned++;
    } else {
      studentLogs.push({ studentId: s.id, totalAssigned: 1, totalCompleted: 0 });
    }
  });
  await writeData("studentLogs", studentLogs);

  res.redirect("/teacher");
});

router.get("/calendar", async (req, res) => {
  const assignments = await readData("assignments");
  const users = await readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = await readData("submissions");
  const ref = req.query.ref || '';
  res.render("teacher/calendar", { assignments, students, submissions, ref });
});

router.get("/students", async (req, res) => {
  const users = await readData("users");
  const students = users.filter(u => u.role === "student");
  const config = await readConfig();

  const { department, year, level } = req.query;
  let filteredStudents = students;
  if (level && level !== 'All Levels') {
    filteredStudents = filteredStudents.filter(s => s.level === level);
  }
  if (department && department !== 'All Departments') {
    filteredStudents = filteredStudents.filter(s => s.department === department);
  }
  if (year && year !== 'All Years') {
    filteredStudents = filteredStudents.filter(s => s.year == year);
  }

  const ref = req.query.ref || '';
  res.render("teacher/students", {
    students: filteredStudents,
    config,
    filters: req.query || {},
    ref
  });
});

router.get("/students/download", async (req, res) => {
  const users = await readData("users");
  const students = users.filter(u => u.role === "student");
  const assignments = await readData("assignments");
  const submissions = await readData("submissions");

  const { department, year, level } = req.query;
  let filteredStudents = students;
  if (level && level !== 'All Levels') {
    filteredStudents = filteredStudents.filter(s => s.level === level);
  }
  if (department && department !== 'All Departments') {
    filteredStudents = filteredStudents.filter(s => s.department === department);
  }
  if (year && year !== 'All Years') {
    filteredStudents = filteredStudents.filter(s => s.year == year);
  }

  const data = filteredStudents.map(s => {
    const assigned = assignments.filter(a => a.department === s.department && a.year == s.year).length;
    const completed = submissions.filter(sub => sub.studentId == s.id).length;
    return {
      "Reg. Number": s.username,
      "Name": s.name,
      "Level": s.level || 'UG',
      "Department": s.department,
      "Year": s.year,
      "Semester": s.semester || '-',
      "Assessments Assigned": assigned,
      "Assessments Completed": completed
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  let nameParts = ["Students"];
  if (level && level !== 'All Levels') nameParts.push(level);
  if (department && department !== 'All Departments') nameParts.push(department);
  if (year && year !== 'All Years') nameParts.push("Year" + year);
  const fileName = nameParts.join("_") + ".xlsx";

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

router.get("/student/:id", async (req, res) => {
  const users = await readData("users");
  const student = users.find(u => u.id == req.params.id && u.role === "student");

  if (!student) return res.redirect("/teacher/students");

  const assignments = await readData("assignments");
  const submissions = await readData("submissions");
  const ref = req.query.ref || '';

  const studentAssignments = assignments.filter(a => a.department === student.department && a.year == student.year);

  const assignmentsWithStatus = studentAssignments.map(a => {
    const sub = submissions.find(s => s.assignmentId == a.id && s.studentId == student.id);
    let status = "Pending";
    let isLate = false;
    const dueDate = new Date(a.dueDate);
    dueDate.setHours(23, 59, 59, 999);

    if (sub) {
      status = "Submitted";
      if (new Date(sub.submittedAt) > dueDate) {
        isLate = true;
      }
    } else {
      if (new Date() > dueDate) {
        status = "Late";
      }
    }
    return { ...a, status, isLate, submittedAt: sub ? sub.submittedAt : null, submission: sub };
  });

  res.render("teacher/studentDetails", { student, assignments: assignmentsWithStatus, ref });
});

router.post("/check/:assignmentId/:studentId", async (req, res) => {
  let submissions = await readData("submissions");
  const index = submissions.findIndex(s => s.assignmentId == req.params.assignmentId && s.studentId == req.params.studentId);

  if (index !== -1) {
    submissions[index].checked = req.body.checked === 'true';
    await writeData("submissions", submissions);
  }

  const ref = req.body.ref || '';
  if (ref) {
    return res.redirect('/teacher?' + ref);
  }
  res.redirect('/teacher/view/' + req.params.assignmentId);
});

router.get("/edit/:id", async (req, res) => {
  const assignments = await readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.redirect("/teacher");
  const config = await readConfig();
  const ref = req.query.ref || '';
  res.render("teacher/editAssignment", { assignment, ref, config });
});

router.post("/edit/:id", async (req, res) => {
  let assignments = await readData("assignments");
  const index = assignments.findIndex(a => a.id == req.params.id);

  if (index !== -1) {
    assignments[index].title = req.body.title;
    assignments[index].department = req.body.department;
    assignments[index].year = Number(req.body.year);
    assignments[index].level = req.body.level || 'UG';
    assignments[index].subject = req.body.subject;
    assignments[index].dueDate = req.body.dueDate;
    await writeData("assignments", assignments);
  }

  res.redirect("/teacher");
});

router.get("/view/:id", async (req, res) => {
  const assignments = await readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.redirect("/teacher");

  const users = await readData("users");
  const students = users.filter(u => u.role === "student" && u.department === assignment.department && u.year == assignment.year && (u.level || 'UG') === (assignment.level || 'UG'));
  const submissions = await readData("submissions");
  const ref = req.query.ref || '';

  const studentSubmissions = students.map(s => {
    const sub = submissions.find(sub => sub.assignmentId == assignment.id && sub.studentId == s.id);
    return {
      student: s,
      submission: sub
    };
  });

  res.render("teacher/viewAssignment", { assignment, studentSubmissions, ref });
});

router.get("/history", async (req, res) => {
  const history = await readData("assessmentHistory");
  const config = await readConfig();
  const ref = req.query.ref || '';

  const { department, level } = req.query;
  let filtered = [...history];

  if (department && department !== 'All Departments') {
    filtered = filtered.filter(h => h.studentDepartment === department);
  }
  if (level && level !== 'All Levels') {
    filtered = filtered.filter(h => h.studentLevel === level);
  }

  filtered.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

  res.render("teacher/history", {
    history: filtered,
    config,
    ref,
    filters: req.query || {}
  });
});

module.exports = router;
