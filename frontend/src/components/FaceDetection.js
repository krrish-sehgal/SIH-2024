/* global ort */
import React, { useRef, useEffect, useState } from 'react';
import Webcam from "react-webcam";
import { useTranslation } from "react-i18next"; // Add this import

export const FaceDetection = ({ models, setLiveness, setDetectionDone, setImageData }) => {
  const { t } = useTranslation(); // Add translation hook
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [output, setOutput] = useState("Initializing...");
  const [yoloModel, setYoloModel] = useState(null);
  const [antispoofModel, setAntispoofModel] = useState(null);
  const frameRef = useRef(); // Store animation frame reference
  const outputRef = useRef("Initializing..."); // Use ref instead of state for output
  const [timeLeft, setTimeLeft] = useState(30);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [isRealFace, setIsRealFace] = useState(false);
  const lastRealFaceTime = useRef(null);
  const timerRef = useRef(null);
  const lastFrameTime = useRef(null);  // Add this ref
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  
  const captureImage = async () => {
    const video = webcamRef.current.video;
    const canvas = document.createElement('canvas');
    
    // Set fixed dimensions for the capture
    const captureWidth = 640;
    const captureHeight = 640;
    
    canvas.width = captureWidth;
    canvas.height = captureHeight;
    const context = canvas.getContext('2d');
    
    // Ensure proper video dimensions and scaling
    const aspectRatio = video.videoWidth / video.videoHeight;
    let drawWidth = captureWidth;
    let drawHeight = captureWidth / aspectRatio;
    
    // Center the image if needed
    let offsetY = 0;
    if (drawHeight < captureHeight) {
      drawHeight = captureHeight;
      drawWidth = captureHeight * aspectRatio;
      offsetY = 0;
    }
    
    context.drawImage(
      video,
      0,
      offsetY,
      drawWidth,
      drawHeight
    );
  
    // Convert to base64 with quality parameter
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = base64Image;
    downloadLink.download = 'captured-face.jpg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    return base64Image;
  setImageData(base64Image);
    
    setDetectionDone(true);
  };
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log(models);
        setOutput(t("faceAuth.status.loading"));
        const yoloBuffer = models[1].decryptedModel;
        const antispoofBuffer = models[0].decryptedModel;
        const yoloSession = await ort.InferenceSession.create(new Uint8Array(yoloBuffer));
        const antispoofSession = await ort.InferenceSession.create(new Uint8Array(antispoofBuffer));
        setYoloModel(yoloSession);
        setAntispoofModel(antispoofSession);
        setOutput(t("faceAuth.status.ready"));
      } catch (error) {
        console.error("Error loading models:", error);
        setOutput(t("faceAuth.status.error"));
      }
    };
    loadModels();
  }, [models, t]);

  useEffect(() => {
    if (yoloModel && antispoofModel && !verificationComplete) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerExpired(true);
            setDetectionDone(true);
            setLiveness(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [yoloModel, antispoofModel, isRetryMode]);

  const preprocessImage = (imageData, targetWidth, targetHeight) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    // Use video frame directly instead of canvas
    ctx.drawImage(
      webcamRef.current.video,
      0,
      0,
      webcamRef.current.video.videoWidth,
      webcamRef.current.video.videoHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const resizedImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const float32Array = new Float32Array(targetWidth * targetHeight * 3);

    for (let i = 0; i < resizedImageData.data.length; i += 4) {
      const index = i / 4;
      float32Array[index] = resizedImageData.data[i] / 255;
      float32Array[index + targetWidth * targetHeight] = resizedImageData.data[i + 1] / 255;
      float32Array[index + 2 * targetWidth * targetHeight] = resizedImageData.data[i + 2] / 255;
    }

    return float32Array;
  };

  const sigmoid = (x) => 1 / (1 + Math.exp(-x));


  const processFrame = async () => {
    if (!webcamRef.current || !yoloModel || !antispoofModel) {
      frameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const currentTime = Date.now();
      if (!lastFrameTime.current) {
        lastFrameTime.current = currentTime;
      }
      
      // Run YOLO first
      const yoloFeeds = {
        images: new ort.Tensor(
          "float32",
          preprocessImage(null, 640, 640),
          [1, 3, 640, 640]
        ),
      };

      const yoloResults = await yoloModel.run(yoloFeeds);
      const detections = yoloResults.output.data;
      const threshold = 0.5;
      let faceDetected = false;

      // Only draw the most confident detection
      let maxConfidence = 0;
      let bestBox = null;

      for (let i = 0; i < detections.length; i += 85) {
        const confidence = detections[i + 4];
        if (confidence > threshold && confidence > maxConfidence) {
          maxConfidence = confidence;
          bestBox = {
            x: detections[i],
            y: detections[i + 1],
            width: detections[i + 2],
            height: detections[i + 3]
          };
          faceDetected = true;
        }
      }

      if (faceDetected && bestBox) {
        // Draw only the best detection
        ctx.beginPath();
        ctx.rect(
          bestBox.x * canvas.width,
          bestBox.y * canvas.height,
          bestBox.width * canvas.width,
          bestBox.height * canvas.height
        );
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Only run anti-spoofing if face detected
        const antispoofFeeds = {
          input: new ort.Tensor(
            "float32",
            preprocessImage(null, 128, 128),
            [1, 3, 128, 128]
          ),
        };

        const antispoofResults = await antispoofModel.run(antispoofFeeds);
        const probability = sigmoid(antispoofResults.output.data[0]);

        const newOutput = probability > 0.75 ? t("faceAuth.status.real") : t("faceAuth.status.spoof");
       
        if (outputRef.current !== newOutput) {
          outputRef.current = newOutput;
          setOutput(newOutput);
        }
      } else {
        lastFrameTime.current = currentTime;
      }
    } catch (error) {
      console.error("Error processing frame:", error);
    }

    frameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (yoloModel && antispoofModel) {
      processFrame();  // Starts the animation frame loop
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);  // Stops the loop when component unmounts
      }
    };
  }, [yoloModel, antispoofModel]);

  const handleCapture = () => {
    const video = webcamRef.current.video;
    const canvas = document.createElement('canvas');
    
    // Set fixed dimensions for the capture
    const captureWidth = 640;
    const captureHeight = 640;
    
    canvas.width = captureWidth;
    canvas.height = captureHeight;
    const context = canvas.getContext('2d');
    
    // Ensure proper video dimensions and scaling
    const aspectRatio = video.videoWidth / video.videoHeight;
    let drawWidth = captureWidth;
    let drawHeight = captureWidth / aspectRatio;
    
    // Center the image if needed
    let offsetY = 0;
    if (drawHeight < captureHeight) {
      drawHeight = captureHeight;
      drawWidth = captureHeight * aspectRatio;
      offsetY = 0;
    }
    
    context.drawImage(
      video,
      0,
      offsetY,
      drawWidth,
      drawHeight
    );
  
    // Convert to base64 with quality parameter
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    
    setImageData(base64Image);
    setVerificationComplete(true);
    setLiveness(true);
    setDetectionDone(true);
  };



  return (
    <div className="auth-container">
      <div className="auth-column">
        <h2>{t("faceAuth.title")}</h2>
        <div className="status-row">
          {(timeLeft>=1) && (
            <div className="mini-timer">
              <span>{timeLeft}s</span>
              <div className="timer-bar" style={{ width: `${(timeLeft/30) * 100}%` }}></div>
            </div>
          )}
        </div>
        
        <div className="webcam-overlay">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 480,
              height: 640,
              facingMode: "user",
            }}
            style={{ display: isTimerExpired ? 'none' : 'block' }}
          />
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'none'
            }} 
          />
          <img 
            className="overlay-circle" 
            src={`face-${(output===t("faceAuth.status.ready")||output===t("faceAuth.status.loading"))?"mid":(output===t("faceAuth.status.real")?"accepted":"rejected")}.png`} 
            alt="Overlay" 
          />
        </div>
        {!verificationComplete && !isTimerExpired && (
          <button 
            className={`capture-button disabled`}
            onClick={handleCapture}
            disabled={output !== t("faceAuth.status.real")}
          >
            {t("faceAuth.capture")}
          </button>
        )}
        
      </div>
    </div>
  );
};

