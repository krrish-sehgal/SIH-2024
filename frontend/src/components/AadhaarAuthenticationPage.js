import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AadhaarAuthenticationPage.css"

const AadhaarAuthenticationPage = (props) => {
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(props.stepNum);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [otpValues, setOtpValues] = useState(new Array(6).fill(""));
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()));

  const validateAadhaar = (aadhaar) => {
    return /^\d{12}$/.test(aadhaar);
  };

  const handleAadhaarSubmit = () => {
    setError("");
    if (!validateAadhaar(aadhaar)) {
      setError("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    setStep(2);
    props.onNext();
    
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    setOtp(newOtpValues.join(""));

    // Move to next input if value is entered
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === "Backspace" && index > 0 && otpValues[index] === "") {
      otpRefs.current[index - 1].current.focus();
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(process.env.REACT_APP_AUTHURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aadhaarNumber: aadhaar, 
          otp 
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.message === "Login successful") {
        sessionStorage.setItem('user', JSON.stringify(data.user));
        props.onNext();
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setIsLoading(false);
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
          {error && <div className="error-message">{error}</div>}
          <button 
            onClick={handleAadhaarSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Submit Aadhaar"}
          </button>
        </div>
      ) : (
        <div className="otp-step">
          <h2>OTP Verification</h2>
          <div className="otp-input-container">
            {otpValues.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={value}
                ref={otpRefs.current[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
              />
            ))}
            
            
          </div>
          {error && <div className="error-message">{`${error}`}</div>}
          <button 
            onClick={handleOtpSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AadhaarAuthenticationPage;
