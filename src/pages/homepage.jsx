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
      image: process.env.PUBLIC_URL + "/res/img/Wisadel_Skin_2.png",
      path: "/guess-operator",
    },
    {
      title: "Classic",
      description: "Guess the operator with clues",
      image: process.env.PUBLIC_URL + "/res/img/Rhodes_Island_Paramilitary_Force.png",
      path: "/classic",
    },
    {
      title: "Originium Circuitry Module",
      description: "Endfield puzzle minigame",
      image: process.env.PUBLIC_URL + "/res/img/ChenWoah.png",
      path: "/originium-circuitry",
    },
  ];

  return (
    <div className="homepage-container">
      {/* <h1 className="homepage-title"></h1> */}
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
