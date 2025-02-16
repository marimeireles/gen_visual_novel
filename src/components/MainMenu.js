// src/components/MainMenu.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const MainMenu = () => {
  const navigate = useNavigate();

  const handleStartNewGame = () => {
    console.log('Starting a new game...'); // This logs for debugging
    navigate('/new-game');
  };

  const handleLoad = () => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith("story-"));
    if (keys.length > 0) {
      navigate('/load-game');
    } else {
      alert('No saved game found!');
    }
  };

  const handleAbout = () => {
    console.log('Displays about page');
  };

  return (
    <MenuContainer>
      <Logo src={require('../assets/continuum.png')} alt="Continuum" />
      <ButtonContainer>
        <MetalButton onClick={handleStartNewGame}>Start New Game</MetalButton>
        <MetalButton onClick={handleLoad}>Load</MetalButton>
        <MetalButton onClick={handleAbout}>About</MetalButton>
      </ButtonContainer>
    </MenuContainer>
  );
};

export default MainMenu;

// Styled Components
const MenuContainer = styled.div`
  text-align: center;
  padding-top: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #000;
  min-height: 100vh;
`;

const Logo = styled.img`
  width: 500px;
  height: auto;
  margin-bottom: 30px;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;



const MetalButton = styled.button`
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
