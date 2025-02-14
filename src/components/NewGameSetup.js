// src/components/NewGameSetup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Import the memory manager functions instead of directly using localStorage.
import { setCurrentStoryName, saveGameMemory } from '../utils/gameMemoryManager';

const NewGameSetup = () => {
  const navigate = useNavigate();

  // Form state for basic info.
  const [userName, setUserName] = useState('');
  const [age, setAge] = useState('');

  // Arrays for up to 3 favorite things and personality traits.
  const [favorites, setFavorites] = useState(['', '', '']);
  const [personalities, setPersonalities] = useState(['', '', '']);

  // State for genre settings.
  const [setting, setSetting] = useState('');   // Options: sci-fi, fantasy, contemporary.
  const [gameType, setGameType] = useState('');   // Options: adventure, romance, mystery.

  // Handlers for favorite things and personality traits.
  const handleFavoriteChange = (index, value) => {
    const newFavorites = [...favorites];
    newFavorites[index] = value.slice(0, 20);
    setFavorites(newFavorites);
  };

  const handlePersonalityChange = (index, value) => {
    const newPersonalities = [...personalities];
    newPersonalities[index] = value.slice(0, 20);
    setPersonalities(newPersonalities);
  };

  // When the form is submitted, validate and save the data.
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields.
    if (!userName || !age || !setting || !gameType) {
      alert("Please fill out all required fields.");
      return;
    }

    // Create a descriptive setup object.
    const setupData = {
      timestamp: new Date().toLocaleString(),
      userName: userName.slice(0, 20),
      userAge: parseInt(age, 10),
      favoriteThings: favorites.filter(fav => fav.trim() !== ''),
      personalityTraits: personalities.filter(trait => trait.trim() !== ''),
      genreSetting: {
        setting,  // 'sci-fi', 'fantasy', or 'contemporary'
        gameType, // 'adventure', 'romance', or 'mystery'
      }
    };

    // Prepare an object that will hold the initial game data.
    const chatMemory = {
      setup: setupData,
      chatHistory: []
    };

    // Generate a unique currentStoryName using the userName and a timestamp.
    const currentStoryName = `story-${userName}-${Date.now()}`;
    
    // Use the memory manager functions to save the game data in the expected format.
    setCurrentStoryName(currentStoryName);
    saveGameMemory(currentStoryName, chatMemory);

    // Navigate to the introduction interface.
    navigate('/introduction');
  };

  return (
    <div style={styles.container}>
      <h2>New Game Setup</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label>Name (max 20 chars):</label>
          <input
            type="text"
            value={userName}
            maxLength="20"
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label>Age:</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label>Favorite Things (up to 3, each max 20 chars):</label>
          {favorites.map((fav, index) => (
            <input
              key={index}
              type="text"
              value={fav}
              maxLength="20"
              onChange={(e) => handleFavoriteChange(index, e.target.value)}
              placeholder={`Favorite ${index + 1}`}
            />
          ))}
        </div>

        <div style={styles.formGroup}>
          <label>Personality Traits (up to 3, each max 20 chars):</label>
          {personalities.map((trait, index) => (
            <input
              key={index}
              type="text"
              value={trait}
              maxLength="20"
              onChange={(e) => handlePersonalityChange(index, e.target.value)}
              placeholder={`Trait ${index + 1}`}
            />
          ))}
        </div>

        {/* Genre Setting Buttons */}
        <div style={styles.buttonGroup}>
          <p>Select your game's setting:</p>
          <button
            type="button"
            onClick={() => setSetting('sci-fi')}
            style={setting === 'sci-fi' ? styles.selectedButton : styles.button}
          >
            Sci-Fi
          </button>
          <button
            type="button"
            onClick={() => setSetting('fantasy')}
            style={setting === 'fantasy' ? styles.selectedButton : styles.button}
          >
            Fantasy
          </button>
          <button
            type="button"
            onClick={() => setSetting('contemporary')}
            style={setting === 'contemporary' ? styles.selectedButton : styles.button}
          >
            Contemporary
          </button>
        </div>

        {/* Game Type Buttons */}
        <div style={styles.buttonGroup}>
          <p>Select your game type:</p>
          <button
            type="button"
            onClick={() => setGameType('adventure')}
            style={gameType === 'adventure' ? styles.selectedButton : styles.button}
          >
            Adventure
          </button>
          <button
            type="button"
            onClick={() => setGameType('romance')}
            style={gameType === 'romance' ? styles.selectedButton : styles.button}
          >
            Romance
          </button>
          <button
            type="button"
            onClick={() => setGameType('mystery')}
            style={gameType === 'mystery' ? styles.selectedButton : styles.button}
          >
            Mystery
          </button>
        </div>

        <button type="submit" style={styles.submitButton}>
          Start Game
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    paddingTop: '50px'
  },
  form: {
    display: 'inline-block',
    textAlign: 'left',
    maxWidth: '400px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  buttonGroup: {
    marginBottom: '15px'
  },
  button: {
    marginRight: '10px',
    padding: '8px 12px',
    cursor: 'pointer'
  },
  selectedButton: {
    marginRight: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#fff'
  },
  submitButton: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    cursor: 'pointer'
  }
};

export default NewGameSetup;
