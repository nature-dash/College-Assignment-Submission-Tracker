import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const s = {
  page: { minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Inter', sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e2e4ed", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #4d96ff, #6b5bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  userInfo: { display: "flex", alignItems: "center", gap: 12 },
  userName: { fontWeight: 600, fontSize: 14, color: "#4a4e6b" },
  logoutBtn: { background: "none", border: "1px solid #e2e4ed", borderRadius: 10, padding: "8px 16px", fontWeight: 600, fontSize: 13, color: "#d14545", cursor: "pointer" },
  content: { padding: "24px 32px" },
  filterCard: { background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 },
  label: { fontWeight: 600, fontSize: 13, color: "#4a4e6b", display: "block", marginBottom: 4 },
  select: { width: "100%", border: "1px solid #e2e4ed", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f5f6fa", color: "#4a4e6b", fontWeight: 600, fontSize: 13, borderBottom: "2px solid #e2e4ed" },
  td: { padding: "12px 16px", borderBottom: "1px solid #e2e4ed", color: "#1a1c2e" },
  cardTitle: { fontWeight: 700, fontSize: 16, color: "#1a1c2e", marginBottom: 16 },
  btnOutline: { background: "none", border: "1px solid #e2e4ed", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, color: "#4a4e6b", cursor: "pointer", textDecoration: "none" },
};

export default function PassedOut() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);

  const filters = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    api.admin.passedOut(filters).then(setData).catch(() => {});
    api.admin.config().then(setConfig).catch(() => {});
  }, [searchParams]);

  const setFilter = (key, val) => {
    const next = { ...filters };
    if (val) next[key] = val;
    else delete next[key];
    setSearchParams(next);
  };

  const downloadExcel = () => {
    window.open(`/api/admin/passedout/download?${new URLSearchParams(filters)}`, "_blank");
  };

  if (!data) return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#8a8fa8" }}>Loading...</div></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Passed Out Students</span>
        <div style={s.userInfo}>
          <Link to="/admin" className="btn btn-outline-primary btn-sm" style={{ textDecoration: "none", fontWeight: 600, fontSize: 13 }}>&larr; Dashboard</Link>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate("/login"); }} style={{ fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h5 style={{ fontWeight: 700, color: "#1a1c2e", margin: 0 }}>Passed Out Records</h5>
            <button style={s.btnOutline} onClick={downloadExcel}>Download Excel</button>
          </div>

          <div style={s.filterCard}>
            <h6 style={s.cardTitle}>Filters</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label style={s.label}>Level</label>
                <select style={s.select} value={filters.level || ""} onChange={(e) => setFilter("level", e.target.value)}>
                  <option value="">All</option>
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                </select>
              </div>
              <div className="col-md-4">
                <label style={s.label}>Department</label>
                <select style={s.select} value={filters.department || ""} onChange={(e) => setFilter("department", e.target.value)}>
                  <option value="">All</option>
                  {config?.departments?.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <label style={s.label}>Passed Out Year</label>
                <select style={s.select} value={filters.passedOutYear || ""} onChange={(e) => setFilter("passedOutYear", e.target.value)}>
                  <option value="">All</option>
                  {[...new Set((data.passedOut || []).map(s => s.passedOutYear).filter(Boolean))].sort().map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Department</th>
                    <th style={s.th}>Level</th>
                    <th style={s.th}>Total Year</th>
                    <th style={s.th}>Passed Out Year</th>
                    <th style={s.th}>Assignments</th>
                    <th style={s.th}>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.passedOut?.map((st, i) => (
                    <tr key={i}>
                      <td style={s.td}>{st.name}</td>
                      <td style={s.td}>{st.department}</td>
                      <td style={s.td}>{st.level}</td>
                      <td style={s.td}>{st.year}</td>
                      <td style={s.td}>{st.passedOutYear || (st.passedOutAt ? new Date(st.passedOutAt).getFullYear() : "-")}</td>
                      <td style={s.td}>{st.displayAssigned || 0}</td>
                      <td style={s.td}>{st.displayCompleted || 0}</td>
                    </tr>
                  ))}
                  {(!data.passedOut || data.passedOut.length === 0) && (
                    <tr><td colSpan={7} style={{ ...s.td, textAlign: "center", color: "#8a8fa8" }}>No records found</td></tr>
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
