import React, { useState } from "react";
import Navbar from "./Navbar";
import "../styles/UpdateAadhaar.css";

const UpdateAadhaar = () => {

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted: ", formData);
    // Add your API call or logic here
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
      </div>
    </>
  );
};

export default UpdateAadhaar;
