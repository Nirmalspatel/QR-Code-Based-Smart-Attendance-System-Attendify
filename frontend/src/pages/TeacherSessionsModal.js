import React from "react";
import "../styles/TeacherSessionsModal.css";

const TeacherSessionsModal = ({ teacher, onClose, onDeleteSession }) => {
  if (!teacher) return null;

  return (
    <div className="tsm-overlay" onClick={onClose}>
      <div className="tsm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tsm-header">
          <div className="tsm-title-group">
            <h3>Session History</h3>
            <p>{teacher.name} ({teacher.email})</p>
          </div>
          <button onClick={onClose} className="tsm-close" title="Close">✕</button>
        </div>

        <div className="tsm-body scrollable-content">
          <div className="tsm-stats-summary">
            <div className="tsm-stat">
              <span className="label">Total Sessions</span>
              <span className="value">{teacher.sessions?.length || 0}</span>
            </div>
            <div className="tsm-stat">
              <span className="label">Access Level</span>
              <span className="value">{(teacher.allowedAccess || []).length} Courses</span>
            </div>
          </div>

          <div className="tsm-session-list">
            <h4>Generated Sessions</h4>
            {(teacher.sessions || []).length === 0 ? (
              <p className="tsm-empty">No sessions created yet.</p>
            ) : (
              <div className="tsm-table-wrapper">
                <table className="tsm-table">
                  <thead>
                    <tr>
                      <th>Session Name</th>
                      <th>Date / Time</th>
                      <th>Group</th>
                      <th>Attendees</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacher.sessions.sort((a,b) => new Date(b.date) - new Date(a.date)).map((session) => (
                      <tr key={session.session_id}>
                        <td>
                          <strong>{session.name}</strong>
                          <br /><small>ID: {session.session_id.slice(0,8)}...</small>
                        </td>
                        <td>
                          {new Date(session.date).toLocaleDateString()}
                          <br /><small>{session.time}</small>
                        </td>
                        <td>
                          <span className="tsm-group-chip">{session.courseName}</span>
                          <div className="tsm-divs">{(session.divisions || []).join(", ")}</div>
                        </td>
                        <td className="tsm-center">
                          <span className="tsm-attendee-count">{session.attendance?.length || 0}</span>
                        </td>
                        <td>
                          <button 
                            className="tsm-del-btn" 
                            onClick={() => onDeleteSession(teacher.email, session.session_id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSessionsModal;
