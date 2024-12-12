import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "../styles/FaceAuthenticationPage.css";
import ModelService from "./ModelService.js";
import Loading from "./Loading";
import { FaceDetection } from "./FaceDetection";
import NoFaceDetected from "./NoFaceDetected.js";
import { useTranslation } from "react-i18next";

const FaceAuthToo = (props) => {
  const { t, i18n } = useTranslation(); // Add i18n
  const webcamRef = useRef(null);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const[keyGenerated,setKeyGenerated]=useState(false);
  const[imageData,setImageData]=useState(null);
  const[isLoaded,setIsLoaded]=useState(false);
  const[modelReady,setModelReady]=useState(false);
  const[decryptedModels,setDecryptedModels]=useState(null);
  const[cameraPermission,setCameraPermission]=useState(false);
  const[reVerify,setReVerify]=useState(false);
  const[liveness,setLiveness]=useState(false);
  const[detectionDone,setDetectionDone]=useState(false);
  const[isVerified, setIsVerified] = useState(false);
  const[isVerifying, setIsVerifying] = useState(false);
  const[faceVerified, setFaceVerified] = useState(false);
  const[verificationComplete, setVerificationComplete] = useState(false);

  // Add this useEffect at the top level of the component
  useEffect(() => {
    checkCameraPermission();
  }, []); // Run once on mount

  const verifyUserImage = async (imageData) => {
    try {
      const userData = JSON.parse(sessionStorage.getItem('user'));
      if (!userData || !userData.aadhaarNumber) {
        console.error('No aadhaar number found in session');
        return false;
      }

      // Remove the data URI prefix if present
      const cleanImageData = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      console.log(cleanImageData)
      const response = await fetch(process.env.REACT_APP_FACE_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaarNumber: userData.aadhaarNumber,
          image: cleanImageData,
          timestamp :new Date().toISOString().slice(0, 23) + "+00:00"
        })
      });
      console.log(imageData);
  
      const data = await response.json();
      console.log(data);
      return data.is_verified;
      console.log("Data returned");
    } catch (error) {
      console.error( error);
      return false;
    }
  };

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
      alert(t("faceAuth.guidelines.acceptRequired"));
      return;
    }
    
    if (!cameraPermission) {
      alert(t("faceAuth.camera.enablePrompt"));
      return;
    }
    
    setShowAuthentication(true);
  };

  // Move verify to useEffect and watch for both detectionDone and liveness
  useEffect(() => {
    const verifyFace = async () => {
      if (detectionDone && liveness && imageData && !verificationComplete) {
        setIsVerifying(true);
        const result = await verifyUserImage(imageData);
        setFaceVerified(result);
        setVerificationComplete(true);
        setIsVerifying(false);
      }
    };

    verifyFace();
  }, [detectionDone, liveness, imageData]);

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
          <h2>{t("faceAuth.guidelines.title")}</h2>
          <img
            src={`${process.env.PUBLIC_URL}/faceAuthGuidelines-${i18n.language}.jpeg`}
            alt={t("faceAuth.guidelines.title")}
            className="guidelines-image"
          />
          <label>
            <input
              type="checkbox"
              checked={guidelinesAccepted} className="guidelinesCheck"
              onChange={() => setGuidelinesAccepted(!guidelinesAccepted)}
            />
            {t("faceAuth.guidelines.checkbox")}
          </label>
          <button onClick={handleProceed}>{t("faceAuth.guidelines.proceed")}</button>
        </div>
      ) : !modelReady ? (
        <Loading/>
      ) : detectionDone ? (
        isVerifying ? (
          <Loading/>
        ) : (
          verificationComplete && faceVerified ? (
            <div className="auth-result">
              <h2>{t("faceAuth.status.authSuccess")}</h2>
              <p>{t("faceAuth.status.real")}</p>
            </div>
          ) : (
            <NoFaceDetected 
              setVerificationComplete={setVerificationComplete} 
              setDetectionDone={setDetectionDone}
              failureType={!liveness ? 'liveness' : !faceVerified ? 'verification' : 'detection'}
            />
          )
        )
      ) : (
        <FaceDetection 
          models={decryptedModels} 
          setDetectionDone={setDetectionDone} 
          setLiveness={setLiveness}
          setImageData={setImageData}
        />
      )}
    </div>
  );
};

export default FaceAuthToo;
