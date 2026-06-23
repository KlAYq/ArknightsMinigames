import React, { useEffect, useState } from "react";
import GuessInput from "../components/guessInput";
import Confetti from "../components/Confetti";
import "./classic.css";
import operatorData from "../res/operatorsAvatar.json";

function Classic() {
  const [targetOperator, setTargetOperator] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [status, setStatus] = useState("playing"); // "playing" | "correct"
  const [operators, setOperators] = useState([]);

  // Load operators on mount
  useEffect(() => {
    const list = Object.entries(operatorData).map(([id, info]) => ({
      id,
      name: info.name,
      url: info.url,
      gender: info.gender,
      position: info.position,
      race: info.race,
      tags: info.tags || [],
      region: info.region,
      release_year: info.release_year,
    }));
    setOperators(list);
    pickRandomOperator(list);
  }, []);

  const pickRandomOperator = (list) => {
    if (!list || list.length === 0) return;
    const random = list[Math.floor(Math.random() * list.length)];
    setTargetOperator(random);
  };

  const handleGuess = (guess) => {
    // Find the full guess details from list
    const operatorDetails = operators.find(
      (op) => op.name.toLowerCase() === guess.name.toLowerCase()
    );
    if (!operatorDetails) return;

    // Check if correct
    const isCorrect = operatorDetails.name.toLowerCase() === targetOperator.name.toLowerCase();

    // Mark previous guesses as isNew: false, and prepended guess as isNew: true
    const updatedPrevGuesses = guesses.map((g) => ({ ...g, isNew: false }));
    const newGuesses = [{ ...operatorDetails, isNew: true }, ...updatedPrevGuesses];
    setGuesses(newGuesses);

    if (isCorrect) {
      setStatus("correct-pending");
      setTimeout(() => {
        setStatus("correct");
      }, 3600);
    }
  };

  const handlePlayAgain = () => {
    setStatus("playing");
    setGuesses([]);
    pickRandomOperator(operators);
  };

  // Filter out already guessed operators for the dropdown list
  const availableOperators = operators.filter(
    (op) => !guesses.some((g) => g.name.toLowerCase() === op.name.toLowerCase())
  );

  // Compare helper functions
  const getGenderClass = (guessVal) => {
    return guessVal === targetOperator.gender ? "correct-cell" : "incorrect-cell";
  };

  const getPositionClass = (guessVal) => {
    return guessVal === targetOperator.position ? "correct-cell" : "incorrect-cell";
  };

  const getRaceClass = (guessVal) => {
    return guessVal === targetOperator.race ? "correct-cell" : "incorrect-cell";
  };

  const getTagsClassAndContent = (guessTags) => {
    const targetTags = targetOperator.tags || [];
    const intersection = guessTags.filter((t) => targetTags.includes(t));

    let cellClass = "incorrect-cell";
    if (guessTags.length === targetTags.length && intersection.length === targetTags.length) {
      cellClass = "correct-cell";
    } else if (intersection.length > 0) {
      cellClass = "partial-cell";
    }

    return {
      cellClass,
      text: guessTags.join(", "),
    };
  };

  const getRegionClass = (guessVal) => {
    return guessVal === targetOperator.region ? "correct-cell" : "incorrect-cell";
  };

  const getYearClassAndArrow = (guessVal) => {
    if (guessVal === targetOperator.release_year) {
      return { cellClass: "correct-cell", arrow: "" };
    }
    const arrow = targetOperator.release_year > guessVal ? " ⬆" : " ⬇";
    return {
      cellClass: "incorrect-cell",
      arrow,
    };
  };

  return (
    <div className="classic-page">
      <Confetti active={status === "correct"} />

      <div className="classic-panel">
        <h1 className="title">Guess the Arknights Operator</h1>
        <p className="subtitle">Type an operator's name to get clues.</p>

        <GuessInput
          onGuess={handleGuess}
          disabled={status !== "playing"}
          operators={availableOperators}
        />

        {status === "correct" && (
          <div className="game-complete">
            <button onClick={handlePlayAgain} className="play-again">
              Play Again
            </button>
          </div>
        )}
      </div>

      {guesses.length > 0 && (
        <div className="table-container">
          <table className="classic-table">
            <thead>
              <tr>
                <th>Operator</th>
                <th>Gender</th>
                <th>Position</th>
                <th>Race</th>
                <th>Tags</th>
                <th>Region</th>
                <th>Release Yr</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((guess, index) => {
                const tagsInfo = getTagsClassAndContent(guess.tags);
                const yearInfo = getYearClassAndArrow(guess.release_year);

                return (
                  <tr key={guess.id} className={`guess-row ${guess.isNew ? "is-new" : ""}`}>
                    <td className={`operator-cell`} style={{ "--delay": 0 }}>
                      <div className="op-info">
                        <img src={guess.url} alt={guess.name} className="table-avatar" />
                        <span className="op-name">{guess.name}</span>
                      </div>
                    </td>
                    <td className={getGenderClass(guess.gender)} style={{ "--delay": 1 }}>
                      {guess.gender}
                    </td>
                    <td className={getPositionClass(guess.position)} style={{ "--delay": 2 }}>
                      {guess.position}
                    </td>
                    <td className={getRaceClass(guess.race)} style={{ "--delay": 3 }}>
                      {guess.race}
                    </td>
                    <td className={tagsInfo.cellClass} style={{ "--delay": 4 }}>
                      {tagsInfo.text}
                    </td>
                    <td className={getRegionClass(guess.region)} style={{ "--delay": 5 }}>
                      {guess.region}
                    </td>
                    <td className={yearInfo.cellClass} style={{ "--delay": 6 }}>
                      {guess.release_year}
                      {yearInfo.arrow && <span className="direction-arrow">{yearInfo.arrow}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Classic;
