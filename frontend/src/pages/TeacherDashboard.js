import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import NewSession from "./NewSession";
import SessionDetails from "./SessionDetails";
import io from "socket.io-client";

axios.defaults.withCredentials = true;

const TeacherDashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [email] = useState(localStorage.getItem("email") || "");
  const [subjectList, setSubjectList] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [currentSession, setCurrentSession] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    updateList();

    // Socket.io initialization
    const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || "";
    const socket = io(SOCKET_URL || "http://localhost:5051", {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected to server");
      if (email) {
        socket.emit("join-room", email);
      }
    });

    socket.on("attendance-marked", (payload) => {
      console.log("[SOCKET] Attendance marked received:", payload);
      updateList();
    });

    socket.on("session-created", (payload) => {
      if (payload.teacher === email) {
        updateList();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, email, navigate]);

  const updateList = async () => {
    try {
      const response = await axios.post("/sessions/getSessions", { token });
      setSubjectList(response.data.subjects || []);
      
      // If a subject was selected, refresh its data from the new list
      if (selectedSubject) {
        const updatedSubj = (response.data.subjects || []).find(s => s._id === selectedSubject._id);
        if (updatedSubj) setSelectedSubject(updatedSubj);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createSubject = async (e) => {
    e.preventDefault();
    const name = e.target.subjectName.value;
    const code = e.target.subjectCode.value;
    try {
      await axios.post("/sessions/subjects/create", { name, code, token });
      setIsSubjectOpen(false);
      updateList();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data || err.message || "Error creating subject. Please try again.";
      alert(errorMsg);
    }
  };

  const handleDeleteSubject = async (e, subjectId, subjectName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete subject "${subjectName}" and all its sessions? This cannot be undone.`)) return;
    try {
      await axios.post("/sessions/subjects/delete", { subject_id: subjectId, token });
      updateList();
    } catch (err) {
      console.error(err);
      alert("Error deleting subject.");
    }
  };

  const toggleSessionDetails = (sessionId) => {
    const session = selectedSubject.sessions.find(s => s.session_id === sessionId);
    setCurrentSession([session]);
    setSessionDisplay(!isSessionDisplay);
  };

  const SubjectCard = ({ subject }) => (
    <div className="flashcard subject-card" onClick={() => setSelectedSubject(subject)}>
      <div className="card-top">
        <h3>{subject.name}</h3>
        <span className="subject-code-badge">{subject.code || "No Code"}</span>
      </div>
      <div className="card-info">
        <p>📚 {subject.sessions ? subject.sessions.length : 0} Sessions</p>
      </div>
      <div className="card-actions-row">
        <button className="detailsbtn">Manage Subject</button>
        <button 
          className="delete-subject-btn" 
          onClick={(e) => handleDeleteSubject(e, subject._id, subject.name)}
          title="Delete Subject"
        >
          🗑
        </button>
      </div>
    </div>
  );

  const SessionCard = ({ session }) => (
    <div className="flashcard session-card" onClick={() => toggleSessionDetails(session.session_id)}>
      <div className="card-top">
        <h3>{session.name}</h3>
        <span className="student-count-badge">
          👤 {session.attendance ? session.attendance.length : 0}
        </span>
      </div>
      <div className="card-info">
        <p className="card-date">📅 {new Date(session.date).toLocaleDateString()}</p>
        <p className="card-time">⏰ {session.time}</p>
      </div>
      <button className="detailsbtn">View Attendance</button>
    </div>
  );

  return (
    <div className="dashboard-main">
      <div className="row1">
        <div className="heading">
          {selectedSubject ? (
            <div className="breadcrumb">
              <span className="back-link" onClick={() => setSelectedSubject(null)}>Subjects</span>
              <span className="separator"> &gt; </span>
              <h2>{selectedSubject.name}</h2>
            </div>
          ) : (
            <h2>Your Subjects</h2>
          )}
        </div>
        <div className="createbtncol">
          {selectedSubject ? (
            <button onClick={() => setIsSessionOpen(true)} className="createbtn">
              Create Session
            </button>
          ) : (
            <button onClick={() => setIsSubjectOpen(true)} className="createbtn">
              Create Subject
            </button>
          )}
        </div>
      </div>

      <div className="session-list">
        {selectedSubject ? (
          selectedSubject.sessions && selectedSubject.sessions.length > 0 ? (
            selectedSubject.sessions.map((session, index) => (
              <SessionCard key={index + session.session_id} session={session} />
            ))
          ) : (
            <p>No sessions found in this subject. Create one to get started!</p>
          )
        ) : (
          subjectList.length > 0 ? (
            subjectList.map((subject, index) => (
              <SubjectCard key={index + subject._id} subject={subject} />
            ))
          ) : (
            <p>No subjects found. Create a subject to organize your sessions.</p>
          )
        )}
      </div>

      {/* Subject Creation Modal */}
      {isSubjectOpen && (
        <div className="popup-overlay">
          <div className="new-session-modal">
            <div className="modal-header">
              <h2>Create New Subject</h2>
              <button onClick={() => setIsSubjectOpen(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={createSubject} className="modal-body">
              <div className="form-group">
                <label className="label">Subject Name</label>
                <input type="text" name="subjectName" placeholder="e.g. Data Structures" required />
              </div>
              <div className="form-group">
                <label className="label">Subject Code (Optional)</label>
                <input type="text" name="subjectCode" placeholder="e.g. CS101" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-create">Create Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {isSessionDisplay && (
        <div className="popup-overlay">
          <SessionDetails
            currentSession={currentSession}
            toggleSessionDetails={() => setSessionDisplay(false)}
            onSessionDeleted={updateList}
          />
        </div>
      )}

      {/* New Session Modal */}
      {isSessionOpen && (
        <div className="popup-overlay">
          <NewSession
            togglePopup={() => setIsSessionOpen(false)}
            onSessionCreated={updateList}
            selectedSubjectId={selectedSubject?._id}
          />
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
