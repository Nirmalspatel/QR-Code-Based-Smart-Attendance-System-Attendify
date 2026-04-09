import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/UserDetails.css";

const UserDetails = ({ user }) => {
  //eslint-disable-next-line
  const [showUserDetails, setShowUserDetails] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setShowUserDetails(!showUserDetails);
  };

  function getInitials(name) {
    if (!name) return "??";
    const names = name.split(" ");
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="user-details" onClick={toggleDropdown}>
      {user.name ? (
        <div className="user-icon">
          {user.profileImage ? (
            <img 
              src={user.profileImage} 
              alt="Profile" 
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} 
            />
          ) : (
            <h3 style={{ color: "black", fontSize: "15px" }}>
              {getInitials(user.name)}
            </h3>
          )}
        </div>
      ) : (
        <div></div>
      )}
      {showUserDetails && (
        <div className="user-details-container">
          <div className="user-details-popup">
            <div className="user-info-section">
              <p className="user-name">{user.name}</p>
              <p className="user-email">{user.email}</p>
            </div>
            <hr />
            <div className="user-actions">
              <button onClick={() => navigate("/profile")} className="menu-item-btn">
                <span>👤</span> View Profile
              </button>
              <button onClick={() => window.location.href = "/logout"} className="menu-item-btn logout-item">
                <span>🚪</span> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
