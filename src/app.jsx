import React from "react";
import HomePage from "./pages/homepage";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import GuessOperator from "./pages/guessOperator";
import GameLogo from "./components/gameLogo";
import NotFound from "./pages/notFoundPages";
import "./app.css";

function AppContent() {
  const location = useLocation();
  const isGuess = location.pathname === "/guess-operator";

  const appBackground = isGuess
    ? {
        backgroundImage: `url(${process.env.PUBLIC_URL}/res/img/bg_lungmen_o.png)`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundAttachment: 'fixed',
        // darken the image by blending with a semi-transparent black
        backgroundColor: 'rgba(0,0,0,0.55)',
        backgroundBlendMode: 'darken',
        color: '#fff',
      }
    : {};

  return (
    <div className="app-container" style={appBackground}>
      <GameLogo />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/guess-operator" element={<GuessOperator />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;