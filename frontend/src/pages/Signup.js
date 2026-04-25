import React, { useEffect, useState } from "react";
import "../styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image512 from "../assets/logo512.png";
import image192 from "../assets/logo192.png";
import { SHA256 } from "crypto-js";
import see from "../assets/see.png";
import hide from "../assets/hide.png";

const Signup = () => {
  // eslint-disable-next-line
  const [showPassword, setShowPassword] = useState(false);
  // eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [SaveOTP, setOtp] = useState(
    Math.floor(100000 + Math.random() * 900000) || 0
  );
  const [userType, setUserType] = useState('student');
  const [academicStructure, setAcademicStructure] = useState({ streams: [] });
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const res = await axios.get("/users/academic-structure");
        setAcademicStructure(res.data);
      } catch (err) {
        console.error("Error fetching academic structure", err);
      }
    };
    fetchStructure();
  }, []);

  function computeHash(input) {
    return SHA256(input).toString();
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    let name = e.target.name.value;
    let pno = e.target.pno.value;
    let email = e.target.email.value;
    let type = e.target.type.value;
    let regno = e.target.regno ? e.target.regno.value : null;
    let password = e.target.password.value;
    let confirmPassword = e.target.confirmPassword.value;

    if (password.length > 0 && confirmPassword.length > 0) {
      if (password === confirmPassword) {
        password = computeHash(password);
        //add email to the password to make it unique
        password = computeHash(email + password);
        const formData = {
          name,
          email,
          password,
          pno,
          type,
          regno,
          streamId: type === 'student' ? selectedStreamId : null,
          streamName: type === 'student' ? academicStructure.streams.find(s => s._id === selectedStreamId)?.name : "",
          courseId: type === 'student' ? selectedCourseId : null,
          courseName: type === 'student' ? academicStructure.streams.find(s => s._id === selectedStreamId)?.courses.find(c => c._id === selectedCourseId)?.name : "",
          semesterId: type === 'student' ? selectedSemesterId : null,
          semesterName: type === 'student' ? academicStructure.streams.find(s => s._id === selectedStreamId)?.courses.find(c => c._id === selectedCourseId)?.semesters.find(sem => sem._id === selectedSemesterId)?.name : "",
          division: type === 'student' ? selectedDivision : "",
        };
        try {
          await axios.post("/users/signup", formData);
          navigate("/login");
        } catch (err) {
          console.log(err);
        }
      } else {
        alert("Passwords do not match");
      }
    } else {
      alert("Please fill all the fields");
    }
  };

  const toggleOne = () => {
    document.querySelector(".first-slide").style.display = "block";
    document.querySelector(".second-slide").style.display = "none";
    document.querySelector(".third-slide").style.display = "none";
    document.querySelector(".fourth-slide").style.display = "none";
  };

  const toggleTwo = async () => {
    let name = document.querySelector("input[name='name']").value;
    let email = document.querySelector("input[name='email']").value;
    let regnoInput = document.querySelector("input[name='regno']");

    if (name.length === 0 || email.length === 0 || (regnoInput && regnoInput.value.length === 0)) {
      alert("Please fill all the fields");
      return;
    }

    if (userType === 'student') {
      if (!selectedStreamId || !selectedCourseId || !selectedSemesterId || !selectedDivision) {
        alert("Please select your stream, course, semester and division");
        return;
      }
    }

    document.querySelector(".first-slide").style.display = "none";
      document.querySelector(".second-slide").style.display = "block";
      document.querySelector(".third-slide").style.display = "none";
      document.querySelector(".fourth-slide").style.display = "none";

    await axios
      .post("/users/sendmail", {
        email: email,
      })
      .then((res) => {
        setOtp(res.data.otp);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const toggleThree = () => {
    //check if the otp is correct and then move to the next slide
    let otp = document.querySelector("input[name='otp']").value;
    if (otp.length === 0) {
      alert("Please Enter OTP");
    } else {
      if (parseInt(otp) === parseInt(SaveOTP)) {
        document.querySelector(".first-slide").style.display = "none";
        document.querySelector(".second-slide").style.display = "none";
        document.querySelector(".third-slide").style.display = "block";
        document.querySelector(".fourth-slide").style.display = "none";
      } else {
        alert("Invalid OTP");
      }
    }
  };

  const toggleFour = () => {
    let pno = document.querySelector("input[name='pno']").value;
    if (pno.length === 0) {
      alert("Please fill all the fields");
    } else {
      document.querySelector(".first-slide").style.display = "none";
      document.querySelector(".second-slide").style.display = "none";
      document.querySelector(".third-slide").style.display = "none";
      document.querySelector(".fourth-slide").style.display = "block";
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
            <h2>Welcome to our website!</h2>
            <p>Please enter your details</p>
            <form onSubmit={handleRegisterSubmit}>
              <div className="first-slide">
                <select name="type" id="type" onChange={(e) => setUserType(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <input
                  type="text"
                  placeholder="Name"
                  name="name"
                  required={true}
                />
                {userType === 'student' && (
                  <input
                    type="text"
                    placeholder="RegNo / Roll No"
                    name="regno"
                    required={true}
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  required={true}
                />

                {userType === 'student' && (
                  <>
                    <select 
                      name="stream" 
                      value={selectedStreamId} 
                      onChange={(e) => { setSelectedStreamId(e.target.value); setSelectedCourseId(""); setSelectedSemesterId(""); setSelectedDivision(""); }}
                      required
                    >
                      <option value="">-- Select Stream --</option>
                      {academicStructure.streams.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>

                    {selectedStreamId && (
                      <select 
                        name="course" 
                        value={selectedCourseId} 
                        onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedSemesterId(""); setSelectedDivision(""); }}
                        required
                      >
                        <option value="">-- Select Course --</option>
                        {academicStructure.streams.find(s => s._id === selectedStreamId)?.courses.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    )}

                    {selectedCourseId && (
                      <select 
                        name="semester" 
                        value={selectedSemesterId} 
                        onChange={(e) => { setSelectedSemesterId(e.target.value); setSelectedDivision(""); }}
                        required
                      >
                        <option value="">-- Select Semester --</option>
                        {academicStructure.streams.find(s => s._id === selectedStreamId)
                          ?.courses.find(c => c._id === selectedCourseId)
                          ?.semesters.map(sem => (
                            <option key={sem._id} value={sem._id}>{sem.name}</option>
                          ))}
                      </select>
                    )}

                    {selectedSemesterId && (
                      <select 
                        name="division" 
                        value={selectedDivision} 
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        required
                      >
                        <option value="">-- Select Division --</option>
                        {academicStructure.streams.find(s => s._id === selectedStreamId)
                          ?.courses.find(c => c._id === selectedCourseId)
                          ?.semesters.find(sem => sem._id === selectedSemesterId)
                          ?.divisions.map(d => (
                            <option key={d._id} value={d.name}>{d.name}</option>
                          ))}
                      </select>
                    )}
                  </>
                )}

                <button type="button" onClick={toggleTwo} className="slide-btn next-btn">
                  Next
                </button>
              </div>
              <div className="second-slide" style={{ display: "none" }}>
                <input
                  type="text"
                  placeholder="OTP"
                  name="otp"
                  required={true}
                />
                <div className="btn-group">
                  <button type="button" onClick={toggleOne} className="slide-btn back-btn">
                    Edit Email
                  </button>
                  <button type="button" onClick={toggleThree} className="slide-btn next-btn">
                    Submit
                  </button>
                </div>
              </div>
              <div className="third-slide" style={{ display: "none" }}>
                <input
                  type="text"
                  placeholder="Phone"
                  name="pno"
                  required={true}
                />
                <div className="btn-group">
                  <button type="button" onClick={toggleOne} className="slide-btn back-btn">
                    Back
                  </button>
                  <button type="button" onClick={toggleFour} className="slide-btn next-btn">
                    Next
                  </button>
                </div>
              </div>
              <div className="fourth-slide" style={{ display: "none" }}>
                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    name="password"
                    required={true}
                  />
                  {showPassword ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(false);
                      }}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="hide" src={hide} alt="hide" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(true);
                      }}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="see" src={see} alt="see" />
                    </button>
                  )}
                </div>
                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    required={true}
                  />
                  {showPassword ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(false);
                      }}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="hide" src={hide} alt="hide" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(true);
                      }}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="see" src={see} alt="see" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleThree}
                  className="slide-btn back-btn"
                  style={{ width: "100%", marginBottom: "15px" }}
                >
                  Back
                </button>
                <div className="register-center-buttons">
                  <button type="submit">Sign Up</button>
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

export default Signup;
