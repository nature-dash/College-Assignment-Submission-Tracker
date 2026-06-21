import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

export default function ViewAssignment() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    api.teacher.viewAssignment(id).then(setData).catch(() => {});
  }, [id]);

  const refresh = async () => {
    const d = await api.teacher.viewAssignment(id);
    setData(d);
  };

  const handleCheck = async (studentId, checked) => {
    setActionLoading(p => ({ ...p, [studentId]: true }));
    try {
      await api.teacher.check(id, studentId, checked);
      await refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(p => ({ ...p, [studentId]: false }));
    }
  };

  const handleMarkSubmitted = async (studentId) => {
    setActionLoading(p => ({ ...p, [studentId]: true }));
    try {
      await api.teacher.check(id, studentId, true);
      await refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(p => ({ ...p, [studentId]: false }));
    }
  };

  const handleMarkNotSubmitted = async (studentId) => {
    setActionLoading(p => ({ ...p, [studentId]: true }));
    try {
      await api.teacher.uncheck(id, studentId);
      await refresh();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(p => ({ ...p, [studentId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this assignment permanently?")) return;
    try {
      await api.teacher.deleteAssignment(id);
      navigate("/teacher");
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
        <div className="container py-5 text-center"><div className="spinner-border" role="status" /></div>
      </div>
    );
  }

  const { assignment } = data;
  const rows = (data.studentSubmissions || []).map(({ student, submission }) => ({
    studentId: student?.id,
    name: student?.name,
    regNo: student?.regNo || student?.username,
    status: submission?.status || "Pending",
    originalStatus: submission?.originalStatus || null,
    submissionLink: submission?.link || null,
    checked: submission?.checked || false,
    hasSubmission: !!submission,
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "12px 0" }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h5 style={{ fontWeight: 700, margin: 0, color: "#212529" }}>View Assignment</h5>
            <small style={{ color: "#6c757d" }}>Welcome, {user?.name || user?.username}</small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate("/teacher")} style={{ fontWeight: 600, fontSize: 13 }}>&larr; Back</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {assignment && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
            <div className="card-body p-4">
              <h5 style={{ fontWeight: 700, marginBottom: 16, color: "#212529" }}>{assignment.title}</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Department</small>
                  <span style={{ fontWeight: 500 }}>{assignment.department}</span>
                </div>
                <div className="col-md-2">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Level</small>
                  <span style={{ fontWeight: 500 }}>{assignment.level}</span>
                </div>
                <div className="col-md-2">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Year</small>
                  <span style={{ fontWeight: 500 }}>{assignment.year}</span>
                </div>
                <div className="col-md-3">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Subject</small>
                  <span style={{ fontWeight: 500 }}>{assignment.subject}</span>
                </div>
                <div className="col-md-2">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Due Date</small>
                  <span style={{ fontWeight: 500 }}>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "-"}</span>
                </div>
              </div>
              {assignment.description && (
                <div className="mt-3">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Description</small>
                  <p style={{ marginTop: 4, fontSize: 14, color: "#495057", whiteSpace: "pre-wrap" }}>{assignment.description}</p>
                </div>
              )}
              <div className="mt-3 d-flex gap-2">
                <button className="btn btn-outline-primary btn-sm" onClick={() => navigate(`/teacher/edit/${id}`)}>Edit</button>
                <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>#</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Student ID</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Submitted Link</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Action</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4" style={{ color: "#999" }}>No students found</td></tr>
                  ) : (
                    rows.map((r, i) => {
                      const displayStatus = r.hasSubmission ? "Submitted" : r.status;
                      const badgeClass = displayStatus === "Submitted" ? "bg-success" : displayStatus === "Late" ? "bg-danger" : "bg-warning text-dark";
                      const loading = actionLoading[r.studentId];
                      const isStudentSubmitted = r.hasSubmission && !r.originalStatus;
                      return (
                      <tr key={r.studentId || i}>
                        <td style={{ padding: "12px 16px" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link to={`/teacher/student/${r.studentId}`} style={{ color: "#4d96ff", textDecoration: "none", fontWeight: 500 }}>{r.name}</Link>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{r.regNo}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`badge ${badgeClass}`}>{displayStatus}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {!r.hasSubmission ? (
                            <span style={{ color: "#adb5bd" }}>-</span>
                          ) : !r.submissionLink ? (
                            <span style={{ color: "#adb5bd" }}>null</span>
                          ) : (
                            <a href={r.submissionLink} target="_blank" rel="noopener noreferrer"
                              style={{ color: "#4d96ff", textDecoration: "none", wordBreak: "break-all" }}>
                              {r.submissionLink}
                            </a>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {r.originalStatus ? (
                            <button className="btn btn-outline-danger btn-sm" disabled={loading}
                              onClick={() => handleMarkNotSubmitted(r.studentId)}
                              style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px" }}>
                              {loading ? "..." : "Mark Not Submitted"}
                            </button>
                          ) : isStudentSubmitted ? (
                            <span style={{ color: "#adb5bd", fontSize: 13 }}>Already submitted</span>
                          ) : (
                            <button className="btn btn-success btn-sm" disabled={loading}
                              onClick={() => handleMarkSubmitted(r.studentId)}
                              style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
                              {loading ? "..." : "Mark Submitted"}
                            </button>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {r.hasSubmission ? (
                            <input type="checkbox" checked={!!r.checked} disabled={loading}
                              onChange={e => handleCheck(r.studentId, e.target.checked)}
                              style={{ width: 18, height: 18, cursor: "pointer" }} />
                          ) : (
                            <span style={{ color: "#adb5bd" }}>-</span>
                          )}
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
