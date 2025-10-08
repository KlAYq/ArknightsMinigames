import React from "react";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <p>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate("/")} style={{
        backgroundColor: '#f5923b',
        color: 'black',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
      }}>Go to Homepage</button>
    </div>
  );
}

export default NotFound;
