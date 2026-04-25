import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";
import { AcademicStructure } from "../model/AcademicStructure.js";
import { SystemConfig } from "../model/SystemConfig.js";

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
      let count = (teacher.sessions || []).length;
      (teacher.subjects || []).forEach(subj => {
        count += (subj.sessions || []).length;
      });
      const obj = teacher.toObject();
      return {
        ...obj,
        sessionCount: count,
      };
    });
    res.status(200).json(teachersWithCount);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teachers", error: error.message });
  }
}

async function GetAllSessions(req, res) {
  try {
    const teachers = await Teacher.find({}, { subjects: 1, sessions: 1, name: 1, email: 1 });
    let sessions = [];
    teachers.forEach((teacher) => {
      // Legacy sessions
      (teacher.sessions || []).forEach((session) => {
        sessions.push({
          ...session.toObject(),
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          subjectName: "General"
        });
      });
      // Subject-based sessions
      (teacher.subjects || []).forEach((subject) => {
        (subject.sessions || []).forEach((session) => {
          sessions.push({
            ...session.toObject(),
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            subjectName: subject.name
          });
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
    const teacher = await Teacher.findOne({ email: teacherEmail });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    let deleted = false;
    // Try deleting from subjects
    (teacher.subjects || []).forEach(subj => {
      const initialLen = subj.sessions.length;
      subj.sessions = subj.sessions.filter(s => s.session_id !== sessionId);
      if (subj.sessions.length < initialLen) deleted = true;
    });

    // Try deleting from legacy
    if (!deleted) {
      const initialLen = teacher.sessions.length;
      teacher.sessions = teacher.sessions.filter(s => s.session_id !== sessionId);
      if (teacher.sessions.length < initialLen) deleted = true;
    }

    if (deleted) {
      await teacher.save();

      // Cascading delete: Remove session from all students' dashboards
      try {
        await Student.updateMany(
          { "sessions.session_id": sessionId },
          { $pull: { sessions: { session_id: sessionId } } }
        );
      } catch (cascadeErr) {
        console.error("[CASCADE DELETE ERROR] Failed to remove session from students:", cascadeErr.message);
      }

      res.status(200).json({ message: "Session deleted successfully" });
    } else {
      res.status(404).json({ message: "Session not found" });
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
    stream.courses.push({ name, semesters: [] });
    await root.save();
    res.status(201).json({ message: "Course added", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error adding course", error: error.message });
  }
}

async function AddSemesterToCourse(req, res) {
  const { streamId, courseId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Semester name is required" });
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    const course = stream.courses.id(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    course.semesters.push({ name, divisions: [] });
    await root.save();
    res.status(201).json({ message: "Semester added", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error adding semester", error: error.message });
  }
}

async function AddDivisionToSemester(req, res) {
  const { streamId, courseId, semesterId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Division name is required" });
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    const course = stream.courses.id(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const semester = course.semesters.id(semesterId);
    if (!semester) return res.status(404).json({ message: "Semester not found" });
    // Prevent duplicate division names
    const exists = semester.divisions.some((d) => d.name.toLowerCase() === name.toLowerCase());
    if (exists) return res.status(400).json({ message: "Division already exists" });
    semester.divisions.push({ name });
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
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    
    // Clean up teachers' access just in case
    await Teacher.updateMany({}, {
      $pull: { allowedAccess: { streamId: streamId } }
    });

    stream.deleteOne();
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
    
    const course = stream.courses.id(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    // Clean up teachers' access
    await Teacher.updateMany({}, {
      $pull: { allowedAccess: { courseId: courseId } }
    });

    course.deleteOne();
    await root.save();
    res.status(200).json({ message: "Course deleted", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error deleting course", error: error.message });
  }
}

async function DeleteSemester(req, res) {
  const { streamId, courseId, semesterId } = req.params;
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    const course = stream.courses.id(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    const semester = course.semesters.id(semesterId);
    if (!semester) return res.status(404).json({ message: "Semester not found" });

    // Clean up teachers' access
    await Teacher.updateMany({}, {
      $pull: { allowedAccess: { semesterId: semesterId } }
    });

    semester.deleteOne();
    await root.save();
    res.status(200).json({ message: "Semester deleted", structure: root });
  } catch (error) {
    res.status(500).json({ message: "Error deleting semester", error: error.message });
  }
}

async function DeleteDivision(req, res) {
  const { streamId, courseId, semesterId, divisionId } = req.params;
  try {
    const root = await getRoot();
    const stream = root.streams.id(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });
    const course = stream.courses.id(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const semester = course.semesters.id(semesterId);
    if (!semester) return res.status(404).json({ message: "Semester not found" });
    
    const division = semester.divisions.id(divisionId);
    if (!division) return res.status(404).json({ message: "Division not found" });

    division.deleteOne();
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
          a.courseId?.toString() === access.courseId?.toString() &&
          a.semesterId?.toString() === access.semesterId?.toString()
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
          a.courseId?.toString() === courseId?.toString() &&
          a.semesterId?.toString() === req.body.semesterId?.toString()
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
    const teachers = await Teacher.find({}, { subjects: 1, sessions: 1 });
    
    let totalSessionsCount = 0;
    let attendedSessionsCount = 0;
    let sessionHistory = [];

    teachers.forEach((teacher) => {
      // Collect all sessions (legacy + subject-based)
      const allSessions = [];
      (teacher.sessions || []).forEach(s => allSessions.push({ ...s.toObject(), subjectName: "General" }));
      (teacher.subjects || []).forEach(subj => {
        subj.sessions.forEach(s => allSessions.push({ ...s.toObject(), subjectName: subj.name }));
      });

      allSessions.forEach((session) => {
        // Check if this session applies to the student's academic group
        const applies = 
          session.streamId?.toString() === student.streamId?.toString() &&
          session.courseId?.toString() === student.courseId?.toString() &&
          session.semesterId?.toString() === student.semesterId?.toString() &&
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
            subjectName: session.subjectName,
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

// ─────────────────────────────────────────────
// System Config: Allowed Email Domains
// ─────────────────────────────────────────────

async function getConfig() {
  let cfg = await SystemConfig.findOne({ key: "global" });
  if (!cfg) cfg = await SystemConfig.create({ key: "global", allowedDomains: [] });
  return cfg;
}

async function GetDomainSettings(req, res) {
  try {
    const cfg = await getConfig();
    res.status(200).json({ allowedDomains: cfg.allowedDomains });
  } catch (error) {
    res.status(500).json({ message: "Error fetching domain settings", error: error.message });
  }
}

async function AddAllowedDomain(req, res) {
  let { domain } = req.body;
  if (!domain) return res.status(400).json({ message: "Domain is required" });
  // Normalise: strip leading "@" and lowercase
  domain = domain.replace(/^@/, "").toLowerCase().trim();
  if (!domain.includes(".")) return res.status(400).json({ message: "Enter a valid domain (e.g. nirmauni.ac.in)" });
  try {
    const cfg = await getConfig();
    if (cfg.allowedDomains.includes(domain)) {
      return res.status(400).json({ message: "Domain already exists" });
    }
    cfg.allowedDomains.push(domain);
    await cfg.save();
    res.status(200).json({ message: "Domain added", allowedDomains: cfg.allowedDomains });
  } catch (error) {
    res.status(500).json({ message: "Error adding domain", error: error.message });
  }
}

async function RemoveAllowedDomain(req, res) {
  const { domain } = req.params;
  try {
    const cfg = await getConfig();
    const before = cfg.allowedDomains.length;
    cfg.allowedDomains = cfg.allowedDomains.filter((d) => d !== domain);
    if (cfg.allowedDomains.length === before) {
      return res.status(404).json({ message: "Domain not found" });
    }
    await cfg.save();
    res.status(200).json({ message: "Domain removed", allowedDomains: cfg.allowedDomains });
  } catch (error) {
    res.status(500).json({ message: "Error removing domain", error: error.message });
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
  AddSemesterToCourse,
  AddDivisionToSemester,
  DeleteStream,
  DeleteCourse,
  DeleteSemester,
  DeleteDivision,
  // Teacher access
  GrantTeacherAccess,
  RevokeTeacherAccess,
  GetTeacherAccess,
  GetStudentStats,
  // Domain settings
  GetDomainSettings,
  AddAllowedDomain,
  RemoveAllowedDomain,
};

export default AdminController;
