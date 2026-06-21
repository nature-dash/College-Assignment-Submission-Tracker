import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

function SearchableSelect({ options, value, onChange, placeholder, theme }) {
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
  const isDark = theme === "dark";
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => { setOpen(!open); setQuery(""); }}
        style={{
          background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #ced4da",
          borderRadius: 6, padding: "8px 12px", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14,
          color: value ? (isDark ? "#e0e4f0" : "#212529") : (isDark ? "#8890b0" : "#adb5bd"),
        }}>
        <span>{display}</span>
        <span>{open ? "\u25B2" : "\u25BC"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100000,
          background: isDark ? "#1a1f38" : "#fff",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #ced4da",
          borderRadius: 6, marginTop: 2, maxHeight: 200, overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search..."
            style={{
              width: "100%", border: "none",
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #eee",
              padding: "8px 12px", outline: "none", fontSize: 14, boxSizing: "border-box",
              background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
              color: isDark ? "#e0e4f0" : "#212529",
            }} />
          <div onClick={() => { onChange(""); setOpen(false); }}
            style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, color: isDark ? "#8890b0" : "#6c757d", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f0f0f0" }}>All {placeholder || ""}</div>
          {filtered.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{
                padding: "8px 12px", cursor: "pointer", fontSize: 14,
                background: o === value ? (isDark ? "rgba(77,150,255,0.2)" : "#e9ecef") : "transparent",
                color: isDark ? "#e0e4f0" : "#212529",
                borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f0f0f0",
              }}>{o}</div>
          ))}
          {filtered.length === 0 && <div style={{ padding: "8px 12px", color: "#999", fontSize: 14 }}>No results</div>}
        </div>
      )}
    </div>
  );
}

const s = (theme, tail) => ({
  page: {
    minHeight: "100vh",
    background: theme === "dark" ? "#0a0e1a" : "linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)",
    fontFamily: "'Inter', sans-serif",
    color: theme === "dark" ? "#e0e4f0" : "#1a1c2e",
    transition: "background 0.3s, color 0.3s",
  },
  nav: {
    background: theme === "dark" ? "rgba(15,20,40,0.85)" : "rgba(255,255,255,0.75)",
    backdropFilter: "blur(16px)",
    borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    padding: "12px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navTitle: {
    fontWeight: 800,
    fontSize: 18,
    color: tail || "#4d96ff",
  },
  heroCard: {
    background: theme === "dark"
      ? "linear-gradient(135deg, rgba(30,40,80,0.6), rgba(20,25,60,0.4))"
      : "linear-gradient(135deg, #ffffff, #f8faff)",
    backdropFilter: "blur(12px)",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    borderRadius: 20,
    padding: "28px 32px",
    marginBottom: 24,
    boxShadow: theme === "dark" ? "0 8px 32px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.04)",
  },
  statCard: (clr) => ({
    background: theme === "dark"
      ? `linear-gradient(135deg, rgba(${clr},0.15), rgba(${clr},0.05))`
      : `linear-gradient(135deg, rgba(${clr},0.08), rgba(${clr},0.02))`,
    backdropFilter: "blur(8px)",
    border: theme === "dark" ? `1px solid rgba(${clr},0.2)` : `1px solid rgba(${clr},0.15)`,
    borderRadius: 16,
    padding: "20px 24px",
    textAlign: "center",
    flex: 1,
    minWidth: 140,
  }),
  filterCard: {
    background: theme === "dark"
      ? "rgba(25,32,60,0.7)"
      : "#fff",
    backdropFilter: "blur(12px)",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    borderRadius: 16,
    padding: "20px 24px",
    marginBottom: 24,
    boxShadow: theme === "dark" ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.03)",
    position: "relative",
    zIndex: 2,
  },
  tableCard: {
    background: theme === "dark"
      ? "rgba(25,32,60,0.7)"
      : "#fff",
    backdropFilter: "blur(12px)",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: theme === "dark" ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.03)",
    position: "relative",
    zIndex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "14px 20px",
    textAlign: "left",
    fontWeight: 700,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: theme === "dark" ? "#8890b0" : "#6b7094",
    borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
  },
  td: {
    padding: "14px 20px",
    fontSize: 14,
    borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.03)",
    color: theme === "dark" ? "#c8cce0" : "#2a2e4a",
  },
  input: {
    background: theme === "dark" ? "rgba(255,255,255,0.06)" : "#f5f6fa",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e4ed",
    borderRadius: 10,
    color: theme === "dark" ? "#e0e4f0" : "#1a1c2e",
    padding: "10px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    background: theme === "dark" ? "rgba(255,255,255,0.06)" : "#f5f6fa",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e4ed",
    borderRadius: 10,
    color: theme === "dark" ? "#e0e4f0" : "#1a1c2e",
    padding: "10px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  small: { color: theme === "dark" ? "#8890b0" : "#8a8fa8", fontSize: 13, marginTop: 2 },
  modalContent: {
    background: theme === "dark" ? "#161b30" : "#fff",
    color: theme === "dark" ? "#e0e4f0" : "#1a1c2e",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.04)",
    borderRadius: 16,
  },
  modalHeader: {
    borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    padding: "16px 24px",
  },
  modalFooter: {
    borderTop: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    padding: "12px 24px",
  },
});

