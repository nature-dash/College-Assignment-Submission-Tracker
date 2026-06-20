# Assignment Submission Management System

A web-based assignment tracking system built with Node.js, Express, and EJS for **Prince Shri Venkateshwara Arts and Science College**.

## Tech Stack

- **Backend:** Node.js, Express 5
- **Templating:** EJS
- **Data Storage:** JSON files
- **Excel Export:** SheetJS (xlsx)
- **Session:** express-session

## Features

### Admin
- **Dashboard** — Overview of all assignments, submissions, pending/late tasks with filters
- **User Management** — Add, edit, delete students & teachers; filter by role/level/department
- **Student Promotion** — Promote students to next semester/year, auto-archive passed-out students
- **Passed Out Students** — View and export passed-out student records
- **Configuration** — Manage departments, levels, and year structures
- **Excel Export** — Download user lists and passed-out records as `.xlsx`

### Teacher
- **Dashboard** — View assignments with per-student progress, filter by department/year/subject
- **Create & Edit Assignments** — Assign by department, year, level, subject with due dates
- **View Submissions** — See per-student submission status, mark as checked/unchecked
- **Calendar View** — Visual calendar of assignment due dates
- **Student Directory** — Browse students, view individual progress, download as Excel
- **Assessment History** — View archived records of promoted/passed-out students

### Student
- **Dashboard** — View personal assignments with status (Pending/Submitted/Late), filter by subject
- **Submit Work** — Submit assignment links
- **Calendar View** — See assignment deadlines on a calendar

## How to Run

```bash
# Install dependencies
npm install

# Start the server
node app.js
```

Then open **http://localhost:3000** in your browser.

## Demo Credentials

| Role    | Username         | Password    |
| ------- | ---------------- | ----------- |
| Admin   | `psvasc-admin`   | `psvasc@123` |
| Teacher | `teacher-13353`  | `psvasc@123` |
| Student | `8118-ds`        | `psvasc@123` |

## Data Storage

All data is stored as JSON files in the `data/` directory:
- `users.json` — Active users (admin, teachers, students)
- `assignments.json` — Active assignments
- `submissions.json` — Student submissions
- `studentLogs.json` — Per-student assignment counts
- `passedout.json` — Archived passed-out students
- `assessmentHistory.json` — Archived assessment records
- `config.json` — College configuration (departments, levels, years)
