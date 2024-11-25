/* global ort */
import React, { useRef, useEffect, useState } from 'react';

import Webcam from "react-webcam";
const YOLO_MODEL_PATH = 'yolo-face-detection.onnx';
const ANTISPOOF_MODEL_PATH = 'antispoofing.onnx';
const FaceDetection = ({ models }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [output, setOutput] = useState("Initializing...");
  const [yoloModel, setYoloModel] = useState(null);
  const [antispoofModel, setAntispoofModel] = useState(null);
  
  useEffect(() => 
  {
    // Load models when the component mounts
    const loadModels = async () => {
      try {
        console.log(models);
        setOutput("Loading models...");
        const yoloBuffer=models[1].decryptedModel;
        const antispoofBuffer=models[0].decryptedModel;
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

  const preprocessImage = (imageData, targetWidth, targetHeight) => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      canvasRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const resizedImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const float32Array = new Float32Array(targetWidth * targetHeight * 3);

    for (let i = 0; i < resizedImageData.data.length; i += 4) {
      const index = i / 4;
      float32Array[index] = resizedImageData.data[i] / 255; // Red
      float32Array[index + targetWidth * targetHeight] = resizedImageData.data[i + 1] / 255; // Green
      float32Array[index + 2 * targetWidth * targetHeight] = resizedImageData.data[i + 2] / 255; // Blue
    }

    return float32Array;
  };

  const sigmoid = (x) => 1 / (1 + Math.exp(-x));

  const handleFaceCapture = async () => {
    if (!webcamRef.current || !yoloModel || !antispoofModel) {
      setOutput("Webcam or models not ready.");
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame onto the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      setOutput("Running models...");
      // Preprocess image for YOLO
      const yoloInput = preprocessImage(imageData, 640, 640);
      const yoloFeeds = { input: new ort.Tensor('float32', yoloInput, [1, 3, 640, 640]) };
      const yoloResults = await yoloModel.run(yoloFeeds);
      console.log("YOLO Results:", yoloResults);

      // Preprocess image for AntiSpoofing
      const antispoofInput = preprocessImage(imageData, 128, 128);
      const antispoofFeeds = { input: new ort.Tensor('float32', antispoofInput, [1, 3, 128, 128]) };
      const antispoofResults = await antispoofModel.run(antispoofFeeds);

      const spoofProbability = antispoofResults.output.data[0];
      const probability = sigmoid(spoofProbability);

      setOutput(probability > 0.3 ? "Real face detected" : "Spoof detected");
    } catch (error) {
      console.error("Error running models:", error);
      setOutput("Error running models. Check console for details.");
    }
  };

  return (
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
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
        <button onClick={handleFaceCapture}>Authenticate Face</button>
        <p>{output}</p>
      </div>
      <div className="example-column">
        <h2>Example</h2>
        <img src="guidelines.jpg" alt="Example of proper camera facing" />
      </div>
    </div>
  );
};

export default FaceDetection;
