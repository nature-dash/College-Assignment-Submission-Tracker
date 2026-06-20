const express = require("express");
const router = express.Router();
const fs = require("fs");
const XLSX = require("xlsx");

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
  if (!req.session.user || req.session.user.role !== "teacher") {
    return res.redirect("/login");
  }
  next();
});

// Dashboard
router.get("/", (req, res) => {
  const allAssignments = readData("assignments");
  let assignments = [...allAssignments];
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = readData("submissions");
  const config = JSON.parse(fs.readFileSync('./data/config.json'));
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

  // Compute progress per assignment
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
    // Apply filters to task view too
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

// Add Assignment (GET)
router.get("/add", (req, res) => {
  res.render("teacher/addAssignment");
});

// Add Assignment (POST)
router.post("/add", (req, res) => {
  let assignments = readData("assignments");

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
  writeData("assignments", assignments);

  res.redirect("/teacher");
});

// Calendar
router.get("/calendar", (req, res) => {
  const assignments = readData("assignments");
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const submissions = readData("submissions");
  const ref = req.query.ref || '';
  res.render("teacher/calendar", { assignments, students, submissions, ref });
});

// Students List
router.get("/students", (req, res) => {
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const config = JSON.parse(fs.readFileSync('./data/config.json'));
  
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

// Download Students as Excel
router.get("/students/download", (req, res) => {
  const users = readData("users");
  const students = users.filter(u => u.role === "student");
  const assignments = readData("assignments");
  const submissions = readData("submissions");

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

// Student Details
router.get("/student/:id", (req, res) => {
  const users = readData("users");
  const student = users.find(u => u.id == req.params.id && u.role === "student");
  
  if (!student) return res.redirect("/teacher/students");

  const assignments = readData("assignments");
  const submissions = readData("submissions");
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

// Toggle Checked/Unchecked on a submission
router.post("/check/:assignmentId/:studentId", (req, res) => {
  let submissions = readData("submissions");
  const index = submissions.findIndex(s => s.assignmentId == req.params.assignmentId && s.studentId == req.params.studentId);
  
  if (index !== -1) {
    submissions[index].checked = !submissions[index].checked;
    writeData("submissions", submissions);
  }
  
  const ref = req.body.ref || '';
  if (ref) {
    return res.redirect('/teacher?' + ref);
  }
  res.redirect('/teacher/view/' + req.params.assignmentId);
});

// Edit Assignment (GET)
router.get("/edit/:id", (req, res) => {
  const assignments = readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.redirect("/teacher");
  const ref = req.query.ref || '';
  res.render("teacher/editAssignment", { assignment, ref });
});

// Edit Assignment (POST)
router.post("/edit/:id", (req, res) => {
  let assignments = readData("assignments");
  const index = assignments.findIndex(a => a.id == req.params.id);
  
  if (index !== -1) {
    assignments[index].title = req.body.title;
    assignments[index].department = req.body.department;
    assignments[index].year = Number(req.body.year);
    assignments[index].level = req.body.level || 'UG';
    assignments[index].subject = req.body.subject;
    assignments[index].dueDate = req.body.dueDate;
    writeData("assignments", assignments);
  }
  
  res.redirect("/teacher");
});

// View Assignment
router.get("/view/:id", (req, res) => {
  const assignments = readData("assignments");
  const assignment = assignments.find(a => a.id == req.params.id);
  if (!assignment) return res.redirect("/teacher");
  
  const users = readData("users");
  const students = users.filter(u => u.role === "student" && u.department === assignment.department && u.year == assignment.year && (u.level || 'UG') === (assignment.level || 'UG'));
  const submissions = readData("submissions");
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

module.exports = router;