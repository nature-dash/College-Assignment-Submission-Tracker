import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

function SearchableSelect({ options, value, onChange, placeholder, style, allowAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(o => String(o).toLowerCase().includes(query.toLowerCase()));
  const noExactMatch = query && !options.some(o => String(o).toLowerCase() === query.toLowerCase());
  const display = value || placeholder || "Select...";

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div onClick={() => { setOpen(!open); setQuery(""); }}
        style={{ background: "#fff", border: "1px solid #ced4da", borderRadius: 6, padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
        <span style={{ color: value ? "#212529" : "#adb5bd" }}>{display}</span>
        <span>{open ? "\u25B2" : "\u25BC"}</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1050, background: "#fff", border: "1px solid #ced4da", borderRadius: 6, marginTop: 2, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search..." style={{ width: "100%", border: "none", borderBottom: "1px solid #eee", padding: "8px 12px", outline: "none", fontSize: 14, boxSizing: "border-box" }} />
          <div style={{ padding: 0, margin: 0, listStyle: "none" }}>
            {allowAdd && query && noExactMatch && (
              <div onClick={() => { onChange(query); setOpen(false); }}
                style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, color: "#4d96ff", fontWeight: 600, borderBottom: "1px solid #f0f0f0" }}>+ Add &ldquo;{query}&rdquo;</div>
            )}
            {filtered.map(o => (
              <div key={o} onClick={() => { onChange(o); setOpen(false); }}
                style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14, background: o === value ? "#e9ecef" : "transparent", borderBottom: "1px solid #f0f0f0" }}>{o}</div>
            ))}
            {filtered.length === 0 && !(allowAdd && query && noExactMatch) && <div style={{ padding: "8px 12px", color: "#999", fontSize: 14 }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditAssignment() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [config, setConfig] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    api.teacher.config().then(d => setConfig(d.config || d)).catch(() => {});
    api.teacher.editData(id).then(d => {
      const a = d.assignment || d;
      setTitle(a.title || "");
      setDescription(a.description || "");
      setDepartment(a.department || "");
      setYear(String(a.year || ""));
      setLevel(a.level || "");
      setSubject(a.subject || "");
      setDueDate(a.dueDate ? a.dueDate.split("T")[0] : "");
      setSubjects(d.allSubjects || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !department || !year || !level || !subject || !dueDate) {
      alert("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      await api.teacher.edit(id, { title, description, department, year, level, subject, dueDate });
      navigate("/teacher");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const years = config ? [...new Set((config.years || []).map(y => y.year))].sort() : [];

  if (loading || !config) {
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
            <h5 style={{ fontWeight: 700, margin: 0, color: "#212529" }}>Edit Assignment</h5>
            <small style={{ color: "#6c757d" }}>Welcome, {user?.name || user?.username}</small>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => navigate("/teacher")} style={{ fontWeight: 600, fontSize: 13 }}>&larr; Back</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-4">
                <h6 style={{ fontWeight: 700, marginBottom: 24, color: "#495057" }}>Assignment Details</h6>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 4, display: "block" }}>Title</label>
                    <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter assignment title" required />
                  </div>
                  <div className="mb-3">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 4, display: "block" }}>Description</label>
                    <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter assignment description (optional)" rows={3} style={{ resize: "vertical" }} />
                  </div>
                  <div className="mb-3">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 4, display: "block" }}>Department</label>
                    <SearchableSelect options={config.departments || []} value={department} onChange={setDepartment} placeholder="Select department" />
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 4, display: "block" }}>Year</label>
                      <SearchableSelect options={years.map(String)} value={year} onChange={setYear} placeholder="Select year" />
                    </div>
                    <div className="col-md-6">
                      <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 4, display: "block" }}>Level</label>
                      <select className="form-select" value={level} onChange={e => setLevel(e.target.value)} style={{ fontSize: 14, borderRadius: 6, padding: "8px 12px" }}>
                        <option value="">Select level</option>
                        <option value="UG">UG</option>
                        <option value="PG">PG</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 4, display: "block" }}>Subject</label>
                    <SearchableSelect options={subjects} value={subject} onChange={setSubject} placeholder="Select or type new subject" allowAdd />
                  </div>
                  <div className="mb-4">
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#495057", marginBottom: 4, display: "block" }}>Due Date</label>
                    <input type="date" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
