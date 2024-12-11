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
  const[decryptedModels,setDecryptedModels]=useState(null);
  const[cameraPermission,setCameraPermission]=useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

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

  const handleVerification = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadhaarNumber: aadhaar,
          otp: otp
        })
      });

      const data = await response.json();
      
      if (data.message === "Login successful") {
        setSuccessMessage(`Welcome, ${data.user.name}`);
        setErrorMessage("");
        setIsVerified(true);
      } else {
        setErrorMessage(data.message);
        setSuccessMessage("");
      }
    } catch (error) {
      setErrorMessage("An error occurred during verification");
      console.error(error);
    }
  };

  const handleProceed = () => {
    if (!isVerified) {
      setErrorMessage("Please complete verification first");
      return;
    }
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
      <ModelService setDecryptedModels={setDecryptedModels} setIsDecrypted={setIsDecrypted} setKeyGenerated={setKeyGenerated} setIsLoaded={setIsLoaded}/>
      {!isVerified ? (
        <div className="verification-form">
          <h2>Aadhaar Verification</h2>
          <form onSubmit={handleVerification}>
            <input
              type="text"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value)}
              placeholder="Enter Aadhaar Number"
              pattern="\d{12}"
              maxLength="12"
              required
            />
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              pattern="\d{6,7}"
              maxLength="7"
              required
            />
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            <button type="submit">Verify</button>
          </form>
        </div>
      ) : !showAuthentication ? ((
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
