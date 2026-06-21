import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const s = {
  page: { minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Inter', sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e2e4ed", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #4d96ff, #6b5bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  userInfo: { display: "flex", alignItems: "center", gap: 12 },
  content: { padding: "24px 32px", maxWidth: 640, margin: "0 auto" },
  card: { background: "#fff", borderRadius: 16, padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  label: { fontWeight: 600, fontSize: 13, color: "#4a4e6b", display: "block", marginBottom: 4 },
  input: { width: "100%", border: "1px solid #ced4da", borderRadius: 6, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", border: "1px solid #ced4da", borderRadius: 6, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" },
  btn: { background: "#4d96ff", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 600, fontSize: 15, color: "#fff", cursor: "pointer", width: "100%" },
  error: { background: "#fff0f0", border: "1px solid #ffd4d4", borderRadius: 10, color: "#d14545", padding: "12px 16px", fontSize: 14, fontWeight: 500, marginBottom: 20, textAlign: "center" },
};

export default function EditUser() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.admin.editUserData(id).then((d) => {
      const editUser = d.editUser || d;
      setForm({ username: editUser.username || "", password: editUser.password || "", name: editUser.name || "", role: editUser.role || "student", department: editUser.department || "", level: editUser.level || "UG", semester: editUser.semester || "" });
      setConfig(d.config || d);
    }).catch(() => navigate("/admin/users"));
  }, [id]);

  const handleChange = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.admin.editUser(id, form);
      navigate("/admin/users");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!form) return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#8a8fa8" }}>Loading...</div></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Edit User</span>
        <div style={s.userInfo}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#4a4e6b" }}>{user?.name || user?.username}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate("/login"); }} style={{ fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <Link to="/admin/users" className="btn btn-outline-primary btn-sm" style={{ textDecoration: "none", fontWeight: 600, fontSize: 13 }}>&larr; Back to Users</Link>
        <div style={s.card}>
          <h5 style={{ fontWeight: 700, marginBottom: 24, color: "#1a1c2e" }}>Edit User</h5>
          {error && <div style={s.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label style={s.label}>Username</label>
                <input style={s.input} value={form.username} onChange={(e) => handleChange("username", e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label style={s.label}>Name</label>
                <input style={s.input} value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label style={s.label}>Password</label>
                <input style={s.input} type="text" value={form.password} onChange={(e) => handleChange("password", e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label style={s.label}>Role</label>
                <select style={s.select} value={form.role} onChange={(e) => handleChange("role", e.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              {form.role === "student" && (
                <>
                  <div className="col-md-4">
                    <label style={s.label}>Department</label>
                    <select style={s.select} value={form.department} onChange={(e) => handleChange("department", e.target.value)}>
                      <option value="">Select</option>
                      {config?.departments?.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label style={s.label}>Level</label>
                    <select style={s.select} value={form.level} onChange={(e) => handleChange("level", e.target.value)}>
                      <option value="UG">UG</option>
                      <option value="PG">PG</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label style={s.label}>Semester</label>
                    <input style={s.input} type="number" min="1" max="8" value={form.semester} onChange={(e) => handleChange("semester", e.target.value)} required />
                  </div>
                </>
              )}
            </div>
            <div style={{ marginTop: 24 }}>
              <button style={s.btn}>Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
