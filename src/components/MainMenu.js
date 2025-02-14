// src/components/MainMenu.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainMenu = () => {
  const navigate = useNavigate();

  const handleStartNewGame = () => {
    // Clear any cached game data if needed, then navigate to the new game setup page.
    navigate('/new-game');
  };

  const handleLoad = () => {
    // Look for keys that start with "story-" in localStorage.
    const keys = Object.keys(localStorage).filter(key => key.startsWith("story-"));
    if (keys.length > 0) {
      // If saved game keys exist, navigate to the LoadGame page so the user can choose one.
      navigate('/load-game');
    } else {
      alert('No saved game found!');
    }
  };

  const handleQuit = () => {
    alert('Thanks for playing!');
    // Optionally, you might try to close the window here (if allowed).
  };

  return (
    <div className="main-menu" style={styles.menuContainer}>
      <h1>Visual Novel Game</h1>
      <button style={styles.button} onClick={handleStartNewGame}>Start New Game</button>
      <button style={styles.button} onClick={handleLoad}>Load</button>
      <button style={styles.button} onClick={handleQuit}>Quit Game</button>
    </div>
  );
};

const styles = {
  menuContainer: {
    textAlign: 'center',
    paddingTop: '100px'
  },
  button: {
    margin: '10px',
    padding: '10px 20px',
    fontSize: '16px'
  }
};

export default MainMenu;
