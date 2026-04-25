import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
  const [userData, setUserData] = useState({
    name: localStorage.getItem("name") || "",
    email: localStorage.getItem("email") || "",
    pno: localStorage.getItem("pno") || "",
    type: localStorage.getItem("type") || "",
    profileImage: localStorage.getItem("profileImage") || "",
    streamId: localStorage.getItem("streamId") || "",
    streamName: localStorage.getItem("streamName") || "",
    courseId: localStorage.getItem("courseId") || "",
    courseName: localStorage.getItem("courseName") || "",
    semesterId: localStorage.getItem("semesterId") || "",
    semesterName: localStorage.getItem("semesterName") || "",
    division: localStorage.getItem("division") || "",
  });
  const [academicStructure, setAcademicStructure] = useState({ streams: [] });
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [tempAcademic, setTempAcademic] = useState({
    streamId: userData.streamId,
    courseId: userData.courseId,
    semesterId: userData.semesterId,
    division: userData.division
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userData.profileImage || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    fetchStructure();
  }, [navigate]);

  const fetchStructure = async () => {
    try {
      const res = await axios.get("/users/academic-structure");
      setAcademicStructure(res.data);
    } catch (err) {
      console.error("Error fetching academic structure", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("name", userData.name);
    formData.append("pno", userData.pno);
    formData.append("email", userData.email);
    formData.append("type", userData.type);
    if (selectedFile) {
      formData.append("profileImage", selectedFile);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("/users/updateprofile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const updatedUser = response.data.user;
        localStorage.setItem("name", updatedUser.name);
        localStorage.setItem("pno", updatedUser.pno);
        if (updatedUser.profileImage) {
          localStorage.setItem("profileImage", updatedUser.profileImage);
          setPreviewUrl(updatedUser.profileImage);
        }
        setMessage("Profile updated successfully!");
        // Redirect to home page
        setTimeout(() => {
          if (userData.type === "student") {
            navigate("/student-dashboard");
          } else if (userData.type === "teacher") {
            navigate("/teacher-dashboard");
          } else if (userData.type === "admin") {
            navigate("/admin-dashboard");
          } else {
            navigate("/");
          }
          window.location.reload(); // Ensure Navbar refreshes with new data
        }, 1500);
        // Refresh local state
        setUserData({
            ...userData,
            name: updatedUser.name,
            pno: updatedUser.pno,
            profileImage: updatedUser.profileImage
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const stream = academicStructure.streams.find(s => s._id === tempAcademic.streamId);
    const course = stream?.courses.find(c => c._id === tempAcademic.courseId);
    const semester = course?.semesters.find(sem => sem._id === tempAcademic.semesterId);

    const updateData = {
      streamId: tempAcademic.streamId,
      streamName: stream?.name || "",
      courseId: tempAcademic.courseId,
      courseName: course?.name || "",
      semesterId: tempAcademic.semesterId,
      semesterName: semester?.name || "",
      division: tempAcademic.division
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put("/users/update-academic", updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setUserData({ ...userData, ...updateData });
        localStorage.setItem("streamId", updateData.streamId);
        localStorage.setItem("streamName", updateData.streamName);
        localStorage.setItem("courseId", updateData.courseId);
        localStorage.setItem("courseName", updateData.courseName);
        localStorage.setItem("semesterId", updateData.semesterId);
        localStorage.setItem("semesterName", updateData.semesterName);
        localStorage.setItem("division", updateData.division);
        setMessage("Academic group updated successfully!");
        setIsEditingAcademic(false);
      }
    } catch (error) {
      console.error("Error updating academic group:", error);
      setMessage(error.response?.data?.message || "Failed to update academic group.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (userData.type === "student") {
      navigate("/student-dashboard");
    } else if (userData.type === "teacher") {
      navigate("/teacher-dashboard");
    } else if (userData.type === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <button type="button" onClick={handleCancel} className="back-arrow-btn" title="Go Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account settings and profile information</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-image-section">
            <div className="image-preview">
              {previewUrl ? (
                <img src={previewUrl.startsWith('http') || previewUrl.startsWith('/uploads') ? previewUrl : previewUrl} alt="Profile" />
              ) : (
                <div className="initials-placeholder">
                   {userData.name.charAt(0)}
                </div>
              )}
            </div>
            <label htmlFor="profile-upload" className="upload-btn">
              Change Photo
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {userData.type !== "admin" && (
            <>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="pno"
                  value={userData.pno}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input type="text" value={userData.type.toUpperCase()} disabled />
          </div>

          {message && (
            <div className={`message ${message.includes("success") ? "success" : "error"}`}>
              {message}
            </div>
          )}

          <div className="profile-actions">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {userData.type === "student" && (
          <div className="academic-profile-section">
            <div className="section-divider"></div>
            <div className="section-header-row">
              <h3>Academic Group</h3>
              {!isEditingAcademic && (
                <button className="edit-academic-btn" onClick={() => setIsEditingAcademic(true)}>
                  Edit
                </button>
              )}
            </div>

            {isEditingAcademic ? (
              <form onSubmit={handleAcademicUpdate} className="academic-edit-form">
                <div className="form-group">
                  <label>Stream</label>
                  <select
                    value={tempAcademic.streamId}
                    onChange={(e) => setTempAcademic({ ...tempAcademic, streamId: e.target.value, courseId: "", semesterId: "", division: "" })}
                    required
                  >
                    <option value="">-- Select Stream --</option>
                    {academicStructure.streams.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Course</label>
                  <select
                    value={tempAcademic.courseId}
                    onChange={(e) => setTempAcademic({ ...tempAcademic, courseId: e.target.value, semesterId: "", division: "" })}
                    disabled={!tempAcademic.streamId}
                    required
                  >
                    <option value="">-- Select Course --</option>
                    {academicStructure.streams.find(s => s._id === tempAcademic.streamId)?.courses.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <select
                    value={tempAcademic.semesterId}
                    onChange={(e) => setTempAcademic({ ...tempAcademic, semesterId: e.target.value, division: "" })}
                    disabled={!tempAcademic.courseId}
                    required
                  >
                    <option value="">-- Select Semester --</option>
                    {academicStructure.streams.find(s => s._id === tempAcademic.streamId)
                      ?.courses.find(c => c._id === tempAcademic.courseId)
                      ?.semesters.map(sem => (
                        <option key={sem._id} value={sem._id}>{sem.name}</option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Division</label>
                  <select
                    value={tempAcademic.division}
                    onChange={(e) => setTempAcademic({ ...tempAcademic, division: e.target.value })}
                    disabled={!tempAcademic.semesterId}
                    required
                  >
                    <option value="">-- Select Division --</option>
                    {academicStructure.streams.find(s => s._id === tempAcademic.streamId)
                      ?.courses.find(c => c._id === tempAcademic.courseId)
                      ?.semesters.find(sem => sem._id === tempAcademic.semesterId)
                      ?.divisions.map(d => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))}
                  </select>
                </div>

                <div className="btn-group">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? "Updating..." : "Save Academic Group"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => {
                    setIsEditingAcademic(false);
                    setTempAcademic({
                      streamId: userData.streamId,
                      courseId: userData.courseId,
                      semesterId: userData.semesterId,
                      division: userData.division
                    });
                  }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="academic-display">
                <div className="display-row">
                  <span className="label">Stream:</span>
                  <span className="value">{userData.streamName || "Not Set"}</span>
                </div>
                <div className="display-row">
                  <span className="label">Course:</span>
                  <span className="value">{userData.courseName || "Not Set"}</span>
                </div>
                <div className="display-row">
                  <span className="label">Semester:</span>
                  <span className="value">{userData.semesterName || "Not Set"}</span>
                </div>
                <div className="display-row">
                  <span className="label">Division:</span>
                  <span className="value">{userData.division || "Not Set"}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
