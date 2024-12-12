import React, { useState } from "react";
import AadhaarAuthenticationPage from "./AadhaarAuthenticationPage";

import FaceAuthToo from "./FaceAuthToo";
import ProgressBar from "./ProgressBar";
import "../styles/MainPage.css"
import Navbar from "./Navbar";

import LanguageSwitcher from "./LanguageSwitcher";

const MainPage = () => {
  const steps = ["Language", "Verification", "OTP", "Face Auth"];
  const [currentStep, setCurrentStep] = useState(1);

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <LanguageSwitcher onNext={goToNextStep} />;
      case 1:
        return <AadhaarAuthenticationPage onNext={goToNextStep} stepNum={1} />;
      case 2:
        return <AadhaarAuthenticationPage onNext={goToNextStep} stepNum={2}/>;
      case 3:
        return <FaceAuthToo />;
      default:
        return <div>Process Complete</div>;
    }
  };

  return (
    <div className="main-container">
      
      <Navbar  step={currentStep} totalSteps={4}/>
      <ProgressBar steps={["aadhaar", "otp", "face", "complete"]} currentStep={currentStep} />
      <div className="step-content">{renderStepContent()}</div>
    </div>
  );
};

export default MainPage;
