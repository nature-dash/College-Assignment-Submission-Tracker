import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

export default function History() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [filterDept, setFilterDept] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  useEffect(() => {
    api.teacher.config().then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (filterDept) params.department = filterDept;
    if (filterLevel) params.level = filterLevel;
    api.teacher.history(params).then(setData).catch(() => {});
  }, [filterDept, filterLevel]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const downloadExcel = () => {
    const params = {};
    if (filterDept) params.department = filterDept;
    if (filterLevel) params.level = filterLevel;
    window.open(`/api/teacher/history/download?${new URLSearchParams(params)}`, "_blank");
  };

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
        <div className="container py-5 text-center"><div className="spinner-border" role="status" /></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef", padding: "12px 0" }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <h5 style={{ fontWeight: 700, margin: 0, color: "#212529" }}>Assessment History</h5>
            <small style={{ color: "#6c757d" }}>Welcome, {user?.name || user?.username}</small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-success btn-sm" onClick={downloadExcel}>Download Excel</button>
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate("/teacher")} style={{ fontWeight: 600, fontSize: 13 }}>&larr; Back</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <h6 style={{ fontWeight: 700, marginBottom: 16, color: "#495057" }}>Filters</h6>
            <div className="row g-2 align-items-end">
              <div className="col-md-5">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Department</label>
                <select className="form-select form-select-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ fontSize: 14 }}>
                  <option value="">All Departments</option>
                  {(config?.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-md-5">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Level</label>
                <select className="form-select form-select-sm" value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ fontSize: 14 }}>
                  <option value="">All Levels</option>
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                </select>
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setFilterDept(""); setFilterLevel(""); }}>Clear</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: 14 }}>
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>#</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Student</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Student ID</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Assignment</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Department</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Level</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Archived Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data.history || data.history.length === 0) ? (
                    <tr><td colSpan={8} className="text-center py-4" style={{ color: "#999" }}>No history records found</td></tr>
                  ) : (
                    data.history.map((r, i) => (
                      <tr key={i}>
                        <td style={{ padding: "12px 16px" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{r.studentName}</td>
                        <td style={{ padding: "12px 16px" }}>{r.studentUsername}</td>
                        <td style={{ padding: "12px 16px" }}>{r.assignmentTitle}</td>
                        <td style={{ padding: "12px 16px" }}>{r.assignmentDepartment}</td>
                        <td style={{ padding: "12px 16px" }}>{r.assignmentLevel}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`badge ${r.submittedAt && new Date(r.submittedAt) <= new Date(r.assignmentDueDate) ? "bg-success" : r.submittedAt ? "bg-danger" : "bg-warning text-dark"}`}>
                            {r.submittedAt ? (new Date(r.submittedAt) > new Date(r.assignmentDueDate) ? "Late" : "Submitted") : "Pending"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{r.archivedAt ? new Date(r.archivedAt).toLocaleDateString() : "-"}</td>
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
