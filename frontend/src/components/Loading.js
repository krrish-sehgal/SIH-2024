import React, { useEffect, useState } from 'react';
import '../styles/Loading.css'; // CSS file for styling

const Loading = ({ currentlyHidden }) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(currentlyHidden);
  }, [currentlyHidden]);

  return (
    <div className={`loading-spinner ${hidden ? "hidden" : ""}`}>
      <svg className="spinner" viewBox="0 0 50 50">
        <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
      </svg>
      <div className="loading-text">Loading</div>
    </div>
  );
};

export default Loading;
