import React, { useState } from "react";
import "./guessInput.css";
import operatorData from "../res/operatorsAvatar.json";


  function GuessInput({ onGuess, disabled, operators }) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
  
  
    const handleChange = (e) => {
      const value = e.target.value;
      setInput(value);
  
      if (value.trim() === "") {
        setSuggestions([]);
      } else {
        const matches = operators.filter((op) =>
          op.name.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(matches.slice(0, 5));
      }
    };
  
    const handleSelect = (op) => {
      setInput(op.name);
      setSuggestions([]);
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!input.trim()) return;
      onGuess(input.trim());
      setInput("");
      setSuggestions([]);
    };
  
    return (
      <div className="guess-input-container">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type operator name..."
            value={input}
            onChange={handleChange}
            disabled={disabled}
          />
          <button type="submit" className="confirm-btn">
            confirm
          </button>
        </form>
  
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => handleSelect(s)}>
                <img src={s.url} alt={s.name} className="suggestion-avatar" />
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  

export default GuessInput;
