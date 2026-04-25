import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SHA256 } from "crypto-js";
import axios from "axios";
import "../styles/AdminLogin.css";
import image192 from "../assets/logo192.png";
import see from "../assets/see.png";
import hide from "../assets/hide.png";

axios.defaults.withCredentials = true;

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  function computeHash(input) {
    return SHA256(input).toString();
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    let email = e.target.email.value;
    let password = e.target.password.value;

    if (email.length > 0 && password.length > 0) {
      password = computeHash(password);
      password = computeHash(email + password);
      const formData = {
        email,
        password,
      };
      try {
        const response = await axios.post("/users/signin", formData);
        let user = response.data.user;
        let type = response.data.type;
        let token = response.data.token;
        
        // strict check: only allow admin type
        if (type !== "admin") {
          alert("Access Denied: You do not have administrative privileges.");
          return;
        }

        localStorage.setItem("email", user.email);
        localStorage.setItem("name", user.name);
        localStorage.setItem("pno", user.pno);
        localStorage.setItem("type", type);
        localStorage.setItem("token", token);
        localStorage.setItem("profileImage", user.profileImage || "");
        
        navigate("/admin-dashboard");
      } catch (err) {
        alert("Invalid admin credentials");
        e.target.password.value = "";
      }
    } else {
      alert("Please enter administrative credentials");
    }
  };

  useEffect(() => {
    if (token !== "" && token !== undefined) {
      if (localStorage.getItem("type") === "admin") {
        navigate("/admin-dashboard");
      }
    }
  }, [token, navigate]);

  return (
    <div className="admin-login-main">
      <div className="admin-login-container">
        <div className="admin-login-logo">
          <img alt="Admin Portal Logo" src={image192} />
        </div>
        <div className="admin-login-header">
          <h2>Admin Portal</h2>
          <p>Secure System Access</p>
        </div>
        <form onSubmit={handleLoginSubmit}>
          <input type="email" placeholder="Administrator Email" name="email" required />
          <div className="admin-pass-input-div">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Security Key"
              name="password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <img src={showPassword ? hide : see} alt="toggle password visibility" />
            </button>
          </div>

          <div className="admin-login-buttons">
            <button type="submit">Authenticate</button>
          </div>
        </form>

        <div className="admin-login-footer">
          <a href="/login">&larr; Return to Standard Login</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
