/* global ort */
import React, { useRef, useEffect, useState } from 'react';
import Webcam from "react-webcam";

const FaceDetection = ({ models, setLiveness, setDetectionDone }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [output, setOutput] = useState("Initializing...");
  const [yoloModel, setYoloModel] = useState(null);
  const [antispoofModel, setAntispoofModel] = useState(null);
  const [lastProcessingTime, setLastProcessingTime] = useState(0);
  const processingInterval = 100; // Process every 100ms (10 fps)
  const frameRef = useRef(); // Store animation frame reference
  const outputRef = useRef("Initializing..."); // Use ref instead of state for output
  const [timeLeft, setTimeLeft] = useState(30);
  const [cumulativeRealFaceTime, setCumulativeRealFaceTime] = useState(0);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verified, setVerified] = useState(false);
  const lastRealFaceTime = useRef(null);
  const timerRef = useRef(null);
  const lastFrameTime = useRef(null);  // Add this ref

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log(models);
        setOutput("Loading models...");
        const yoloBuffer = models[1].decryptedModel;
        const antispoofBuffer = models[0].decryptedModel;
        const yoloSession = await ort.InferenceSession.create(new Uint8Array(yoloBuffer));
        const antispoofSession = await ort.InferenceSession.create(new Uint8Array(antispoofBuffer));
        setYoloModel(yoloSession);
        setAntispoofModel(antispoofSession);
        setOutput("Models loaded. Ready for face authentication.");
      } catch (error) {
        console.error("Error loading models:", error);
        setOutput("Failed to load models. Check console for details.");
      }
    };
    loadModels();
  }, [models]);

  useEffect(() => {
    if (yoloModel && antispoofModel && !verificationComplete) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setLiveness(cumulativeRealFaceTime >= 10);
            
            setVerificationComplete(true);
            
            setDetectionDone(true);
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [yoloModel, antispoofModel]);

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

  const calculateIoU = (box1, box2) => {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    if (x2 < x1 || y2 < y1) return 0;

    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;

    return intersection / union;
  };

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

        const newOutput = probability > 0.4 ? "Real face detected" : "Spoof detected";
        
        // Update cumulative real face time
        if (newOutput === "Real face detected" && !verificationComplete) {
          const timeIncrement = (currentTime - lastFrameTime.current) / 1000;
          setCumulativeRealFaceTime((prev) => {
            const newTime = Math.min(prev + timeIncrement, 10);
           
            return newTime;
          });
        }
        lastFrameTime.current = currentTime;
        
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
      processFrame();
    }
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [yoloModel, antispoofModel]);
useEffect(() => {if(cumulativeRealFaceTime>=10){setVerificationComplete(true);
  setLiveness(true);
  setDetectionDone(true);}}, [cumulativeRealFaceTime]);
  return (
    <div className="auth-container">
      <div className="auth-column">
        <h2>Face Authentication</h2>
        <div className="status-row">
          <p>{output}</p>
          {!verificationComplete && (
            <div className="mini-timer">
              <span>{timeLeft}s</span>
              <div className="timer-bar" style={{ width: `${(timeLeft/30) * 100}%` }}></div>
            </div>
          )}
          {!verificationComplete && (
            <div className="real-face-timer">
            {/* Progress Bar */}
            <div className="real-bar-container">
              <div
                className="real-bar"
                style={{
                  width: `${(cumulativeRealFaceTime / 10) * 100}%`,
                }}
              ></div>
            </div>
            {/* Time Display */}
            <span>{cumulativeRealFaceTime.toFixed(1)}s/10s</span>
          </div>
          )}
        </div>
        
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
          <canvas 
            ref={canvasRef} 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'none'  // This removes the canvas from layout
            }} 
          />
          <img 
            className="overlay-circle" 
            src={`face-${(output==="Models loaded. Ready for face authentication."||output==="Loading models...")?"mid":(output==="Real face detected"?"accepted":"rejected")}.png`} 
            alt="Overlay" 
          />
        </div>
      </div>
      <div className="example-column">
        <h2>Example</h2>
        <img src="guidelines.jpg" alt="Example of proper camera facing" />
      </div>
    </div>
  );
};

export default FaceDetection;

