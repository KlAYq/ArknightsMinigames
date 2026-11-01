import React, { useEffect, useState, useRef } from "react";
import GuessInput from "../components/guessInput";
import Confetti from "../components/Confetti";
import StatsModal from "../components/StatsModal";
import "./classic.css";
import operatorData from "../res/operatorsInfo.json";
import {
  getDailyDateString,
  getDailyOperator,
  getTimeUntilNextDaily,
  getStats,
  recordWin,
  loadDailyState,
  saveDailyState,
} from "../utils/dailyStorage";

function Classic() {
  const [gameMode, setGameMode] = useState("daily"); // "daily" | "infinite"
  const [targetOperator, setTargetOperator] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [status, setStatus] = useState("playing"); // "playing" | "correct-pending" | "correct"
  const [showConfetti, setShowConfetti] = useState(false);
  const [operators, setOperators] = useState([]);
  const [stats, setStats] = useState(() => getStats("classic"));
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [dailyCountdown, setDailyCountdown] = useState(getTimeUntilNextDaily());

  const winTimerRef = useRef(null);
  const animTimerRef = useRef(null);

  // In-memory state for infinite mode
  const [infiniteState, setInfiniteState] = useState({
    target: null,
    guesses: [],
    status: "playing",
  });

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  // Ticking countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDailyCountdown(getTimeUntilNextDaily());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load operators on mount and initialize daily challenge
  useEffect(() => {
    const list = Object.entries(operatorData).map(([id, info]) => ({
      id,
      name: info.name,
      url: info.url,
      gender: info.gender,
      position: info.position,
      race: info.race,
      tags: info.tags || [],
      main_faction: Array.isArray(info.main_faction) ? info.main_faction : (info.main_faction ? [info.main_faction] : []),
      skill_type: info.skill_type || [],
      release_year: info.release_year,
    }));
    setOperators(list);

    // Initialize with Daily Challenge as default
    const dailyTarget = getDailyOperator(list, "classic");
    setTargetOperator(dailyTarget);

    const savedDaily = loadDailyState("classic");
    if (savedDaily && savedDaily.targetName === dailyTarget.name) {
      // Strip isNew so past guesses never animate on page reload
      const cleanGuesses = (savedDaily.guesses || []).map((g) => ({ ...g, isNew: false }));
      setGuesses(cleanGuesses);
      setStatus(savedDaily.status || "playing");
    } else {
      setGuesses([]);
      setStatus("playing");
    }
  }, []);

  const handleGuess = (guess) => {
    const operatorDetails = operators.find(
      (op) => op.name.toLowerCase() === guess.name.toLowerCase()
    );
    if (!operatorDetails || !targetOperator) return;

    // Check if correct
    const isCorrect = operatorDetails.name.toLowerCase() === targetOperator.name.toLowerCase();

    // Clear any previous ongoing animation/win timer
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    if (winTimerRef.current) clearTimeout(winTimerRef.current);

    // Mark previous guesses as isNew: false, and prepended guess as isNew: true
    const updatedPrevGuesses = guesses.map((g) => ({ ...g, isNew: false }));
    const newGuesses = [{ ...operatorDetails, isNew: true }, ...updatedPrevGuesses];
    setGuesses(newGuesses);

    // After animation completes (~4.2s), clear isNew flag so future updates don't replay it
    animTimerRef.current = setTimeout(() => {
      setGuesses((prev) => prev.map((g) => ({ ...g, isNew: false })));
    }, 4200);

    // Save progress if in Daily mode (strip isNew: true so localStorage never persists animation flags)
    if (gameMode === "daily") {
      saveDailyState("classic", {
        date: getDailyDateString(),
        targetId: targetOperator.id,
        targetName: targetOperator.name,
        guesses: newGuesses.map((g) => ({ ...g, isNew: false })),
        status: isCorrect ? "correct" : "playing",
      });
    }

    if (isCorrect) {
      if (gameMode === "daily") {
        const newStats = recordWin("classic", newGuesses.length);
        setStats(newStats);
      }
      setStatus("correct-pending");
      winTimerRef.current = setTimeout(() => {
        setStatus("correct");
        setShowConfetti(true);
      }, 3600);
    }
  };

  const handleSwitchMode = (newMode) => {
    if (newMode === gameMode) return;

    // Cancel any active animation/win timers and ensure confetti is turned off
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    setShowConfetti(false);

    if (newMode === "infinite") {
      // Save current daily state to localStorage (preserves daily progress, all guesses isNew: false)
      if (gameMode === "daily" && targetOperator) {
        saveDailyState("classic", {
          date: getDailyDateString(),
          targetId: targetOperator.id,
          targetName: targetOperator.name,
          guesses: guesses.map((g) => ({ ...g, isNew: false })),
          status: status === "correct-pending" ? "correct" : status,
        });
      }

      // Restore or generate infinite mode
      if (infiniteState.target) {
        setTargetOperator(infiniteState.target);
        // Stripping isNew ensures no slow animation plays when swapping
        setGuesses((infiniteState.guesses || []).map((g) => ({ ...g, isNew: false })));
        setStatus(infiniteState.status);
      } else {
        const random = operators[Math.floor(Math.random() * operators.length)];
        setTargetOperator(random);
        setGuesses([]);
        setStatus("playing");
        setInfiniteState({
          target: random,
          guesses: [],
          status: "playing",
        });
      }
      setGameMode("infinite");
    } else {
      // Switching to daily
      // Save infinite mode in memory (strip isNew so swapping back won't re-animate)
      setInfiniteState({
        target: targetOperator,
        guesses: guesses.map((g) => ({ ...g, isNew: false })),
        status: status === "correct-pending" ? "correct" : status,
      });

      // Load daily mode from localStorage
      const dailyTarget = getDailyOperator(operators, "classic");
      setTargetOperator(dailyTarget);
      console.log("correct guesses: " + dailyTarget.name)
      const savedDaily = loadDailyState("classic");
      if (savedDaily && savedDaily.targetName === dailyTarget.name) {
        // Strip isNew so swapping back won't re-animate
        setGuesses((savedDaily.guesses || []).map((g) => ({ ...g, isNew: false })));
        setStatus(savedDaily.status || "playing");
      } else {
        setGuesses([]);
        setStatus("playing");
      }
      setGameMode("daily");
    }
  };

  const handlePlayAgain = () => {
    if (gameMode === "infinite") {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (winTimerRef.current) clearTimeout(winTimerRef.current);
      setShowConfetti(false);
      const random = operators[Math.floor(Math.random() * operators.length)];
      setTargetOperator(random);
      setGuesses([]);
      setStatus("playing");
      setInfiniteState({
        target: random,
        guesses: [],
        status: "playing",
      });
    }
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

  const getSkillTypeClassAndContent = (guessSkillTypes) => {
    const targetSkillTypes = targetOperator.skill_type || [];
    const intersection = guessSkillTypes.filter((t) => targetSkillTypes.includes(t));

    let cellClass = "incorrect-cell";
    if (guessSkillTypes.length === targetSkillTypes.length && intersection.length === targetSkillTypes.length) {
      cellClass = "correct-cell";
    } else if (intersection.length > 0) {
      cellClass = "partial-cell";
    }

    return {
      cellClass,
      text: guessSkillTypes.join(", "),
    };
  };

  const getMainFactionClassAndContent = (guessFactions) => {
    const targetFactions = targetOperator.main_faction || [];
    const intersection = guessFactions.filter((t) => targetFactions.includes(t));

    let cellClass = "incorrect-cell";
    if (guessFactions.length === targetFactions.length && intersection.length === targetFactions.length) {
      cellClass = "correct-cell";
    } else if (intersection.length > 0) {
      cellClass = "partial-cell";
    }

    return {
      cellClass,
      text: guessFactions.join(", "),
    };
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
      <Confetti active={showConfetti} />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        modeName="Classic"
        onSwitchToInfinite={() => handleSwitchMode("infinite")}
      // isDailyCompleted={status === "correct" && gameMode === "daily"}
      />

      <div className="classic-panel">
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

        <h1 className="title">Guess the Arknights Operator</h1>
        {/* <p className="subtitle">
          {"Type an operator's name to get clues."}
        </p> */}

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
              🎉 Correct! Today's Operator is {targetOperator?.name}!
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
          </div>
        )}

        {status === "correct" && gameMode === "infinite" && (
          <div className="game-complete">
            <p className="success-message"> 🎉 Correct! The operator was {targetOperator?.name}!</p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handlePlayAgain} className="play-again">
                Play Again
              </button>
            </div>
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
                <th>Main Faction</th>
                <th>Skill Type</th>
                <th>Release Yr</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((guess, index) => {
                const tagsInfo = getTagsClassAndContent(guess.tags);
                const mainFactionInfo = getMainFactionClassAndContent(guess.main_faction);
                const skillTypeInfo = getSkillTypeClassAndContent(guess.skill_type);
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
                    <td className={mainFactionInfo.cellClass} style={{ "--delay": 5 }}>
                      {mainFactionInfo.text}
                    </td>
                    <td className={skillTypeInfo.cellClass} style={{ "--delay": 6 }}>
                      {skillTypeInfo.text}
                    </td>
                    <td className={yearInfo.cellClass} style={{ "--delay": 7 }}>
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
