import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./gameLogo.css";

export default function GameLogo() {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const handleClick = () => {
    if (!isHome) {
      navigate("/");
    }
  };

  return (
    <div
      className={`game-logo ${isHome ? "home-logo" : "small-logo"}`}
      onClick={handleClick}
    >
      <img src="https://arknights.wiki.gg/images/Arknights_logo.png?cc80ab" alt="Arknights Logo" className="logo-img"/>
    </div>
  );
}
