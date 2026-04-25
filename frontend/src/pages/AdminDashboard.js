import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/AdminDashboard.css";
import StreamManager from "./StreamManager";
import TeacherAccessManager from "./TeacherAccessManager";
import StudentStatsModal from "./StudentStatsModal";
import TeacherSessionsModal from "./TeacherSessionsModal";
import DomainManager from "./DomainManager";
import io from "socket.io-client";
import "../styles/StudentStatsModal.css";

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [academicStructure, setAcademicStructure] = useState({ streams: [] });
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(true);
  const [selectedTeacherForAccess, setSelectedTeacherForAccess] = useState(null);
  const [selectedStudentForStats, setSelectedStudentForStats] = useState(null);
  const [selectedTeacherForHistory, setSelectedTeacherForHistory] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Hierarchical student state
  const [studentPath, setStudentPath] = useState({ 
    stream: null, 
    course: null, 
    semester: null,
    division: null 
  });

  // Hierarchical teacher state
  const [teacherPath, setTeacherPath] = useState({ 
    stream: null, 
    course: null 
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const type = localStorage.getItem("type");
    if (type !== "admin") {
      navigate("/login");
      return;
    }
    fetchData();

    // Socket.io initialization
    const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || "";
    const socket = io(SOCKET_URL || "http://localhost:5051", {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Admin connected");
    });

    const handleRefresh = () => {
      console.log("[SOCKET] Refreshing data due to real-time event");
      fetchData();
    };

    socket.on("user-signup", handleRefresh);
    socket.on("session-created", handleRefresh);
    socket.on("admin-activity", handleRefresh);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [token, navigate]);


  const fetchData = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [studentsRes, teachersRes, sessionsRes, academicRes] = await Promise.all([
        axios.get("/admin/students", config),
        axios.get("/admin/teachers", config),
        axios.get("/admin/sessions", config),
        axios.get("/admin/academic-structure", config)
      ]);

      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setSessions(sessionsRes.data);
      setAcademicStructure(academicRes.data);
    } catch (error) {
      console.error("Error fetching admin data", error);
      if (error.response && error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.delete(`/admin/delete/${type}/${id}`, config);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully.`);
      fetchData(); // Refresh the lists after deletion
    } catch (error) {
      console.error(`Error deleting ${type}`, error);
      alert("Failed to delete. Please try again.");
    }
  };

  const handleDeleteSession = async (teacherEmail, sessionId) => {
    if (!window.confirm(`Are you sure you want to delete this session?`)) {
      return;
    }
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.delete(`/admin/session/delete/${teacherEmail}/${sessionId}`, config);
      alert(`Session deleted successfully.`);
      fetchData(); // Refresh the lists after deletion
    } catch (error) {
      console.error(`Error deleting session`, error);
      alert("Failed to delete. Please try again.");
    }
  };

  const handleTeacherPath = (key, value) => {
    setTeacherPath(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'stream') { next.course = null; }
      return next;
    });
  };

  const renderTeacherHierarchy = () => {
    const { stream, course } = teacherPath;

    // Search Mode for Teachers
    if (searchTerm.trim().length > 0) {
      const filtered = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.pno?.includes(searchTerm)
      );
      
      return (
        <div className="data-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Sessions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher) => (
                <tr key={teacher._id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.email}<br/><small style={{color: '#888'}}>{teacher.pno}</small></td>
                  <td className="session-count-cell">{teacher.sessionCount || 0}</td>
                  <td>
                    <div className="btn-group-admin">
                      <button className="view-stats-btn" onClick={() => setSelectedTeacherForHistory(teacher)}>
                        View History
                      </button>
                      <button className="del-btn" onClick={() => handleDelete(teacher._id, "teacher")}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="4" className="empty-message">No teachers matching "{searchTerm}"</td></tr>}
            </tbody>
          </table>
        </div>
      );
    }

    // 1. Show Streams
    if (!stream) {
      return (
        <div className="hierarchy-grid">
          {academicStructure.streams.map(s => (
            <div key={s._id} className="hierarchy-card" onClick={() => handleTeacherPath('stream', s)}>
              <div className="card-icon">🏛️</div>
              <div className="card-info">
                <h3>{s.name}</h3>
                <p>Browse Teachers</p>
              </div>
            </div>
          ))}
          {academicStructure.streams.length === 0 && <p className="empty-message">No streams found.</p>}
        </div>
      );
    }

    // 2. Show Courses
    if (!course) {
      return (
        <div className="hierarchy-grid">
          {stream.courses.map(c => (
            <div key={c._id} className="hierarchy-card" onClick={() => handleTeacherPath('course', c)}>
              <div className="card-icon">📖</div>
              <div className="card-info">
                <h3>{c.name}</h3>
                <p>View teachers assigned here</p>
              </div>
            </div>
          ))}
          {stream.courses.length === 0 && <p className="empty-message">No courses found in this stream.</p>}
        </div>
      );
    }

    // 3. Show Teachers assigned to this Course
    const filteredTeachers = teachers.filter(t => 
      (t.allowedAccess || []).some(a => 
        a.streamId === stream._id && a.courseId === course._id
      )
    );

    return (
      <div className="data-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Sessions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((teacher) => (
              <tr key={teacher._id}>
                <td>{teacher.name}</td>
                <td>{teacher.email}<br/><small style={{color: '#888'}}>{teacher.pno}</small></td>
                <td className="session-count-cell">{teacher.sessionCount || 0}</td>
                <td>
                  <div className="btn-group-admin">
                    <button className="view-stats-btn" onClick={() => setSelectedTeacherForHistory(teacher)}>
                      View History
                    </button>
                    <button className="del-btn" onClick={() => handleDelete(teacher._id, "teacher")}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTeachers.length === 0 && (
              <tr>
                <td colSpan="4" className="empty-message">No teachers assigned to this course yet. Use "Teacher Access" tab to grant access.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const handleStudentPath = (key, value) => {
    setStudentPath(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'stream') { next.course = null; next.semester = null; next.division = null; }
      if (key === 'course') { next.semester = null; next.division = null; }
      if (key === 'semester') { next.division = null; }
      return next;
    });
  };

  const renderStudentHierarchy = () => {
    const { stream, course, semester, division } = studentPath;

    // Search Mode for Students
    if (searchTerm.trim().length > 0) {
      const filtered = students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.regno?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return (
        <div className="data-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Reg/Roll No</th>
                <th>Email</th>
                <th>Group</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.regno || "N/A"}</td>
                  <td>{student.email}</td>
                  <td>
                    <small>{student.streamName}</small><br/>
                    <strong>{student.courseName} - {student.semesterName} ({student.division})</strong>
                  </td>
                  <td>
                    <div className="btn-group-admin">
                      <button className="view-stats-btn" onClick={() => setSelectedStudentForStats(student._id)}>
                        View Stats
                      </button>
                      <button className="del-btn" onClick={() => handleDelete(student._id, "student")}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5" className="empty-message">No students matching "{searchTerm}"</td></tr>}
            </tbody>
          </table>
        </div>
      );
    }

    // 1. Show Streams
    if (!stream) {
      return (
        <div className="hierarchy-grid">
          {academicStructure.streams.map(s => (
            <div key={s._id} className="hierarchy-card" onClick={() => handleStudentPath('stream', s)}>
              <div className="card-icon">📚</div>
              <div className="card-info">
                <h3>{s.name}</h3>
                <p>{s.courses?.length || 0} Courses</p>
              </div>
            </div>
          ))}
          {academicStructure.streams.length === 0 && <p className="empty-message">No streams found. Create one in Academic Structure tab.</p>}
        </div>
      );
    }

    // 2. Show Courses
    if (!course) {
      return (
        <div className="hierarchy-grid">
          {stream.courses.map(c => (
            <div key={c._id} className="hierarchy-card" onClick={() => handleStudentPath('course', c)}>
              <div className="card-icon">🎓</div>
              <div className="card-info">
                <h3>{c.name}</h3>
                <p>{c.semesters?.length || 0} Semesters</p>
              </div>
            </div>
          ))}
          {stream.courses.length === 0 && <p className="empty-message">No courses found in this stream.</p>}
        </div>
      );
    }

    // 3. Show Semesters
    if (!semester) {
      return (
        <div className="hierarchy-grid">
          {course.semesters.map(s => (
            <div key={s._id} className="hierarchy-card" onClick={() => handleStudentPath('semester', s)}>
              <div className="card-icon">📆</div>
              <div className="card-info">
                <h3>{s.name}</h3>
                <p>{s.divisions?.length || 0} Divisions</p>
              </div>
            </div>
          ))}
          {course.semesters.length === 0 && <p className="empty-message">No semesters found in this course.</p>}
        </div>
      );
    }

    // 4. Show Divisions
    if (!division) {
      return (
        <div className="hierarchy-grid">
          {semester.divisions.map(d => (
            <div key={d._id} className="hierarchy-card" onClick={() => handleStudentPath('division', d)}>
              <div className="card-icon">📂</div>
              <div className="card-info">
                <h3>Division {d.name}</h3>
                <p>Click to view students</p>
              </div>
            </div>
          ))}
          {semester.divisions.length === 0 && <p className="empty-message">No divisions found in this semester.</p>}
        </div>
      );
    }

    // 5. Show Students
    const filteredStudents = students.filter(s => 
      s.streamId === stream._id && 
      s.courseId === course._id && 
      s.semesterId === semester._id &&
      s.division === division.name
    );

    return (
      <div className="data-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Reg/Roll No</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td>{student.name}</td>
                <td>{student.regno || "N/A"}</td>
                <td>{student.email}</td>
                <td>
                  <div className="btn-group-admin">
                    <button className="view-stats-btn" onClick={() => setSelectedStudentForStats(student._id)}>
                      View Stats
                    </button>
                    <button className="del-btn" onClick={() => handleDelete(student._id, "student")}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="4" className="empty-message">No students found in this division.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const getFilteredStudentCount = () => {
    if (searchTerm.trim().length > 0) {
      return students.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.regno?.toLowerCase().includes(searchTerm.toLowerCase())
      ).length;
    }
    const { stream, course, semester, division } = studentPath;
    if (!stream && !course && !semester && !division) return students.length;
    
    return students.filter(s => {
      const matchStream = !stream || s.streamId === stream._id;
      const matchCourse = !course || s.courseId === course._id;
      const matchSemester = !semester || s.semesterId === semester._id;
      const matchDiv = !division || s.division === division.name;
      return matchStream && matchCourse && matchSemester && matchDiv;
    }).length;
  };

  const getFilteredTeacherCount = () => {
    if (searchTerm.trim().length > 0) {
      return teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.pno?.includes(searchTerm)
      ).length;
    }
    const { stream, course } = teacherPath;
    if (!stream && !course) return teachers.length;
    
    return teachers.filter(t => 
      (t.allowedAccess || []).some(a => 
        (!stream || a.streamId === stream._id) && 
        (!course || a.courseId === course._id)
      )
    ).length;
  };

  return (
    <div className="admin-dash-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your ecosystem efficiently.</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`AdminTabBtn ${activeTab === "students" ? "active" : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Students ({getFilteredStudentCount()})
        </button>
        <button
          className={`AdminTabBtn ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          Teachers ({getFilteredTeacherCount()})
        </button>
        <button
          className={`AdminTabBtn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          Sessions ({sessions.filter(s => 
            searchTerm === "" || 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
          ).length})
        </button>
        <button
          className={`AdminTabBtn ${activeTab === "academic" ? "active" : ""}`}
          onClick={() => setActiveTab("academic")}
        >
          Academic Structure
        </button>
        <button
          className={`AdminTabBtn ${activeTab === "access" ? "active" : ""}`}
          onClick={() => setActiveTab("access")}
        >
          Teacher Access
        </button>
        <button
          className={`AdminTabBtn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-state">Loading data...</div>
        ) : (
          <>
            {(activeTab === "students" || activeTab === "teachers" || activeTab === "access" || activeTab === "sessions") && (
              <div className="admin-search-bar">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder={`Search ${
                      activeTab === "students" ? "students..." : 
                      activeTab === "teachers" || activeTab === "access" ? "teachers..." : 
                      "sessions by name or teacher..."
                    }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button className="search-clear-btn" onClick={() => setSearchTerm("")}>✕</button>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === "students" ? (
          <div className="student-browser-container">
            <div className="browser-path-nav">
              <button className={`path-crumb ${!studentPath.stream ? 'active' : ''}`} onClick={() => setStudentPath({ stream: null, course: null, semester: null, division: null })}>
                All Streams
              </button>
              {studentPath.stream && (
                <>
                  <span className="path-sep">/</span>
                  <button className={`path-crumb ${!studentPath.course ? 'active' : ''}`} onClick={() => handleStudentPath('stream', studentPath.stream)}>
                    {studentPath.stream.name}
                  </button>
                </>
              )}
              {studentPath.course && (
                <>
                  <span className="path-sep">/</span>
                  <button className={`path-crumb ${!studentPath.semester ? 'active' : ''}`} onClick={() => handleStudentPath('course', studentPath.course)}>
                    {studentPath.course.name}
                  </button>
                </>
              )}
              {studentPath.semester && (
                <>
                  <span className="path-sep">/</span>
                  <button className={`path-crumb ${!studentPath.division ? 'active' : ''}`} onClick={() => handleStudentPath('semester', studentPath.semester)}>
                    {studentPath.semester.name}
                  </button>
                </>
              )}
              {studentPath.division && (
                <>
                  <span className="path-sep">/</span>
                  <span className="path-crumb active">{studentPath.division.name}</span>
                </>
              )}
            </div>
            
            {renderStudentHierarchy()}
          </div>
        ) : activeTab === "teachers" ? (
          <div className="student-browser-container">
            <div className="browser-path-nav">
              <button 
                className={`path-crumb ${!teacherPath.stream ? 'active' : ''}`} 
                onClick={() => setTeacherPath({ stream: null, course: null })}
              >
                All Departments
              </button>
              {teacherPath.stream && (
                <>
                  <span className="path-sep">/</span>
                  <button 
                    className={`path-crumb ${!teacherPath.course ? 'active' : ''}`} 
                    onClick={() => handleTeacherPath('stream', teacherPath.stream)}
                  >
                    {teacherPath.stream.name}
                  </button>
                </>
              )}
              {teacherPath.course && (
                <>
                  <span className="path-sep">/</span>
                  <span className="path-crumb active">{teacherPath.course.name}</span>
                </>
              )}
            </div>
            
            {renderTeacherHierarchy()}
          </div>
        ) : activeTab === "academic" ? (
          <div className="admin-academic-container">
             <StreamManager
               structure={academicStructure}
               onRefresh={fetchData}
               token={token}
             />
          </div>
        ) : activeTab === "settings" ? (
          <div className="admin-academic-container">
            <DomainManager token={token} />
          </div>
        ) : activeTab === "access" ? (
          <div className="data-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Email</th>
                  <th>Current Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers
                  .filter(t => 
                    searchTerm === "" || 
                    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    t.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.name}</td>
                      <td>{teacher.email}</td>
                      <td>
                        <div className="access-summary-chips">
                          {(teacher.allowedAccess || []).length > 0 ? (
                            teacher.allowedAccess.slice(0, 2).map((a, i) => (
                              <span key={i} className="access-summary-chip">
                                {a.streamName} - {a.courseName}
                              </span>
                            ))
                          ) : (
                            <span className="no-access-text">No access</span>
                          )}
                          {(teacher.allowedAccess || []).length > 2 && (
                            <span className="access-plus-more">+{teacher.allowedAccess.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button className="access-btn" onClick={() => setSelectedTeacherForAccess(teacher)}>
                          Manage Access
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Session & Subject</th>
                  <th>Academic Group</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Attendees</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .filter(s => 
                    searchTerm === "" || 
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.teacherEmail.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((session) => (
                    <tr key={session.session_id}>
                      <td>{session.teacherName}<br /><small style={{ color: "#888" }}>{session.teacherEmail}</small></td>
                      <td>
                        <strong>{session.name}</strong><br/>
                        <small style={{color: '#818cf8', fontWeight: '600'}}>{session.subjectName}</small>
                      </td>
                      <td>
                        <small>{session.streamName}</small><br/>
                        <small>{session.courseName} - {session.semesterName}</small><br/>
                        <strong style={{fontSize: '11px'}}>Div: {(session.divisions || []).join(", ")}</strong>
                      </td>
                      <td>{new Date(session.date).toLocaleDateString()}</td>
                      <td>{session.time}</td>
                      <td className="session-count-cell">{session.attendance?.length || 0}</td>
                      <td>
                        <button className="del-btn" onClick={() => handleDeleteSession(session.teacherEmail, session.session_id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                {sessions.filter(s => 
                    searchTerm === "" || 
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.teacherEmail.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-message">No sessions found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </div>

      {selectedTeacherForAccess && (
        <TeacherAccessManager
          teacher={selectedTeacherForAccess}
          structure={academicStructure}
          token={token}
          onClose={() => setSelectedTeacherForAccess(null)}
          onRefresh={fetchData}
        />
      )}

      {selectedStudentForStats && (
        <StudentStatsModal
          studentId={selectedStudentForStats}
          token={token}
          onClose={() => setSelectedStudentForStats(null)}
        />
      )}

      {selectedTeacherForHistory && (
        <TeacherSessionsModal
          teacher={selectedTeacherForHistory}
          onClose={() => setSelectedTeacherForHistory(null)}
          onDeleteSession={handleDeleteSession}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
