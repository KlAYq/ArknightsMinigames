import React, { useEffect, useState } from "react";
import GuessInput from "../components/guessInput";
import Confetti from "../components/Confetti";
import "./guessOperator.css";
import operatorData from "../res/operatorsAvatar.json";
import questionIcon from "../res/questionMark.png";
import { VStack, HStack, Text  } from "@chakra-ui/react";

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
        const chosen = random.emojis[Math.floor(Math.random() * random.emojis.length)];
        // shuffle chosen emoji order
        const shuffleArray = (arr) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };
        setEmoji(shuffleArray(chosen));
    }, []);

    const handleGuess = (guess) => {
        const newGuess = {
            text: guess.name,
            correct: guess.name.toLowerCase() === correctAnswer.toLowerCase(),
            url: guess.url
        };

        setGuesses([...guesses, newGuess]);

        if (newGuess.correct) {
        setStatus("correct");
        } else if (revealed < emoji.length) {
        setRevealed(revealed + 1);
        }
    };

    const handlePlayAgain = () => {
        // reset UI state
        setRevealed(1);
        setGuesses([]);
        setStatus("playing");

        // pick a new random operator and emoji
        if (operators && operators.length > 0) {
            const random = operators[Math.floor(Math.random() * operators.length)];
            setCorrectAnswer(random.name);
            const newEmoji = random.emojis[Math.floor(Math.random() * random.emojis.length)];
            // shuffle the emoji reveal order
            const shuffleArray = (arr) => {
                const a = [...arr];
                for (let i = a.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [a[i], a[j]] = [a[j], a[i]];
                }
                return a;
            };
            setEmoji(shuffleArray(newEmoji));
        } else {
            const list = Object.entries(operatorData).map(([id, info]) => ({
                id,
                name: info.name,
                url: info.url,
                emojis: info.emojis,
            }));
            if (list.length > 0) {
                setOperators(list);
                const random = list[Math.floor(Math.random() * list.length)];
                setCorrectAnswer(random.name);
                const newEmoji = random.emojis[Math.floor(Math.random() * random.emojis.length)];
                const shuffleArray = (arr) => {
                    const a = [...arr];
                    for (let i = a.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [a[i], a[j]] = [a[j], a[i]];
                    }
                    return a;
                };
                setEmoji(shuffleArray(newEmoji));
            }
        }
    };

    const availableOperators = operators.filter(op => 
        !guesses.some(g => g.text.toLowerCase() === op.name.toLowerCase())
    );

    return (
        <div className="guess-page">
        <Confetti active={status === "correct"} />
        <div className="guess-panel">
          <h1 className="title">Which operator do these emojis describe?</h1>

          <div className="emoji-container">
              {emoji.map((emoji, i) => (
              <span key={i} className={`emoji-slot ${i < revealed ? "show" : "hidden"}`}>
                  {i < revealed ? (
                  <span className="emoji">{emoji}</span>
                  ) : (
                  <img src={questionIcon} alt="Hidden" className="hidden-icon" />
                  )}
              </span> 
              ))}
          </div>

          {status === "playing" && (
              <GuessInput 
                onGuess={handleGuess} 
                disabled={status !== "playing"} 
                operators={availableOperators}
              />
          )}
        </div>

        <div className="guess-history">
        <VStack>
            {guesses.map((g, i) => (
            <HStack width={"200px"}
                key={i}
                className={`guess-item ${g.correct ? "correct" : "incorrect"}`}
            >
                <img src={g.url} alt={g.text} className="suggestion-avatar" />
                <Text textAlign={"left"}> {g.text} </Text>
                
            </HStack>
            
            ))}
            </VStack>
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
