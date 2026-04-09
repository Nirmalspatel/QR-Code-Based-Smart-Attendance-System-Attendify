import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import StudentForm from "./StudentForm";
const queryParameters = new URLSearchParams(window.location.search);

const Dashboard = () => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  // eslint-disable-next-line
  const [sessionList, setSessionList] = useState([]);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
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

  function getDistance(distance, radius) {
    return {
      distance,
      color: distance <= parseFloat(radius) ? "green" : "red",
    };
  }

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

  return (
    <div className="dashboard-main">
      {!isSessionDisplay && (
        <div className="session-dashboard-content">
          <div className="section-header">
            <h2>Your Attendance History</h2>
            <p>Track your presence across all sessions</p>
          </div>
          
          <div className="student-session-grid">
            {sessionList.length > 0 ? (
              sessionList.map((session, index) => {
                const distanceData = getDistance(session.distance, session.radius);
                const formattedDate = new Date(session.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div key={index + session.session_id} className="student-session-card">
                    <div className="card-image-box">
                      <img src={session.image} alt="Attendance Capture" />
                      <div className={`distance-badge ${distanceData.color}`}>
                        {distanceData.distance}m
                      </div>
                    </div>
                    
                    <div className="card-info">
                      <div className="session-info-header">
                        <div className="title-group">
                          <h3>{session.name}</h3>
                          <span className="session-date">{formattedDate}</span>
                        </div>
                      </div>
                      
                      <div className="session-details-row">
                        <div className="detail-item">
                          <span className="label">Time</span>
                          <span className="value">{session.time}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Duration</span>
                          <span className="value">{session.duration} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-sessions">
                <p>No attendance records found yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {isSessionDisplay && (
        <div className="popup-overlay">
          <StudentForm togglePopup={toggleStudentForm} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
