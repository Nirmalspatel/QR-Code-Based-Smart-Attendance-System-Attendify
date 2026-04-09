import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/TeacherAccess.css";

/**
 * TeacherAccessManager
 * Props:
 *   teacher     — { _id, name, email, allowedAccess[] }
 *   structure   — full AcademicStructure document { streams[] }
 *   token       — JWT token string
 *   onClose     — callback to close the modal
 *   onRefresh   — callback to refresh teacher list after changes
 */
const TeacherAccessManager = ({ teacher, structure, token, onClose, onRefresh }) => {
  const [currentAccess, setCurrentAccess] = useState(teacher.allowedAccess || []);
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cfg = { headers: { Authorization: `Bearer ${token}` } };
  const streams = structure?.streams || [];

  // Courses available for the selected stream
  const availableCourses = streams.find((s) => s._id === selectedStreamId)?.courses || [];

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleGrant = async () => {
    if (!selectedStreamId || selectedCourseIds.length === 0) {
      setError("Select a stream and at least one course.");
      return;
    }
    setError("");
    setLoading(true);

    const stream = streams.find((s) => s._id === selectedStreamId);
    const accesses = selectedCourseIds.map((courseId) => {
      const course = stream.courses.find((c) => c._id === courseId);
      return {
        streamId: stream._id,
        streamName: stream.name,
        courseId: course._id,
        courseName: course.name,
      };
    });

    try {
      const res = await axios.post(
        `/admin/teacher/${teacher._id}/access`,
        { accesses },
        cfg
      );
      setCurrentAccess(res.data.allowedAccess);
      setSelectedStreamId("");
      setSelectedCourseIds([]);
      setSuccess("Access granted!");
      setTimeout(() => setSuccess(""), 2500);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Error granting access");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (streamId, courseId, courseName) => {
    if (!window.confirm(`Remove access to "${courseName}"?`)) return;
    setLoading(true);
    try {
      const res = await axios.delete(`/admin/teacher/${teacher._id}/access`, {
        ...cfg,
        data: { streamId, courseId },
      });
      setCurrentAccess(res.data.allowedAccess);
      setSuccess("Access revoked.");
      setTimeout(() => setSuccess(""), 2500);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Error revoking access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tam-overlay" onClick={onClose}>
      <div className="tam-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tam-header">
          <div>
            <h2>Manage Access</h2>
            <p className="tam-subtitle">{teacher.name} &bull; {teacher.email}</p>
          </div>
          <button className="tam-close" onClick={onClose}>✕</button>
        </div>

        <div className="tam-body">
          {/* Current Access */}
          <div className="tam-section">
            <h3 className="tam-section-title">Current Access</h3>
            {currentAccess.length === 0 ? (
              <div className="tam-empty">No access granted yet.</div>
            ) : (
              <div className="tam-access-list">
                {currentAccess.map((a, i) => (
                  <div key={i} className="tam-access-item">
                    <div className="tam-access-info">
                      <span className="tam-stream-tag">{a.streamName}</span>
                      <span className="tam-arrow">→</span>
                      <span className="tam-course-tag">{a.courseName}</span>
                    </div>
                    <button
                      className="tam-revoke-btn"
                      onClick={() => handleRevoke(a.streamId, a.courseId, a.courseName)}
                      disabled={loading}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grant New Access */}
          <div className="tam-section">
            <h3 className="tam-section-title">Grant New Access</h3>

            {/* Stream selector */}
            <label className="tam-label">Select Stream</label>
            <select
              className="tam-select"
              value={selectedStreamId}
              onChange={(e) => { setSelectedStreamId(e.target.value); setSelectedCourseIds([]); }}
            >
              <option value="">-- Choose a Stream --</option>
              {streams.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>

            {/* Course multi-select */}
            {selectedStreamId && (
              <>
                <label className="tam-label" style={{ marginTop: 14 }}>
                  Select Courses <span className="tam-hint">(pick one or more)</span>
                </label>
                <div className="tam-course-grid">
                  {availableCourses.length === 0 ? (
                    <p className="tam-empty">No courses in this stream.</p>
                  ) : (
                    availableCourses.map((c) => {
                      const isAlreadyGranted = currentAccess.some(
                        (a) =>
                          a.streamId?.toString() === selectedStreamId &&
                          a.courseId?.toString() === c._id
                      );
                      return (
                        <label
                          key={c._id}
                          className={`tam-course-chip ${selectedCourseIds.includes(c._id) ? "selected" : ""} ${isAlreadyGranted ? "granted" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourseIds.includes(c._id)}
                            onChange={() => toggleCourse(c._id)}
                            disabled={isAlreadyGranted}
                          />
                          <span>{c.name}</span>
                          {isAlreadyGranted && <span className="tam-already">✓ Granted</span>}
                        </label>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {error && <div className="tam-error">{error}</div>}
            {success && <div className="tam-success">{success}</div>}

            <button
              className="tam-grant-btn"
              onClick={handleGrant}
              disabled={loading || !selectedStreamId || selectedCourseIds.length === 0}
            >
              {loading ? "Saving..." : `Grant Access (${selectedCourseIds.length} course${selectedCourseIds.length !== 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAccessManager;
