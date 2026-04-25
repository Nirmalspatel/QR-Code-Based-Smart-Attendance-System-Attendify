import querystring from "querystring";
import { Teacher } from "../model/Teacher.js";
import { Student } from "../model/Student.js";
import uploadImage from "../middleware/cloudinary.js";
import { AcademicStructure } from "../model/AcademicStructure.js";
import { getIO } from "../socket.js";

function getQR(session_id, email, name, date, location) {
  // Debug log to verify environmental sync
  console.log("[DEBUG] Generating QR with CLIENT_URL:", process.env.CLIENT_URL);
  
  let url = `${process.env.CLIENT_URL}/login?${querystring.stringify({
    session_id,
    email,
    name,
    date,
    location,
  })}`;
  return url;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  return distance;
}
function checkStudentDistance(Location1, Location2) {
  Location1 = Location1.split(",");
  Location2 = Location2.split(",");
  const locationLat1 = parseFloat(Location1[0]);
  const locationLon1 = parseFloat(Location1[1]);
  const locationLat2 = parseFloat(Location2[0]);
  const locationLon2 = parseFloat(Location2[1]);

  const distance = haversineDistance(
    locationLat1,
    locationLon1,
    locationLat2,
    locationLon2
  );
  return distance.toFixed(2);
}

//make controller functions

async function CreateSubject(req, res) {
  try {
    const { name, code } = req.body;
    const tokenData = req.user;
    
    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Invalid token data. Please log in again." });
    }

    const teacher = await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $push: { subjects: { name, code, sessions: [] } } },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher account not found." });
    }

    res.status(200).json({ 
      message: "Subject created successfully", 
      subjects: teacher.subjects 
    });
  } catch (err) {
    console.error("Error creating subject:", err);
    res.status(400).json({ message: err.message });
  }
}

