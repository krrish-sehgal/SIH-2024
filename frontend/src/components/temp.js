const YOLO_MODEL_PATH = "yolov7-lite.onnx"; // Path to YOLOv7 lite model
const ANTISPOOF_MODEL_PATH = "AntiSpoofing_bin_1.5_128.onnx";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const output = document.getElementById("output");

function sigmoid(logit) {
  return 1 / (1 + Math.exp(-logit));
}

// Initialize video stream
async function initVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (error) {
    console.error("Error accessing camera:", error);
    output.textContent =
      "Error accessing camera. Please allow camera permissions.";
  }
}

// Preprocess image for models
function preprocessImage(imageData, targetWidth, targetHeight) {
  const resizedCanvas = document.createElement("canvas");
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;
  const resizedCtx = resizedCanvas.getContext("2d");
  resizedCtx.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const resizedImageData = resizedCtx.getImageData(
    0,
    0,
    targetWidth,
    targetHeight
  );
  const float32Array = new Float32Array(targetWidth * targetHeight * 3);

  for (let i = 0; i < resizedImageData.data.length; i += 4) {
    const index = i / 4;
    float32Array[index] = resizedImageData.data[i] / 255; // Red
    float32Array[index + targetWidth * targetHeight] =
      resizedImageData.data[i + 1] / 255; // Green
    float32Array[index + 2 * targetWidth * targetHeight] =
      resizedImageData.data[i + 2] / 255; // Blue
  }

  return float32Array;
}

// Run YOLO and AntiSpoofing models for each frame
async function runModels() {
  // Load ONNX models
  const yoloSession = await ort.InferenceSession.create(YOLO_MODEL_PATH);
  const antispoofSession = await ort.InferenceSession.create(
    ANTISPOOF_MODEL_PATH
  );

  function processFrame() {
    // Capture frame from video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Preprocess for YOLO (640x640)
    const yoloInput = preprocessImage(imageData, 640, 640);

    try {
      // YOLO Model
      const yoloFeeds = {
        images: new ort.Tensor("float32", yoloInput, [1, 3, 640, 640]),
      };
      yoloSession
        .run(yoloFeeds)
        .then((yoloResults) => {
          const detections = yoloResults.output.data;
          const threshold = 0.5;
          const filteredDetections = [];

          for (let i = 0; i < detections.length; i += 85) {
            const confidence = detections[i + 4];
            if (confidence > threshold) {
              const x = detections[i];
              const y = detections[i + 1];
              const width = detections[i + 2];
              const height = detections[i + 3];
              filteredDetections.push({ x, y, width, height, confidence });

              // Draw bounding box
              ctx.beginPath();
              ctx.rect(
                x * canvas.width,
                y * canvas.height,
                width * canvas.width,
                height * canvas.height
              );
              ctx.strokeStyle = "red";
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
          console.log("YOLO Results:", filteredDetections);
        })
        .catch((error) => {
          console.error("YOLO Model Error:", error);
        });

      // Preprocess for AntiSpoofing (128x128)
      const antispoofInput = preprocessImage(imageData, 128, 128);

      // Anti-Spoofing Model
      const antispoofFeeds = {
        input: new ort.Tensor("float32", antispoofInput, [1, 3, 128, 128]),
      };
      antispoofSession
        .run(antispoofFeeds)
        .then((antispoofResults) => {
          const spoofProbability = antispoofResults.output.data[0];
          const probability = sigmoid(spoofProbability);
          console.log("Anti-Spoofing Probability:", probability);

          // Display result
          output.textContent =
            probability > 0.4 ? "Real face detected" : "Spoof detected";
        })
        .catch((error) => {
          console.error("AntiSpoofing Model Error:", error);
          output.textContent = "Error running AntiSpoofing model!";
        });
    } catch (error) {
      console.error("Error processing frame:", error);
      output.textContent = "Error running models!";
    }

    // Request next frame for continuous processing
    requestAnimationFrame(processFrame);
  }

  // Start processing frames
  requestAnimationFrame(processFrame);
}

// Initialize video stream and models when page loads
initVideo().then(() => {
  runModels();
});
