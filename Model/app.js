const YOLO_MODEL_PATH = 'yolo-face-detection.onnx';
const ANTISPOOF_MODEL_PATH = 'antispoofing.onnx';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const output = document.getElementById('output');
const runButton = document.getElementById('runButton');

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
    output.textContent = "Error accessing camera. Please allow camera permissions.";
  }
}

// Preprocess image for models
function preprocessImage(imageData, targetWidth, targetHeight) {
  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = targetWidth;
  resizedCanvas.height = targetHeight;
  const resizedCtx = resizedCanvas.getContext('2d');
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

  const resizedImageData = resizedCtx.getImageData(0, 0, targetWidth, targetHeight);
  const float32Array = new Float32Array(targetWidth * targetHeight * 3);

  for (let i = 0; i < resizedImageData.data.length; i += 4) {
    const index = i / 4;
    float32Array[index] = resizedImageData.data[i] / 255; // Red
    float32Array[index + targetWidth * targetHeight] = resizedImageData.data[i + 1] / 255; // Green
    float32Array[index + 2 * targetWidth * targetHeight] = resizedImageData.data[i + 2] / 255; // Blue
  }

  return float32Array;
}

// Run YOLO and AntiSpoofing models
async function runModels() {
  output.textContent = "Running models...";

  // Load ONNX models
  const yoloSession = await ort.InferenceSession.create(YOLO_MODEL_PATH);
  const antispoofSession = await ort.InferenceSession.create(ANTISPOOF_MODEL_PATH);

  // Capture frame from video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Preprocess for YOLO (640x640)
  const yoloInput = preprocessImage(imageData, 640, 640);

  try {
    const yoloFeeds = { input: new ort.Tensor('float32', yoloInput, [1, 3, 640, 640]) };
    const yoloResults = await yoloSession.run(yoloFeeds);

    // Process YOLO results (adjust based on YOLO's specific output format)
    console.log("YOLO Results:", yoloResults);
  } catch (error) {
    console.error("YOLO Model Error:", error);
    output.textContent = "Error running YOLO model!";
    return;
  }

  // Preprocess for AntiSpoofing (128x28)
  const antispoofInput = preprocessImage(imageData, 128, 128);  // Corrected the dimensions: height = 128, width = 28

  try {
    const antispoofFeeds = { input: new ort.Tensor('float32', antispoofInput, [1, 3, 128, 128]) }; // Corrected tensor shape
    const antispoofResults = await antispoofSession.run(antispoofFeeds);

    // Process AntiSpoofing results (adjust based on model's specific output)
    const spoofProbability = antispoofResults.output.data[0];
    let Probability = sigmoid(spoofProbability);
    output.textContent = Probability > 0.3 ? "Real face detected" : "Spoof detected";
    
  } catch (error) {
    console.error("AntiSpoofing Model Error:", error);
    output.textContent = "Error running AntiSpoofing model!";
  }
}

runButton.addEventListener('click', runModels);

// Initialize video stream on page load
initVideo();
