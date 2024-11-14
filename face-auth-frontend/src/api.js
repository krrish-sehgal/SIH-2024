import axios from "axios";

// Base URL for the Django API (adjust the URL accordingly)
const API_URL = "http://127.0.0.1:8000/api/"; // Update with your backend URL

// Function to send image data to the backend for face authentication
export const authenticateFace = async (formData) => {
  try {
    const response = await axios.post(
      `${API_URL}authenticate-face/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during face authentication", error);
    throw error;
  }
};
