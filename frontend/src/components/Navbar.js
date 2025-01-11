import React from "react";
import { useTranslation } from 'react-i18next';
import "../styles/Navbar.css";

const Navbar = ({ step, totalSteps }) => {
  const { t } = useTranslation();
  const progressPercentage = (step / totalSteps) * 100;

  const gradientStart = "#4D869C";
  const gradientMiddle = "#7AB2B2";
  const gradientEnd = "#CDE8E5";

  return (
    <div>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "white", // Light blue background
          padding: "10px 20px",
          position: "relative",
          borderBottom: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src="emblem.png"
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
          style={{ height: "10vh" }}
        />
      </nav>
      <div
        style={{
          width: "100%",
          height: "5px",
          transition: "background 0.3s ease-in-out",
          background: `linear-gradient(to right, 
          #4D869C ${progressPercentage}%,  
          #CDE8E5 )`,
        }}
      ></div>
    </div>
  );
};

export default Navbar;
