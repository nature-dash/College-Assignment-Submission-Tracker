import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "teacher") navigate("/teacher");
      else if (user.role === "student") navigate("/student");
    }
  }, [user, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff 0%, #e8ecf8 100%)",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: 500, width: "100%", margin: 20,
        background: "#fff", borderRadius: 24, padding: "50px 40px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.06)", textAlign: "center"
      }}>
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png" width={120} alt="icon" style={{ marginBottom: 20, opacity: 0.8 }} />
        <h1 style={{ fontWeight: 800, fontSize: 20, marginBottom: 6, background: "linear-gradient(135deg, #4d96ff, #6b5bff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Prince Shri Venkateshwara Arts and Science College
        </h1>
        <p style={{ color: "#8a8fa8", fontSize: 15, fontWeight: 500, marginBottom: 30 }}>
          Assignment Submission Management System
        </p>
        <Link to="/login" style={{
          display: "inline-block", padding: "14px 48px", border: "none",
          borderRadius: 50, fontWeight: 700, fontSize: 16, color: "#fff",
          textDecoration: "none", background: "linear-gradient(135deg, #4d96ff, #6b5bff)"
        }}>Login</Link>
      </div>
    </div>
  );
}
