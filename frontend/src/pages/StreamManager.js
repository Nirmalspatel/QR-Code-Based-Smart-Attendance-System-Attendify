import React, { useState } from "react";
import axios from "axios";
import "../styles/StreamManager.css";

const StreamManager = ({ structure, onRefresh, token }) => {
  const [expandedStreams, setExpandedStreams] = useState({});
  const [expandedCourses, setExpandedCourses] = useState({});
  const [newStreamName, setNewStreamName] = useState("");
  const [newCourseName, setNewCourseName] = useState({});
  const [newDivisionName, setNewDivisionName] = useState({});
  const [addingCourse, setAddingCourse] = useState({});
  const [addingDivision, setAddingDivision] = useState({});
  const [loadingAction, setLoadingAction] = useState("");

  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const toggleStream = (id) =>
    setExpandedStreams((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleCourse = (id) =>
    setExpandedCourses((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Stream CRUD ───────────────────────────────────────────
  const handleCreateStream = async () => {
    if (!newStreamName.trim()) return;
    setLoadingAction("stream-create");
    try {
      await axios.post("/admin/stream/create", { name: newStreamName.trim() }, cfg);
      setNewStreamName("");
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating stream");
    } finally {
      setLoadingAction("");
    }
  };

  const handleDeleteStream = async (streamId, streamName) => {
    if (!window.confirm(`Delete stream "${streamName}" and all its courses/divisions?`)) return;
    setLoadingAction(`stream-del-${streamId}`);
    try {
      await axios.delete(`/admin/stream/${streamId}`, cfg);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting stream");
    } finally {
      setLoadingAction("");
    }
  };

  // ── Course CRUD ───────────────────────────────────────────
  const handleCreateCourse = async (streamId) => {
    const name = (newCourseName[streamId] || "").trim();
    if (!name) return;
    setLoadingAction(`course-create-${streamId}`);
    try {
      await axios.post(`/admin/stream/${streamId}/course`, { name }, cfg);
      setNewCourseName((prev) => ({ ...prev, [streamId]: "" }));
      setAddingCourse((prev) => ({ ...prev, [streamId]: false }));
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating course");
    } finally {
      setLoadingAction("");
    }
  };

  const handleDeleteCourse = async (streamId, courseId, courseName) => {
    if (!window.confirm(`Delete course "${courseName}" and all its divisions?`)) return;
    setLoadingAction(`course-del-${courseId}`);
    try {
      await axios.delete(`/admin/stream/${streamId}/course/${courseId}`, cfg);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting course");
    } finally {
      setLoadingAction("");
    }
  };

  // ── Division CRUD ─────────────────────────────────────────
  const handleCreateDivision = async (streamId, courseId) => {
    const key = `${streamId}-${courseId}`;
    const name = (newDivisionName[key] || "").trim();
    if (!name) return;
    setLoadingAction(`div-create-${key}`);
    try {
      await axios.post(`/admin/stream/${streamId}/course/${courseId}/division`, { name }, cfg);
      setNewDivisionName((prev) => ({ ...prev, [key]: "" }));
      setAddingDivision((prev) => ({ ...prev, [key]: false }));
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating division");
    } finally {
      setLoadingAction("");
    }
  };

  const handleDeleteDivision = async (streamId, courseId, divisionId, divName) => {
    if (!window.confirm(`Delete division "${divName}"?`)) return;
    setLoadingAction(`div-del-${divisionId}`);
    try {
      await axios.delete(`/admin/stream/${streamId}/course/${courseId}/division/${divisionId}`, cfg);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting division");
    } finally {
      setLoadingAction("");
    }
  };

  const streams = structure?.streams || [];

  return (
    <div className="stream-manager">
      {/* ── Create Stream ── */}
      <div className="sm-create-bar">
        <input
          type="text"
          placeholder="New stream name (e.g. B.Tech)"
          value={newStreamName}
          onChange={(e) => setNewStreamName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateStream()}
          className="sm-input"
        />
        <button
          onClick={handleCreateStream}
          disabled={loadingAction === "stream-create"}
          className="sm-btn sm-btn-primary"
        >
          {loadingAction === "stream-create" ? "Adding..." : "+ Add Stream"}
        </button>
      </div>

      {streams.length === 0 && (
        <div className="sm-empty">No streams yet. Create one above to get started.</div>
      )}

      {/* ── Streams List ── */}
      {streams.map((stream) => (
        <div key={stream._id} className="sm-stream-card">
          <div className="sm-stream-header" onClick={() => toggleStream(stream._id)}>
            <div className="sm-stream-title">
              <span className={`sm-chevron ${expandedStreams[stream._id] ? "open" : ""}`}>▶</span>
              <span className="sm-stream-name">{stream.name}</span>
              <span className="sm-badge">{stream.courses.length} course{stream.courses.length !== 1 ? "s" : ""}</span>
            </div>
            <button
              className="sm-delete-btn"
              onClick={(e) => { e.stopPropagation(); handleDeleteStream(stream._id, stream.name); }}
              disabled={loadingAction === `stream-del-${stream._id}`}
              title="Delete stream"
            >
              🗑
            </button>
          </div>

          {expandedStreams[stream._id] && (
            <div className="sm-stream-body">
              {/* Add course row */}
              {addingCourse[stream._id] ? (
                <div className="sm-inline-add">
                  <input
                    type="text"
                    placeholder="Course name (e.g. Computer Science)"
                    value={newCourseName[stream._id] || ""}
                    onChange={(e) =>
                      setNewCourseName((prev) => ({ ...prev, [stream._id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleCreateCourse(stream._id)}
                    className="sm-input sm-input-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleCreateCourse(stream._id)}
                    disabled={loadingAction === `course-create-${stream._id}`}
                    className="sm-btn sm-btn-success"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setAddingCourse((prev) => ({ ...prev, [stream._id]: false }))}
                    className="sm-btn sm-btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="sm-add-link"
                  onClick={() => setAddingCourse((prev) => ({ ...prev, [stream._id]: true }))}
                >
                  + Add Course
                </button>
              )}

              {stream.courses.length === 0 && (
                <div className="sm-empty-small">No courses yet.</div>
              )}

              {/* Courses */}
              {stream.courses.map((course) => {
                const divKey = `${stream._id}-${course._id}`;
                return (
                  <div key={course._id} className="sm-course-card">
                    <div
                      className="sm-course-header"
                      onClick={() => toggleCourse(course._id)}
                    >
                      <div className="sm-course-title">
                        <span className={`sm-chevron sm-chevron-sm ${expandedCourses[course._id] ? "open" : ""}`}>▶</span>
                        <span className="sm-course-name">{course.name}</span>
                        <span className="sm-division-chips">
                          {course.divisions.map((d) => (
                            <span key={d._id} className="sm-div-chip">{d.name}</span>
                          ))}
                        </span>
                      </div>
                      <button
                        className="sm-delete-btn"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCourse(stream._id, course._id, course.name); }}
                        disabled={loadingAction === `course-del-${course._id}`}
                        title="Delete course"
                      >
                        🗑
                      </button>
                    </div>

                    {expandedCourses[course._id] && (
                      <div className="sm-course-body">
                        <div className="sm-divisions-row">
                          {course.divisions.map((div) => (
                            <div key={div._id} className="sm-div-item">
                              <span>{div.name}</span>
                              <button
                                className="sm-div-delete"
                                onClick={() => handleDeleteDivision(stream._id, course._id, div._id, div.name)}
                                disabled={loadingAction === `div-del-${div._id}`}
                                title="Remove division"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        {addingDivision[divKey] ? (
                          <div className="sm-inline-add">
                            <input
                              type="text"
                              placeholder="Division (e.g. A)"
                              value={newDivisionName[divKey] || ""}
                              onChange={(e) =>
                                setNewDivisionName((prev) => ({ ...prev, [divKey]: e.target.value }))
                              }
                              onKeyDown={(e) => e.key === "Enter" && handleCreateDivision(stream._id, course._id)}
                              className="sm-input sm-input-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => handleCreateDivision(stream._id, course._id)}
                              disabled={loadingAction === `div-create-${divKey}`}
                              className="sm-btn sm-btn-success"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setAddingDivision((prev) => ({ ...prev, [divKey]: false }))}
                              className="sm-btn sm-btn-ghost"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="sm-add-link"
                            onClick={() => setAddingDivision((prev) => ({ ...prev, [divKey]: true }))}
                          >
                            + Add Division
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StreamManager;
