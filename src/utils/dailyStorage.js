


// Returns today's date string in local time (YYYY-MM-DD).
export function getDailyDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}


// Returns yesterday's date string in local time (YYYY-MM-DD).
export function getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getDailyDateString(d);
}

// 32-bit FNV-1a seeded pseudo-random number generator returning float in [0, 1).
export function seededRandom(seedStr) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
    }
    return ((h >>> 0) % 1000000) / 1000000;
}

// Deterministically pick an operator for the given mode and date.
export function getDailyOperator(operatorList, mode = "classic", dateStr = getDailyDateString()) {
    if (!operatorList || operatorList.length === 0) return null;

    let pool = operatorList;
    if (mode === "emoji") {
        // Only select operators that have at least one non-empty emoji set defined
        const valid = operatorList.filter((op) =>
            op.emojis &&
            op.emojis.some((set) => Array.isArray(set) && set.some((e) => e && typeof e === "string" && e.trim() !== ""))
        );
        if (valid.length > 0) {
            pool = valid;
        }
    }

    const seed = `${dateStr}_${mode}_arknights_seed_v2`;
    const rand = seededRandom(seed);
    const index = Math.floor(rand * pool.length);
    return pool[index];
}

// Shuffle an emoji set for today's daily puzzle.
export function getDailyEmojiOrder(emojiSet, dateStr = getDailyDateString()) {
    if (!emojiSet || !Array.isArray(emojiSet)) return [];
    const arr = [...emojiSet];
    for (let i = arr.length - 1; i > 0; i--) {
        const seed = `${dateStr}_emoji_order_step_${i}`;
        const j = Math.floor(seededRandom(seed) * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Calculate countdown string (HH:MM:SS) until next midnight.
export function getTimeUntilNextDaily() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diff = Math.max(0, tomorrow.getTime() - now.getTime());
    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
    const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

const STATS_KEY_PREFIX = "arknights_stats_";
const DAILY_STATE_PREFIX = "arknights_daily_state_";

// Retrieve user stats for a specific mode from localStorage.
export function getStats(mode) {
    const defaultStats = {
        currentStreak: 0,
        maxStreak: 0,
        gamesWon: 0,
        totalGuesses: 0,
        averageGuesses: "0.0",
        lastWonDate: null,
    };

    try {
        const raw = localStorage.getItem(`${STATS_KEY_PREFIX}${mode}`);
        if (!raw) return defaultStats;
        const parsed = JSON.parse(raw);

        // Verify if active streak is still valid (won yesterday or today)
        const todayStr = getDailyDateString();
        const yesterdayStr = getYesterdayDateString();

        let activeStreak = parsed.currentStreak || 0;
        if (parsed.lastWonDate && parsed.lastWonDate !== todayStr && parsed.lastWonDate !== yesterdayStr) {
            activeStreak = 0;
        }

        return {
            ...defaultStats,
            ...parsed,
            currentStreak: activeStreak,
        };
    } catch (e) {
        console.error("Failed to read stats from localStorage:", e);
        return defaultStats;
    }
}

// Record a game win in daily mode and update streak and guess statistics.
export function recordWin(mode, guessCount, dateStr = getDailyDateString()) {
    const stats = getStats(mode);

    // Prevent duplicate stat updates on multiple re-renders of the same day's win
    if (stats.lastWonDate === dateStr) {
        return stats;
    }

    const yesterdayStr = getYesterdayDateString();
    let newCurrentStreak = 1;
    if (stats.lastWonDate === yesterdayStr) {
        newCurrentStreak = (stats.currentStreak || 0) + 1;
    }

    const newMaxStreak = Math.max(stats.maxStreak || 0, newCurrentStreak);
    const newGamesWon = (stats.gamesWon || 0) + 1;
    const newTotalGuesses = (stats.totalGuesses || 0) + guessCount;
    const newAverageGuesses = (newTotalGuesses / newGamesWon).toFixed(1);

    const updated = {
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        gamesWon: newGamesWon,
        totalGuesses: newTotalGuesses,
        averageGuesses: newAverageGuesses,
        lastWonDate: dateStr,
    };

    try {
        localStorage.setItem(`${STATS_KEY_PREFIX}${mode}`, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save stats to localStorage:", e);
    }

    return updated;
}

// Load saved daily game state from localStorage.
export function loadDailyState(mode, dateStr = getDailyDateString()) {
    try {
        const raw = localStorage.getItem(`${DAILY_STATE_PREFIX}${mode}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Only return state if it belongs to today's date
        if (parsed && parsed.date === dateStr) {
            return parsed;
        }
        return null;
    } catch (e) {
        console.error("Failed to load daily state:", e);
        return null;
    }
}

// Save current daily game state to localStorage.
export function saveDailyState(mode, state) {
    try {
        localStorage.setItem(`${DAILY_STATE_PREFIX}${mode}`, JSON.stringify(state));
    } catch (e) {
        console.error("Failed to save daily state:", e);
    }
}
