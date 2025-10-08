import React from "react";
import HomePage from "./pages/homepage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GuessOperator from "./pages/guessOperator";
import GameLogo from "./components/gameLogo";
import "./app.css";

function App() {
  return (
    <Router>
      <div className="app-container" style={{
      // backgroundImage: `url(${process.env.PUBLIC_URL}/res/img/bg_lungmen_o.png)`,
      // backgroundSize: ' ',
      // backgroundRepeat: 'no-repeat',
      // backgroundPosition: 'center',
      // height: '100vh',
    }}>
        <GameLogo />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/guess-operator" element={<GuessOperator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;