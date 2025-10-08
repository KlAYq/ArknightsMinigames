import React, { useEffect, useState } from "react";
import GuessInput from "../components/guessInput";
import "./guessOperator.css";
import operatorData from "../res/operatorsAvatar.json";

function GuessOperator() {
    const [revealed, setRevealed] = useState(1);
    const [guesses, setGuesses] = useState([]);
    const [status, setStatus] = useState("playing"); // "playing" | "correct"
    const [operators, setOperators] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [emoji, setEmoji] = useState([null]);
    useEffect(() => {
        const list = Object.entries(operatorData).map(([id, info]) => ({
        id,
        name: info.name,
        url: info.url,
        emojis: info.emojis
        }));
        setOperators(list);
        const random = list[Math.floor(Math.random() * list.length)];
        setCorrectAnswer(random.name);
        const emoji = random.emojis[Math.floor(Math.random() * random.emojis.length)];
        setEmoji(emoji);
    }, []);

    const handleGuess = (guess) => {
        const newGuess = {
        text: guess,
        correct: guess.toLowerCase() === correctAnswer.toLowerCase(),
        };

        setGuesses([...guesses, newGuess]);

        if (newGuess.correct) {
        setStatus("correct");
        } else if (revealed < emoji.length) {
        setRevealed(revealed + 1);
        }
    };

    const handlePlayAgain = () => {
        setRevealed(1);
        setGuesses([]);
        setStatus("playing");
    };

    return (
        <div className="guess-page">
        <h1 className="title">Which operator do these emojis describe?</h1>

        <div className="emoji-container">
            {emoji.map((emoji, i) => (
            <span key={i} className={`emoji ${i < revealed ? "show" : "hidden"}`}>
                {i < revealed ? emoji : "❓"}
            </span>
            ))}
        </div>

        {status === "playing" && (
            <GuessInput onGuess={handleGuess} disabled={status !== "playing"} operators={operators}/>
        )}

        <div className="guess-history">
            {guesses.map((g, i) => (
            <div
                key={i}
                className={`guess-item ${g.correct ? "correct" : "incorrect"}`}
            >
                {g.text}
            </div>
            ))}
        </div>

        {status === "correct" && (
            <div className="game-complete">
            <p> Correct! The operator is {correctAnswer}.</p>
            <button onClick={handlePlayAgain} className="play-again">
                Play Again
            </button>
            </div>
        )}
        </div>
    );
}

export default GuessOperator;
