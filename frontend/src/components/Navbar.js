import React from "react";
import { useTranslation } from 'react-i18next';
import "../styles/Navbar.css";

const Navbar = ({ step, totalSteps }) => {
  const { t } = useTranslation();
  const progressPercentage = (step / totalSteps) * 100;

  const gradientStart = "#041759";
  const gradientMiddle = "#19AAD7";
  const gradientEnd = "#19AAD7";

  return (
    <div>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "white", // Light blue background
          padding: "8px 16px",  // Reduced padding
          position: "relative",
          borderBottom: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="emblem.png"
            alt="Government Emblem"
            style={{ height: "8vh", marginRight: "8px" }}  // Reduced height and margin
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
              {t('navbar.title')}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#666",
              }}
            >
              {t('navbar.subtitle')}
            </p>
          </div>
        </div>
        <img
          src="aadhaar-logo.png"
          alt="Aadhaar Logo"
          style={{ height: "8vh" }}  // Reduced height
        />
      </nav>
      <div
        style={{
          width: "100%",
          height: "10px",
          transition: "background 0.3s ease-in-out",
          background: `linear-gradient(to right, 
          #041759 ${progressPercentage}%,  
          #19AAD7 )`,
        }}
      ></div>
    </div>
  );
};

export default Navbar;
