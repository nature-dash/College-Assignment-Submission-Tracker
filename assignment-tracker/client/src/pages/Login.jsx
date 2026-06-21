import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const u = await login(username.trim(), password);
      if (u.role === "admin") navigate("/admin");
      else if (u.role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (err) {
      setError(err.message);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)", fontFamily: "'Inter', sans-serif", padding: 20
    },
    card: {
      maxWidth: 420, width: "100%", background: "#fff", borderRadius: 24, padding: "40px 36px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.06)"
    },
    h2: { fontWeight: 800, fontSize: 28, textAlign: "center", marginBottom: 8, background: "linear-gradient(135deg, #4d96ff, #6b5bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    sub: { textAlign: "center", color: "#8a8fa8", fontSize: 14, marginBottom: 30, fontWeight: 500 },
    label: { color: "#4a4e6b", fontWeight: 600, fontSize: 13, marginBottom: 6, display: "block" },
    input: { background: "#f5f6fa", border: "1px solid #e2e4ed", borderRadius: 12, color: "#1a1c2e", padding: "12px 16px", fontSize: 15, width: "100%", outline: "none", boxSizing: "border-box" },
    btn: { width: "100%", padding: 12, border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, color: "#fff", background: "linear-gradient(135deg, #4d96ff, #6b5bff)", cursor: "pointer", marginTop: 16 },
    homeLink: { display: "block", textAlign: "center", marginTop: 20, color: "#8a8fa8", textDecoration: "none", fontSize: 14, fontWeight: 500 },
    error: { background: "#fff0f0", border: "1px solid #ffd4d4", borderRadius: 12, color: "#d14545", padding: "12px 16px", fontSize: 14, fontWeight: 500, marginBottom: 20, textAlign: "center" },
    inputGroup: { display: "flex" },
    inputInGroup: { borderRight: "none", borderRadius: "12px 0 0 12px", flex: 1 },
    toggleBtn: { background: "#f5f6fa", border: "1px solid #e2e4ed", borderLeft: "none", borderRadius: "0 12px 12px 0", color: "#6b7094", fontWeight: 600, fontSize: 13, padding: "12px 16px", cursor: "pointer" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Welcome</h2>
        <p style={styles.sub}>Sign in to your account</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Username</label>
            <input style={styles.input} type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputGroup}>
              <input style={{ ...styles.input, ...styles.inputInGroup }} type={showPw ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" style={styles.toggleBtn} onClick={() => setShowPw(!showPw)}>{showPw ? "Hide" : "Show"}</button>
            </div>
          </div>
          <button style={styles.btn}>Sign In</button>
        </form>
        <Link to="/" style={styles.homeLink}>&larr; Back to Home</Link>
      </div>
    </div>
  );
}
