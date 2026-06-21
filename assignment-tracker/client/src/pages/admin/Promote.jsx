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
  card: { background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 },
  cardTitle: { fontWeight: 700, fontSize: 16, color: "#1a1c2e", marginBottom: 16 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f5f6fa", color: "#4a4e6b", fontWeight: 600, fontSize: 13, borderBottom: "2px solid #e2e4ed" },
  td: { padding: "12px 16px", borderBottom: "1px solid #e2e4ed", color: "#1a1c2e" },
  statBox: { textAlign: "center", padding: "16px", background: "#f5f6fa", borderRadius: 12, flex: 1 },
  statNumber: { fontWeight: 800, fontSize: 28, color: "#4d96ff" },
  statLabel: { color: "#8a8fa8", fontSize: 13, fontWeight: 500 },
  btnPrimary: { background: "#4d96ff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 600, fontSize: 15, color: "#fff", cursor: "pointer" },
  btnDisabled: { background: "#c5d9f5", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 600, fontSize: 15, color: "#fff", cursor: "not-allowed" },
};

export default function Promote() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const filters = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    api.admin.promote(filters).then(setData).catch(() => {});
    api.admin.config().then(setConfig).catch(() => {});
  }, [searchParams]);

  const setFilter = (key, val) => {
    const next = { ...filters };
    if (val) next[key] = val;
    else delete next[key];
    setSearchParams(next);
  };

  const handlePromote = async () => {
    if (!confirm("Confirm promotion?")) return;
    setLoading(true);
    try {
      await api.admin.doPromote(filters);
      alert("Promotion completed successfully");
      setSearchParams({});
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data) return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#8a8fa8" }}>Loading...</div></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Student Promotion</span>
        <div style={s.userInfo}>
          <Link to="/admin" className="btn btn-outline-primary btn-sm" style={{ textDecoration: "none", fontWeight: 600, fontSize: 13 }}>&larr; Dashboard</Link>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate("/login"); }} style={{ fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <div className="container-fluid">
          <div style={s.filterCard}>
            <h6 style={s.cardTitle}>Filters</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={s.label}>Level</label>
                <select style={s.select} value={filters.level || ""} onChange={(e) => setFilter("level", e.target.value)}>
                  <option value="">All</option>
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                </select>
              </div>
              <div className="col-md-6">
                <label style={s.label}>Department</label>
                <select style={s.select} value={filters.department || ""} onChange={(e) => setFilter("department", e.target.value)}>
                  <option value="">All</option>
                  {config?.departments?.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={s.statBox}>
              <div style={s.statNumber}>{data.promoteCount || 0}</div>
              <div style={s.statLabel}>Students to Promote</div>
            </div>
            <div style={s.statBox}>
              <div style={{ ...s.statNumber, color: "#2ecc71" }}>{data.passoutCount || 0}</div>
              <div style={s.statLabel}>Students to Pass Out</div>
            </div>
          </div>

          <div style={s.card}>
            <h6 style={s.cardTitle}>Promotion Preview</h6>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Category</th>
                    <th style={s.th}>Student Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.preview || {}).length === 0 ? (
                    <tr><td colSpan={2} style={{ ...s.td, textAlign: "center", color: "#8a8fa8" }}>No students to promote</td></tr>
                  ) : (
                    Object.entries(data.preview).map(([key, count], i) => (
                      <tr key={i}>
                        <td style={s.td}>{key}</td>
                        <td style={s.td}><span style={{ fontWeight: 700, fontSize: 16 }}>{count}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button style={data.promoteCount === 0 && data.passoutCount === 0 ? s.btnDisabled : s.btnPrimary} onClick={handlePromote} disabled={(data.promoteCount === 0 && data.passoutCount === 0) || loading}>
                {loading ? "Processing..." : "Confirm Promotion"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
