import React, { useEffect, useState } from "react";
import * as ort from "onnxruntime-web";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Fetch the model file from the backend and load it
    async function fetchModel() {
      try {
        // Request the ONNX model file from Django
        const response = await fetch("http://localhost:8000/download-model/");
        const modelArrayBuffer = await response.arrayBuffer();

        // Initialize ONNX runtime session with the downloaded model
        const session = await ort.InferenceSession.create(modelArrayBuffer);
        setSession(session);
        console.log("Model loaded successfully");
      } catch (error) {
        console.error("Error loading the model:", error);
      }
    }

    fetchModel();
  }, []);

  return (
    <div className="App">
      <h1>Face Authentication Model Test</h1>
      {session ? (
        <p>Model is loaded and ready for inference.</p>
      ) : (
        <p>Loading model...</p>
      )}
      {/* Here you could add inputs and code to run inferences with the model */}
    </div>
  );
}

export default App;
