import React from "react";
import "../styles/ProgressBar.css";

const ProgressBar = ({ steps, currentStep }) => {
  if(currentStep === 0){
    return null
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
              <div
                className={`circle ${
                  isActive ? "active" : isCompleted ? "completed" : "pending"
                }`}
              >
                {index + 1}
              </div>
              <span className="step-title">{step}</span>
            </div>
            {!isLastStep && <div className={`line ${isCompleted ? 'completed' : 'pending'}`} />}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBar;
