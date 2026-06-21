# Assignment Submission Management System (React)

A web-based assignment tracking system for **Arts and Science College**, rebuilt in **React** with an Express REST API backend.

## Tech Stack

- **Frontend:** React 19 + Vite + React Router
- **Backend:** Node.js, Express 5 (REST API)
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

### Prerequisites
- Node.js v18 or later

### 1. Start the API Server (Terminal 1)
```bash
cd server
npm install
npm start
```
The API runs on **http://localhost:3001**

### 2. Start the React Frontend (Terminal 2)
```bash
cd client
npm install
npm run dev
```
The app opens at **http://localhost:5173**

## Demo Credentials

| Role    | Username         | Password     |
| ------- | ---------------- | ------------ |
| Admin   | `psvasc-admin`   | `psvasc@123` |
| Teacher | `teacher-13353`  | `psvasc@123` |
| Student | `1234-ds`        | `psvasc@123` |

## Data Storage

All data is stored as JSON files in `server/data/`:
- `users.json` — Active users (admin, teachers, students)
- `assignments.json` — Active assignments
- `submissions.json` — Student submissions
- `studentLogs.json` — Per-student assignment counts
- `passedout.json` — Archived passed-out students
- `assessmentHistory.json` — Archived assessment records
- `config.json` — College configuration (departments, levels, years)
