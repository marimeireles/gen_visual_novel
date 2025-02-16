import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { setCurrentStoryName, saveGameMemory } from '../utils/gameMemoryManager';

const NewGameSetup = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('');
  const [age, setAge] = useState('');
  const [favorites, setFavorites] = useState(['', '', '']);
  const [personalities, setPersonalities] = useState(['', '', '']);
  const [setting, setSetting] = useState('');
  const [gameType, setGameType] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userName || !age || !setting || !gameType) {
      alert("Please fill out all required fields.");
      return;
    }

    const setupData = {
      timestamp: new Date().toLocaleString(),
      userName: userName.slice(0, 20),
      userAge: parseInt(age, 10),
      favoriteThings: favorites.filter(fav => fav.trim() !== ''),
      personalityTraits: personalities.filter(trait => trait.trim() !== ''),
      genreSetting: { setting, gameType }
    };

    const chatMemory = { setup: setupData, chatHistory: [] };
    const currentStoryName = `story-${userName}-${Date.now()}`;
    
    setCurrentStoryName(currentStoryName);
    saveGameMemory(currentStoryName, chatMemory);
    navigate('/introduction');
  };

  return (
    <Container>
      <Title>New Game Setup</Title>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Name:</Label>
          <Input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} maxLength="20" required />
        </FormGroup>

        <FormGroup>
          <Label>Age:</Label>
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
        </FormGroup>

        <FormGroup>
          <Label>Favorite Things (up to 3):</Label>
          {favorites.map((fav, index) => (
            <Input
              key={index}
              type="text"
              value={fav}
              onChange={(e) => handleFavoriteChange(index, e.target.value)}
              placeholder={`Favorite ${index + 1}`}
              maxLength="20"
            />
          ))}
        </FormGroup>

        <FormGroup>
          <Label>Personality Traits (up to 3):</Label>
          {personalities.map((trait, index) => (
            <Input
              key={index}
              type="text"
              value={trait}
              onChange={(e) => handlePersonalityChange(index, e.target.value)}
              placeholder={`Trait ${index + 1}`}
              maxLength="20"
            />
          ))}
        </FormGroup>

        <ButtonGroup>
          <p>Select your game's setting:</p>
          <MetalButton onClick={() => setSetting('sci-fi')} active={setting === 'sci-fi'}>Sci-Fi</MetalButton>
          <MetalButton onClick={() => setSetting('fantasy')} active={setting === 'fantasy'}>Fantasy</MetalButton>
          <MetalButton onClick={() => setSetting('contemporary')} active={setting === 'contemporary'}>Contemporary</MetalButton>
        </ButtonGroup>

        <ButtonGroup>
          <p>Select your game type:</p>
          <MetalButton onClick={() => setGameType('adventure')} active={gameType === 'adventure'}>Adventure</MetalButton>
          <MetalButton onClick={() => setGameType('romance')} active={gameType === 'romance'}>Romance</MetalButton>
          <MetalButton onClick={() => setGameType('mystery')} active={gameType === 'mystery'}>Mystery</MetalButton>
        </ButtonGroup>

        <SubmitButton type="submit">Start Game</SubmitButton>
      </Form>
    </Container>
  );
};

export default NewGameSetup;

const body = styled.body`
  font-family: 'Cinzel', serif;
  font-weight: bold;
  letter-spacing: 1px;
  color: #fff;
`;

// Styled Components
const Container = styled.div`
  text-align: center;
  padding: 50px 20px;
  background: #000;
  min-height: 100vh;
  color: #fff;
`;

const Title = styled.h2`
  font-family: 'Cinzel', serif;
  font-size: 36px;
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
`;

const Label = styled.label`
  font-size: 18px;
  margin-bottom: 5px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #555;
  border-radius: 5px;
  background: #1a1a1a;
  color: #fff;
`;

const ButtonGroup = styled.div`
  margin-bottom: 20px;
`;

const MetalButton = styled.button`
  padding: 12px 20px;
  font-size: 16px;
  margin-right: 10px;
  color: #fff;
  background: ${(props) => (props.active ? '#333' : 'linear-gradient(145deg, #1a1a1a, #0d0d0d)')};
  border: 2px solid ${(props) => (props.active ? '#007bff' : '#333')};
  border-radius: 15px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.8), inset 0 -3px 10px rgba(255, 255, 255, 0.1);
  cursor: pointer;
  clip-path: polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #333, #1a1a1a);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6), 0 8px 15px rgba(0, 0, 0, 1);
  }
`;

const SubmitButton = styled(MetalButton)`
  width: 100%;
  margin-top: 20px;
  clip-path: none;
  border-radius: 10px;
`;

