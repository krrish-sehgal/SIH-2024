import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import "../styles/FaceAuthenticationPage.css";
import ModelService from "./ModelService";
import Loading from "./Loading";

const FaceAuthenticationPage = () => {
  const webcamRef = useRef(null);
  const [showAuthentication, setShowAuthentication] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const[keyGenerated,setKeyGenerated]=useState(false);
  const[isLoaded,setIsLoaded]=useState(false);
  const[isDecrypted,setIsDecrypted]=useState(false);
  const[decryptedModel,setDecryptedModel]=useState(null);
  const[cameraPermission,setCameraPermission]=useState(false);
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
  const handleFaceCapture = () => {
   
    const screenshot = webcamRef.current.getScreenshot();
    console.log("Captured Image:", screenshot);
   
    const isAuthenticated = true; 
    alert(
      isAuthenticated
        ? "Face authenticated successfully!"
        : "Authentication failed. Please try again."
    );
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
      <ModelService setDecryptedModel={setDecryptedModel} setIsDecrypted={setIsDecrypted} setKeyGenerated={setKeyGenerated} setIsLoaded={setIsLoaded}/>
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
        <div className="auth-container">
          <div className="auth-column">
            <h2>Face Authentication</h2>
            <div className="webcam-overlay">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 360,
                  height: 480,
                  facingMode: "user",
                }}
              />
              <img className="overlay-circle" src="face.png" alt="Overlay" />
            </div>
            <button onClick={handleFaceCapture}>Authenticate Face</button>
          </div>
          <div className="example-column">
            <h2>Example</h2>
            <img src="guidelines.jpg" alt="Example of proper camera facing" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceAuthenticationPage;
