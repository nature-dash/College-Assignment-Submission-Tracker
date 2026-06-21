import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

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
    fontWeight: 800, fontSize: 18,
    background: `linear-gradient(135deg, ${tail || "#4d96ff"}, ${tail ? tail + "dd" : "#6b5bff"})`,
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  headerCard: {
    background: theme === "dark" ? "linear-gradient(135deg, rgba(30,40,80,0.6), rgba(20,25,60,0.4))" : "linear-gradient(135deg, #ffffff, #f8faff)",
    backdropFilter: "blur(12px)",
    border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    borderRadius: 20, padding: "20px 24px", marginBottom: 20,
    boxShadow: theme === "dark" ? "0 8px 32px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.04)",
  },
  small: { color: theme === "dark" ? "#8890b0" : "#8a8fa8", fontSize: 13 },
  gradientText: (c) => ({
    fontWeight: 800,
    background: `linear-gradient(135deg, ${c || "#4d96ff"}, ${c ? c + "cc" : "#6b5bff"})`,
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  }),
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const statusColors = {
  Late: ["#ff4757", "255,71,87"],
  Pending: ["#ffa502", "255,165,2"],
  Submitted: ["#2ed573", "46,213,115"],
};

export default function Calendar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("student-theme") || "light");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => { localStorage.setItem("student-theme", theme); }, [theme]);

  useEffect(() => {
    setLoading(true); setError("");
    api.student.calendar().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };

  const tail = data?.tailColor;
  const st = s(theme, tail);
  const assignments = data?.assignments || [];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const byDate = {};
  assignments.forEach(a => {
    if (!a.dueDate) return;
    const d = new Date(a.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(a);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedKey = selectedDay ? `${year}-${month}-${selectedDay}` : null;
  const selectedAssignments = selectedKey ? (byDate[selectedKey] || []) : [];

  if (loading) return (
    <div style={st.page}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div className="spinner-border" style={{ color: tail || "#4d96ff" }} role="status" /></div></div>
  );

  if (error && !data) return (
    <div style={st.page}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div style={{ textAlign: "center" }}><p style={{ color: "#ff4757", fontWeight: 600, marginBottom: 12 }}>{error}</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button></div></div></div>
  );

  return (
    <div style={st.page}>
      <nav style={st.nav}>
        <Link to="/student" style={{ textDecoration: "none" }}><span style={st.navTitle}>📅 Calendar</span></Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme === "dark" ? "#8890b0" : "#6b7094" }}>{user?.name || "Student"}</span>
          <Link to="/student" style={{ fontSize: 14, fontWeight: 600, color: theme === "dark" ? "#8890b0" : "#6b7094", textDecoration: "none", padding: "6px 14px", borderRadius: 8, background: theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>Dashboard</Link>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 8, lineHeight: 1 }}>{theme === "dark" ? "☀️" : "🌙"}</button>
          <button onClick={async () => { try { await logout(); } catch {}; navigate("/login"); }} style={{ background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 600, fontSize: 13, color: theme === "dark" ? "#e0e4f0" : "#4a4e6b", cursor: "pointer" }}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: "24px 32px", maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={st.headerCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ ...st.gradientText(tail), fontSize: 22, margin: 0 }}>Assignment Calendar</h1>
            <span style={{ color: theme === "dark" ? "#8890b0" : "#8a8fa8", fontSize: 14, fontWeight: 500 }}>{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "#e2e4ed"}`, borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 14, color: theme === "dark" ? "#e0e4f0" : "#4a4e6b" }}>&larr; Prev</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h4 style={{ fontWeight: 700, margin: 0, color: theme === "dark" ? "#e0e4f0" : "#1a1c2e" }}>{MONTHS[month]} {year}</h4>
            {!isCurrentMonth && (
              <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelectedDay(null); }} style={{ background: tail || "#4d96ff", border: "none", borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#fff" }}>Today</button>
            )}
          </div>
          <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "#e2e4ed"}`, borderRadius: 10, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 14, color: theme === "dark" ? "#e0e4f0" : "#4a4e6b" }}>Next &rarr;</button>
        </div>

        <div style={{
          background: theme === "dark" ? "rgba(25,32,60,0.7)" : "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 20,
          border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
          boxShadow: theme === "dark" ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: theme === "dark" ? "rgba(255,255,255,0.06)" : "#e2e4ed" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontWeight: 700, fontSize: 11, color: theme === "dark" ? "#8890b0" : "#8a8fa8", padding: "10px 0", textTransform: "uppercase", letterSpacing: "0.5px", background: theme === "dark" ? "rgba(20,28,55,0.8)" : "#f5f6fa" }}>{d}</div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e-${i}`} style={{ background: theme === "dark" ? "rgba(20,28,55,0.4)" : "#fff", minHeight: 80 }} />;
              const key = `${year}-${month}-${d}`;
              const dayAs = byDate[key] || [];
              const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
              const isSelected = selectedDay === d;
              return (
                <div key={d} onClick={() => setSelectedDay(isSelected ? null : d)} style={{
                  background: isSelected ? (theme === "dark" ? "rgba(77,150,255,0.2)" : "#e8f0fe") : (isToday ? (theme === "dark" ? "rgba(77,150,255,0.15)" : "#f0f4ff") : (theme === "dark" ? "rgba(20,28,55,0.4)" : "#fff")),
                  minHeight: 80, padding: 6, cursor: dayAs.length > 0 ? "pointer" : "default",
                  display: "flex", flexDirection: "column",
                }}>
                  <span style={{ fontWeight: isToday ? 800 : 600, fontSize: 13, color: isToday ? (tail || "#4d96ff") : (theme === "dark" ? "#e0e4f0" : "#1a1c2e"), marginBottom: 4 }}>{d}</span>
                  {dayAs.slice(0, 2).map((a, j) => {
                    const sc = statusColors[a.status] || statusColors.Pending;
                    return <span key={j} style={{ fontSize: 9, color: sc[0], lineHeight: 1.2, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>;
                  })}
                  {dayAs.length > 2 && <span style={{ fontSize: 9, color: theme === "dark" ? "#8890b0" : "#8a8fa8", fontWeight: 600 }}>+{dayAs.length - 2}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {selectedAssignments.length > 0 && (
          <div style={{
            background: theme === "dark" ? "rgba(25,32,60,0.7)" : "#fff", borderRadius: 16, padding: "16px 20px",
            border: theme === "dark" ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
            boxShadow: theme === "dark" ? "0 4px 24px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.03)",
          }}>
            <h6 style={{ fontWeight: 700, marginBottom: 12, color: theme === "dark" ? "#e0e4f0" : "#1a1c2e" }}>
              Assignments for {MONTHS[month]} {selectedDay}, {year}
            </h6>
            {selectedAssignments.map((a, i) => {
              const sc = statusColors[a.status] || statusColors.Pending;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < selectedAssignments.length - 1 ? `1px solid ${theme === "dark" ? "rgba(255,255,255,0.06)" : "#f0f0f0"}` : "none" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: theme === "dark" ? "#e0e4f0" : "#1a1c2e" }}>{a.title}</div>
                    <div style={st.small}>{a.subject}{a.assignedBy ? ` \u00B7 ${a.assignedBy}` : ""}</div>
                  </div>
                  <span style={{ background: `rgba(${sc[1]},0.15)`, color: sc[0], padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{a.status || "Pending"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
