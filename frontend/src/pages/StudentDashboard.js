import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import StudentForm from "./StudentForm";
import QRScannerModal from "./QRScannerModal";
const queryParameters = new URLSearchParams(window.location.search);

const Dashboard = () => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  // eslint-disable-next-line
  const [sessionList, setSessionList] = useState([]);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  function getStudentSessions() {
    axios
      .post("/sessions/getStudentSessions", {
        token: token,
      })
      .then((response) => {
        setSessionList(response.data.sessions);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function toggleStudentForm(action) {
    if (action === "open") {
      setSessionDisplay(true);
    } else {
      localStorage.removeItem("session_id");
      localStorage.removeItem("teacher_email");
      setSessionDisplay(false);
      navigate("/student-dashboard");
    }
  }

  const handleAttendanceSuccess = (msg) => {
    localStorage.removeItem("session_id");
    localStorage.removeItem("teacher_email");
    setSessionDisplay(false);
    setSuccessMessage(msg || "Attendance Marked Successfully!");
    
    // Auto-hide the toast after 4 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
    
    // Refresh sessions to show the newly marked attendance
    getStudentSessions();
    navigate("/student-dashboard");
  };

  function getDistance(distance, radius) {
    return {
      distance,
      color: distance <= parseFloat(radius) ? "green" : "red",
    };
  }

  const handleQRScanSuccess = (decodedUrl) => {
    setScannerOpen(false);
    try {
      const url = new URL(decodedUrl);
      const sessionId = url.searchParams.get("session_id");
      const email = url.searchParams.get("email");

      if (sessionId && email) {
        localStorage.setItem("session_id", sessionId);
        localStorage.setItem("teacher_email", email);
        toggleStudentForm("open");
      } else {
        alert("Invalid QR Code: Missing session parameters.");
      }
    } catch (err) {
      alert("Invalid QR Code format: Ensure you represent a valid session URL.");
      console.error(err);
    }
  };

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      getStudentSessions();
      try {
        if (
          queryParameters.get("session_id") !== null &&
          queryParameters.get("email") !== null
        ) {
          localStorage.setItem("session_id", queryParameters.get("session_id"));
          localStorage.setItem("teacher_email", queryParameters.get("email"));
        }
        if (
          localStorage.getItem("session_id") == null &&
          localStorage.getItem("teacher_email") == null
        ) {
          toggleStudentForm("close");
        } else {
          toggleStudentForm("open");
        }
      } catch (err) {
        console.log(err);
      }
    }
  }, [token]);

  const groupSessionsBySubject = (sessions) => {
    return sessions.reduce((groups, session) => {
      const subj = session.subjectName || "General";
      if (!groups[subj]) groups[subj] = [];
      groups[subj].push(session);
      return groups;
    }, {});
  };

  const groupedSessions = groupSessionsBySubject(sessionList);

  return (
    <div className="dashboard-main-premium">
      
      {/* Toast Notification for Success */}
      {successMessage && (
        <div className="success-toast-premium">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {!isSessionDisplay && (
        <>
          {/* Super Premium Hero Section */}
          <div className="dashboard-hero">
            <div className="dashboard-hero-content">
              <div className="hero-text-block">
                <span className="hero-badge">Welcome back</span>
                <h1>Student Portal</h1>
                <p>Track your academic presence and scan QR codes instantly.</p>
              </div>
              <button 
                className="btn-pulse-scan"
                onClick={() => setScannerOpen(true)}
              >
                <div className="btn-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h6v6H4z"></path><path d="M14 4h6v6h-6z"></path><path d="M14 14h6v6h-6z"></path><path d="M4 14h6v6H4z"></path>
                    <path d="M10 10l4 4"></path>
                  </svg>
                </div>
                <span>Scan QR</span>
              </button>
            </div>
            {/* Background design elements */}
            <div className="hero-glow-1"></div>
            <div className="hero-glow-2"></div>
          </div>

          <div className="session-dashboard-container">
            <div className="student-grouped-list-premium">
              {Object.keys(groupedSessions).length > 0 ? (
                Object.keys(groupedSessions).map((subject) => (
                  <div key={subject} className="subject-group-section-premium">
                    <div className="subject-group-header-glass">
                      <div className="subject-title-wrapper">
                        <div className="subject-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        </div>
                        <h3>{subject}</h3>
                      </div>
                      <span className="count-badge-premium">{groupedSessions[subject].length} Sessions</span>
                    </div>
                    
                    <div className="student-session-grid-premium">
                      {groupedSessions[subject].map((session, index) => {
                        const distanceData = getDistance(session.distance, session.radius);
                        const formattedDate = new Date(session.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });

                        return (
                          <div key={index + session.session_id} className="student-session-card-premium group">
                            <div className="card-top-accent"></div>
                            <div className="card-image-box-premium">
                              <img src={session.image} alt="Attendance Capture" loading="lazy" />
                              <div className={`status-pill status-${distanceData.color}`}>
                                {distanceData.distance}m
                              </div>
                            </div>
                            
                            <div className="card-info-premium">
                              <div className="session-info-top">
                                <h4>{session.name}</h4>
                                <div className="date-chip">{formattedDate}</div>
                              </div>
                              
                              <div className="session-stats-grid">
                                <div className="stat-block">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  <span>{session.time}</span>
                                </div>
                                <div className="stat-block">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                  <span>{session.duration}m</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-premium">
                  <div className="empty-icon-wrap">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                  </div>
                  <h3>Ready for Class!</h3>
                  <p>Your attendance records will magically appear here once you scan into your first session.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {isSessionDisplay && (
        <div className="popup-overlay">
          <StudentForm togglePopup={toggleStudentForm} onSuccess={handleAttendanceSuccess} />
        </div>
      )}
      
      {isScannerOpen && (
        <QRScannerModal 
          onClose={() => setScannerOpen(false)} 
          onScanSuccess={handleQRScanSuccess} 
        />
      )}
    </div>
  );
};

export default Dashboard;
