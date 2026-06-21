import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const s = {
  page: { minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Inter', sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e2e4ed", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #4d96ff, #6b5bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  userInfo: { display: "flex", alignItems: "center", gap: 12 },
  userName: { fontWeight: 600, fontSize: 14, color: "#4a4e6b" },
  content: { padding: "24px 32px" },
  card: { background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 },
  cardTitle: { fontWeight: 700, fontSize: 16, color: "#1a1c2e", marginBottom: 16 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 16px", background: "#f5f6fa", color: "#4a4e6b", fontWeight: 600, fontSize: 13, borderBottom: "2px solid #e2e4ed" },
  td: { padding: "12px 16px", borderBottom: "1px solid #e2e4ed", color: "#1a1c2e" },
  badge: { padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-block" },
  detailRow: { display: "flex", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 14 },
  detailLabel: { fontWeight: 600, color: "#4a4e6b", minWidth: 140 },
  detailValue: { color: "#1a1c2e" },
};

const badgeColor = (status) => {
  const map = { submitted: "#4d96ff", pending: "#f5a623", late: "#d14545", checked: "#2ecc71" };
  return map[status?.toLowerCase()] || "#8a8fa8";
};

export default function ViewAssignment() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.admin.viewAssignment(id).then(setData).catch(() => navigate("/admin"));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this assignment permanently?")) return;
    try {
      await api.admin.deleteAssignment(id);
      navigate("/admin");
    } catch (e) {
      alert(e.message);
    }
  };

  if (!data) return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#8a8fa8" }}>Loading...</div></div>;

  const a = data.assignment || data;
  const rows = (data.studentSubmissions || []).map(({ student, submission }) => ({
    studentName: student?.name,
    studentId: student?.id,
    regNo: student?.regNo || student?.username,
    status: submission ? "Submitted" : "Pending",
    link: submission?.link || null,
    submittedAt: submission?.submittedAt || null,
    checked: submission?.checked || false,
    hasSubmission: !!submission,
  }));
  const submittedCount = rows.filter(r => r.hasSubmission).length;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Assignment Details</span>
        <div style={s.userInfo}>
          <Link to="/admin" className="btn btn-outline-primary btn-sm" style={{ textDecoration: "none", fontWeight: 600, fontSize: 13 }}>&larr; Dashboard</Link>
          <button className="btn btn-outline-danger btn-sm" onClick={() => { logout(); navigate("/login"); }} style={{ fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <div className="container-fluid">
          <div style={s.card}>
            <h6 style={s.cardTitle}>{a.title}</h6>
            <div>
              <div style={s.detailRow}><span style={s.detailLabel}>Assigned By</span><span style={s.detailValue}>{a.assignedBy || "-"}</span></div>
              <div style={s.detailRow}><span style={s.detailLabel}>Department</span><span style={s.detailValue}>{a.department || "-"}</span></div>
              <div style={s.detailRow}><span style={s.detailLabel}>Level</span><span style={s.detailValue}>{a.level || "-"}</span></div>
              <div style={s.detailRow}><span style={s.detailLabel}>Year</span><span style={s.detailValue}>{a.year || "-"}</span></div>
              <div style={s.detailRow}><span style={s.detailLabel}>Subject</span><span style={s.detailValue}>{a.subject || "-"}</span></div>
              <div style={s.detailRow}><span style={s.detailLabel}>Due Date</span><span style={s.detailValue}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "-"}</span></div>
              <div style={s.detailRow}><span style={s.detailLabel}>Description</span><span style={s.detailValue}>{a.description || "-"}</span></div>
            </div>
            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-outline-danger btn-sm" onClick={handleDelete} style={{ fontWeight: 600, fontSize: 13 }}>Delete</button>
            </div>
          </div>

          <div style={s.card}>
            <h6 style={s.cardTitle}>Students ({rows.length}) &mdash; {submittedCount} submitted</h6>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Student</th>
                    <th style={s.th}>Student ID</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Submission Link</th>
                    <th style={s.th}>Submitted At</th>
                    <th style={s.th}>Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td style={s.td}>{r.studentName}</td>
                      <td style={s.td}>{r.regNo}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: badgeColor(r.status) + "20", color: badgeColor(r.status) }}>{r.status}</span></td>
                      <td style={s.td}>{r.link ? <a href={r.link} target="_blank" rel="noreferrer" style={{ color: "#4d96ff" }}>View</a> : "-"}</td>
                      <td style={s.td}>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}</td>
                      <td style={s.td}>{r.hasSubmission ? <input type="checkbox" checked={!!r.checked} disabled style={{ width: 18, height: 18 }} /> : "-"}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} style={{ ...s.td, textAlign: "center", color: "#8a8fa8" }}>No students assigned to this assignment</td></tr>
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
