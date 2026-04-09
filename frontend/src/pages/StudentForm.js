//create a new session component
import React, { useState, useRef } from "react";
import axios from "axios";
import "../styles/StudentForm.css";

const StudentForm = ({ togglePopup }) => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [image, setImage] = useState({ contentType: "", data: "" });
  const [photoData, setPhotoData] = useState(""); // To store the captured photo data
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);

  const constraints = {
    video: true,
  };
  const startCamera = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Camera access is not available. Browsers block camera access on non-secure connections (HTTP) for IP addresses.\n\n" +
        "Try using 'localhost' or use a tool like ngrok for HTTPS testing."
      );
      return;
    }
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        alert("Could not access camera. Please ensure you have granted permissions.");
      });
  };
  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  };
  const capturePhoto = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL("image/png");

    setImage(await fetch(photoDataUrl).then((res) => res.blob()));

    setPhotoData(photoDataUrl);
    stopCamera();
  };
  const ResetCamera = () => {
    setPhotoData("");
    startCamera();
  };

  const AttendSession = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!photoData) {
      alert("Please capture a photo first");
      return;
    }

    setIsLoading(true);
    console.log("Attending session...");
    
    // Get user IP address (optional, backend can also get it)
    let IP = "Unknown";
    try {
      axios.defaults.withCredentials = false;
      const res = await axios.get("https://api64.ipify.org?format=json", { timeout: 3000 });
      IP = res.data.ip;
    } catch (ipErr) {
      console.warn("Could not fetch external IP:", ipErr.message);
    } finally {
      axios.defaults.withCredentials = true;
    }

    if (navigator.geolocation) {
      console.log("Requesting geolocation...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log("Position obtained:", position.coords);
          const { latitude, longitude } = position.coords;
          let locationString = `${latitude},${longitude}`;

          const data = new FormData();
          data.append("session_id", localStorage.getItem("session_id"));
          data.append("teacher_email", localStorage.getItem("teacher_email"));
          data.append("IP", IP);
          data.append("date", new Date().toISOString());
          data.append("Location", locationString);
          data.append("student_email", localStorage.getItem("email"));
          data.append("image", image, "attendance.png"); // image is a Blob

          try {
            console.log("Submitting attendance...");
            const response = await axios.post(
              "/sessions/attend_session",
              data,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            console.log("Submission success:", response.data);
            setIsLoading(false);
            document.querySelector(
              ".form-popup-inner"
            ).innerHTML = `<h5>${response.data.message}</h5>`;
          } catch (err) {
            console.error("Submission failed:", err);
            setIsLoading(false);
            alert("Error: " + (err.response?.data?.message || err.message));
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoading(false);
          alert("Location error: " + error.message + ". Please ensure location is enabled and permissions are granted.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="form-popup">
      <button onClick={togglePopup}>
        <strong>X</strong>
      </button>
      <div className="form-popup-inner">
        <h5>Enter Your Details</h5>
        {!photoData && <video ref={videoRef} width={300} autoPlay={true} />}
        {photoData && <img src={photoData} width={300} alt="Captured" />}
        <div className="cam-btn">
          <button onClick={startCamera}>Start Camera</button>
          <button onClick={capturePhoto}>Capture</button>
          <button onClick={ResetCamera}>Reset</button>
        </div>

        <form onSubmit={AttendSession}>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Done"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
