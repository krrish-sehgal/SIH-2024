import React, { useState, useEffect } from 'react';
import { FaceDetection } from './FaceDetection';
import '../styles/UpdateVerificationOverlay.css';
import { useNavigate } from 'react-router-dom';

const UpdateVerificationOverlay = ({ models, onSuccess, onClose }) => {
  const [liveness, setLiveness] = useState(false);
  const [detectionDone, setDetectionDone] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [showRetry, setShowRetry] = useState(false);
    const navigate = useNavigate();
  useEffect(() => {
    if (detectionDone) {
      if (liveness) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setShowRetry(true);
      }
    }
  }, [detectionDone, liveness]);

  const handleRetry = () => {
    setDetectionDone(false);
    setLiveness(false);
    setImageData(null);
    setShowRetry(false);
  };
  useEffect(() => {
    if (liveness && detectionDone) {
      const timeoutId = setTimeout(() => {
        navigate('/clone.html'); 
      }, 2000);
  
      return () => clearTimeout(timeoutId);
    }
  }, [liveness, detectionDone, navigate]);
  return (
    <div className="verification-overlay">
      <div className="overlay-content">
        <button className="close-button" onClick={onClose}>×</button>
        {detectionDone ? (
          <div className="result-message">
            {liveness ? (
              <div className="success-message">
                <h2>Verification Successful!</h2>
                <p>Your changes have been stored successfully</p>

              </div>
            ) : (
              <div className="failure-message">
                <h2>Verification Failed</h2>
                <p>Please make sure you're in a well-lit area and facing the camera directly.</p>
                {showRetry && (
                  <button className="retry-button" onClick={handleRetry}>
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <FaceDetection
            models={models}
            setLiveness={setLiveness}
            setDetectionDone={setDetectionDone}
            setImageData={setImageData}
          />
        )}
      </div>
    </div>
  );
};

export default UpdateVerificationOverlay;
