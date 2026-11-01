import React, { useEffect, useState } from "react";
import GuessInput from "../components/guessInput";
import Confetti from "../components/Confetti";
import "./Emoji.css";
import operatorData from "../res/operatorsInfo.json";
import questionIcon from "../res/questionMark.png";
import { VStack, HStack, Text } from "@chakra-ui/react";

import StatsModal from "../components/StatsModal";
import {
    getDailyDateString,
    getDailyOperator,
    getDailyEmojiOrder,
    getTimeUntilNextDaily,
    getStats,
    recordWin,
    loadDailyState,
    saveDailyState,
} from "../utils/dailyStorage";

const isImage = (val) => {
    if (!val || typeof val !== "string") return false;
    const trimmed = val.trim();
    if (!trimmed) return false;
    return (
        /\.(png|jpe?g|svg|webp|gif|ico)$/i.test(trimmed) ||
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/")
    );
};

const resolveImagePath = (val) => {
    if (!val || typeof val !== "string") return "";
    let clean = val.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
        return clean;
    }
    clean = clean.replace(/^\/?public\//, "/");
    if (!clean.startsWith("/")) {
        if (clean.startsWith("res/")) {
            clean = "/" + clean;
        } else if (clean.startsWith("icon/")) {
            clean = "/res/" + clean;
        } else {
            clean = "/res/icon/" + clean;
        }
    }
    const publicUrl = process.env.PUBLIC_URL || "";
    return `${publicUrl}${clean}`;
};

const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

