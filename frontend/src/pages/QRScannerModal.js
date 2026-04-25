import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "../styles/StudentDashboard.css";

const QRScannerModal = ({ onClose, onScanSuccess }) => {
  const [error, setError] = useState(null);
  const scannerActive = useRef(false);

  useEffect(() => {
    if (scannerActive.current) return; // Prevent double start in React Strict Mode
    scannerActive.current = true;

    const html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" }, 
      config,
      (decodedText) => {
        html5QrCode.stop().then(() => {
          onScanSuccess(decodedText);
        }).catch((err) => console.log("Failed to stop scanner", err));
      },
      (errorMessage) => {
        // Ignore frame errors
      }
    ).catch((err) => {
      console.error(err);
      setError("Please grant camera permissions to scan.");
    });

    return () => {
      // Cleanup on unmount
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
           html5QrCode.clear();
        }).catch(e => console.error(e));
      }
      scannerActive.current = false;
      const element = document.getElementById("qr-reader");
      if (element) element.innerHTML = "";
    };
  }, [onScanSuccess]);

  return (
    <div className="popup-overlay" style={{ zIndex: 9999 }}>
      <div className="form-popup" style={{ minHeight: "400px", padding: "30px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        <button 
          className="close-btn" 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '25px', 
            background: '#f1f3f5', 
            border: 'none', 
            fontSize: '1.2rem', 
            cursor: 'pointer',
            height: '35px',
            width: '35px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#495057',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#e9ecef'}
          onMouseOut={e => e.currentTarget.style.background = '#f1f3f5'}
        >
          <strong>✕</strong>
        </button>

        <div className="form-popup-inner" style={{ textAlign: "center" }}>
          <div style={{ marginBottom: "25px" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#2b2b2b", marginBottom: "8px", marginTop: "10px" }}>
              Scan Teacher QR Code
            </h2>
            <p style={{ color: "#6c757d", fontSize: "0.95rem" }}>
              Hold your camera steady and point it at the QR code displayed on the teacher's screen to mark your attendance.
            </p>
          </div>
          
          <div style={{ 
            width: "100%", 
            maxWidth: "350px", 
            margin: "0 auto",
            border: "2px dashed #dee2e6",
            borderRadius: "16px",
            padding: "10px",
            backgroundColor: "#f8f9fa",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <div id="qr-reader" style={{ width: "100%", margin: "0", borderRadius: "12px", overflow: "hidden" }}></div>
          </div>
          
          {error && (
            <div style={{ 
              marginTop: "20px", 
              padding: "10px 15px", 
              backgroundColor: "#ffdb58", 
              color: "#3e3e3e", 
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "500"
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
