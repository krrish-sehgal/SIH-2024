import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import "../styles/FaceAuthenticationPage.css";
import ModelService from "./ModelService";
import Loading from "./Loading";
import FaceDetection from "./FaceDetection";

const FaceAuthenticationPage = () => {
  const webcamRef = useRef(null);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const[keyGenerated,setKeyGenerated]=useState(false);
  const[isLoaded,setIsLoaded]=useState(false);
  const[isDecrypted,setIsDecrypted]=useState(false);
  const[decryptedModels,setDecryptedModels]=useState(null);
  const[cameraPermission,setCameraPermission]=useState(false);
  const[reVerify,setReVerify]=useState(false);
  const checkCameraPermission = async () => {

    try {
      // Requesting camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // If camera is accessible, stop the stream to release the resources
      stream.getTracks().forEach(track => track.stop());

      setCameraPermission(true);
     
    } catch (error) {
      console.log(error);
    
    }
  };


  const handleProceed = () => {
    if (guidelinesAccepted&&cameraPermission) {
      setShowAuthentication(true);

    }
    else if(guidelinesAccepted&&!cameraPermission){
      checkCameraPermission();
        // Function to check and request camera permission
      alert("Please give camera access for face authentication before proceeding.");
    } 
    else {
      alert("Please accept the guidelines before proceeding.");
    }
  };

  return (
    
    <div className="face-auth-page">
      <ModelService setDecryptedModels={setDecryptedModels} reVerify={reVerify}  setReVerify={setReVerify} setIsDecrypted={setIsDecrypted} setKeyGenerated={setKeyGenerated} setIsLoaded={setIsLoaded}/>
      {!showAuthentication ? ((
        <div className="guidelines-box">
          <h2>Face Authentication Guidelines</h2>
          <ul>
            <li>Ensure proper lighting on your face.</li>
            <li>Face the camera directly with a neutral expression.</li>
            <li>Avoid wearing hats or glasses that may obstruct your face.</li>
          </ul>
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
      )) :(!isDecrypted)?<Loading/>: (
        <FaceDetection models={decryptedModels} setReVerify={setReVerify}/>
      )}
    </div>
  );
};

export default FaceAuthenticationPage;
