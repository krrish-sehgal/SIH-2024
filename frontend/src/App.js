import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './i18n'; // Import i18n configuration
import './App.css';
import MainPage from "./components/MainPage";
import Profile from "./components/Profile.js";
import UpdateAadhaar from "./components/UpdateAadhaar.js";
import Admin from "./components/Admin.js";
function App() {
  return (
    <Router>
     
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/update" element={<UpdateAadhaar />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;