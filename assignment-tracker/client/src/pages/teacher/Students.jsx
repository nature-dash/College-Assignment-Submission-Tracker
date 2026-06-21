import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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

export default function Students() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");

  useEffect(() => {
    api.teacher.config().then(d => setConfig(d.config || d)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (filterLevel) params.level = filterLevel;
    if (filterDept) params.department = filterDept;
    if (filterYear) params.year = filterYear;
    api.teacher.students(params).then(setData).catch(() => {});
  }, [filterLevel, filterDept, filterYear]);

  const handleDownload = async () => {
    try {
      const params = {};
      if (filterLevel) params.level = filterLevel;
      if (filterDept) params.department = filterDept;
      if (filterYear) params.year = filterYear;
      const res = await api.teacher.studentsDownload(params);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "students.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const years = config ? [...new Set((config.years || []).map(y => y.year))].sort() : [];

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
            <h5 style={{ fontWeight: 700, margin: 0, color: "#212529" }}>Students List</h5>
            <small style={{ color: "#6c757d" }}>Welcome, {user?.name || user?.username}</small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate("/teacher")} style={{ fontWeight: 600, fontSize: 13 }}>&larr; Back</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Level</label>
                <SearchableSelect options={["UG", "PG"]} value={filterLevel} onChange={setFilterLevel} placeholder="Levels" />
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Department</label>
                <SearchableSelect options={config?.departments || []} value={filterDept} onChange={setFilterDept} placeholder="Departments" />
              </div>
              <div className="col-md-3">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, display: "block" }}>Year</label>
                <SearchableSelect options={years.map(String)} value={filterYear} onChange={setFilterYear} placeholder="Years" />
              </div>
              <div className="col-md-3">
                <button className="btn btn-success btn-sm w-100" onClick={handleDownload} style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600 }}>
                  Download Excel
                </button>
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
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Student ID</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Department</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Year</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600 }}>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data.students || data.students.length === 0) ? (
                    <tr><td colSpan={6} className="text-center py-4" style={{ color: "#999" }}>No students found</td></tr>
                  ) : (
                    data.students.map((s, i) => (
                      <tr key={s.id || i}>
                        <td style={{ padding: "12px 16px" }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <Link to={`/teacher/student/${s.id}`} style={{ color: "#4d96ff", textDecoration: "none", fontWeight: 500 }}>{s.name}</Link>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{s.regNo || s.username || "-"}</td>
                        <td style={{ padding: "12px 16px" }}>{s.department}</td>
                        <td style={{ padding: "12px 16px" }}>{s.year}</td>
                        <td style={{ padding: "12px 16px" }}>{s.semester}</td>
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
