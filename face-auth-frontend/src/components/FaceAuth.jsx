import React, { useState } from 'react';
import { authenticateFace } from '../api';

const FaceAuth = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      alert('Please upload an image for authentication.');
      return;
    }

    // Prepare form data to send to the backend
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await authenticateFace(formData);
      setResult(response);  // Set the result (response from backend)
    } catch (error) {
      setResult({ success: false, message: 'Authentication failed.' });
    }
  };

  return (
    <div>
      <h2>Face Authentication</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleImageChange} accept="image/*" />
        <button type="submit">Authenticate</button>
      </form>

      {result && (
        <div>
          <h3>Authentication Result</h3>
          {result.success ? (
            <p>Authentication successful! Welcome, {result.user}!</p>
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceAuth;
