import React, { useState } from "react";
import axios from "axios";
import "../styles/StreamManager.css";

const StreamManager = ({ structure, onRefresh, token }) => {
  const [expandedStreams, setExpandedStreams] = useState({});
  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedSemesters, setExpandedSemesters] = useState({});
  const [newStreamName, setNewStreamName] = useState("");
  const [newCourseName, setNewCourseName] = useState({});
  const [newSemesterName, setNewSemesterName] = useState({});
  const [newDivisionName, setNewDivisionName] = useState({});
  const [addingCourse, setAddingCourse] = useState({});
  const [addingSemester, setAddingSemester] = useState({});
  const [addingDivision, setAddingDivision] = useState({});
  const [loadingAction, setLoadingAction] = useState("");

  const cfg = { headers: { Authorization: `Bearer ${token}` } };

  const toggleStream = (id) =>
    setExpandedStreams((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleCourse = (id) =>
    setExpandedCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleSemester = (id) =>
    setExpandedSemesters((prev) => ({ ...prev, [id]: !prev[id] }));

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

  // ── Semester CRUD ─────────────────────────────────────────
  const handleCreateSemester = async (streamId, courseId) => {
    const key = `${streamId}-${courseId}`;
    const name = (newSemesterName[key] || "").trim();
    if (!name) return;
    setLoadingAction(`sem-create-${key}`);
    try {
      await axios.post(`/admin/stream/${streamId}/course/${courseId}/semester`, { name }, cfg);
      setNewSemesterName((prev) => ({ ...prev, [key]: "" }));
      setAddingSemester((prev) => ({ ...prev, [key]: false }));
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating semester");
    } finally {
      setLoadingAction("");
    }
  };

  const handleDeleteSemester = async (streamId, courseId, semesterId, semName) => {
    if (!window.confirm(`Delete semester "${semName}" and all its divisions?`)) return;
    setLoadingAction(`sem-del-${semesterId}`);
    try {
      await axios.delete(`/admin/stream/${streamId}/course/${courseId}/semester/${semesterId}`, cfg);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting semester");
    } finally {
      setLoadingAction("");
    }
  };

  // ── Division CRUD ─────────────────────────────────────────
  const handleCreateDivision = async (streamId, courseId, semesterId) => {
    const key = `${streamId}-${courseId}-${semesterId}`;
    const name = (newDivisionName[key] || "").trim();
    if (!name) return;
    setLoadingAction(`div-create-${key}`);
    try {
      await axios.post(`/admin/stream/${streamId}/course/${courseId}/semester/${semesterId}/division`, { name }, cfg);
      setNewDivisionName((prev) => ({ ...prev, [key]: "" }));
      setAddingDivision((prev) => ({ ...prev, [key]: false }));
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating division");
    } finally {
      setLoadingAction("");
    }
  };

  const handleDeleteDivision = async (streamId, courseId, semesterId, divisionId, divName) => {
    if (!window.confirm(`Delete division "${divName}"?`)) return;
    setLoadingAction(`div-del-${divisionId}`);
    try {
      await axios.delete(`/admin/stream/${streamId}/course/${courseId}/semester/${semesterId}/division/${divisionId}`, cfg);
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
      {/* ── Header Area ── */}
      <div className="sm-header-section">
        <div className="sm-header-info">
          <h2>Academic Ecosystem</h2>
          <p>Define the streams, courses, and divisions for your organization.</p>
        </div>
        <div className="sm-create-bar">
          <input
            type="text"
            placeholder="New stream name..."
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
      </div>

      {streams.length === 0 && (
        <div className="sm-empty">
          <span className="empty-icon">🏛️</span>
          <p>No streams available. Start by creating your first stream above.</p>
        </div>
      )}

      {/* ── Streams List ── */}
      {streams.map((stream) => (
        <div key={stream._id} className="sm-stream-card">
          <div className="sm-stream-header" onClick={() => toggleStream(stream._id)}>
            <div className="sm-main-title">
              <div className="sm-icon-box">🏛️</div>
              <div className="sm-title-text">
                <span className="sm-stream-name">{stream.name}</span>
                <span className="sm-stream-meta">{stream.courses.length} Course{stream.courses.length !== 1 ? 's' : ''} established</span>
              </div>
            </div>
            
            <div className="sm-stream-actions">
              <button
                className="sm-delete-btn"
                onClick={(e) => { e.stopPropagation(); handleDeleteStream(stream._id, stream.name); }}
                disabled={loadingAction === `stream-del-${stream._id}`}
              >
                {loadingAction === `stream-del-${stream._id}` ? "..." : "🗑 Delete"}
              </button>
              <div className={`sm-chevron ${expandedStreams[stream._id] ? "open" : ""}`}>
                ▼
              </div>
            </div>
          </div>

          {expandedStreams[stream._id] && (
            <div className="sm-stream-body">
              <div className="sm-section-title">Courses in {stream.name}</div>
              
              <div className="sm-nested-grid">
                {stream.courses.map((course) => {
                  const divKey = `${stream._id}-${course._id}`;
                  return (
                    <div key={course._id} className="sm-nested-card">
                      <div className="sm-nested-header">
                        <div className="sm-nested-info">
                          <h4>{course.name}</h4>
                          <span>{(course.semesters || []).length} Semesters</span>
                        </div>
                        <button
                          className="sm-mini-del"
                          onClick={() => handleDeleteCourse(stream._id, course._id, course.name)}
                          title="Delete Course"
                        >
                          🗑
                        </button>
                      </div>

                        <div className="sm-nested-body">
                          {/* Semesters / Divisions */}
                          {(course.semesters || []).map(sem => {
                            const semKey = `${stream._id}-${course._id}-${sem._id}`;
                            return (
                              <div key={sem._id} className="sm-sem-wrapper">
                                <div className="sm-sem-row">
                                  <div className="sm-sem-name">
                                    <span className="sm-sem-icon">📅</span>
                                    <strong>{sem.name}</strong>
                                  </div>
                                  <button 
                                    className="sm-mini-del" 
                                    onClick={() => handleDeleteSemester(stream._id, course._id, sem._id, sem.name)}
                                    title="Delete Semester"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="sm-divisions-row">
                                  {sem.divisions?.map(div => (
                                    <div key={div._id} className="sm-div-item">
                                      {div.name}
                                      <span className="sm-div-delete" onClick={() => handleDeleteDivision(stream._id, course._id, sem._id, div._id, div.name)}>×</span>
                                    </div>
                                  ))}
                                  
                                  {addingDivision[semKey] ? (
                                    <div className="sm-inline-add-xs">
                                      <input
                                        className="sm-input-xs"
                                        placeholder="Div..."
                                        value={newDivisionName[semKey] || ""}
                                        onChange={(e) => setNewDivisionName(p => ({...p, [semKey]: e.target.value}))}
                                        onKeyDown={(e) => e.key === "Enter" && handleCreateDivision(stream._id, course._id, sem._id)}
                                        autoFocus
                                      />
                                      <button className="sm-check-btn" onClick={() => handleCreateDivision(stream._id, course._id, sem._id)}>✓</button>
                                      <button className="sm-close-btn" onClick={() => setAddingDivision(p => ({...p, [semKey]: false}))}>×</button>
                                    </div>
                                  ) : (
                                    <button className="sm-add-div-btn" onClick={() => setAddingDivision(p => ({...p, [semKey]: true}))}>+ Div</button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                      {addingSemester[divKey] ? (
                        <div className="sm-inline-add">
                          <input
                            className="sm-input-sm"
                            placeholder="New semester name..."
                            value={newSemesterName[divKey] || ""}
                            onChange={(e) => setNewSemesterName(p => ({...p, [divKey]: e.target.value}))}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateSemester(stream._id, course._id)}
                            autoFocus
                          />
                          <button className="sm-btn sm-btn-success" onClick={() => handleCreateSemester(stream._id, course._id)}>Add</button>
                        </div>
                      ) : (
                        <button className="sm-btn sm-btn-ghost" style={{width:'100%', justifyContent:'center'}} onClick={() => setAddingSemester(p => ({...p, [divKey]: true}))}>+ Add Semester</button>
                      )}
                    </div>
                  );
                })}

                {addingCourse[stream._id] ? (
                  <div className="sm-nested-card sm-inline-add" style={{display:'flex', flexDirection:'column'}}>
                    <input
                      className="sm-input-sm"
                      placeholder="New course name..."
                      value={newCourseName[stream._id] || ""}
                      onChange={(e) => setNewCourseName(p => ({...p, [stream._id]: e.target.value}))}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateCourse(stream._id)}
                      autoFocus
                    />
                    <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                      <button className="sm-btn sm-btn-success" onClick={() => handleCreateCourse(stream._id)}>Save Course</button>
                      <button className="sm-btn sm-btn-ghost" onClick={() => setAddingCourse(p => ({...p, [stream._id]: false}))}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="sm-add-link" onClick={() => setAddingCourse(p => ({...p, [stream._id]: true}))}>
                    <span>+ Establish New Course</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StreamManager;