const statusColors = {
  Late: ["#ff4757", "255,71,87"],
  Pending: ["#ffa502", "255,165,2"],
  Submitted: ["#2ed573", "46,213,115"],
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [theme, setTheme] = useState(() => localStorage.getItem("student-theme") || "light");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState(searchParams.get("subject") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [submitLink, setSubmitLink] = useState("");
  const [submitWithoutLink, setSubmitWithoutLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const contentRef = useRef(null);

  const tail = data?.tailColor;
  const st = s(theme, tail);

  useEffect(() => {
    localStorage.setItem("student-theme", theme);
  }, [theme]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (subject) params.subject = subject;
    if (status) params.status = status;
    api.student.dashboard(params).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [subject, status]);

  useEffect(() => {
    if (theme !== "dark" || typeof window === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.5 + 0.5,
    }));
    const trail = [];
    const onMouse = (e) => {
      trail.push({ x: e.clientX, y: e.clientY, life: 1 });
    };
    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    document.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", onResize);
    let anim;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(100,140,255,0.25)";
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100,140,255,${0.08 * (1 - d / 130)})`;
            ctx.stroke();
          }
        }
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].life -= 0.025;
        if (trail[i].life <= 0) { trail.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, trail[i].life * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,180,255,${trail[i].life * 0.4})`;
        ctx.fill();
      }
      anim = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(anim);
      document.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      document.body.removeChild(canvas);
    };
  }, [theme]);

  useEffect(() => {
    const el = document.getElementById("viewModal");
    if (!el) return;
    const handler = () => {
      document.querySelectorAll(".modal-backdrop").forEach(b => {
        if (theme === "dark") b.style.background = "rgba(0,0,0,0.7)";
      });
    };
    el.addEventListener("shown.bs.modal", handler);
    return () => el.removeEventListener("shown.bs.modal", handler);
  }, [theme]);

  const handleFilter = () => {
    const params = {};
    if (subject) params.subject = subject;
    if (status) params.status = status;
    setSearchParams(params);
  };

  const handleClear = () => {
    setSubject("");
    setStatus("");
    setSearchParams({});
  };

  const openSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmitLink("");
    setSubmitWithoutLink(false);
    setSubmitError("");
  };

  const handleSubmit = async () => {
    if (!submitLink && !submitWithoutLink) {
      setSubmitError("Enter a link or check 'submit without link'");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.student.submit(selectedAssignment.id, submitWithoutLink ? "" : submitLink);
      const el = document.getElementById("submitModal");
      const inst = window.bootstrap?.Modal?.getInstance(el);
      if (inst) inst.hide();
      setSelectedAssignment(null);
      setSuccessMsg("Assignment submitted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      const params = {};
      if (subject) params.subject = subject;
      if (status) params.status = status;
      const d = await api.student.dashboard(params);
      setData(d);
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch {}
    navigate("/login");
  };

  const openView = (a) => {
    setViewAssignment(a);
    const el = document.getElementById("viewModal");
    if (window.bootstrap) {
      const modal = new window.bootstrap.Modal(el);
      modal.show();
    }
  };

  if (loading) {
    return (
      <div style={st.page}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div className="spinner-border" style={{ color: tail || "#4d96ff" }} role="status" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={st.page}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#ff4757", fontWeight: 600, marginBottom: 12 }}>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const u = data?.user || user || {};
  const assignments = data?.assignments || [];
  const stats = {
    late: assignments.filter(a => a.status === "Late").length,
    pending: assignments.filter(a => a.status === "Pending").length,
    done: assignments.filter(a => a.status === "Submitted").length,
  };

  return (
    <div style={st.page}>
      <div ref={contentRef} style={{ position: "relative" }}>
        <nav style={st.nav}>
          <Link to="/student" style={{ textDecoration: "none" }}>
            <span style={st.navTitle}>Assignments</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{
              background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "4px 8px",
              borderRadius: 8, lineHeight: 1,
            }}>{theme === "dark" ? "☀️" : "🌙"}</button>
            <Link to="/student/calendar" style={{
              fontSize: 14, fontWeight: 600, color: theme === "dark" ? "#8890b0" : "#6b7094",
              textDecoration: "none", padding: "6px 14px", borderRadius: 8,
              background: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            }}>Calendar</Link>
            <button onClick={handleLogout} style={{
              background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
              border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 600, fontSize: 13,
              color: theme === "dark" ? "#e0e4f0" : "#4a4e6b", cursor: "pointer",
            }}>Logout</button>
          </div>
        </nav>

        {successMsg && (
          <div style={{
            position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 99999,
            background: "#2ed573", color: "#fff", padding: "12px 28px", borderRadius: 12,
            fontWeight: 600, fontSize: 14, boxShadow: "0 8px 32px rgba(46,213,115,0.3)",
          }}>{successMsg}</div>
        )}

        <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={st.heroCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ fontWeight: 800, fontSize: 26, margin: 0, color: tail || "#4d96ff" }}>
                  {u.name || "Student Dashboard"}
                </h1>
                <p style={{ color: theme === "dark" ? "#8890b0" : "#6b7094", margin: "4px 0 0", fontSize: 14, fontWeight: 500 }}>
                  {[u.level, u.department, u.year && `Year ${u.year}`, u.semester && `Sem ${u.semester}`].filter(Boolean).join(" \u00B7 ") || "Welcome"}
                </p>
              </div>
              <div style={{
                background: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                borderRadius: 12, padding: "8px 20px", textAlign: "center",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme === "dark" ? "#8890b0" : "#8a8fa8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: tail || "#4d96ff", marginTop: 2 }}>{assignments.length}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Late", count: stats.late, clr: "255,71,87" },
              { label: "Pending", count: stats.pending, clr: "255,165,2" },
              { label: "Done", count: stats.done, clr: "46,213,115" },
            ].map((s) => (
              <div key={s.label} style={st.statCard(s.clr)}>
                <div style={{ fontSize: 32, fontWeight: 800, color: `rgb(${s.clr})` }}>{s.count}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme === "dark" ? "#8890b0" : "#8a8fa8", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={st.filterCard}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme === "dark" ? "#8890b0" : "#6b7094", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" }}>Subject</label>
                <SearchableSelect options={data?.subjects || []} value={subject} onChange={setSubject} placeholder="Subjects" theme={theme} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: theme === "dark" ? "#8890b0" : "#6b7094", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6, display: "block" }}>Status</label>
                <select style={st.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                  <option value="Late">Late</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, paddingBottom: 1 }}>
                <button onClick={handleFilter} style={{
                  background: `linear-gradient(135deg, ${tail || "#4d96ff"}, ${tail ? tail + "cc" : "#6b5bff"})`,
                  border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 14,
                  color: "#fff", cursor: "pointer",
                }}>Filter</button>
                <button onClick={handleClear} style={{
                  background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: "1px solid" + (theme === "dark" ? " rgba(255,255,255,0.1)" : " #e2e4ed"),
                  borderRadius: 10, padding: "10px 20px", fontWeight: 600, fontSize: 14,
                  color: theme === "dark" ? "#e0e4f0" : "#4a4e6b", cursor: "pointer",
                }}>Clear</button>
              </div>
            </div>
          </div>

          <div style={st.tableCard}>
            {assignments.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: theme === "dark" ? "#8890b0" : "#8a8fa8" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ fontWeight: 600, margin: 0 }}>No assignments found</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={st.table}>
                  <thead>
                    <tr>
                      <th style={st.th}>Title</th>
                      <th style={st.th}>Subject</th>
                      <th style={st.th}>Due Date</th>
                      <th style={st.th}>Status</th>
                      <th style={st.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => {
                      const sc = statusColors[a.status] || statusColors.Pending;
                      return (
                        <tr key={a.id} style={{
                          transition: "background 0.2s",
                        }} onMouseEnter={(e) => e.currentTarget.style.background = theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={st.td}>
                            <div style={{ fontWeight: 600 }}>{a.title}</div>
                            {a.assignedBy && <div style={st.small}>by {a.assignedBy}</div>}
                          </td>
                          <td style={st.td}>{a.subject}</td>
                          <td style={st.td}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "\u2014"}</td>
                          <td style={st.td}>
                            <span style={{
                              background: `rgba(${sc[1]},0.15)`, color: sc[0],
                              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            }}>{a.status || "Pending"}</span>
                          </td>
                          <td style={st.td}>
                            {a.status === "Submitted" ? (
                              <button onClick={() => openView(a)} style={{
                                background: "linear-gradient(135deg, #28a745, #20c997)",
                                border: "none", borderRadius: 8, padding: "6px 18px", fontWeight: 700, fontSize: 13,
                                color: "#fff", cursor: "pointer",
                              }}>View</button>
                            ) : (
                              <button onClick={() => openSubmit(a)}
                                data-bs-toggle="modal" data-bs-target="#submitModal" style={{
                                  background: `linear-gradient(135deg, ${tail || "#4d96ff"}, ${tail ? tail + "cc" : "#6b5bff"})`,
                                  border: "none", borderRadius: 8, padding: "6px 18px", fontWeight: 700, fontSize: 13,
                                  color: "#fff", cursor: "pointer",
                                }}>Submit</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal fade" id="submitModal" tabIndex="-1" aria-labelledby="submitModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={st.modalContent}>
            <div className="modal-header" style={st.modalHeader}>
              <h5 className="modal-title" id="submitModalLabel" style={{ fontWeight: 800, fontSize: 18 }}>
                {selectedAssignment ? `Submit: ${selectedAssignment.title}` : "Submit Assignment"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"
                style={{ filter: theme === "dark" ? "invert(1)" : "none" }} />
            </div>
            <div className="modal-body" style={{ padding: "24px" }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: theme === "dark" ? "#8890b0" : "#6b7094", marginBottom: 8, display: "block" }}>
                Submission Link
              </label>
              <input
                style={st.input}
                placeholder="https://example.com/my-work"
                value={submitLink}
                onChange={(e) => setSubmitLink(e.target.value)}
                disabled={submitWithoutLink}
              />
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="noLink" checked={submitWithoutLink}
                  onChange={(e) => setSubmitWithoutLink(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                <label htmlFor="noLink" style={{ fontSize: 14, cursor: "pointer", color: theme === "dark" ? "#c8cce0" : "#4a4e6b" }}>
                  Submit without link
                </label>
              </div>
              {submitError && (
                <div style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 10, color: "#ff4757", padding: "10px 14px", fontSize: 13, fontWeight: 600, marginTop: 14 }}>
                  {submitError}
                </div>
              )}
            </div>
            <div className="modal-footer" style={st.modalFooter}>
              <button type="button" className="btn" data-bs-dismiss="modal" style={{
                background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 600, fontSize: 14,
                color: theme === "dark" ? "#e0e4f0" : "#4a4e6b",
              }}>Cancel</button>
              <button type="button" onClick={handleSubmit} disabled={submitting} style={{
                background: `linear-gradient(135deg, ${tail || "#4d96ff"}, ${tail ? tail + "cc" : "#6b5bff"})`,
                border: "none", borderRadius: 10, padding: "10px 28px", fontWeight: 700, fontSize: 14,
                color: "#fff", opacity: submitting ? 0.6 : 1, cursor: submitting ? "not-allowed" : "pointer",
              }}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="viewModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={st.modalContent}>
            <div className="modal-header" style={st.modalHeader}>
              <h5 className="modal-title" style={{ fontWeight: 800, fontSize: 18 }}>
                {viewAssignment ? viewAssignment.title : "Submission"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"
                style={{ filter: theme === "dark" ? "invert(1)" : "none" }} />
            </div>
            <div className="modal-body" style={{ padding: "24px" }}>
              {viewAssignment?.submission?.link ? (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: theme === "dark" ? "#8890b0" : "#6b7094", marginBottom: 8, display: "block" }}>Submission Link</label>
                  <a href={viewAssignment.submission.link} target="_blank" rel="noreferrer"
                    style={{ color: tail || "#4d96ff", fontWeight: 600, wordBreak: "break-all" }}>{viewAssignment.submission.link}</a>
                </div>
              ) : (
                <p style={{ color: theme === "dark" ? "#8890b0" : "#8a8fa8" }}>Submitted without link</p>
              )}
              {viewAssignment?.submission?.submittedAt && (
                <p style={{ fontSize: 13, color: theme === "dark" ? "#8890b0" : "#8a8fa8", marginTop: 12 }}>
                  Submitted: {new Date(viewAssignment.submission.submittedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="modal-footer" style={st.modalFooter}>
              <button type="button" className="btn" data-bs-dismiss="modal" style={{
                background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 600, fontSize: 14,
                color: theme === "dark" ? "#e0e4f0" : "#4a4e6b",
              }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
