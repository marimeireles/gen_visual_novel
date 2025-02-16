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
      {/* Prevent form submission on Enter by preventing default on submit */}
      <Form onSubmit={(e) => e.preventDefault()}>
        <FormGroupRow>
          <FormGroupColumn flex={4}>
            <Label>Name:</Label>
            <StyledInput
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength="20"
              required
            />
          </FormGroupColumn>
          <FormGroupColumn flex={1}>
            <Label>Age:</Label>
            <AgeInput
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </FormGroupColumn>
        </FormGroupRow>

        <FormGroup>
          <Label>Objects of desire:</Label>
          {favorites.map((fav, index) => (
            <StyledInput
              key={index}
              type="text"
              value={fav}
              onChange={(e) => handleFavoriteChange(index, e.target.value)}
              maxLength="40"
            />
          ))}
        </FormGroup>

        <FormGroup>
          <Label>Personality traits:</Label>
          {personalities.map((trait, index) => (
            <StyledInput
              key={index}
              type="text"
              value={trait}
              onChange={(e) => handlePersonalityChange(index, e.target.value)}
              maxLength="40"
            />
          ))}
        </FormGroup>

        <ButtonGroup>
          <SectionTitle>Select your game's universe:</SectionTitle>
          <NeonButton onClick={() => setSetting('little-martian')} active={setting === 'little-martian'}>
            Little Martian
          </NeonButton>
          <NeonButton onClick={() => setSetting('self-made')} active={setting === 'self-made'}>
            Build your own
          </NeonButton>
        </ButtonGroup>

        <ButtonGroup>
          <SectionTitle>Select your game genre:</SectionTitle>
          <NeonButton onClick={() => setGameType('murder-mistery')} active={gameType === 'murder-mistery'}>
            Murder mistery
          </NeonButton>
          <NeonButton onClick={() => setGameType('open-ended')} active={gameType === 'open-ended'}>
            Open ended learning
          </NeonButton>
        </ButtonGroup>

        {/* Change type to "button" and attach handleSubmit to onClick */}
        <SubmitButton type="button" onClick={handleSubmit}>
          Start Game
        </SubmitButton>
      </Form>
    </Container>
  );
};

export default NewGameSetup;

// Styled Components
const Container = styled.div`
  text-align: center;
  padding: 50px 20px;
  background: linear-gradient(135deg, #000, #111);
  min-height: 100vh;
  color: #fff;
`;

const Title = styled.h2`
  font-family: 'Cinzel', serif;
  font-size: 48px;
  color: rgb(173, 173, 173);
  margin-bottom: 30px;
  text-shadow: 0 0 20px grey, 0 0 40px grey;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
`;

const FormGroupRow = styled.div`
  display: flex;
  width: 100%;
  gap: 20px;
  margin-bottom: 20px;
`;

const FormGroupColumn = styled.div`
  flex: ${(props) => props.flex};
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
`;

const Label = styled.label`
  font-size: 20px;
  margin-bottom: 8px;
  display: block;
  color: rgb(173, 173, 173);
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  margin-top: 5px;
  background: rgba(50, 50, 50, 0.8);
  color: #fff;
  transition: all 0.3s ease;

  &:focus {
    background: rgba(70, 70, 70, 0.9);
    outline: none;
    box-shadow: 0 0 10px grey;
  }
`;

const AgeInput = styled(StyledInput)`
  max-width: 70px;
  /* Remove spinner arrows in WebKit browsers */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  margin-left: 49px;
  /* Remove spinner arrows in Firefox */
  -moz-appearance: textfield;
`;

const ButtonGroup = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.p`
  font-size: 18px;
  color: rgb(173, 173, 173);
  margin-bottom: 10px;
`;

const neonGlow = keyframes`
  0% { box-shadow: 0 0 10px #fff, 0 0 20px grey; }
  50% { box-shadow: 0 0 20px #fff, 0 0 40px grey; }
  100% { box-shadow: 0 0 10px #fff, 0 0 20px grey; }
`;

const NeonButton = styled.button`
  padding: 12px 20px;
  font-size: 16px;
  margin-right: 10px;
  background: ${(props) => (props.active ? '#fff' : '#222')};
  color: ${(props) => (props.active ? '#000' : '#fff')};
  border: 2px solid rgb(127, 127, 127);
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${(props) => (props.active ? neonGlow : 'none')} 2s infinite;

  &:hover {
    background: solid rgb(127, 127, 127);
    color: rgb(127, 127, 127);
    transform: scale(1.05);
  }
`;

const SubmitButton = styled(NeonButton)`
  width: 100%;
  margin-top: 20px;
`;
