// src/components/MainMenu.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// A helper component for a single random cloud that repositions and gets a new duration on each animation cycle.
const RandomCloud = () => {
  // Generate random position and size.
  const getRandomPosition = () => ({
    top: Math.random() * 100 + '%',
    left: Math.random() * 100 + '%',
    size: (Math.random() * 200 + 300) + 'px', // Size between 300px and 500px
  });

  // Generate a random duration between 5s and 15s.
  const getRandomDuration = () => (Math.random() * 10 + 20) + 's';

  const [position, setPosition] = useState(getRandomPosition());
  const [duration, setDuration] = useState(getRandomDuration());

  // When the animation iteration completes, update position and duration.
  const handleAnimationIteration = () => {
    setPosition(getRandomPosition());
    setDuration(getRandomDuration());
  };

  return (
    <Cloud
      top={position.top}
      left={position.left}
      size={position.size}
      duration={duration}
      onAnimationIteration={handleAnimationIteration}
    />
  );
};

const MainMenu = () => {
  const navigate = useNavigate();

  const handleStartNewGame = () => {
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
    navigate('/about');
  };

  const cloudCount = 8;
  const clouds = Array.from({ length: cloudCount }, (_, i) => <RandomCloud key={i} />);

  return (
    <MenuContainer>
      {clouds}
      <GlowingLogo src={require('../assets/continuum.png')} alt="Continuum Logo" />
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
  position: relative;
  overflow: hidden;
`;

// Animation for the subtle breathing effect.
const breathingCloudAnimation = keyframes`
  0% {
    opacity: 0.0;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.5);
  }
  100% {
    opacity: 0.0;
    transform: scale(1);
  }
`;

// Cloud styled-component using dynamic props for position, size, and duration.
const Cloud = styled.div`
  position: absolute;
  top: ${props => props.top};
  left: ${props => props.left};
  width: ${props => props.size};
  height: ${props => props.size};
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(247, 37, 133, 0) 70%);
  border-radius: 50%;
  animation: ${breathingCloudAnimation} ${props => props.duration} infinite;
  z-index: 0;
`;

const GlowingLogo = styled.img`
  width: 500px;
  height: auto;
  position: relative;
  z-index: 1;
  display: block;
  margin-bottom: 30px;
  filter: drop-shadow(0 0 0.75rem rgb(122, 122, 122));
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
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
