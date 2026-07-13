import React from "react";
import "./gameCard.css";

function GameCard({ title, description, image, onPlay }) {
  return (
    <div className="game-card" onClick={onPlay}>
      <img src={image} alt={title} className="game-image" />
      <div className="game-content">
        <h2 className="game-title">{title}</h2>
        <p className="description">{description}</p>
      </div>
    </div>
  );
}

export default GameCard;
