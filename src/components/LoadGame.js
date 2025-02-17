import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { listGameMemories, getGameMemory, setCurrentStoryName } from '../utils/gameMemoryManager';

// Shimmer animation used on buttons.
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Page container styled similar to your MainMenu.
const PageContainer = styled.div`
  text-align: center;
  padding-top: 50px;
  background: #000;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

// Styled title for the page.
const Title = styled.h2`
  color: #fff;
  margin-bottom: 30px;
`;

// Styled message for no saved games.
const Message = styled.p`
  color: #fff;
`;

// Container for the list of game buttons.
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Styled button matching the "MetalButton" theme.
const GameButton = styled.button`
  margin: 15px;
  padding: 20px 60px;
  font-size: 20px;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  letter-spacing: 1px;
  color: #fff;
  background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
  border: 2px solid #333;
  border-radius: 15px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.8), inset 0 -4px 10px rgba(255, 255, 255, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  clip-path: polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #333, #1a1a1a);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 10px 20px rgba(0, 0, 0, 1);
  }

  &:hover:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(120deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.3));
    background-size: 200% 100%;
    z-index: 1;
    mix-blend-mode: overlay;
    animation: ${shimmer} 3s infinite;
  }
`;

// Helper function to clean up the story name.
function cleanUpStoryName(storyName) {
  if (!storyName) return "";
  // Replace underscores with spaces.
  const cleaned = storyName.replace(/_/g, ' ');

  // If the cleaned string is within 40 characters, return it.
  if (cleaned.length <= 40) return cleaned;

  // Split into words.
  const words = cleaned.split(' ');
  let result = '';

  // Append words until adding another would exceed 40 characters.
  for (let i = 0; i < words.length; i++) {
    const wordWithSpace = result ? ' ' + words[i] : words[i];
    if (result.length + wordWithSpace.length <= 40) {
      result += wordWithSpace;
    } else {
      break;
    }
  }

  // Fallback: if no words were added (e.g., the first word is too long), just cut the string.
  if (!result) {
    result = cleaned.substring(0, 40);
  }

  return result;
}

const LoadGame = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  useEffect(() => {
    // List all keys that start with "story-"
    const keys = listGameMemories();
    console.log('Found keys:', keys);

    // Build an array of game objects only if valid memory exists.
    const gamesData = keys
      .map(key => {
        const memory = getGameMemory(key);
        if (memory && memory.introduction) {
          // Clean up the story name.
          const cleanedLabel = cleanUpStoryName(memory.introduction.storyName);
          return { key, label: cleanedLabel };
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
    <PageContainer>
      <Title>Select a Saved Game</Title>
      {games.length === 0 ? (
        <Message>No saved games found.</Message>
      ) : (
        <ButtonContainer>
          {games.map(game => (
            <GameButton key={game.key} onClick={() => handleLoad(game.key)}>
              {game.label}
            </GameButton>
          ))}
        </ButtonContainer>
      )}
    </PageContainer>
  );
};

export default LoadGame;
