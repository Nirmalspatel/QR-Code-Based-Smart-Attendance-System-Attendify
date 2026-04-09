import querystring from "querystring";
import { Teacher } from "../model/Teacher.js";
import { Student } from "../model/Student.js";
import uploadImage from "../middleware/Cloudinary.js";
import { AcademicStructure } from "../model/AcademicStructure.js";

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

async function CreateNewSession(req, res) {
  let {
    session_id, name, duration, location, radius, date, time, token,
    streamId, streamName, courseId, courseName, divisions,
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
    divisions: Array.isArray(divisions) ? divisions : (divisions ? [divisions] : []),
  };

  try {
    let teacher = await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $push: { sessions: newSession } }
    );

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
    res.status(200).json({ sessions: teacher.sessions });
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

    const session = teacher.sessions.find(s => s.session_id === session_id);
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

    const sessionIndex = teacher.sessions.findIndex(s => s.session_id === session_id);
    if (sessionIndex === -1) {
      return res.status(404).json({ message: "Session not found" });
    }

    const session = teacher.sessions[sessionIndex];

    // Check if QR is expired
    if (session.isExpired) {
      return res.status(403).json({ message: "Attendance is closed for this session" });
    }

    const studentInfo = await Student.findOne({ email: tokenData.email });
    const student_name = studentInfo ? studentInfo.name : "Unknown";
    const regno = studentInfo && studentInfo.regno ? studentInfo.regno : "Not Provided";

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
    teacher.sessions[sessionIndex].attendance.push(attendanceEntry);
    await teacher.save();

    // Update Student Sessions
    await Student.findOneAndUpdate(
      { email: student_email },
      { $push: { sessions: session_details } }
    );

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

    const sessionIndex = teacher.sessions.findIndex(s => s.session_id === session_id);
    if (sessionIndex === -1) {
      return res.status(404).json({ message: "Session not found" });
    }

    teacher.sessions[sessionIndex].isExpired = true;
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

    const sessionIndex = teacher.sessions.findIndex(s => s.session_id === session_id);
    if (sessionIndex === -1) {
      return res.status(404).json({ message: "Session not found" });
    }

    teacher.sessions[sessionIndex].isExpired = false;
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

    const session = teacher.sessions.find((s) => s.session_id === session_id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const { streamId, courseId, divisions } = session;

    // If session has no academic context attached, return only attendance list
    if (!streamId || !courseId || !divisions || divisions.length === 0) {
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

    // Fetch all students belonging to this stream+course+divisions
    const allStudents = await Student.find(
      {
        streamId: streamId,
        courseId: courseId,
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

    const teacher = await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $pull: { sessions: { session_id } } },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
