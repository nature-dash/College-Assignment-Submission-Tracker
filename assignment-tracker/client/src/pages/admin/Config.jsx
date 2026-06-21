import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  card: { background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 },
  cardTitle: { fontWeight: 700, fontSize: 16, color: "#1a1c2e", marginBottom: 16 },
  input: { width: "100%", border: "1px solid #e2e4ed", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" },
  btnPrimary: { background: "#4d96ff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, color: "#fff", cursor: "pointer", whiteSpace: "nowrap" },
  btnDanger: { background: "none", border: "1px solid #d14545", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 13, color: "#d14545", cursor: "pointer" },
  chip: { display: "inline-flex", alignItems: "center", gap: 8, background: "#f5f6fa", borderRadius: 100, padding: "6px 14px", fontSize: 14, fontWeight: 500, color: "#4a4e6b" },
};

export default function Config() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [newDept, setNewDept] = useState("");

  useEffect(() => {
    api.admin.config().then(d => setConfig(d.config)).catch(() => {});
  }, []);

  const addDepartment = async () => {
    if (!newDept.trim()) return;
    try {
      await api.admin.addDepartment(newDept.trim());
      setConfig((c) => ({ ...c, departments: [...(c.departments || []), newDept.trim()] }));
      setNewDept("");
    } catch (err) {
      alert(err.message);
    }
  };

  const removeDepartment = async (dept) => {
    if (!confirm(`Remove department "${dept}"?`)) return;
    try {
      await api.admin.removeDepartment(dept);
      setConfig((c) => ({ ...c, departments: (c.departments || []).filter((d) => d !== dept) }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!config) return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#8a8fa8" }}>Loading...</div></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Department Management</span>
        <div style={s.userInfo}>
          <Link to="/admin" className="btn btn-outline-primary btn-sm" style={{ textDecoration: "none", fontWeight: 600, fontSize: 13 }}>&larr; Dashboard</Link>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate("/login"); }} style={{ fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <div className="container-fluid">
          <div className="row g-4">
            <div className="col-md-6">
              <div style={s.card}>
                <h6 style={s.cardTitle}>Departments</h6>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input style={s.input} placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addDepartment()} />
                  <button style={s.btnPrimary} onClick={addDepartment}>Add</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {config.departments?.map((d) => (
                    <div key={d} style={s.chip}>
                      {d}
                      <span style={{ cursor: "pointer", color: "#d14545", fontWeight: 700, fontSize: 16, lineHeight: 1 }} onClick={() => removeDepartment(d)}>&times;</span>
                    </div>
                  ))}
                  {(!config.departments || config.departments.length === 0) && (
                    <span style={{ color: "#8a8fa8", fontSize: 14 }}>No departments</span>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div style={s.card}>
                <h6 style={s.cardTitle}>Levels</h6>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {config.levels?.map((l) => (
                    <span key={l} style={s.chip}>{l}</span>
                  ))}
                  {(!config.levels || config.levels.length === 0) && (
                    <span style={{ color: "#8a8fa8", fontSize: 14 }}>No levels configured</span>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div style={s.card}>
                <h6 style={s.cardTitle}>Years</h6>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {config.years?.map((y) => (
                    <span key={`${y.level}-${y.year}`} style={s.chip}>{y.level} Year {y.year} ({y.semesters} Sem)</span>
                  ))}
                  {(!config.years || config.years.length === 0) && (
                    <span style={{ color: "#8a8fa8", fontSize: 14 }}>No years configured</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
