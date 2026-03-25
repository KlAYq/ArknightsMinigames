import React, { useState } from "react";
import "./guessInput.css";
import { Button, VStack } from "@chakra-ui/react"

  function GuessInput({ onGuess, disabled, operators }) {
    const [input, setInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
  
    const operatorList = Object.values(operators || {});

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

      const match = operatorList.find(
        (op) => op.name.toLowerCase() === input.trim().toLowerCase()
      );

      if (!match) {
        console.log("Operator not found in the list!");
        return;
      }

      onGuess({
        name: match.name,
        url: match.url,
      });
      // onGuess(input.trim());
      setInput("");
      setSuggestions([]);
    };
  
    return (
      <VStack>
      <div className="guess-input-container" style={{ "flex-direction": `row`, display: `flex`, "justify-content": `center` }}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type operator name..."
            value={input}
            onChange={handleChange}
            disabled={disabled}
            style={{ color: "white" }}
          />
          
        </form>
        <Button variant="solid" className="confirm-btn" onClick={handleSubmit} ml={2} colorPalette="teal" size="lg" font={"bold"} >
            Confirm
        </Button>
        {suggestions.length > 0 && (
          <ul className="suggestions" align="center">
            {suggestions.map((s, i) => (
              <li key={i} onClick={() => handleSelect(s)}>
                <img src={s.url} alt={s.name} className="suggestion-avatar" />
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      </VStack>
    );
  }
  

export default GuessInput;
