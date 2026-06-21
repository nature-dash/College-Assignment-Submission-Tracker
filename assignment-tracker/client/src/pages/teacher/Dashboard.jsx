import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

function SearchableSelect({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef();
  useEffect(() => {
    function f(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const filtered = options.filter(o => String(o).toLowerCase().includes(query.toLowerCase()));
  const display = value || placeholder || "Select...";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => { setOpen(!open); setQuery(""); }}
        style={{ background: "#fff", border: "1px solid #ced4da", borderRadius: 6, padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
        <span style={{ color: value ? "#212529" : "#adb5bd" }}>{display}</span>
        <span>{open ? "\u25B2" : "\u25BC"}</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1050, background: "#fff", border: "1px solid #ced4da", borderRadius: 6, marginTop: 2, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search..." style={{ width: "100%", border: "none", borderBottom: "1px solid #eee", padding: "8px 12px", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
          <div onClick={() => { onChange(""); setOpen(false); }}
            style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, color: "#6c757d", borderBottom: "1px solid #f0f0f0" }}>All {placeholder || ""}</div>
          {filtered.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, background: o === value ? "#e9ecef" : "transparent", borderBottom: "1px solid #f0f0f0" }}>{o}</div>
          ))}
          {filtered.length === 0 && <div style={{ padding: "8px 12px", color: "#999", fontSize: 14 }}>No results</div>}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [fDept, setFDept] = useState(searchParams.get("department") || "");
  const [fLevel, setFLevel] = useState(searchParams.get("level") || "");
  const [fYear, setFYear] = useState(searchParams.get("year") || "");
  const [fSubject, setFSubject] = useState(searchParams.get("subject") || "");
  const [checking, setChecking] = useState({});
  const taskStatus = searchParams.get("taskStatus") || "";

  useEffect(() => {
    api.teacher.config().then(d => setConfig(d.config || d)).catch(() => {});
  }, []);

  useEffect(() => {
    const p = {};
    if (fDept) p.department = fDept;
    if (fLevel) p.level = fLevel;
    if (fYear) p.year = fYear;
    if (fSubject) p.subject = fSubject;
    if (taskStatus) p.taskStatus = taskStatus;
    api.teacher.dashboard(p).then(setData).catch(() => {});
  }, [fDept, fLevel, fYear, fSubject, taskStatus]);

  const applyFilter = () => {
    const p = {};
    if (fDept) p.department = fDept;
    if (fLevel) p.level = fLevel;
    if (fYear) p.year = fYear;
    if (fSubject) p.subject = fSubject;
    setSearchParams(p, { replace: true });
  };

  const clearFilter = () => {
    setFDept(""); setFLevel(""); setFYear(""); setFSubject("");
    setSearchParams({}, { replace: true });
  };

  const viewTasks = (status) => {
    const p = {};
    if (fDept) p.department = fDept;
    if (fLevel) p.level = fLevel;
    if (fYear) p.year = fYear;
    if (fSubject) p.subject = fSubject;
    p.taskStatus = status;
    setSearchParams(p, { replace: true });
  };

  const handleCheck = async (assignmentId, studentId, checked) => {
    setChecking(p => ({ ...p, [`${assignmentId}-${studentId}`]: true }));
    try {
      await api.teacher.check(assignmentId, studentId, checked);
      const p = {};
      if (fDept) p.department = fDept;
      if (fLevel) p.level = fLevel;
      if (fYear) p.year = fYear;
      if (fSubject) p.subject = fSubject;
      if (taskStatus) p.taskStatus = taskStatus;
      const d = await api.teacher.dashboard(p);
      setData(d);
    } catch (e) { alert(e.message); }
    finally { setChecking(p => ({ ...p, [`${assignmentId}-${studentId}`]: false })); }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment permanently?")) return;
    try {
      await api.teacher.deleteAssignment(assignmentId);
      const p = {};
      if (fDept) p.department = fDept;
      if (fLevel) p.level = fLevel;
      if (fYear) p.year = fYear;
      if (fSubject) p.subject = fSubject;
      if (taskStatus) p.taskStatus = taskStatus;
      const d = await api.teacher.dashboard(p);
      setData(d);
    } catch (e) { alert(e.message); }
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (!data) return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
      <div className="container py-5 text-center"><div className="spinner-border" role="status" /></div>
    </div>
  );

  const years = [...new Set((config?.years || []).map(y => y.year))].sort();

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "12px 0" }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h5 style={{ fontWeight: 700, margin: 0, color: "#212529" }}>Teacher Dashboard</h5>
            <small style={{ color: "#6c757d" }}>Welcome, {user?.name || user?.username}</small>
          </div>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div onClick={() => viewTasks("")} style={{ cursor: "pointer" }}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: "linear-gradient(135deg, #4d96ff, #6b5bff)" }}>
                <div className="card-body text-white">
                  <h6 style={{ fontWeight: 600, opacity: 0.9, fontSize: 13 }}>Total Assignments</h6>
                  <h2 style={{ fontWeight: 800, margin: 0 }}>{data.assignments?.length || 0}</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div onClick={() => viewTasks("Submitted")} style={{ cursor: "pointer" }}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: "linear-gradient(135deg, #28a745, #20c997)" }}>
                <div className="card-body text-white">
                  <h6 style={{ fontWeight: 600, opacity: 0.9, fontSize: 13 }}>Submitted</h6>
                  <h2 style={{ fontWeight: 800, margin: 0 }}>{data.submittedCount || 0}</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div onClick={() => viewTasks("Pending")} style={{ cursor: "pointer" }}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: "linear-gradient(135deg, #ffc107, #fd7e14)" }}>
                <div className="card-body text-white">
                  <h6 style={{ fontWeight: 600, opacity: 0.9, fontSize: 13 }}>Pending</h6>
                  <h2 style={{ fontWeight: 800, margin: 0 }}>{data.pendingCount || 0}</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div onClick={() => viewTasks("Late")} style={{ cursor: "pointer" }}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: 12, background: "linear-gradient(135deg, #dc3545, #e74c3c)" }}>
                <div className="card-body text-white">
                  <h6 style={{ fontWeight: 600, opacity: 0.9, fontSize: 13 }}>Late</h6>
                  <h2 style={{ fontWeight: 800, margin: 0 }}>{data.lateCount || 0}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-4">
          <button className="btn" style={{ background: "#4d96ff", border: "none", borderRadius: 8, padding: "6px 18px", fontWeight: 600, fontSize: 13, color: "#fff" }} onClick={() => navigate("/teacher/add")}>+ Add Assignment</button>
          <button className="btn" style={{ background: "#6f42c1", border: "none", borderRadius: 8, padding: "6px 18px", fontWeight: 600, fontSize: 13, color: "#fff" }} onClick={() => navigate("/teacher/calendar")}>Assignment Calendar</button>
          <button className="btn" style={{ background: "#28a745", border: "none", borderRadius: 8, padding: "6px 18px", fontWeight: 600, fontSize: 13, color: "#fff" }} onClick={() => navigate("/teacher/students")}>Students List</button>
          <button className="btn" style={{ background: "#fd7e14", border: "none", borderRadius: 8, padding: "6px 18px", fontWeight: 600, fontSize: 13, color: "#fff" }} onClick={() => navigate("/teacher/history")}>Assessment History</button>
        </div>

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#495057" }}>Filters</h6>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Department</label>
                <SearchableSelect options={config?.departments || []} value={fDept} onChange={setFDept} placeholder="Departments" />
              </div>
              <div className="col-md-2">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Level</label>
                <SearchableSelect options={["UG", "PG"]} value={fLevel} onChange={setFLevel} placeholder="Levels" />
              </div>
              <div className="col-md-2">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Year</label>
                <SearchableSelect options={years.map(String)} value={fYear} onChange={setFYear} placeholder="Years" />
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Subject</label>
                <SearchableSelect options={data.allSubjects || []} value={fSubject} onChange={setFSubject} placeholder="Subjects" />
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button className="btn btn-primary btn-sm flex-fill" onClick={applyFilter} style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600 }}>Filter</button>
                <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={clearFilter} style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600 }}>Clear</button>
              </div>
            </div>
          </div>
        </div>

        {taskStatus && data.displayTasks ? (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header" style={{ background: "#fff", borderBottom: "1px solid #e9ecef" }}>
              <div className="d-flex justify-content-between align-items-center">
                <h6 style={{ fontWeight: 700, margin: 0, color: "#495057" }}>Showing {taskStatus} Tasks ({data.displayTasks.length})</h6>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => { const p = {}; if (fDept) p.department = fDept; if (fLevel) p.level = fLevel; if (fYear) p.year = fYear; if (fSubject) p.subject = fSubject; setSearchParams(p, { replace: true }); }}>Back to Overview</button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Student</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Assignment</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Department</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Due Date</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Submission</th>
                      {taskStatus === "Submitted" && <th style={{ padding: "12px 16px", fontWeight: 600 }}>Checked</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.displayTasks.map((t, i) => (
                      <tr key={i}>
                        <td style={{ padding: "12px 16px" }}>
                          <Link to={`/teacher/student/${t.student.id}`} style={{ color: "#4d96ff", textDecoration: "none" }}>{t.student.name}</Link>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link to={`/teacher/view/${t.assignment.id}`} style={{ color: "#4d96ff", textDecoration: "none" }}>{t.assignment.title}</Link>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{t.assignment.department}</td>
                        <td style={{ padding: "12px 16px" }}>{t.assignment.dueDate ? new Date(t.assignment.dueDate).toLocaleDateString() : "-"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`badge ${t.status === "Submitted" ? "bg-success" : t.status === "Late" ? "bg-danger" : "bg-warning text-dark"}`}>{t.status}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {t.submission?.link ? <a href={t.submission.link} target="_blank" rel="noreferrer" className="btn btn-sm btn-info text-white">View Link</a> : "-"}
                        </td>
                        {taskStatus === "Submitted" && (
                          <td style={{ padding: "12px 16px" }}>
                            <input type="checkbox" checked={!!t.submission?.checked} disabled={checking[`${t.assignment.id}-${t.student.id}`]}
                              onChange={e => handleCheck(t.assignment.id, t.student.id, e.target.checked)}
                              style={{ width: 18, height: 18, cursor: "pointer" }} />
                          </td>
                        )}
                      </tr>
                    ))}
                    {data.displayTasks.length === 0 && (
                      <tr><td colSpan={taskStatus === "Submitted" ? 7 : 6} className="text-center py-4" style={{ color: "#999" }}>No tasks found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
                  <thead style={{ background: "#f8f9fa" }}>
                    <tr>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Title</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Department</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Level</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Year</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Subject</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Due Date</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Progress</th>
                      <th style={{ padding: "12px 16px", fontWeight: 600 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assignments.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-4" style={{ color: "#999" }}>No assignments found</td></tr>
                    ) : (
                      data.assignments.map(a => (
                        <tr key={a.id}>
                          <td style={{ padding: "12px 16px" }}>
                            <Link to={`/teacher/view/${a.id}`} style={{ color: "#4d96ff", textDecoration: "none", fontWeight: 500 }}>{a.title}</Link>
                            <br /><small className="text-muted">by {a.assignedBy || "-"}</small>
                          </td>
                          <td style={{ padding: "12px 16px" }}>{a.department}</td>
                          <td style={{ padding: "12px 16px" }}>{a.level || "UG"}</td>
                          <td style={{ padding: "12px 16px" }}>{a.year}</td>
                          <td style={{ padding: "12px 16px" }}>{a.subject}</td>
                          <td style={{ padding: "12px 16px" }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "-"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {a.totalStudents === 0 ? (
                              <span className="badge bg-secondary">No Students</span>
                            ) : (
                              <span className={`badge ${a.submittedStudents === a.totalStudents ? "bg-success" : a.submittedStudents > 0 ? "bg-warning text-dark" : "bg-danger"}`}>
                                {a.submittedStudents}/{a.totalStudents} submitted
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div className="d-flex gap-1">
                              <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/teacher/edit/${a.id}`)}>Edit</button>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteAssignment(a.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
