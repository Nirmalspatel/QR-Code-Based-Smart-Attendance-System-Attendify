import React from "react";
import { useEffect } from "react";
import "../styles/Landing.css";
import { Link } from "react-router-dom";
import heroImage from "../assets/atendo-hero.png";

const Landing = () => {
  useEffect(() => {
    if (localStorage.getItem("token")) {
      if (localStorage.getItem("type") === "teacher") {
        window.location.href = "/teacher-dashboard";
      } else {
        window.location.href = "/student-dashboard";
      }
    }
  }, []);

  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to <span className="accent">Nirma University</span></h1>
          <p className="hero-subtitle">
            Smart QR-based attendance system for modern classrooms.
            Track attendance in real-time with secure and automated management.
          </p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-secondary">Get Started</Link>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <Link to="/admin-login" style={{ color: "var(--text-muted)", textDecoration: "underline", fontSize: "0.95rem", fontWeight: "600" }}>
              Admin Portal Access &rarr;
            </Link>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-blob"></div>
          <div className="hero-visual">
            <img src={heroImage} alt="Attendence System App Interface" className="hero-img-main" />
          </div>
        </div>
      </section>

      {/* <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>QR Attendance</h3>
          <p>Scan unique QR codes to mark attendance instantly and securely. Our geofencing ensures students are actually in the classroom.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>Real-time Stats</h3>
          <p>Monitor attendance trends and participation with dynamic, colorful dashboards for students, teachers, and admins.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Easy Management</h3>
          <p>Manage multiple sessions, student records, and teacher account approvals with just a few clicks from a central hub.</p>
        </div>
      </section> */}
    </div>
  );
};

export default Landing;
