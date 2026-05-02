import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as faceapi from "@vladmandic/face-api";
import "../styles/FaceRegistration.css";

const FaceRegistrationModal = ({ onClose, onSuccess }) => {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Loading AI models...");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + "/models";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoading(false);
        setStatusText("Models loaded. Please face the camera directly.");
        startCamera();
      } catch (err) {
        console.error("Error loading face-api models", err);
        setStatusText("Error loading models. Please try again later.");
      }
    };
    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setStatusText("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const startRegistration = async () => {
    if (isModelLoading) return;
    setIsRegistering(true);
    const descriptors = [];
    
    try {
      for (let i = 0; i < 3; i++) {
        setStatusText(`Capturing photo ${i + 1} of 3... Ensure your face is clear.`);
        
        // Wait a bit to let the user adjust
        await delay(1500);

        if (!videoRef.current || videoRef.current.videoWidth === 0) {
          setStatusText("Camera not ready. Please wait...");
          await delay(1000);
          continue;
        }

        // Draw current video frame to a canvas to ensure stable detection
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const detection = await faceapi.detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptors.push(Array.from(detection.descriptor));
          setProgress(((i + 1) / 3) * 100);
        } else {
          setStatusText("No face detected! Please ensure proper lighting and face the camera directly.");
          setIsRegistering(false);
          return;
        }
      }

      setStatusText("Processing and saving...");
      
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/users/save-face-descriptors",
        { descriptors },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStatusText("Face Registration Complete!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      console.error("Registration error:", err);
      setStatusText("An error occurred during registration.");
      setIsRegistering(false);
    }
  };

  return (
    <div className="face-reg-overlay">
      <div className="face-reg-modal">
        <div className="face-reg-header">
          <h3>Face ID Setup</h3>
          <p>We need to securely capture 3 photos of your face to verify your identity during attendance.</p>
        </div>

        <div className={`face-reg-camera-container ${isRegistering ? "scanning" : ""}`}>
          <div className="scan-line"></div>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="face-reg-video"
          />
        </div>

        <div className={`face-reg-status ${statusText.includes("error") || statusText.includes("No face") ? "error" : statusText.includes("Complete") ? "success" : ""}`}>
          {statusText}
        </div>

        <div className="face-reg-progress-bar">
          <div className="face-reg-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="face-reg-actions">
          <button 
            className="btn-primary-pro"
            onClick={startRegistration} 
            disabled={isModelLoading || isRegistering}
          >
            {isRegistering ? "Scanning..." : isModelLoading ? "Loading AI..." : "Start Setup"}
          </button>
          <button 
            className="btn-secondary-pro"
            onClick={onClose}
            disabled={isRegistering}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistrationModal;
