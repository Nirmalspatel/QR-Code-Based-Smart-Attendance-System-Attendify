import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Signup.css";
import axios from "axios";
import image512 from "../assets/logo512.png";
import image192 from "../assets/logo192.png";
import { SHA256 } from "crypto-js";

const ForgotPassword = () => {
  // eslint-disable-next-line
  const [showPassword, setShowPassword] = useState(false);
  // eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [SaveOTP, setOtp] = useState(
    Math.floor(100000 + Math.random() * 900000) || 0
  );
  const navigate = useNavigate();

  function computeHash(input) {
    return SHA256(input).toString();
  }

  const toggleTwo = async (e) => {
    e.preventDefault();
    const email = document.querySelector("input[name=email]").value;
    if (email === "") {
      alert("Please enter your email");
      return;
    }
    try {
      const response = await axios.post("/users/sendmail", { email: email });
      setOtp(response.data.otp);
      document.querySelector(".page1").style.display = "none";
      document.querySelector(".page2").style.display = "block";
    } catch (error) {
      alert("Error sending OTP: " + (error.response?.data?.message || error.message));
    }
  };

  const toggleThree = async (e) => {
    e.preventDefault();
    const otp = document.querySelector("input[name=otp]").value;
    if (otp === "") {
      alert("Please enter OTP");
      return;
    }
    if (parseInt(otp) === parseInt(SaveOTP)) {
      document.querySelector(".page2").style.display = "none";
      document.querySelector(".page3").style.display = "block";
    } else {
      alert("Invalid OTP");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    const cpassword = e.target.cpassword.value;
    const email = e.target.email.value;

    if (!password || !cpassword) {
      alert("Please fill in both password fields");
      return;
    }

    if (password !== cpassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const hashedPassword = computeHash(email + computeHash(password));
      
      const formData = {
        email,
        password: hashedPassword,
      };

      await axios.post("/users/forgotpassword", formData);
      navigate("/login");
    } catch (err) {
      console.error("Reset Password Error:", err);
      alert("Error resetting password: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (token !== "") {
      navigate("/dashboard");
    }
  });

  return (
    <div className="register-main">
      <div className="register-left">
        <img alt="Full" src={image512} />
      </div>
      <div className="register-right">
        <div className="register-right-container">
          <div className="register-logo">
            <img alt="logo" src={image192} />
          </div>
          <div className="register-center">
            <h2>Forgot your Password?</h2>
            <form onSubmit={handleRegisterSubmit}>
              <div className="page1">
                <p>Enter your email to receive an OTP</p>
                <input type="email" placeholder="Email" required name="email" />
                <button type="button" onClick={toggleTwo} className="slide-btn next-btn">
                  Send OTP
                </button>
              </div>
              <div className="page2" style={{ display: "none" }}>
                <p>Verification OTP sent to your email</p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  name="otp"
                  required={true}
                />
                <div className="btn-group">
                   <button type="button" onClick={() => {
                        document.querySelector(".page2").style.display = "none";
                        document.querySelector(".page1").style.display = "block";
                   }} className="slide-btn back-btn">
                     Back
                   </button>
                   <button type="button" onClick={toggleThree} className="slide-btn next-btn">
                     Verify OTP
                   </button>
                </div>
              </div>
              <div className="page3" style={{ display: "none" }}>
                <p>Set a new secure password</p>
                <input
                  type="password"
                  placeholder="New Password"
                  required
                  name="password"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  name="cpassword"
                />
                <div className="btn-group" style={{ marginTop: "15px" }}>
                   <button type="button" onClick={() => {
                        document.querySelector(".page3").style.display = "none";
                        document.querySelector(".page2").style.display = "block";
                   }} className="slide-btn back-btn">
                     Back
                   </button>
                   <button type="submit" className="slide-btn next-btn">
                     Reset Password
                   </button>
                </div>
              </div>
            </form>
          </div>
          <p className="login-bottom-p">
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#76ABAE" }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
