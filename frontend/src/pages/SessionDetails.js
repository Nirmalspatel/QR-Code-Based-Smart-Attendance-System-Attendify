//create a new session component
import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import * as XLSX from "xlsx";
import "../styles/SessionDetails.css";
import io from "socket.io-client";

const SessionDetails = (props) => {
  const [qr, setQR] = useState("");
  const initialSession = props.currentSession && props.currentSession.length > 0 ? props.currentSession[0] : {};
  const [isExpired, setIsExpired] = useState(initialSession.isExpired || false);
  const [expiring, setExpiring] = useState(false);
  const [roster, setRoster] = useState([]);
  const [sessionMetadata, setSessionMetadata] = useState(initialSession || {});
  const [loadingRoster, setLoadingRoster] = useState(true);

  const fetchRoster = async () => {
    try {
      setLoadingRoster(true);
      const token = localStorage.getItem("token");
      if (!initialSession.session_id) return;
      const res = await axios.get(
        `/sessions/roster/${initialSession.session_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRoster(res.data.roster || []);
      setSessionMetadata(res.data.session || initialSession || {});
    } catch (err) {
      console.error("Error fetching roster:", err);
      // Fallback to what we have if API fails
      setRoster((sessionMetadata?.attendance || []).map(a => ({
        regno: a.regno,
        student_name: a.student_name,
        student_email: a.student_email,
        division: "",
        attended: true,
        attendance: a
      })));
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    // Socket.io for Real-time Roster Updates
    const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || "";
    const socket = io(SOCKET_URL || "http://localhost:5051", {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    const email = localStorage.getItem("email");

    socket.on("connect", () => {
      console.log("[SOCKET] SessionDetails connected");
      if (email) {
        socket.emit("join-room", email);
      }
    });

    socket.on("attendance-marked", (payload) => {
      console.log("[SOCKET] Attendance update received for session:", payload.session_id);
      // Only refresh if the update is for THIS session
      if (initialSession && payload.session_id === initialSession.session_id) {
        fetchRoster();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [initialSession?.session_id]);

  async function getQR() {
    if (!sessionMetadata?.session_id) return;
    await axios
      .post("/sessions/getQR", {
        session_id: sessionMetadata.session_id,
        token: localStorage.getItem("token"),
      })
      .then((response) => {
        setQR(response.data.url);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const showImage = (e) => {
    let image = e.target.src;
    let imageWindow = window.open("", "_blank");
    imageWindow.document.write(
      `<img src=${image} alt="student" width="50%" />`
    );
  };

  const copyQR = () => {
    navigator.clipboard.writeText(qr);
  };

  const handleExpireSession = async () => {
    if (!window.confirm("Are you sure you want to close attendance for this session? Students will no longer be able to mark attendance.")) {
      return;
    }
    setExpiring(true);
    try {
      await axios.post("/sessions/expireSession", {
        session_id: sessionMetadata?.session_id,
        token: localStorage.getItem("token"),
      });
      setIsExpired(true);
    } catch (err) {
      console.error("Expire session error:", err);
      alert("Failed to close attendance. Please try again.");
    } finally {
      setExpiring(false);
    }
  };

  const handleReopenSession = async () => {
    if (!window.confirm("Re-open attendance? Students will be able to scan the QR and mark attendance again.")) {
      return;
    }
    setExpiring(true);
    try {
      await axios.post("/sessions/reopenSession", {
        session_id: sessionMetadata?.session_id,
        token: localStorage.getItem("token"),
      });
      setIsExpired(false);
    } catch (err) {
      console.error("Reopen session error:", err);
      alert("Failed to re-open attendance. Please try again.");
    } finally {
      setExpiring(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm("Delete this session permanently? This cannot be undone.")) {
      return;
    }
    try {
      await axios.post("/sessions/deleteSession", {
        session_id: sessionMetadata?.session_id,
        token: localStorage.getItem("token"),
      });
      // Close popup and refresh the session list
      props.toggleSessionDetails(null);
      if (props.onSessionDeleted) props.onSessionDeleted();
    } catch (err) {
      console.error("Delete session error:", err);
      alert("Failed to delete session. Please try again.");
    }
  };

  const handleExportToExcel = () => {
    if (!sessionMetadata?.attendance || sessionMetadata.attendance.length === 0) {
      alert("No attendance data to export.");
      return;
    }

    const excelData = sessionMetadata.attendance.map((student) => ({
      "Reg No": student.regno,
      "Name": student.student_name || "Unknown",
      "IP Address": student.IP,
      "Date": student.date ? student.date.split("T")[0] : "",
      "Email": student.student_email,
      "Distance": getDistance(student.distance, sessionMetadata.radius).distance
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const fileName = `${(sessionMetadata?.name || "Session").replace(/\s+/g, '_')}_Attendance.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  function getDistance(distance, radius) {
    return {
      distance,
      color: distance <= parseFloat(radius) ? "green" : "red",
    };
  }

  useEffect(() => {
    if (!isExpired) {
      getQR();
    }
    fetchRoster();
  }, [isExpired]);


  const presentCount = roster.filter(r => r.attended).length;
  const totalCount = roster.length;
  const absentCount = totalCount - presentCount;
  const percentage = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0;

  if (!props.currentSession || props.currentSession.length === 0) {
    return (
      <div className="popup-overlay">
        <div className="session-details-modal">
          <div className="loading-state">Loading session details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-overlay">
      <div className="session-details-modal">
        <div className="modal-header">
          <div className="title-section">
            <h2>{sessionMetadata?.name || "Session Details"}</h2>
            <div className="summary-pills">
              <span className={`status-badge ${isExpired ? 'expired' : 'active'}`}>
                {isExpired ? "🔒 Closed" : "🟢 Active"}
              </span>
              <span className="pill-blue">{sessionMetadata?.location}</span>
              <span className="pill-gray">{sessionMetadata?.duration}min</span>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={handleDeleteSession} className="btn-delete" title="Delete Session">
              🗑 Delete
            </button>
            <button onClick={props.toggleSessionDetails} className="btn-close" title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body-split">
          <aside className="sidebar-meta">
            <div className="sidebar-section">
              <h4>Scan QR Code</h4>
              <div className="qr-container-sidebar">
                {isExpired ? (
                  <div className="qr-locked-sidebar">
                    <p>Attendance Closed</p>
                    <button onClick={handleReopenSession} className="link-text" disabled={expiring}>
                      {expiring ? "..." : "Re-open"}
                    </button>
                  </div>
                ) : (
                  <div className="qr-active-sidebar">
                    <QRCode value={qr || " "} onClick={copyQR} size={150} />
                    <div className="qr-mini-actions">
                      <button onClick={copyQR} className="link-text">Copy Link</button>
                      <button onClick={handleExpireSession} className="error-text">Stop</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sidebar-section">
              <h4>Attendance Stats</h4>
              <div className="stats-cards-vertical">
                <div className="stat-pill total">
                  <span className="label">Total</span>
                  <span className="val">{totalCount}</span>
                </div>
                <div className="stat-pill present">
                  <span className="label">Present</span>
                  <span className="val">{presentCount}</span>
                </div>
                <div className="stat-pill absent">
                  <span className="label">Absent</span>
                  <span className="val">{absentCount}</span>
                </div>
                <div className="stat-pill percent">
                  <span className="label">Rate</span>
                  <span className="val">{percentage}%</span>
                </div>
              </div>
            </div>

            <div className="sidebar-section">
              <h4>Session Info</h4>
              <div className="compact-info-list">
                <div className="info-item">
                  <span className="i-label">Date:</span>
                  <span className="i-val">{sessionMetadata?.date?.split("T")[0]}</span>
                </div>
                <div className="info-item">
                  <span className="i-label">Time:</span>
                  <span className="i-val">{sessionMetadata?.time}</span>
                </div>
                <div className="info-item">
                  <span className="i-label">Radius:</span>
                  <span className="i-val">{sessionMetadata?.radius}m</span>
                </div>
                {sessionMetadata?.courseName && (
                  <div className="info-item">
                    <span className="i-label">Course:</span>
                    <span className="i-val">{sessionMetadata?.courseName}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="i-label">Div:</span>
                  <span className="i-val">{(sessionMetadata?.divisions || []).join(",")}</span>
                </div>
              </div>
            </div>
          </aside>

          <main className="main-attendance-panel">
            <div className="attendance-header-compact">
              <h3>Class Roster</h3>
              <button onClick={handleExportToExcel} className="btn-export-mini">
                📊 Export Excel
              </button>
            </div>

            <div className="table-responsive">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Full Name</th>
                    <th>Div</th>
                    <th>Status</th>
                    <th>IP / Dist</th>
                    <th>Time</th>
                    <th>Verify</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRoster ? (
                    <tr><td colSpan="7" className="empty-state">Loading roster...</td></tr>
                  ) : roster.length > 0 ? (
                    roster.map((row, index) => {
                      const att = row.attendance;
                      const distanceData = att ? getDistance(att.distance, sessionMetadata?.radius || 0) : null;
                      return (
                        <tr key={index} className={row.attended ? "row-attended" : "row-absent"}>
                          <td className="reg-no">{row.regno}</td>
                          <td className="student-name">
                            {row.student_name}
                            <br /><small>{row.student_email}</small>
                          </td>
                          <td className="division-col">{row.division}</td>
                          <td className="status-col">
                            <span className={`status-dot ${row.attended ? 'present' : 'absent'}`}></span>
                            {row.attended ? "Present" : "Absent"}
                          </td>
                          <td className="details-col">
                            {row.attended && att ? (
                              <>
                                <small>IP: {att.IP}</small>
                                <br />
                                <span className={`distance-val ${distanceData.color}`}>
                                  {distanceData.distance}m
                                </span>
                              </>
                            ) : "—"}
                          </td>
                          <td className="join-time">
                            {row.attended && att?.date ? (
                              new Date(att.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            ) : "—"}
                          </td>
                          <td className="photo-cell">
                            {row.attended && att?.image ? (
                              <img src={att.image} alt="Attendance" className="mini-photo" width={45} onClick={showImage} style={{cursor: 'pointer'}} />
                            ) : (
                                <span className="no-photo">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="7" className="empty-state">No students found in these divisions.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
