import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

function verifyToken(req, res, next) {
  // Try to get token from cookies, Authorization header, or Request Body
  let token = req.cookies.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Access Denied: No token provided. Please log in again." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    res.status(400).json({ message: "Invalid or expired session. Please log in again." });
  }
}

function generateToken(data) {
  // Will generate token using user info and server secret key
  return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "5h" });
}

const JWT = {
  verifyToken,
  generateToken,
};

export default JWT;
