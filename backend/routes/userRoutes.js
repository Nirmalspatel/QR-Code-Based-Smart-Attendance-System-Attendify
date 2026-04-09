import { Router } from "express";
const router = Router();
import UserController from "../controllers/UserController.js";
import upload from "../middleware/Multer.js";
import JWT from "../middleware/JWT.js";

// login & signup
router.post("/signin", UserController.Login);
router.post("/signup", UserController.Signup);
// forgot password
router.post("/forgotpassword", UserController.ForgotPassword);
// send OTP mail
router.post("/sendmail", UserController.SendMail);
// update profile (name, photo, pno)
router.post("/updateprofile", JWT.verifyToken, upload.single("profileImage"), UserController.UpdateProfile);
// public: academic structure for signup dropdowns (no auth required)
router.get("/academic-structure", UserController.GetPublicAcademicStructure);
// student: update academic group (stream/course/division) — auth required
router.put("/update-academic", JWT.verifyToken, UserController.UpdateAcademicGroup);

export default router;
