import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";
import { Admin } from "../model/Admin.js";
import { AcademicStructure } from "../model/AcademicStructure.js";
import JWT from "../middleware/JWT.js";
import uploadImage from "../middleware/Cloudinary.js";

//login
async function Login(req, res) {
  const { email, password } = req.body;
  let type = "student";
  //check if user is a student
  let user = await Student.findOne({ email });
  if (!user) {
    type = "teacher";
    user = await Teacher.findOne({ email });
  }
  if (!user) {
    type = "admin";
    user = await Admin.findOne({ email });
  }

  if (user) {
    if (user.password === password) {
      const token = JWT.generateToken({ email: user.email });
      user.type = type;
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        .status(200)
        .json({ user: user, type: type, token: token });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } else {
    res.status(400).json({ message: "No such User" });
  }
}
// Create a new user
async function Signup(req, res) {
  const { name, email, pno, password, type, regno } = req.body;
  if (type === "student") {
    const user = new Student({
      name,
      email,
      pno,
      regno,
      password,
      streamId: req.body.streamId || null,
      streamName: req.body.streamName || "",
      courseId: req.body.courseId || null,
      courseName: req.body.courseName || "",
      division: req.body.division || "",
    });
    try {
      const existingUser = await Student.findOne({ email: email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        const newUser = await user.save();
        res.status(201).json(newUser);
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else if (type === "teacher") {
    const user = new Teacher({
      name: name,
      email: email,
      pno: pno,
      password: password,
    });
    try {
      const existingUser = await Teacher.findOne({ email: email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        const newUser = await user.save();
        res.status(201).json(newUser);
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else if (type === "admin") {
    const user = new Admin({
      name: name,
      email: email,
      pno: pno,
      password: password,
    });
    try {
      const existingUser = await Admin.findOne({ email: email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      } else {
        const newUser = await user.save();
        res.status(201).json(newUser);
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

// Public: return academic structure for signup dropdowns (no auth)
async function GetPublicAcademicStructure(req, res) {
  try {
    let root = await AcademicStructure.findOne();
    if (!root) root = { streams: [] };
    res.status(200).json(root);
  } catch (error) {
    res.status(500).json({ message: "Error fetching academic structure", error: error.message });
  }
}

// Student: update their academic grouping (stream/course/division)
async function UpdateAcademicGroup(req, res) {
  try {
    const tokenData = req.user;
    const { streamId, streamName, courseId, courseName, division } = req.body;

    const student = await Student.findOneAndUpdate(
      { email: tokenData.email },
      { streamId, streamName, courseId, courseName, division },
      { new: true }
    );

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json({
      message: "Academic group updated successfully",
      student: {
        streamId: student.streamId,
        streamName: student.streamName,
        courseId: student.courseId,
        courseName: student.courseName,
        division: student.division,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating academic group", error: error.message });
  }
}
//change password
async function ForgotPassword(req, res) {
  const { email, password } = req.body;
  //check if user is a student
  let user = await Student.findOneAndUpdate({ email }, { password }).exec();
  if (!user) {
    user = await Teacher.findOneAndUpdate({ email }, { password }).exec();
  }
  if (!user) {
    user = await Admin.findOneAndUpdate({ email }, { password }).exec();
  }
  if (user) {
    res.status(200).json({ message: "Password changed successfully" });
  } else {
    res.status(400).json({ message: "No such User" });
  }
}

//edit user details
async function EditUserDetails(req, res) {
  const { email, name, pno } = req.body;
  //check if user is a student
  let user = await Student.findOneAndUpdate({ email }, { name, pno }).exec();
  if (!user) {
    user = await Teacher.findOneAndUpdate({ email }, { name, pno }).exec();
  }
  if (!user) {
    user = await Admin.findOneAndUpdate({ email }, { name, pno }).exec();
  }
  if (user) {
    res.status(200).json({ message: "User updated" });
  }
}

// Update user profile (Photo, name, pno)
async function UpdateProfile(req, res) {
  const { email, name, pno, type } = req.body;
  let profileImage = "";

  if (req.file) {
    try {
      profileImage = await uploadImage(req.file.filename);
    } catch (err) {
      return res.status(500).json({ message: "Error uploading profile image to cloud", error: err.message });
    }
  }

  try {
    let user;
    const updateData = { name, pno };
    if (profileImage) {
      updateData.profileImage = profileImage;
    }

    if (type === "student") {
      user = await Student.findOneAndUpdate({ email }, updateData, { new: true }).exec();
    } else if (type === "teacher") {
      user = await Teacher.findOneAndUpdate({ email }, updateData, { new: true }).exec();
    } else if (type === "admin") {
      user = await Admin.findOneAndUpdate({ email }, updateData, { new: true }).exec();
    }

    if (user) {
      res.status(200).json({ message: "Profile updated successfully", user });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
}

//send mail
function SendMail(req, res) {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Atendo Verification Code",
    text: `Your OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("SMTP Error:", error.message);
      let errorMessage = error.message;
      if (error.message.includes("Invalid login") || error.message.includes("535")) {
        errorMessage = "SMTP Authentication Error: Please ensure you are using a Gmail App Password, not your regular password. See https://support.google.com/mail/?p=BadCredentials";
      }
      res.status(400).json({ message: errorMessage });
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).json({ message: "OTP sent successfully", otp: otp });
    }
  });
}

const UserController = {
  Login,
  Signup,
  ForgotPassword,
  EditUserDetails,
  UpdateProfile,
  SendMail,
  GetPublicAcademicStructure,
  UpdateAcademicGroup,
};

export default UserController;
