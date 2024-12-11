import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "../styles/FaceAuthenticationPage.css";
import ModelService from "./ModelService";
import Loading from "./Loading";
import { FaceDetection } from "./FaceDetection"; // Change this import
import FaceaAuthImage from "./faceAuthGuidelines.jpeg";
import NoFaceDetected from "./NoFaceDetected.js";

const FaceAuthToo = (props) => {
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

      const response = await fetch(process.env.REACT_APP_FACE_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaarNumber: userData.aadhaarNumber,
          image: cleanImageData,
          timestamp: new Date().toISOString()
        })
      });
      console.log(imageData);
  
      const data = await response.json();
      return data.is_authorized;
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
          <h2>Face Authentication Guidelines</h2>
          <img
            src={FaceaAuthImage}
            alt="Face Authentication Guidelines"
            className="guidelines-image"
          />
          <label>
            <input
              type="checkbox"
              checked={guidelinesAccepted} className="guidelinesCheck"
              onChange={() => setGuidelinesAccepted(!guidelinesAccepted)}
            />
            I have read and understood the guidelines.
          </label>
          <button onClick={handleProceed}>Proceed</button>
        </div>
      ) : !modelReady ? (
        <Loading/>
      ) : detectionDone ? (
        isVerifying ? (
          <Loading/>
        ) : (
          <div className="auth-result">
            <h2>
              {!liveness ? "Liveness Check Failed" :
               !verificationComplete ? "Verifying..." :
               faceVerified ? "Authorization Successful" : "Authorization Failed"}
            </h2>
            <p>{liveness &&faceVerified? "Live face detected" : <NoFaceDetected setDetectionDone={setDetectionDone}/>}</p>
          </div>
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
