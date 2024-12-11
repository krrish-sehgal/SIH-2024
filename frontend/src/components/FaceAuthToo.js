import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import Webcam from "react-webcam";
import "../styles/FaceAuthenticationPage.css";
import ModelService from "./ModelService";
import Loading from "./Loading";
import FaceDetection from "./FaceDetection";

const FaceAuthToo = (props) => {
  const { t } = useTranslation();
  const webcamRef = useRef(null);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const[keyGenerated,setKeyGenerated]=useState(false);
  const[isLoaded,setIsLoaded]=useState(false);
  const[modelReady,setModelReady]=useState(false);
  const[decryptedModels,setDecryptedModels]=useState(null);
  const[cameraPermission,setCameraPermission]=useState(false);
  const[reVerify,setReVerify]=useState(false);
  const[liveness,setLiveness]=useState(false);
  const[detectionDone,setDetectionDone]=useState(false);
  const[isVerified, setIsVerified] = useState(false);
  const[isVerifying, setIsVerifying] = useState(false);

  // Add this useEffect at the top level of the component
  useEffect(() => {
    checkCameraPermission();
  }, []); // Run once on mount

  // Update the checkCameraPermission function
  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
    } catch (error) {
      console.log(error);
      setCameraPermission(false);
    }
  };

  // Replace the existing handleProceed with this simplified version
  const handleProceed = () => {
    if (!guidelinesAccepted) {
      alert("Please accept the guidelines before proceeding.");
      return;
    }
    
    if (!cameraPermission) {
      alert("Please enable camera access in your browser settings and refresh the page.");
      return;
    }
    
    setShowAuthentication(true);
  };

  // Move verify to useEffect and watch for both detectionDone and liveness
  useEffect(() => {
    if (detectionDone) {
      setIsVerifying(true);
      setReVerify(true);
    }
  }, [detectionDone]);

  return (
    <div className="face-auth-page">
      <ModelService 
        setDecryptedModels={setDecryptedModels} 
        reVerify={reVerify}  
        setIsVerifying={setIsVerifying} 
        setIsVerified={setIsVerified} 
        setReVerify={setReVerify} 
        setModelReady={setModelReady} 
        setKeyGenerated={setKeyGenerated} 
        setIsLoaded={setIsLoaded}
      />
      {!showAuthentication ? (
        <div className="guidelines-box">
          <h2>{t('faceAuth.guidelines.title')}</h2>
          <img
            src={t('faceAuth.guidelines.imagePath')}
            alt={t('faceAuth.guidelines.title')}
            className="guidelines-image"
          />
          <label>
            <input
              type="checkbox"
              checked={guidelinesAccepted} className="guidelinesCheck"
              onChange={() => setGuidelinesAccepted(!guidelinesAccepted)}
            />
            {t('faceAuth.guidelines.checkbox')}
          </label>
          <button onClick={handleProceed}>{t('faceAuth.guidelines.proceed')}</button>
        </div>
      ) : !modelReady ? (
        <Loading/>
      ) : detectionDone ? (
        isVerifying ? (
          <Loading/>
        ) : (
          <div className="auth-result">
            <h2>{isVerified&&liveness ? t('faceAuth.status.real') : t('faceAuth.status.spoof')}</h2>
            <p>{liveness ? t('faceAuth.status.real') : t('faceAuth.status.spoof')}</p>
          </div>
        )
        
      ) : (
        <FaceDetection 
          models={decryptedModels} 
          setDetectionDone={setDetectionDone} 
          setLiveness={setLiveness}
        />
      )}
    </div>
  );
};

export default FaceAuthToo;
