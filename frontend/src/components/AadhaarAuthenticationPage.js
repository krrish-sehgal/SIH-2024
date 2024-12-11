import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next"; // Add this import
import "../styles/AadhaarAuthenticationPage.css";

const AadhaarAuthenticationPage = (props) => {
  const { t } = useTranslation(); // Add this hook
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(props.stepNum);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();
  const [otpValues, setOtpValues] = useState(new Array(6).fill(""));
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()));
  const recaptchaRef = useRef(null);
  const [captchaReady, setCaptchaReady] = useState(false);

  const validateAadhaar = (aadhaar) => {
    return /^\d{12}$/.test(aadhaar);
  };

  useEffect(() => {
    // Validate site key immediately
    const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error('reCAPTCHA site key is missing');
      return;
    }

    const initializeCaptcha = () => {
      if (!window.grecaptcha) {
        setTimeout(initializeCaptcha, 1000);
        return;
      }

      try {
        if (!document.getElementById('recaptcha-element')) {
          console.error('reCAPTCHA element not found');
          return;
        }

        window.grecaptcha.ready(() => {
          window.grecaptcha.render('recaptcha-element', {
            sitekey: siteKey,
            callback: (response) => {
              setIsVerified(true);
              setError("");
            }
          });
          setCaptchaReady(true);
        });
      } catch (error) {
        console.error("reCAPTCHA initialization error:", error);
      }
    };

    // Start initialization process
    initializeCaptcha();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleAadhaarSubmit = () => {
    setError("");
    if (!validateAadhaar(aadhaar)) {
      setError(t("aadhaar.error.invalid"));
      return;
    }
    if (!isVerified) {
      setError(t("aadhaar.error.captcha"));
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
      setError(t("aadhaar.error.otp"));
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
          <h2>{t("aadhaar.title")}</h2>
          <input
            type="text"
            placeholder={t("aadhaar.input")}
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value)}
            maxLength={12}
            required
          />
          <div className="recaptcha-container">
            {!captchaReady && <div>Loading reCAPTCHA...</div>}
            <div id="recaptcha-element" ref={recaptchaRef}></div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button 
            onClick={handleAadhaarSubmit}
            disabled={isLoading || !isVerified}
          >
            {isLoading ? t("aadhaar.verifying") : t("aadhaar.submit")}
          </button>
        </div>
      ) : (
        <div className="otp-step">
          <h2>{t("aadhaar.otpTitle")}</h2>
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
            {isLoading ? t("aadhaar.verifying") : t("aadhaar.verifyOtp")}
          </button>
        </div>
      )}
    </div>
  );
};

export default AadhaarAuthenticationPage;
