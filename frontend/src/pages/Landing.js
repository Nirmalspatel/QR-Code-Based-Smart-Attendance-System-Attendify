import React from "react";
import { useEffect } from "react";
import "../styles/Landing.css";
import { Link } from "react-router-dom";
import heroImage from "../assets/modern_attendance_hero.png";

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

      <section className="features-grid-premium">
        <div className="feature-card-premium">
          <div className="feature-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="8" y="8" width="8" height="8" rx="2" ry="2"></rect></svg>
          </div>
          <h3>Lightning Fast QR</h3>
          <p>Scan unique cryptographic QR codes to mark your presence instantly. No more roll calls or manual registers.</p>
        </div>
        <div className="feature-card-premium">
          <div className="feature-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
          </div>
          <h3>AI Face Verification</h3>
          <p>Eliminate proxy attendance completely with our advanced client-side facial recognition and strict Euclidean distance verification.</p>
        </div>
        <div className="feature-card-premium">
          <div className="feature-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <h3>Real-time Analytics</h3>
          <p>Beautiful, intuitive dashboards that provide instant insights into student participation and academic trends.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>Attendify</h2>
            <p>Smart Campus Management</p>
          </div>
          <div className="footer-links">
            <p>&copy; {new Date().getFullYear()} Nirma University. All rights reserved.</p>
            <Link to="/about" style={{ color: "var(--landing-primary)", marginTop: "10px", display: "inline-block", fontWeight: "600", textDecoration: "none" }}>Learn More About Us &rarr;</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
