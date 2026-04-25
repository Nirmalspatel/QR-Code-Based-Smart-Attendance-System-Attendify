import { Router } from "express";
const router = Router();
import upload from "../middleware/multer.js";
import SessionController from "../controllers/SessionController.js";
import JWT from "../middleware/JWT.js";

// create session
router.post("/create", JWT.verifyToken, SessionController.CreateNewSession);
// subject management
router.post("/subjects/create", JWT.verifyToken, SessionController.CreateSubject);
router.get("/subjects/all", JWT.verifyToken, SessionController.GetSubjects);
router.post("/subjects/delete", JWT.verifyToken, SessionController.DeleteSubject);
// get teacher sessions (now includes subjects)
router.post("/getSessions", JWT.verifyToken, SessionController.GetAllTeacherSessions);
// get QR
router.post("/getQR", JWT.verifyToken, SessionController.GetQR);
// mark attendance
router.post("/attend_session", JWT.verifyToken, upload.single("image"), SessionController.AttendSession);
// student sessions
router.post("/getStudentSessions", JWT.verifyToken, SessionController.GetStudentSessions);
// expire / reopen / delete
router.post("/expireSession", JWT.verifyToken, SessionController.ExpireSession);
router.post("/reopenSession", JWT.verifyToken, SessionController.ReopenSession);
router.post("/deleteSession", JWT.verifyToken, SessionController.DeleteSession);
// teacher's allowed access (for NewSession form)
router.get("/my-access", JWT.verifyToken, SessionController.GetMyAccess);
// full division roster for a session (present + absent)
router.get("/roster/:session_id", JWT.verifyToken, SessionController.GetSessionRoster);

export default router;
