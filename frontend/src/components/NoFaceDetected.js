import React from 'react'
import "../styles/FaceDetection.css"
import "../styles/NoFaceDetected.css"

const NoFaceDetected = (props) => {

    const handleRetry = () => {
        
        props.setDetectionDone(false);
      };
  return (
    <div className="no-face-container">
      <span>Check Your Lighting, Ensure that your face isn't covered and is centered properly.</span>
      <button 
        className="retry-button" 
        onClick={handleRetry}
      >
        Try Again
      </button>
    </div>
  )
}

export default NoFaceDetected