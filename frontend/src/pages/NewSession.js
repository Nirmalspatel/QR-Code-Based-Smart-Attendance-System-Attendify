//create a new session component
import React, { useState } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import "../styles/NewSession.css";

const NewSession = ({ togglePopup, onSessionCreated }) => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [qrtoggle, setQrtoggle] = useState(false);
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(false);

  // New academic state
  const [allowedAccess, setAllowedAccess] = useState([]);
  const [academicStructure, setAcademicStructure] = useState({ streams: [] });
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDivisions, setSelectedDivisions] = useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [accessRes, structureRes] = await Promise.all([
          axios.get("/sessions/my-access", config),
          axios.get("/users/academic-structure")
        ]);
        setAllowedAccess(accessRes.data.allowedAccess || []);
        setAcademicStructure(structureRes.data);
      } catch (err) {
        console.error("Error fetching access data", err);
      }
    };
    fetchData();
  }, [token]);

  // Derived data
  const filteredStreams = academicStructure.streams.filter(s => 
    allowedAccess.some(a => a.streamId === s._id)
  );

  const filteredCourses = (academicStructure.streams.find(s => s._id === selectedStreamId)?.courses || []).filter(c => 
    allowedAccess.some(a => a.streamId === selectedStreamId && a.courseId === c._id)
  );

  const availableDivisions = academicStructure.streams.find(s => s._id === selectedStreamId)
    ?.courses.find(c => c._id === selectedCourseId)?.divisions || [];

  const handleDivisionChange = (divName) => {
    setSelectedDivisions(prev => 
      prev.includes(divName) ? prev.filter(d => d !== divName) : [...prev, divName]
    );
  };

  const createQR = async (e) => {
    e.preventDefault();
    setLoading(true);
    //create a 16 digit UUID
    const uuid = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
          var r = (Math.random() * 16) | 0,
            v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    };
    let session_id = uuid();

    let name = e.target.name.value;
    let date = new Date();
    //get the date in the format yyyy-mm-dd
    date = date.toISOString().split("T")[0];
    let time = e.target.time.value;
    let duration = e.target.duration.value;
    let radius = e.target.radius.value;
    //get the current location
    let location = "";

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude},${longitude}`;
          location = locationString.length > 0 ? locationString : "0,0";
          if (name.length > 0 && duration.length > 0) {
            if (!selectedStreamId || !selectedCourseId || selectedDivisions.length === 0) {
              alert("Please select Stream, Course and at least one Division");
              setLoading(false);
              return;
            }

            const stream = academicStructure.streams.find(s => s._id === selectedStreamId);
            const course = stream?.courses.find(c => c._id === selectedCourseId);

            const formData = {
              token,
              session_id,
              date,
              time,
              name,
              duration,
              location,
              radius,
              streamId: selectedStreamId,
              streamName: stream?.name || "",
              courseId: selectedCourseId,
              courseName: course?.name || "",
              divisions: selectedDivisions
            };
            try {
              const response = await axios.post(
                "/sessions/create",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setQrData(response.data.url);
              setQrtoggle(true);
              if (onSessionCreated) onSessionCreated();
            } catch (err) {
              console.log("Error creating session");
              console.log(err);
            } finally {
              setLoading(false);
            }
          } else {
            alert("Please fill all the fields");
            setLoading(false);
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      alert("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  };

  const copyQR = () => {
    navigator.clipboard.writeText(qrData);
  };

  return (
    <div className="new-session-modal">
      <div className="modal-header">
        <div className="title-section">
          <h2>Create New Session</h2>
          <span className="subtitle">Set up a geo-fenced attendance point</span>
        </div>
        <button onClick={togglePopup} className="btn-close" title="Close">
          ✕
        </button>
      </div>

      {!qrtoggle ? (
        <form onSubmit={createQR} className="modal-body scrollable-content">
          <div className="form-group">
            <label className="label">Session Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Mathematics Lecture"
              autoComplete="off"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Duration (Minutes)</label>
              <input
                type="number"
                name="duration"
                placeholder="60"
                autoComplete="off"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Session Time</label>
              <input
                type="time"
                name="time"
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Academic Group</label>
            <div className="academic-selection-grid">
              <select 
                value={selectedStreamId} 
                onChange={(e) => { setSelectedStreamId(e.target.value); setSelectedCourseId(""); setSelectedDivisions([]); }}
                required
              >
                <option value="">-- Select Stream --</option>
                {filteredStreams.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>

              <select 
                value={selectedCourseId} 
                onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedDivisions([]); }}
                disabled={!selectedStreamId}
                required
              >
                <option value="">-- Select Course --</option>
                {filteredCourses.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedCourseId && (
            <div className="form-group">
              <label className="label">Select Divisions</label>
              <div className="division-checkboxes">
                {availableDivisions.map(d => (
                  <label key={d._id} className="div-check-label">
                    <input 
                      type="checkbox" 
                      checked={selectedDivisions.includes(d.name)}
                      onChange={() => handleDivisionChange(d.name)}
                    />
                    <span>{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="label">Allowed Radius</label>
            <div className="select-wrapper">
              <select name="radius" id="radius">
                <option value="50">50 meters (Standard)</option>
                <option value="100">100 meters</option>
                <option value="200">200 meters</option>
                <option value="500">500 meters</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-create">
              {loading ? "Initializing..." : "Create Session Now"}
            </button>
          </div>
        </form>
      ) : (
        <div className="modal-body qr-success-state">
          <div className="success-header">
            <div className="success-icon">✅</div>
            <h3>Session Created!</h3>
            <p>Scan or share this QR code with your students.</p>
          </div>
          
          <div className="qr-display-box">
             <QRCode value={qrData} onClick={copyQR} size={220} />
          </div>

          <div className="qr-actions">
            <button onClick={copyQR} className="btn-secondary">🔗 Copy Link</button>
            <button onClick={togglePopup} className="btn-create">Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSession;
