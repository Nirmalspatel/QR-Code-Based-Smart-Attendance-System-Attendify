import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentStatsModal.css";

const StudentStatsModal = ({ studentId, token, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`/admin/student/${studentId}/stats`, config);
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [studentId, token]);

  if (loading) return (
    <div className="ssm-overlay">
      <div className="ssm-modal loading">
        <div className="ssm-spinner"></div>
        <p>Calculating statistics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="ssm-overlay">
      <div className="ssm-modal">
        <div className="ssm-header">
          <h3>Error</h3>
          <button onClick={onClose} className="ssm-close">✕</button>
        </div>
        <div className="ssm-body">
          <p className="ssm-error-text">{error}</p>
        </div>
      </div>
    </div>
  );

  const { student, percentage, total, attended, absent, history } = stats;

  return (
    <div className="ssm-overlay" onClick={onClose}>
      <div className="ssm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ssm-header">
          <div className="ssm-title-group">
            <h3>Attendance Report</h3>
            <p>{student.name} ({student.regno})</p>
          </div>
          <button onClick={onClose} className="ssm-close" title="Close">✕</button>
        </div>

        <div className="ssm-body scrollable-content">
          <div className="ssm-summary-grid">
            {/* Circular Progress */}
            <div className="ssm-chart-container">
              <div 
                className="ssm-progress-ring" 
                style={{ 
                  '--percentage': percentage,
                  '--color': percentage >= 75 ? '#22c55e' : percentage >= 50 ? '#eab308' : '#ef4444'
                }}
              >
                <div className="ssm-inner-circle">
                  <span className="ssm-percent-val">{percentage}%</span>
                  <span className="ssm-percent-label">Attendance</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="ssm-stats-cards">
              <div className="ssm-stat-card">
                <span className="label">Total Sessions</span>
                <span className="value">{total}</span>
              </div>
              <div className="ssm-stat-card present">
                <span className="label">Present</span>
                <span className="value">{attended}</span>
              </div>
              <div className="ssm-stat-card absent">
                <span className="label">Absent</span>
                <span className="value">{absent}</span>
              </div>
            </div>
          </div>

          <div className="ssm-info-bar">
             <span><strong>Stream:</strong> {student.streamName}</span>
             <span><strong>Course:</strong> {student.courseName}</span>
             <span><strong>Division:</strong> {student.division}</span>
          </div>

          {/* History List */}
          <div className="ssm-history-section">
            <h4>Session History</h4>
            {history.length === 0 ? (
              <p className="ssm-empty">No sessions recorded for this academic group.</p>
            ) : (
              <div className="ssm-history-list">
                {history.map((h, i) => (
                  <div key={i} className={`ssm-history-item ${h.attended ? 'present' : 'absent'}`}>
                    <div className="ssm-history-info">
                      <span className="ssm-hist-name">{h.name}</span>
                      <span className="ssm-hist-date">{new Date(h.date).toLocaleDateString()}</span>
                    </div>
                    <span className={`ssm-status-badge ${h.attended ? 'present' : 'absent'}`}>
                      {h.attended ? "PRESENT" : "ABSENT"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentStatsModal;
