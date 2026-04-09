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
        <ul className="nav-links">
          <li className="nav-link">
            <a href="/">
              <img style={{ width: "30px" }} src={logo} alt="Home" />
            </a>
          </li>
        </ul>
        <UserDetails user={user} />
      </nav>
    </div>
  );
};

export default Nav;
