import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AadhaarAuthenticationPage.css"
const AadhaarAuthenticationPage = (props) => {
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(props.stepNum); // 1: Aadhaar Input, 2: OTP Input
  const navigate = useNavigate();

  const handleAadhaarSubmit = () => {
    
    console.log("Aadhaar submitted:", aadhaar);
    props.onNext(); 
    setStep(2);
  };

  const handleOtpSubmit = () => {
   
    console.log("OTP submitted:", otp);
    props.onNext();
  };
  return (
    <div className="authentication-container">
      {step === 1 ? (
        <div className="aadhaar-step">
          <h2>Aadhaar Authentication</h2>
          <input
            type="text"
            placeholder="Enter Aadhaar Number"
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value)}
            maxLength={12}
            required
          />
          <button onClick={handleAadhaarSubmit}>Submit Aadhaar</button>
        </div>
      ) : (
        <div className="otp-step">
          <h2>OTP Verification</h2>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            required
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={handleOtpSubmit}>Verify OTP</button>
        </div>
      )}
    </div>
  );
};

export default AadhaarAuthenticationPage;
