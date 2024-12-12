import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import UpdateVerificationOverlay from "./UpdateVerificationOverlay";
import ModelService from "./ModelService";
import "../styles/UpdateAadhaar.css";

const UpdateAadhaar = () => {
  const REACT_APP_FETCHURL = process.env.REACT_APP_FETCH_USERDATA;
  
  const [formData, setFormData] = useState({
    aadharNumber: "",
    name: "",
    dob: "",
    street: "",
    locality: "",
    district: "",
    state: "",
    pincode: "",
    mobileNumber: "",
  });

  const [showVerification, setShowVerification] = useState(false);
  const [decryptedModels, setDecryptedModels] = useState(null);
  const [modelReady, setModelReady] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem('user'));
        console.log("User data from session:", userData);
        const response = await fetch(REACT_APP_FETCHURL, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ aadhaarNumber: userData.aadhaarNumber , name: userData.name}),
          credentials: 'include' // if you need to include cookies
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Received non-JSON response from server");
        }

        const user = await response.json();
        
        if (!user) {
          throw new Error('No data received from server');
        }

        setFormData({
          aadharNumber: user.aadhaarNumber || '',
          name: user.name || '',
          dob: user.dob || '',
          street: user.address?.street || '',
          locality: user.address?.locality || '',
          district: user.address?.district || '',
          state: user.address?.state || '',
          pincode: user.pincode || '',
          mobileNumber: user.mobile || ''
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Optionally add user notification here
      }
    };

    fetchUserData();
  }, [REACT_APP_FETCHURL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowVerification(true);
  };

  const handleVerificationSuccess = async () => {
    try {
      // Make your API call to update the data here
      const response = await fetch('/your-update-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setUpdateSuccess(true);
        setShowVerification(false);
      }
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };

  return (
    <>
      <Navbar step={4} totalSteps={4} />
      <div className="update-form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              disabled
              placeholder="Aadhaar Number"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your Name"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              disabled
              placeholder="Enter your Date of Birth"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Enter your Street"
            />
            <input
              type="text"
              name="locality"
              value={formData.locality}
              onChange={handleChange}
              placeholder="Enter your Locality"
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              placeholder="Enter your District"
            />
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="Enter your State"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Enter your Pincode"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="Enter your Mobile Number"
              className="form-input"
            />
          </div>

          <button type="submit" className="submit-button">
            Update
          </button>
        </form>

        {showVerification && (
          <UpdateVerificationOverlay
            models={decryptedModels}
            onSuccess={handleVerificationSuccess}
            onClose={() => setShowVerification(false)}
          />
        )}

        {updateSuccess && (
          <div className="success-notification">
            Update successful!
          </div>
        )}
      </div>
      
      <ModelService 
        setDecryptedModels={setDecryptedModels}
        setModelReady={setModelReady}
      />
    </>
  );
};

export default UpdateAadhaar;
