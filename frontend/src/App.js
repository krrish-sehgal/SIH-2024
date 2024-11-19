import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AadhaarAuthenticationPage from "./components/AadhaarAuthenticationPage";
import FaceAuthenticationPage from "./components/FaceAuthenticationPage";
import './App.css';
import MainPage from "./components/MainPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />

      </Routes>
    </Router>
  );
}

export default App;