async function GetSubjects(req, res) {
  try {
    const tokenData = req.user;
    if (!tokenData || !tokenData.email) {
      return res.status(401).json({ message: "Invalid token. Please log in again." });
    }

    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }
    
    // Auto-migration for legacy sessions
    if (teacher.sessions && teacher.sessions.length > 0 && (!teacher.subjects || teacher.subjects.length === 0)) {
      teacher.subjects.push({
        name: "General",
        code: "GEN",
        sessions: teacher.sessions
      });
      teacher.sessions = [];
      await teacher.save();
    }

    res.status(200).json({ subjects: teacher.subjects });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function DeleteSubject(req, res) {
  try {
    const { subject_id } = req.body;
    const tokenData = req.user;
    await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $pull: { subjects: { _id: subject_id } } }
    );
    res.status(200).json({ message: "Subject deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function CreateNewSession(req, res) {
  let {
    subject_id, session_id, name, duration, location, radius, date, time, 
    streamId, streamName, courseId, courseName, semesterId, semesterName, divisions,
  } = req.body;
  let tokenData = req.user;

  let newSession = {
    session_id,
    date,
    time,
    name,
    duration,
    location,
    radius,
    streamId: streamId || null,
    streamName: streamName || "",
    courseId: courseId || null,
    courseName: courseName || "",
    semesterId: semesterId || null,
    semesterName: semesterName || "",
    divisions: Array.isArray(divisions) ? divisions : (divisions ? [divisions] : []),
  };

  try {
    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    let targetSubject;
    if (subject_id) {
      targetSubject = teacher.subjects.id(subject_id);
    } else {
      targetSubject = teacher.subjects.find(s => s.name === "General");
      if (!targetSubject) {
        teacher.subjects.push({ name: "General", sessions: [] });
        await teacher.save();
        targetSubject = teacher.subjects[teacher.subjects.length - 1];
      }
    }

    if (!targetSubject) return res.status(404).json({ message: "Subject not found" });

    // Use atomic update to ensure persistency and avoid race conditions or subdoc tracking issues
    const updateResult = await Teacher.findOneAndUpdate(
      { _id: teacher._id, "subjects._id": targetSubject._id },
      { $push: { "subjects.$.sessions": newSession } },
      { new: true }
    );

    if (!updateResult) {
       console.error(`[SESSION ERROR] Failed to perform atomic push for teacher ${teacher.email}`);
       return res.status(500).json({ message: "Failed to save session to database" });
    }

    console.log(`[SESSION SUCCESS] Created session "${name}" for teacher ${teacher.email} in subject "${targetSubject.name}"`);

    // Emit real-time event
    try {
      getIO().emit("session-created", {
        teacher: teacher.email,
        session_name: name,
        date
      });
    } catch (socketErr) {
      console.error("[SOCKET ERROR] Failed to emit session-created event:", socketErr.message);
    }

    res.status(200).json({
      url: getQR(session_id, teacher.email, name, date, location),
      message: "Session created successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
//get sessions
async function GetAllTeacherSessions(req, res) {
  try {
    let tokenData = req.user;
    const teacher = await Teacher.findOne({ email: tokenData.email });
    
    // Auto-migration for legacy sessions on main dashboard load
    if (teacher.sessions && teacher.sessions.length > 0 && (!teacher.subjects || teacher.subjects.length === 0)) {
      teacher.subjects.push({
        name: "General",
        code: "GEN",
        sessions: teacher.sessions
      });
      teacher.sessions = [];
      await teacher.save();
    }

    res.status(200).json({ subjects: teacher.subjects });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
//get QR
async function GetQR(req, res) {
  try {
    let tokenData = req.user;
    const { session_id } = req.body;

    // Fetch session details so they can be embedded in the QR URL
    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Search through all subjects for the session
    let session = null;
    let foundSubject = null;
    for (const subj of teacher.subjects) {
      session = subj.sessions.find(s => s.session_id === session_id);
      if (session) {
        foundSubject = subj;
        break;
      }
    }

    // Check legacy sessions too
    if (!session) {
      session = teacher.sessions.find(s => s.session_id === session_id);
    }

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const url = getQR(
      session_id,
      tokenData.email,
      session.name,
      session.date,
      session.location
    );
    res.status(200).json({ url });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

//attend session
async function AttendSession(req, res) {
  const tokenData = req.user;
  const { session_id, teacher_email, IP, student_email, Location, date } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Photo is required for attendance" });
  }
  const imageName = req.file.filename;

  try {
    const teacher = await Teacher.findOne({ email: teacher_email });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    let session = null;
    let foundSubject = null;
    for (const subj of teacher.subjects) {
      session = subj.sessions.find(s => s.session_id === session_id);
      if (session) {
        foundSubject = subj;
        break;
      }
    }

    // Check legacy sessions
    if (!session) {
      session = teacher.sessions.find(s => s.session_id === session_id);
    }

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if QR is expired
    if (session.isExpired) {
      return res.status(403).json({ message: "Attendance is closed for this session" });
    }

    const studentInfo = await Student.findOne({ email: tokenData.email });
    if (!studentInfo) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if the student belongs to the required stream/course/semester/division for this session
    if (session.streamId || session.courseId || session.semesterId || (session.divisions && session.divisions.length > 0)) {
      if (session.streamId && String(session.streamId) !== String(studentInfo.streamId || "")) {
        return res.status(403).json({ message: "Access denied. You do not belong to the stream for this session." });
      }
      if (session.courseId && String(session.courseId) !== String(studentInfo.courseId || "")) {
        return res.status(403).json({ message: "Access denied. You do not belong to the course for this session." });
      }
      if (session.semesterId && String(session.semesterId) !== String(studentInfo.semesterId || "")) {
        return res.status(403).json({ message: "Access denied. You do not belong to the semester for this session." });
      }
      if (session.divisions && session.divisions.length > 0) {
        if (!studentInfo.division || !session.divisions.includes(studentInfo.division)) {
          return res.status(403).json({ message: `Access denied. This session is restricted to division(s): ${session.divisions.join(", ")}. Your division: ${studentInfo.division || "Not Set"}` });
        }
      }
    }

    const student_name = studentInfo.name || "Unknown";
    const regno = studentInfo.regno || "Not Provided";

    // Check if already marked
    const alreadyMarked = session.attendance.some(a => a.regno === regno || a.student_email === student_email);
    if (alreadyMarked) {
      return res.status(200).json({ message: "Attendance already marked" });
    }

    const distance = checkStudentDistance(Location, session.location);
    console.log(`[GEO DEBUG] Session: ${session.name}`);
    console.log(`[GEO DEBUG] Teacher Loc: ${session.location}`);
    console.log(`[GEO DEBUG] Student Loc: ${Location}`);
    console.log(`[GEO DEBUG] Calculated Dist: ${distance} meters`);
    
    // Optional: Add radius check here if required
    
    // Upload image to Cloudinary
    const imageUrl = await uploadImage(imageName);

    // Use server-side timestamp for accuracy and security
    const currentTimestamp = new Date().toISOString();

    const attendanceEntry = {
      regno,
      student_name,
      image: imageUrl,
      date: currentTimestamp,
      IP,
      student_email: tokenData.email,
      Location,
      distance,
    };

    const session_details = {
      session_id: session.session_id,
      subjectName: foundSubject ? foundSubject.name : "General",
      teacher_email: teacher.email,
      name: session.name,
      date: currentTimestamp,
      time: session.time,
      duration: session.duration,
      distance: distance,
      radius: session.radius,
      student_location: Location, // Matches schema field name
      image: imageUrl,
    };

    // Update Teacher Sessions (Attendance)
    // We need to find the session again to update it within the array correctly
    let updated = false;
    for (const subj of teacher.subjects) {
      const sIndex = subj.sessions.findIndex(s => s.session_id === session_id);
      if (sIndex !== -1) {
        subj.sessions[sIndex].attendance.push(attendanceEntry);
        updated = true;
        break;
      }
    }
    
    if (!updated) {
       const sIndex = teacher.sessions.findIndex(s => s.session_id === session_id);
       if (sIndex !== -1) {
         teacher.sessions[sIndex].attendance.push(attendanceEntry);
       }
    }

    await teacher.save();

    await Student.findOneAndUpdate(
      { email: student_email },
      { $push: { sessions: session_details } }
    );

    // Emit real-time event
    try {
      const io = getIO();
      // Notify the teacher's specific room
      io.to(teacher.email).emit("attendance-marked", {
        session_id,
        student_name,
        regno,
        date: currentTimestamp
      });
      // Also notify admins
      io.emit("admin-activity", { type: "attendance", teacher: teacher.email, session: session.name });
    } catch (socketErr) {
      console.error("[SOCKET ERROR] Failed to emit attendance event:", socketErr.message);
    }

    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (err) {
    console.error("AttendSession Error:", err);
    res.status(400).json({ message: err.message });
  }
}

//get student sessions
async function GetStudentSessions(req, res) {
  let tokenData = req.user;
  try {
    const student = await Student.findOne({
      email: tokenData.email,
    });
    res.status(200).json({ sessions: student.sessions });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// expire QR / close attendance
async function ExpireSession(req, res) {
  try {
    let tokenData = req.user;
    const { session_id } = req.body;

    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    let updated = false;
    for (const subj of teacher.subjects) {
      const sIndex = subj.sessions.findIndex(s => s.session_id === session_id);
      if (sIndex !== -1) {
        subj.sessions[sIndex].isExpired = true;
        updated = true;
        break;
      }
    }

    if (!updated) {
      const sIndex = teacher.sessions.findIndex(s => s.session_id === session_id);
      if (sIndex !== -1) {
        teacher.sessions[sIndex].isExpired = true;
        updated = true;
      }
    }

    await teacher.save();

    res.status(200).json({ message: "Session attendance closed successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// re-open QR / re-enable attendance
async function ReopenSession(req, res) {
  try {
    let tokenData = req.user;
    const { session_id } = req.body;

    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    let updated = false;
    for (const subj of teacher.subjects) {
      const sIndex = subj.sessions.findIndex(s => s.session_id === session_id);
      if (sIndex !== -1) {
        subj.sessions[sIndex].isExpired = false;
        updated = true;
        break;
      }
    }

    if (!updated) {
      const sIndex = teacher.sessions.findIndex(s => s.session_id === session_id);
      if (sIndex !== -1) {
        teacher.sessions[sIndex].isExpired = false;
        updated = true;
      }
    }

    await teacher.save();

    res.status(200).json({ message: "Session attendance re-opened successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get the logged-in teacher's allowedAccess list
async function GetMyAccess(req, res) {
  try {
    const tokenData = req.user;
    const teacher = await Teacher.findOne(
      { email: tokenData.email },
      { allowedAccess: 1 }
    );
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json({ allowedAccess: teacher.allowedAccess || [] });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get the full division roster (all students in division) merged with attendance data
async function GetSessionRoster(req, res) {
  try {
    const tokenData = req.user;
    const { session_id } = req.params;

    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    let session = null;
    for (const subj of teacher.subjects) {
       session = subj.sessions.find((s) => s.session_id === session_id);
       if (session) break;
    }
    
    if (!session) {
      session = teacher.sessions.find((s) => s.session_id === session_id);
    }

    if (!session) return res.status(404).json({ message: "Session not found" });

    const { streamId, courseId, semesterId, divisions } = session;

    // If session has no academic context attached, return only attendance list
    if (!streamId || !courseId || !semesterId || !divisions || divisions.length === 0) {
      return res.status(200).json({
        roster: session.attendance.map((a) => ({
          regno: a.regno,
          student_name: a.student_name,
          student_email: a.student_email,
          division: "",
          attended: true,
          attendance: a,
        })),
      });
    }

    // Fetch all students belonging to this stream+course+semester+divisions
    const allStudents = await Student.find(
      {
        streamId: streamId,
        courseId: courseId,
        semesterId: semesterId,
        division: { $in: divisions },
      },
      { password: 0 }
    );

    // Merge with attendance data
    const roster = allStudents.map((student) => {
      const attendanceRecord = session.attendance.find(
        (a) =>
          a.student_email === student.email || a.regno === student.regno
      );
      return {
        regno: student.regno,
        student_name: student.name,
        student_email: student.email,
        division: student.division,
        attended: !!attendanceRecord,
        attendance: attendanceRecord || null,
      };
    });

    // Append any attendees NOT in student DB (edge case)
    session.attendance.forEach((a) => {
      const found = roster.find(
        (r) => r.student_email === a.student_email || r.regno === a.regno
      );
      if (!found) {
        roster.push({
          regno: a.regno,
          student_name: a.student_name,
          student_email: a.student_email,
          division: "",
          attended: true,
          attendance: a,
        });
      }
    });

    // Sort: attended first, then alphabetically
    roster.sort((a, b) => {
      if (a.attended !== b.attended) return b.attended - a.attended;
      return a.student_name.localeCompare(b.student_name);
    });

    res.status(200).json({ roster, session });
  } catch (err) {
    console.error("GetSessionRoster Error:", err);
    res.status(400).json({ message: err.message });
  }
}

const SessionController = {
  CreateSubject,
  GetSubjects,
  DeleteSubject,
  CreateNewSession,
  GetAllTeacherSessions,
  GetQR,
  AttendSession,
  GetStudentSessions,
  ExpireSession,
  ReopenSession,
  DeleteSession,
  GetMyAccess,
  GetSessionRoster,
};

export default SessionController;

// delete session
async function DeleteSession(req, res) {
  try {
    let tokenData = req.user;
    const { session_id } = req.body;

    const teacher = await Teacher.findOne({ email: tokenData.email });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Try deleting from subjects
    let deleted = false;
    for (const subj of teacher.subjects) {
      const initialLen = subj.sessions.length;
      subj.sessions = subj.sessions.filter(s => s.session_id !== session_id);
      if (subj.sessions.length < initialLen) {
        deleted = true;
        break;
      }
    }

    // Try deleting from legacy sessions
    if (!deleted) {
      teacher.sessions = teacher.sessions.filter(s => s.session_id !== session_id);
    }

    await teacher.save();

    // Cascading delete: Remove session from all students' dashboards
    try {
      await Student.updateMany(
        { "sessions.session_id": session_id },
        { $pull: { sessions: { session_id: session_id } } }
      );
    } catch (cascadeErr) {
      console.error("[CASCADE DELETE ERROR] Failed to remove session from students:", cascadeErr.message);
    }

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
