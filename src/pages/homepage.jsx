import React from "react";
import GameCard from "../components/gameCard";
import "./homepage.css";
import { useNavigate } from "react-router-dom";
function HomePage() {

  const navigate = useNavigate();

  const games = [
    {
      title: "Emoji",
      description: "Guess the operator with emojis.",
      image: process.env.PUBLIC_URL + "/res/img/Rhodes_Island_Paramilitary_Force.png",
      path: "/guess-operator",
    },
    {
      title: "Classic",
      description: "Guess the operator with clues",
      image: process.env.PUBLIC_URL + "/res/img/Rhodes_Island_Paramilitary_Force.png",
      path: "/classic",
    },
  ];

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Arknights Minigames</h1>
      <p className="homepage-subtitle">
        {/* Arknight Minigames! */}
      </p>

      <div className="game-grid">
        {games.map((game, index) => (
          <GameCard
            key={index}
            {...game}
            onPlay={() => {
              if (game.path !== "#") navigate(game.path);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
