import React from 'react'
import '../styles/EndPage.css'
 // Make sure you have your styles in App.css


const EndPage = () => {
    return (
        <div className="end-page">
          <div className="container-end">
            <div className="left-section">
              {/* You can replace the src with the actual image URL of the important person */}
              <img src="modiji.png" alt="MOdiji" className="profile-image" />
            </div>
            <div className="middle-section">
              <h1>Thank you for using Face Authentication Service</h1>
            </div>
          </div>
        </div>
      );
}

export default EndPage