import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

const s = {
  page: { minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Inter', sans-serif" },
  header: { background: "#fff", borderBottom: "1px solid #e2e4ed", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontWeight: 700, fontSize: 20, background: "linear-gradient(135deg, #4d96ff, #6b5bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  userInfo: { display: "flex", alignItems: "center", gap: 12 },
  content: { padding: "24px 32px" },
  card: { background: "#fff", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Calendar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    api.teacher.calendar().then(setData).catch(() => {});
  }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(null); };

  if (!data) return <div style={s.page}><div style={{ padding: 40, textAlign: "center", color: "#8a8fa8" }}>Loading...</div></div>;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const assignmentsByDate = {};
  (data.assignments || []).forEach(a => {
    if (!a.dueDate) return;
    const d = new Date(a.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!assignmentsByDate[key]) assignmentsByDate[key] = [];
    assignmentsByDate[key].push(a);
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedKey = selectedDay ? `${year}-${month}-${selectedDay}` : null;
  const selectedAssignments = selectedKey ? (assignmentsByDate[selectedKey] || []) : [];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={s.headerTitle}>Assignment Calendar</span>
        <div style={s.userInfo}>
          <Link to="/teacher" className="btn btn-outline-primary btn-sm" style={{ textDecoration: "none", fontWeight: 600, fontSize: 13 }}>&larr; Dashboard</Link>
          <button className="btn btn-outline-danger btn-sm" onClick={async () => { await logout(); navigate("/login"); }} style={{ fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <div className="container-fluid">
          <div style={s.card}>
            <h6 style={{ fontWeight: 700, fontSize: 16, color: "#1a1c2e", marginBottom: 16 }}>Assignment Calendar</h6>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <button onClick={prevMonth} style={{ background: "none", border: "1px solid #e2e4ed", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#4a4e6b" }}>&larr; Prev</button>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h4 style={{ fontWeight: 700, margin: 0, color: "#1a1c2e" }}>{MONTHS[month]} {year}</h4>
                {!isCurrentMonth && (
                  <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); setSelectedDay(null); }} style={{ background: "#4d96ff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#fff" }}>Today</button>
                )}
              </div>
              <button onClick={nextMonth} style={{ background: "none", border: "1px solid #e2e4ed", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#4a4e6b" }}>Next &rarr;</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 24 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: "center", fontWeight: 700, fontSize: 12, color: "#8a8fa8", padding: "8px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>{d}</div>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <div key={`e-${i}`} />;
                const key = `${year}-${month}-${d}`;
                const dayAssignments = assignmentsByDate[key] || [];
                const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
                const isSelected = selectedDay === d;
                return (
                  <div key={d} onClick={() => setSelectedDay(isSelected ? null : d)} style={{
                    background: isSelected ? "#e8f0fe" : isToday ? "#4d96ff" : "#fff",
                    color: isToday && !isSelected ? "#fff" : "#1a1c2e",
                    borderRadius: 8, minHeight: 80, padding: 6, cursor: dayAssignments.length > 0 ? "pointer" : "default",
                    border: "1px solid #e2e4ed",
                    display: "flex", flexDirection: "column",
                  }}>
                    <span style={{ fontWeight: isToday ? 800 : 600, fontSize: 13, marginBottom: 4 }}>{d}</span>
                    {dayAssignments.slice(0, 3).map((a, j) => (
                      <Link key={j} to={`/teacher/view/${a.id}`} style={{
                        fontSize: 10, color: "#4d96ff", textDecoration: "none", lineHeight: 1.3, marginBottom: 1,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{a.title}</Link>
                    ))}
                    {dayAssignments.length > 3 && <span style={{ fontSize: 10, color: "#8a8fa8", fontWeight: 600 }}>+{dayAssignments.length - 3} more</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedAssignments.length > 0 && (
            <div style={s.card}>
              <h6 style={{ fontWeight: 700, fontSize: 16, color: "#1a1c2e", marginBottom: 16 }}>
                Assignments for {MONTHS[month]} {selectedDay}, {year}
              </h6>
              {selectedAssignments.map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < selectedAssignments.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div>
                    <Link to={`/teacher/view/${a.id}`} style={{ color: "#4d96ff", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>{a.title}</Link>
                    <div style={{ color: "#8a8fa8", fontSize: 12, marginTop: 2 }}>{a.department} &middot; {a.level} &middot; Year {a.year} &middot; {a.subject}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#4a4e6b", whiteSpace: "nowrap" }}>{new Date(a.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
