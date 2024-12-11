import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './i18n'; // Import i18n configuration
import './App.css';
import MainPage from "./components/MainPage";
import LanguageSwitcher from "./components/LanguageSwitcher";

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