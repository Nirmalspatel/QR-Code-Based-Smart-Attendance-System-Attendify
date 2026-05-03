//create a nav bar component
import React from "react";
import "../styles/Nav.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UserDetails from "./UserDetails"; // Assuming both files are in the same directory
import logo from "../assets/logo192.png";
import logout from "../assets/logout.png";

const Nav = () => {
  // eslint-disable-next-line
  const [user, setuser] = useState({
    email: localStorage.getItem("email"),
    name: localStorage.getItem("name"),
    pno: localStorage.getItem("pno"),
    dob: localStorage.getItem("dob"),
    profileImage: localStorage.getItem("profileImage"),
  });

  const refresh = () => {
    setuser({
      email: localStorage.getItem("email"),
      name: localStorage.getItem("name"),
      pno: localStorage.getItem("pno"),
      dob: localStorage.getItem("dob"),
      profileImage: localStorage.getItem("profileImage"),
    });
  };

  const location = useLocation();

  useEffect(() => {
    refresh();
  }, [location.pathname]);

  return (
    <div className="nav-container">
      <nav>
        <div className="nav-brand">
          <a href="/" className="brand-link">
            <img style={{ width: "32px", height: "32px" }} src={logo} alt="Home" />
            <span className="brand-text">Attendify</span>
          </a>
        </div>

        <ul className="nav-links">
          <li className="nav-link">
            <a href="/about" className="nav-about-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>About Developer</span>
            </a>
          </li>
        </ul>
        <UserDetails user={user} />
      </nav>
    </div>
  );
};

export default Nav;
