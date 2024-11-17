// import React, { useState } from "react";
// import * as ort from "onnxruntime-web";

// const App = () => {
//   const [modelOutput, setModelOutput] = useState(null);

//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];

//     if (!file) {
//       alert("Please upload a valid ONNX model file.");
//       return;
//     }

//     try {
//       // Read the ONNX model file
//       const arrayBuffer = await file.arrayBuffer();
//       console.log("ONNX File Loaded:", file.name);

//       // Load the ONNX model
//       const session = await ort.InferenceSession.create(arrayBuffer);
//       console.log("Model Loaded Successfully");
//       console.log("Model Inputs:", session.inputNames);
//       console.log("Model Outputs:", session.outputNames);

//       // Prepare the input tensor
//       const inputName = "permute_input"; // Your input tensor name
//       const inputTensor = new ort.Tensor(
//         "float32", // Data type
//         new Float32Array(3 * 112 * 112).fill(1), // Dummy data (replace with actual input)
//         [1, 3, 112, 112] // Batch size 1, 3 channels, 112x112 image
//       );

//       console.log("Input Tensor Created:", inputTensor);

//       // Run inference
//       const results = await session.run({ [inputName]: inputTensor });

//       // Extract and display the output
//       const outputName = "sequential"; // Your output tensor name
//       console.log("Model Output:", results);
//       setModelOutput(results[outputName].data);
//     } catch (error) {
//       console.error("Error running the ONNX model:", error);
//       alert(`Failed to run the ONNX model: ${error.message}`);
//     }
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <h1>Run ONNX Model in Browser</h1>
//       <input
//         type="file"
//         accept=".onnx"
//         onChange={handleFileUpload}
//         style={{ margin: "20px 0" }}
//       />
//       {modelOutput && (
//         <div>
//           <h3>Model Output:</h3>
//           <pre>{JSON.stringify(modelOutput, null, 2)}</pre>
//         </div>
//       )}
//     </div>
//   );
// };

// export default App;

import React, { useState, useEffect, useRef } from "react";
import * as ort from "onnxruntime-web";

const App = () => {
  const [modelOutput, setModelOutput] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Fetch and load the ONNX model
    const loadModel = async () => {
      try {
        const response = await fetch('/models/onnx-model.onnx');
        if (!response.ok) {
          throw new Error("Failed to fetch the model");
        }

        const arrayBuffer = await response.arrayBuffer();
        const loadedSession = await ort.InferenceSession.create(arrayBuffer);
        console.log("ONNX Model Loaded");

        // Save the session for later use
        setSession(loadedSession);

      } catch (error) {
        console.error("Error loading the ONNX model:", error);
        alert(`Failed to load the ONNX model: ${error.message}`);
      }
    };

    loadModel();

    // Request camera access
    const getCameraFeed = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraReady(true);
      } catch (err) {
        console.error("Error accessing the camera: ", err);
        alert("Failed to access the camera.");
      }
    };

    getCameraFeed();
  }, []);

  const runInference = async () => {
    if (!session || !canvasRef.current) return;

    // Capture the video frame and draw it on the canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = new Float32Array(imageData.data.buffer);

    // Prepare the input tensor (dummy data for now)
    const inputName = "permute_input"; // Your input tensor name
    const inputTensor = new ort.Tensor("float32", pixels, [1, 3, 112, 112]);

    // Run inference
    const results = await session.run({ [inputName]: inputTensor });
    const outputName = "sequential"; // Your output tensor name
    setModelOutput(results[outputName].data);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Run ONNX Model in Browser with Webcam</h1>

      {isCameraReady ? (
        <div>
          <video
            ref={videoRef}
            width="640"
            height="480"
            style={{ display: "none" }}
            autoPlay
          />
          <canvas ref={canvasRef} width="112" height="112" style={{ display: "none" }} />
          <button onClick={runInference}>Run Inference</button>
          {modelOutput && (
            <div>
              <h3>Model Output:</h3>
              <pre>{JSON.stringify(modelOutput, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <p>Loading camera...</p>
      )}
    </div>
  );
};

export default App;
