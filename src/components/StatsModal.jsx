import React, { useEffect, useState } from "react";
import "./StatsModal.css";
import { getTimeUntilNextDaily } from "../utils/dailyStorage";

function StatsModal({ isOpen, onClose, stats, modeName, onSwitchToInfinite, isDailyCompleted }) {


    if (!isOpen) return null;

    return (
        <div className="stats-modal-overlay" onClick={onClose}>
            <div className="stats-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="stats-modal-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>

                <h2 className="stats-modal-title"> Daily statistics</h2>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.gamesWon ?? 0}</div>
                        <div className="stat-label">Played & Won</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.currentStreak ?? 0}</div>
                        <div className="stat-label">Current Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.maxStreak ?? 0}</div>
                        <div className="stat-label">Max Streak</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.averageGuesses ?? "0.0"}</div>
                        <div className="stat-label">Avg. Guesses</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StatsModal;
