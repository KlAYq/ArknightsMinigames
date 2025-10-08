import React from "react";
import "./gameCard.css";

function GameCard({ title, description, image, onPlay }) {
  return (
    <div className="game-card" onClick={onPlay}>
      <img src={image} alt={title} className="game-image" />
      <div className="game-content">
        <h2>{title}</h2>
        <p>{description}</p>
        {/* <button className="play-button" >
          Play
        </button> */}
      </div>
    </div>
  );
}

export default GameCard;
