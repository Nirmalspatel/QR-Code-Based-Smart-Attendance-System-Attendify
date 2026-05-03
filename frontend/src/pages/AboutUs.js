import React from "react";
import "../styles/AboutUs.css";
import { Link } from "react-router-dom";
import Nav from "./Nav";
import nirmalPhoto from "../assets/nirmal_photo.png";

const AboutUs = () => {
  return (
    <div className="portfolio-container">
      {/* 
        We hide the standard Nav on the split layout, 
        or we can place a custom "Back" button.
      */}
      
      <div className="split-layout">
        
        {/* LEFT SIDEBAR: Sticky Profile */}
        <aside className="left-sidebar">
          <div className="sidebar-content">
            
            <div className="profile-image-container">
              <img src={nirmalPhoto} alt="Nirmal Patel" className="profile-image-actual" />
              <div className="status-badge">Available for Hire</div>
            </div>
            
            <h1 className="portfolio-name">Nirmal <br /><span className="accent">Patel</span></h1>
            
            <h2 className="portfolio-role">Full-Stack Developer</h2>
            <p className="portfolio-tagline">
              Computer Science & Engineering Student at Nirma University. Building secure, scalable, and intelligent web applications.
            </p>
            
            <div className="portfolio-socials">
              <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="btn-social linkedin">
                <svg viewBox="0 0 24 24" fill="currentColor" height="20" width="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
              <a href="https://github.com/" target="_blank" rel="noreferrer" className="btn-social github">
                <svg viewBox="0 0 24 24" fill="currentColor" height="20" width="20"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>
            </div>

            <div className="sidebar-footer">
              <Link to="/" className="back-link">&larr; Back to App</Link>
            </div>
            
          </div>
        </aside>

        {/* RIGHT CONTENT: Scrollable */}
        <main className="right-content">
          
          <section className="portfolio-section about-me-section">
            <h2 className="section-title">About Me</h2>
            <div className="about-text-container">
              <p className="about-text">
                I am a passionate and driven software engineering student currently pursuing my B.Tech in <strong>Computer Science & Engineering at Nirma University</strong>. Ever since I wrote my first lines of code, I have been captivated by the power of software to solve complex, real-world problems. 
              </p>
              <p className="about-text">
                My academic journey has equipped me with a strong foundational understanding of data structures, algorithms, system design, and cutting-edge web technologies. I specialize in building robust, scalable full-stack applications with a heavy focus on the MERN stack (MongoDB, Express.js, React.js, Node.js). 
              </p>
              <p className="about-text">
                Beyond standard web development, I am deeply interested in artificial intelligence, computer vision, and geospatial data processing. I love challenging myself by integrating complex client-side machine learning models and high-security cryptographic functions into intuitive, user-friendly interfaces.
              </p>
              <p className="about-text">
                When I'm not coding, you can find me exploring new development frameworks, participating in hackathons, and constantly looking for ways to push the boundaries of what web applications can achieve. I am always eager to learn, adapt, and build tools that make a tangible difference.
              </p>
            </div>
          </section>

          <section className="portfolio-section skills-section">
            <h2 className="section-title">Technical Arsenal</h2>
            
            <div className="skill-group">
              <div className="skill-group-header">
                <span className="skill-icon">🖥️</span>
                <h3>Frontend Development</h3>
              </div>
              <div className="skill-tags">
                <span>React.js</span>
                <span>JavaScript (ES6+)</span>
                <span>HTML5 / CSS3</span>
                <span>Tailwind CSS</span>
                <span>Responsive UI/UX</span>
              </div>
            </div>

            <div className="skill-group">
              <div className="skill-group-header">
                <span className="skill-icon">⚙️</span>
                <h3>Backend Engineering</h3>
              </div>
              <div className="skill-tags">
                <span>Node.js</span>
                <span>Express.js</span>
                <span>MongoDB</span>
                <span>RESTful APIs</span>
                <span>Socket.io (WebSockets)</span>
              </div>
            </div>

            <div className="skill-group">
              <div className="skill-group-header">
                <span className="skill-icon">🛠️</span>
                <h3>Tools & Core Concepts</h3>
              </div>
              <div className="skill-tags">
                <span>Git / GitHub</span>
                <span>Postman</span>
                <span>WebRTC</span>
                <span>face-api.js (ML)</span>
                <span>Data Structures & Algorithms</span>
                <span>Cryptography</span>
              </div>
            </div>
          </section>

          <footer className="content-footer">
            <p>&copy; {new Date().getFullYear()} Nirmal Patel. Built with React.js & Passion.</p>
          </footer>

        </main>

      </div>
    </div>
  );
};

export default AboutUs;