function Emoji() {
    const [gameMode, setGameMode] = useState("daily"); // "daily" | "infinite"
    const [revealed, setRevealed] = useState(1);
    const [guesses, setGuesses] = useState([]);
    const [status, setStatus] = useState("playing"); // "playing" | "correct"
    const [showConfetti, setShowConfetti] = useState(false);
    const [operators, setOperators] = useState([]);
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [targetOperator, setTargetOperator] = useState(null);
    const [emoji, setEmoji] = useState([null]);
    const [stats, setStats] = useState(() => getStats("emoji"));
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [dailyCountdown, setDailyCountdown] = useState(getTimeUntilNextDaily());

    // In-memory state for infinite mode
    const [infiniteState, setInfiniteState] = useState({
        target: null,
        correctAnswer: null,
        emoji: [],
        revealed: 1,
        guesses: [],
        status: "playing",
    });

    // Ticking countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setDailyCountdown(getTimeUntilNextDaily());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Load operators on mount and initialize Daily mode by default
    useEffect(() => {
        const list = Object.entries(operatorData).map(([id, info]) => ({
            id,
            name: info.name,
            url: info.url,
            emojis: info.emojis,
        }));
        setOperators(list);

        // Deterministically pick daily operator for Emoji mode (different from classic)
        const dailyTarget = getDailyOperator(list, "emoji");
        const dailyEmojiSet = (dailyTarget && dailyTarget.emojis && dailyTarget.emojis[0]) || ["", "", "", ""];
        const orderedDailyEmojis = getDailyEmojiOrder(dailyEmojiSet);

        setTargetOperator(dailyTarget);
        setCorrectAnswer(dailyTarget.name);

        const savedDaily = loadDailyState("emoji");
        if (savedDaily && savedDaily.targetName === dailyTarget.name) {
            setEmoji(savedDaily.emoji || orderedDailyEmojis);
            setRevealed(savedDaily.revealed || 1);
            setGuesses(savedDaily.guesses || []);
            setStatus(savedDaily.status || "playing");
        } else {
            setEmoji(orderedDailyEmojis);
            setRevealed(1);
            setGuesses([]);
            setStatus("playing");
        }
    }, []);

    const handleGuess = (guess) => {
        const isCorrect = guess.name.toLowerCase() === correctAnswer.toLowerCase();
        const newGuess = {
            text: guess.name,
            correct: isCorrect,
            url: guess.url,
        };

        const newGuesses = [...guesses, newGuess];
        setGuesses(newGuesses);

        let newRevealed = revealed;
        if (!isCorrect && revealed < emoji.length) {
            newRevealed = revealed + 1;
            setRevealed(newRevealed);
        }

        // Save progress if in Daily mode
        if (gameMode === "daily") {
            saveDailyState("emoji", {
                date: getDailyDateString(),
                targetId: targetOperator?.id,
                targetName: correctAnswer,
                emoji,
                revealed: newRevealed,
                guesses: newGuesses,
                status: isCorrect ? "correct" : "playing",
            });
        }

        if (isCorrect) {
            setStatus("correct");
            setShowConfetti(true);
            if (gameMode === "daily") {
                const newStats = recordWin("emoji", newGuesses.length);
                setStats(newStats);
                setIsStatsOpen(true);
            }
        }
    };

    const handleSwitchMode = (newMode) => {
        if (newMode === gameMode) return;
        setShowConfetti(false);

        if (newMode === "infinite") {
            // Save current daily state to localStorage (preserves daily progress)
            if (gameMode === "daily" && targetOperator) {
                saveDailyState("emoji", {
                    date: getDailyDateString(),
                    targetId: targetOperator.id,
                    targetName: correctAnswer,
                    emoji,
                    revealed,
                    guesses,
                    status,
                });
            }

            // Restore or generate infinite mode
            if (infiniteState.target) {
                setTargetOperator(infiniteState.target);
                setCorrectAnswer(infiniteState.correctAnswer);
                setEmoji(infiniteState.emoji);
                setRevealed(infiniteState.revealed);
                setGuesses(infiniteState.guesses);
                setStatus(infiniteState.status);
            } else {
                const valid = operators.filter(
                    (op) => op.emojis && op.emojis.some((set) => Array.isArray(set) && set.some((e) => e && e.trim() !== ""))
                );
                const pool = valid.length > 0 ? valid : operators;
                const random = pool[Math.floor(Math.random() * pool.length)];
                const chosenEmoji = random.emojis[Math.floor(Math.random() * random.emojis.length)];
                const shuffled = shuffleArray(chosenEmoji);

                setTargetOperator(random);
                setCorrectAnswer(random.name);
                setEmoji(shuffled);
                setRevealed(1);
                setGuesses([]);
                setStatus("playing");
                setInfiniteState({
                    target: random,
                    correctAnswer: random.name,
                    emoji: shuffled,
                    revealed: 1,
                    guesses: [],
                    status: "playing",
                });
            }
            setGameMode("infinite");
        } else {
            // Switching to daily
            // Save infinite mode in memory
            setInfiniteState({
                target: targetOperator,
                correctAnswer,
                emoji,
                revealed,
                guesses,
                status,
            });

            // Load daily mode from localStorage
            const dailyTarget = getDailyOperator(operators, "emoji");
            const dailyEmojiSet = (dailyTarget && dailyTarget.emojis && dailyTarget.emojis[0]) || ["", "", "", ""];
            const orderedDailyEmojis = getDailyEmojiOrder(dailyEmojiSet);
            const savedDaily = loadDailyState("emoji");

            setTargetOperator(dailyTarget);
            setCorrectAnswer(dailyTarget.name);

            if (savedDaily && savedDaily.targetName === dailyTarget.name) {
                setEmoji(savedDaily.emoji || orderedDailyEmojis);
                setRevealed(savedDaily.revealed || 1);
                setGuesses(savedDaily.guesses || []);
                setStatus(savedDaily.status || "playing");
            } else {
                setEmoji(orderedDailyEmojis);
                setRevealed(1);
                setGuesses([]);
                setStatus("playing");
            }
            setGameMode("daily");
        }
    };

    const handlePlayAgain = () => {
        if (gameMode === "infinite") {
            setShowConfetti(false);
            const valid = operators.filter(
                (op) => op.emojis && op.emojis.some((set) => Array.isArray(set) && set.some((e) => e && e.trim() !== ""))
            );
            const pool = valid.length > 0 ? valid : operators;
            const random = pool[Math.floor(Math.random() * pool.length)];
            const chosenEmoji = random.emojis[Math.floor(Math.random() * random.emojis.length)];
            const shuffled = shuffleArray(chosenEmoji);

            setTargetOperator(random);
            setCorrectAnswer(random.name);
            setEmoji(shuffled);
            setRevealed(1);
            setGuesses([]);
            setStatus("playing");
            setInfiniteState({
                target: random,
                correctAnswer: random.name,
                emoji: shuffled,
                revealed: 1,
                guesses: [],
                status: "playing",
            });
        }
    };

    const availableOperators = operators.filter(
        (op) => !guesses.some((g) => g.text.toLowerCase() === op.name.toLowerCase())
    );

    return (
        <div className="guess-page">
            <Confetti active={showConfetti} />

            <StatsModal
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
                stats={stats}
                modeName="Emoji"
                onSwitchToInfinite={() => handleSwitchMode("infinite")}
                isDailyCompleted={status === "correct" && gameMode === "daily"}
            />

            <div className="guess-panel">
                <div className="mode-switch-bar">
                    <div className="mode-tabs">
                        <button
                            className={`mode-tab-btn ${gameMode === "daily" ? "active daily" : ""}`}
                            onClick={() => handleSwitchMode("daily")}
                        >
                            Daily
                        </button>
                        <button
                            className={`mode-tab-btn ${gameMode === "infinite" ? "active infinite" : ""}`}
                            onClick={() => handleSwitchMode("infinite")}
                        >
                            Infinite
                        </button>
                    </div>

                    <button
                        className="stats-trigger-btn"
                        onClick={() => setIsStatsOpen(true)}
                    >
                        Stats
                    </button>
                </div>

                <h1 className="title">Which operator do these emojis describe?</h1>

                <div className="emoji-container">
                    {emoji.map((item, i) => (
                        <span key={i} className={`emoji-slot ${i < revealed ? "show" : "hidden"}`}>
                            {i < revealed ? (
                                isImage(item) ? (
                                    <img
                                        src={resolveImagePath(item)}
                                        alt="custom emoji"
                                        className="emoji-custom-icon"
                                    />
                                ) : (
                                    <span className="emoji">{item}</span>
                                )
                            ) : (
                                <img src={questionIcon} alt="Hidden" className="hidden-icon" />
                            )}
                        </span>
                    ))}
                </div>

                {status !== "correct" && (
                    <GuessInput
                        onGuess={handleGuess}
                        disabled={status !== "playing"}
                        operators={availableOperators}
                    />
                )}

                {status === "correct" && gameMode === "daily" && (
                    <div className="daily-win-banner">
                        <div className="daily-win-title">
                            🎉 Correct! Today's Operator is {correctAnswer}!
                        </div>
                        <div className="daily-win-stats-preview">
                            <span>Guessed in <strong>{guesses.length}</strong> {guesses.length === 1 ? "try" : "tries"}</span>
                            <span>•</span>
                            <span>🔥 Streak: <strong>{stats.currentStreak}</strong></span>
                            <span>•</span>
                            <span>🏆 Max: <strong>{stats.maxStreak}</strong></span>
                        </div>
                        <div className="daily-win-timer">
                            Next Daily Operator in <strong>{dailyCountdown}</strong>
                        </div>
                        {/* <div className="daily-win-actions">
                            <button
                                onClick={() => setIsStatsOpen(true)}
                                className="stats-btn-close"
                            >
                                Stats
                            </button>
                        </div> */}
                    </div>
                )}

                {status === "correct" && gameMode === "infinite" && (
                    <div className="game-complete">
                        <p className="success-message" style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                            🎉 Correct! The operator is {correctAnswer}.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
                            <button onClick={handlePlayAgain} className="play-again">
                                Play Again
                            </button>
                        </div>
                    </div>
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
        </div>
    );
}

export default Emoji;
