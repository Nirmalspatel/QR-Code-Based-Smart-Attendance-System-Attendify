import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";
import { AcademicStructure } from "../model/AcademicStructure.js";

// ─────────────────────────────────────────────
// Existing: Users & Sessions
// ─────────────────────────────────────────────

async function GetAllStudents(req, res) {
  try {
    const students = await Student.find({}, { password: 0 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
}

async function GetAllTeachers(req, res) {
  try {
    const teachers = await Teacher.find({}, { password: 0 });
    const teachersWithCount = teachers.map((teacher) => {
      const obj = teacher.toObject();
      return {
        ...obj,
        sessionCount: teacher.sessions.length,
      };
    });
    res.status(200).json(teachersWithCount);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers", error: error.message });
  }
}

async function GetAllSessions(req, res) {
  try {
    const teachers = await Teacher.find({}, { sessions: 1, name: 1, email: 1 });
    let sessions = [];
    teachers.forEach((teacher) => {
      teacher.sessions.forEach((session) => {
        sessions.push({
          ...session.toObject(),
          teacherName: teacher.name,
          teacherEmail: teacher.email,
        });
      });
    });
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sessions", error: error.message });
  }
}

async function DeleteUser(req, res) {
  const { id, type } = req.params;
  try {
    if (type === "student") {
      await Student.findByIdAndDelete(id);
      res.status(200).json({ message: "Student deleted successfully" });
    } else if (type === "teacher") {
      await Teacher.findByIdAndDelete(id);
      res.status(200).json({ message: "Teacher deleted successfully" });
    } else {
      res.status(400).json({ message: "Invalid user type" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
}

async function DeleteSession(req, res) {
  const { teacherEmail, sessionId } = req.params;
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { email: teacherEmail },
      { $pull: { sessions: { session_id: sessionId } } },
      { new: true }
    );
    if (teacher) {
      res.status(200).json({ message: "Session deleted successfully" });
    } else {
      res.status(404).json({ message: "Teacher not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting session", error: error.message });
  }
}

// ─────────────────────────────────────────────
// NEW: Academic Structure CRUD
// ─────────────────────────────────────────────

// Helper: get or create the single institution root document
async function getRoot() {
  let root = await AcademicStructure.findOne();
  if (!root) {
    root = await AcademicStructure.create({ streams: [] });
  }
  return root;
}

async function GetAcademicStructure(req, res) {
  try {
    const root = await getRoot();
    res.status(200).json(root);
  } catch (error) {
    res.status(500).json({ message: "Error fetching academic structure", error: error.message });
  }
}

async function CreateStream(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Stream name is required" });
  try {
    const root = await getRoot();
    root.streams.push({ name, courses: [] });
    await root.save();
    res.status(201).json({ message: "Stream created", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error creating stream", error: error.message });
  }
}

async function AddCourseToStream(req, res) {
  const { streamId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Course name is required" });
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    stream.courses.push({ name, divisions: [] });
    await root.save();
    res.status(201).json({ message: "Course added", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error adding course", error: error.message });
  }
}

async function AddDivisionToCourse(req, res) {
  const { streamId, courseId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Division name is required" });
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    const course = stream.courses.id(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    // Prevent duplicate division names
    const exists = course.divisions.some((d) => d.name.toLowerCase() === name.toLowerCase());
    if (exists) return res.status(400).json({ message: "Division already exists" });
    course.divisions.push({ name });
    await root.save();
    res.status(201).json({ message: "Division added", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error adding division", error: error.message });
  }
}

async function DeleteStream(req, res) {
  const { streamId } = req.params;
  try {
    const root = await getRoot();
    root.streams.pull({ _id: streamId });
    await root.save();
    res.status(200).json({ message: "Stream deleted", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error deleting stream", error: error.message });
  }
}

async function DeleteCourse(req, res) {
  const { streamId, courseId } = req.params;
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    stream.courses.pull({ _id: courseId });
    await root.save();
    res.status(200).json({ message: "Course deleted", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error: error.message });
  }
}

async function DeleteDivision(req, res) {
  const { streamId, courseId, divisionId } = req.params;
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    const course = stream.courses.id(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.divisions.pull({ _id: divisionId });
    await root.save();
    res.status(200).json({ message: "Division deleted", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error deleting division", error: error.message });
  }
}

// ─────────────────────────────────────────────
// NEW: Teacher Access Management
// ─────────────────────────────────────────────

// Grant teacher access to multiple stream+course pairs at once
// Body: { accesses: [{ streamId, streamName, courseId, courseName }] }
async function GrantTeacherAccess(req, res) {
  const { teacherId } = req.params;
  const { accesses } = req.body; // array of { streamId, streamName, courseId, courseName }
  if (!accesses || !Array.isArray(accesses) || accesses.length === 0) {
    return res.status(400).json({ message: "Provide at least one access entry" });
  }
  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    for (const access of accesses) {
      // Avoid duplicate entries
      const duplicate = teacher.allowedAccess.some(
        (a) =>
          a.streamId?.toString() === access.streamId?.toString() &&
          a.courseId?.toString() === access.courseId?.toString()
      );
      if (!duplicate) {
        teacher.allowedAccess.push(access);
      }
    }
    await teacher.save();
    res.status(200).json({ message: "Access granted", allowedAccess: teacher.allowedAccess });
  } catch (error) {
    res.status(500).json({ message: "Error granting access", error: error.message });
  }
}

// Revoke one specific stream+course access from a teacher
// Body: { streamId, courseId }
async function RevokeTeacherAccess(req, res) {
  const { teacherId } = req.params;
  const { streamId, courseId } = req.body;
  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    teacher.allowedAccess = teacher.allowedAccess.filter(
      (a) =>
        !(
          a.streamId?.toString() === streamId?.toString() &&
          a.courseId?.toString() === courseId?.toString()
        )
    );
    await teacher.save();
    res.status(200).json({ message: "Access revoked", allowedAccess: teacher.allowedAccess });
  } catch (error) {
    res.status(500).json({ message: "Error revoking access", error: error.message });
  }
}

async function GetTeacherAccess(req, res) {
  const { teacherId } = req.params;
  try {
    const teacher = await Teacher.findById(teacherId, { allowedAccess: 1, name: 1, email: 1 });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json({ allowedAccess: teacher.allowedAccess });
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher access", error: error.message });
  }
}

async function GetStudentStats(req, res) {
  const { id } = req.params;
  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Find all teachers
    const teachers = await Teacher.find({}, { sessions: 1 });
    
    let totalSessionsCount = 0;
    let attendedSessionsCount = 0;
    let sessionHistory = [];

    teachers.forEach((teacher) => {
      teacher.sessions.forEach((session) => {
        // Check if this session applies to the student's academic group
        const applies = 
          session.streamId?.toString() === student.streamId?.toString() &&
          session.courseId?.toString() === student.courseId?.toString() &&
          (session.divisions || []).includes(student.division);

        if (applies) {
          totalSessionsCount++;
          const attendanceRecord = session.attendance.find(
            (a) => a.student_email === student.email || a.regno === student.regno
          );
          
          if (attendanceRecord) {
            attendedSessionsCount++;
          }

          sessionHistory.push({
            session_id: session.session_id,
            name: session.name,
            date: session.date,
            attended: !!attendanceRecord,
          });
        }
      });
    });

    // Sort history by date descending
    sessionHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    const percentage = totalSessionsCount > 0 
      ? ((attendedSessionsCount / totalSessionsCount) * 100).toFixed(2) 
      : 0;

    res.status(200).json({
      total: totalSessionsCount,
      attended: attendedSessionsCount,
      absent: totalSessionsCount - attendedSessionsCount,
      percentage: parseFloat(percentage),
      history: sessionHistory,
      student: {
        name: student.name,
        regno: student.regno,
        streamName: student.streamName,
        courseName: student.courseName,
        division: student.division,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating student stats", error: error.message });
  }
}

const AdminController = {
  // Existing
  GetAllStudents,
  GetAllTeachers,
  GetAllSessions,
  DeleteUser,
  DeleteSession,
  // Academic structure
  GetAcademicStructure,
  CreateStream,
  AddCourseToStream,
  AddDivisionToCourse,
  DeleteStream,
  DeleteCourse,
  DeleteDivision,
  // Teacher access
  GrantTeacherAccess,
  RevokeTeacherAccess,
  GetTeacherAccess,
  GetStudentStats,
};

export default AdminController;
