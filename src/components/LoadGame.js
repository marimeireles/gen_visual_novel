import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listGameMemories, getGameMemory, setCurrentStoryName } from '../utils/gameMemoryManager';

const LoadGame = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  useEffect(() => {
    // List all keys that start with "story-"
    const keys = listGameMemories();
    console.log('Found keys:', keys);

    // Build an array of game objects only if valid memory exists
    const gamesData = keys
      .map(key => {
        const memory = getGameMemory(key);
        if (memory && memory.introduction) {
          return { key, label: memory.introduction.storyName };
        }
        return null;
      })
      .filter(Boolean);

    console.log('Games data:', gamesData);
    setGames(gamesData);
  }, []);

  const handleLoad = (key) => {
    setCurrentStoryName(key);
    navigate('/game');
  };

  return (
    <div style={{ padding: '20px', border: '2px solid blue' }}>
      <h2>Select a Saved Game</h2>
      {games.length === 0 ? (
        <p>No saved games found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {games.map(game => (
            <button
              key={game.key}
              onClick={() => handleLoad(game.key)}
              style={{ padding: '10px', fontSize: '16px' }}
            >
              {game.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoadGame;
