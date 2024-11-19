import React, { useState } from "react";
import AadhaarAuthenticationPage from "./AadhaarAuthenticationPage";
import FaceAuthenticationPage from "./FaceAuthenticationPage";
import ProgressBar from "./ProgressBar";
import "../styles/MainPage.css"

const MainPage = () => {
  const steps = ["Details", "Verification", "OTP", "Face Auth"];
  const [currentStep, setCurrentStep] = useState(1);

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <div>Welcome to the UIDAI Authentication Process!</div>;
      case 1:
        return <AadhaarAuthenticationPage onNext={goToNextStep} stepNum={1} />;
      case 2:
        return <AadhaarAuthenticationPage onNext={goToNextStep} stepNum={2}/>;
      case 3:
        return <FaceAuthenticationPage />;
      default:
        return <div>Process Complete</div>;
    }
  };

  return (
    <div className="main-container">
      <ProgressBar steps={steps} currentStep={currentStep} />
      <div className="step-content">{renderStepContent()}</div>
    </div>
  );
};

export default MainPage;
