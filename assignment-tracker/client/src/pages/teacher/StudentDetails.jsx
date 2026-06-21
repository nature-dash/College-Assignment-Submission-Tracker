import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

export default function StudentDetails() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.teacher.studentDetails(id).then(setData).catch(() => {});
  }, [id]);

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

  const { student, assignments } = data;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "12px 0" }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h5 style={{ fontWeight: 700, margin: 0, color: "#212529" }}>Student Details</h5>
            <small style={{ color: "#6c757d" }}>Welcome, {user?.name || user?.username}</small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate("/teacher/students")} style={{ fontWeight: 600, fontSize: 13 }}>&larr; Back</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {student && (
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
            <div className="card-body p-4">
              <h5 style={{ fontWeight: 700, marginBottom: 16, color: "#212529" }}>{student.name}</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Student ID</small>
                  <span style={{ fontWeight: 500 }}>{student.regNo || student.username || "-"}</span>
                </div>
                <div className="col-md-3">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Department</small>
                  <span style={{ fontWeight: 500 }}>{student.department}</span>
                </div>
                <div className="col-md-2">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Year</small>
                  <span style={{ fontWeight: 500 }}>{student.year}</span>
                </div>
                <div className="col-md-2">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Semester</small>
                  <span style={{ fontWeight: 500 }}>{student.semester}</span>
                </div>
                <div className="col-md-2">
                  <small style={{ color: "#6c757d", display: "block", fontWeight: 600 }}>Level</small>
                  <span style={{ fontWeight: 500 }}>{student.level}</span>
                </div>
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
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Assignment</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Due Date</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Submission Link</th>
                  </tr>
                </thead>
                <tbody>
                  {(!assignments || assignments.length === 0) ? (
                    <tr><td colSpan={5} className="text-center py-4" style={{ color: "#999" }}>No assignments found</td></tr>
                  ) : (
                    assignments.map((a, i) => (
                      <tr key={a.id || i}>
                        <td style={{ padding: "12px 16px" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link to={`/teacher/view/${a.id}`} style={{ color: "#4d96ff", textDecoration: "none", fontWeight: 500 }}>{a.title}</Link>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "-"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`badge ${a.status === "Submitted" ? "bg-success" : a.status === "Late" ? "bg-danger" : "bg-warning text-dark"}`}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {a.submissionLink ? (
                            <a href={a.submissionLink} target="_blank" rel="noreferrer" style={{ color: "#4d96ff", textDecoration: "none", fontSize: 13 }}>View Link</a>
                          ) : (
                            <span style={{ color: "#adb5bd" }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
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
