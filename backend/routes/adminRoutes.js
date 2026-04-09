import { Router } from "express";
const router = Router();
import AdminController from "../controllers/AdminController.js";
import JWT from "../middleware/JWT.js";

// ── Existing: Users & Sessions ──────────────────────────────
router.get("/students", JWT.verifyToken, AdminController.GetAllStudents);
router.get("/teachers", JWT.verifyToken, AdminController.GetAllTeachers);
router.delete("/delete/:type/:id", JWT.verifyToken, AdminController.DeleteUser);
router.get("/sessions", JWT.verifyToken, AdminController.GetAllSessions);
router.delete("/session/delete/:teacherEmail/:sessionId", JWT.verifyToken, AdminController.DeleteSession);
router.get("/student/:id/stats", JWT.verifyToken, AdminController.GetStudentStats);

// ── Academic Structure ──────────────────────────────────────
router.get("/academic-structure", JWT.verifyToken, AdminController.GetAcademicStructure);
router.post("/stream/create", JWT.verifyToken, AdminController.CreateStream);
router.post("/stream/:streamId/course", JWT.verifyToken, AdminController.AddCourseToStream);
router.post("/stream/:streamId/course/:courseId/division", JWT.verifyToken, AdminController.AddDivisionToCourse);
router.delete("/stream/:streamId", JWT.verifyToken, AdminController.DeleteStream);
router.delete("/stream/:streamId/course/:courseId", JWT.verifyToken, AdminController.DeleteCourse);
router.delete("/stream/:streamId/course/:courseId/division/:divisionId", JWT.verifyToken, AdminController.DeleteDivision);

// ── Teacher Access Management ───────────────────────────────
router.get("/teacher/:teacherId/access", JWT.verifyToken, AdminController.GetTeacherAccess);
router.post("/teacher/:teacherId/access", JWT.verifyToken, AdminController.GrantTeacherAccess);
router.delete("/teacher/:teacherId/access", JWT.verifyToken, AdminController.RevokeTeacherAccess);

export default router;
