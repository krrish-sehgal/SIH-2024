import React from "react";
import "../styles/Navbar.css";
const Navbar = ({ step, totalSteps }) => {
  // Calculate the width percentage of the progress bar
  const progressPercentage = (step / totalSteps) * 100;

  // Define gradient colors
  const gradientStart = "#4D869C"; // Starting color of the progress bar
  const gradientMiddle = "#7AB2B2"; // Color up to the current step
  const gradientEnd = "#CDE8E5"; // Remaining part color

  return (
    
    <div>
      <nav
        style={{
          
          display: "flex",
      
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#E8F4FB", // Light blue background
          padding: "10px 20px",
          position: "relative", // For the progress bar
          borderBottom: "none", // No default border
        }}
      >
        {/* Left Logo and Text */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="emblem.png" // Replace with your logo URL
            alt="Government Emblem"
            style={{ height: "10vh", marginRight: "10px" }}
          />
          <div>
            <h1
              style={{
              
                margin: 0,
                fontSize: "18px",
                color: "#333",
                fontWeight: "bold",
              }}
            >
              Unique Identification Authority of India
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#666",
              }}
            >
              Government of India
            </p>
          </div>
        </div>

        {/* Right Logo */}
        <img
          src="aadhaar-logo.png" // Replace with your Aadhaar logo URL
          alt="Aadhaar Logo"
          style={{ height: "10vh" }}
        />
      </nav>
      {/* Progress Bar */}
      <div
        style={{
          width: "100%",
          height: "5px", // Height of the progress bar
          
          transition: "background 0.3s ease-in-out",
          background: `linear-gradient(to right, 
          #4D869C ${progressPercentage}%,  
          #CDE8E5 )`, // Smooth transition for gradient changes
        }}
      ></div>
    </div>
  );
};

export default Navbar;
