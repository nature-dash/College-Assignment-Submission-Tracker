import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const s = {
  page: { minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Inter', sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e2e4ed", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #4d96ff, #6b5bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  userInfo: { display: "flex", alignItems: "center", gap: 12 },
  content: { padding: "24px 32px" },
  filterCard: { background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 },
  label: { fontWeight: 600, fontSize: 13, color: "#4a4e6b", display: "block", marginBottom: 4 },
  select: { width: "100%", border: "1px solid #ced4da", borderRadius: 6, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f5f6fa", color: "#4a4e6b", fontWeight: 600, fontSize: 13, borderBottom: "2px solid #e2e4ed" },
  td: { padding: "12px 16px", borderBottom: "1px solid #e2e4ed", color: "#1a1c2e" },
  cardTitle: { fontWeight: 700, fontSize: 16, color: "#1a1c2e", marginBottom: 16 },
  btnPrimary: { background: "#4d96ff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14, color: "#fff", cursor: "pointer", textDecoration: "none", display: "inline-block" },
  btnDanger: { background: "none", border: "1px solid #d14545", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 13, color: "#d14545", cursor: "pointer" },
  btnOutline: { background: "none", border: "1px solid #e2e4ed", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 13, color: "#4a4e6b", cursor: "pointer", textDecoration: "none", display: "inline-block" },
};

export default function Users() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);

  const filters = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    api.admin.users(filters).then(setData).catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    api.admin.config().then(d => setConfig(d.config || d)).catch(() => {});
  }, []);

  const setFilter = (key, val) => {
    const next = { ...filters };
    if (val) next[key] = val;
    else delete next[key];
    setSearchParams(next);
  };

  const removeUser = async (id) => {
    if (!confirm("Remove this user?")) return;
    try { await api.admin.removeUser(id); setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) })); }
    catch (e) { alert(e.message); }
  };

  const downloadExcel = () => {
    window.open(`/api/admin/users/download?${new URLSearchParams(filters)}`, "_blank");
  };

  if (!data) return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#8a8fa8" }}>Loading...</div></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>User Management</span>
        <div style={s.userInfo}>
          <Link to="/admin" className="btn btn-outline-primary btn-sm" style={{ textDecoration: "none", fontWeight: 600, fontSize: 13 }}>&larr; Dashboard</Link>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate("/login"); }} style={{ fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <div className="container-fluid">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h5 style={{ fontWeight: 700, color: "#1a1c2e", margin: 0 }}>All Users</h5>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={s.btnOutline} onClick={downloadExcel}>Download Excel</button>
              <Link to="/admin/users/add" style={s.btnPrimary}>Add User</Link>
            </div>
          </div>

          <div style={s.filterCard}>
            <h6 style={s.cardTitle}>Filters</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label style={s.label}>Role</label>
                <select style={s.select} value={filters.role || ""} onChange={(e) => setFilter("role", e.target.value)}>
                  <option value="">All</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
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
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Username</th>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Role</th>
                    <th style={s.th}>Department</th>
                    <th style={s.th}>Level</th>
                    <th style={s.th}>Year</th>
                    <th style={s.th}>Semester</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users?.map((u) => (
                    <tr key={u.id}>
                      <td style={s.td}>{u.username}</td>
                      <td style={s.td}>{u.name}</td>
                      <td style={s.td}>{u.role}</td>
                      <td style={s.td}>{u.department || "-"}</td>
                      <td style={s.td}>{u.level || "-"}</td>
                      <td style={s.td}>{u.year || "-"}</td>
                      <td style={s.td}>{u.semester || "-"}</td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Link to={`/admin/users/edit/${u.id}`} style={s.btnOutline}>Edit</Link>
                          <button style={s.btnDanger} onClick={() => removeUser(u.id)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!data.users || data.users.length === 0) && (
                    <tr><td colSpan={8} style={{ ...s.td, textAlign: "center", color: "#8a8fa8" }}>No users found</td></tr>
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
