import React from "react";
import "../styles/ProgressBar.css";

const ProgressBar = ({ steps, currentStep }) => {
  return (
    <div className="progress-bar">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        return (
          <div key={index} className="step">
            <div
              className={`circle ${
                isActive ? "active" : isCompleted ? "completed" : "pending"
              }`}
            >
              {index + 1}
            </div>
            <span className="step-title">{step}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressBar;
