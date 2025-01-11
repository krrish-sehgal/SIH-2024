import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/ProgressBar.css";

const ProgressBar = ({ steps, currentStep }) => {
  const { t } = useTranslation();
  
  if(currentStep === 0){
    return null;
  }
  
  return (
    <div className="progress-bar">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLastStep = index === steps.length - 1;
        
        return (
          <div key={index} className="step-container">
            <div className="step">
              <div className={`circle ${isActive ? "active" : isCompleted ? "completed" : "pending"}`}>
                {index + 1}
              </div>
              <div className="step-title-container">
                <span className="step-title">{t(`progressBar.steps.${step}`)}</span>
              </div>
            </div>
            {!isLastStep && <div className={`line ${isCompleted ? 'completed' : 'pending'}`} />}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBar;
