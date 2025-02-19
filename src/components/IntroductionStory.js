// src/components/IntroductionStory.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import OpenAI from 'openai';
import { getCurrentStoryNameID, getCurrentSetting, getGameMemory, saveGameMemory } from '../utils/gameMemoryManager';

const apiKey = process.env.REACT_APP_API_KEY;

const openai = new OpenAI({ 
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
});

const IntroductionStory = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [storyOptions, setStoryOptions] = useState([]); // Three story beginning options.
  const [selectedOption, setSelectedOption] = useState('');
  const [storyName, setStoryName] = useState('');
  const [phase, setPhase] = useState('loadingOptions'); // "loadingOptions", "displayOptions", "generatingName", "done"
  const [error, setError] = useState(null);

  // On mount, load the temporary game memory (saved in new game setup) and kick off the LLM call.
  useEffect(() => {
    fetchStoryOptions();
  }, []);

  // Build a prompt for the LLM using the setup information.
  const buildStoryPrompt = (setup) => {
    const { userName, userAge, favoriteThings, personalityTraits, genreSetting } = setup;
    return `
Using the following details, generate three short possibilities for the beginning of a story that situates the user and introduces the universe:
- Name: ${userName}
- Age: ${userAge}
- Favorite Things: ${favoriteThings.join(', ')}
- Personality Traits: ${personalityTraits.join(', ')}
- Genre Setting: ${genreSetting.setting} and ${genreSetting.gameType}
Provide your answer in the following format:
Option 1: <story beginning option 1>
Option 2: <story beginning option 2>
Option 3: <story beginning option 3>
    `;
  };

  // Call the LLM to generate three beginning options.
  const fetchStoryOptions = async () => {
    setLoading(true);
    try {
      const storyKey = getCurrentStoryNameID();
      if (!storyKey) {
        navigate('/new-game');
        return;
      }
      const chatMemory = getGameMemory(storyKey);
      if (!chatMemory) {
        navigate('/new-game');
        return;
      }

      const setup = chatMemory.setup;
      const prompt = buildStoryPrompt(setup);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = completion.choices[0].message.content;
      const options = parseStoryOptions(responseText);
      setStoryOptions(options);
      setPhase('displayOptions');
    } catch (err) {
      console.error("Error fetching story options:", err);
      setError("Failed to fetch story options.");
    }
    setLoading(false);
  };

  // Parse the LLM response into an array of three options.
  const parseStoryOptions = (text) => {
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const options = [];
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.startsWith("option 1:")) {
        options.push(line.substring("option 1:".length).trim());
      } else if (lower.startsWith("option 2:")) {
        options.push(line.substring("option 2:".length).trim());
      } else if (lower.startsWith("option 3:")) {
        options.push(line.substring("option 3:".length).trim());
      }
    });
    return options;
  };

  // Build a prompt to generate a short story name from the chosen introduction.
  const buildNamePrompt = (chosenOption) => {
    return `
Given the following story beginning:
"${chosenOption}"
Generate a short, catchy story name. The name should be in plain ASCII characters, have a maximum of 30 characters, and use underscores (_) instead of spaces.
    `;
  };

  // Call the LLM to generate a story name.
  const fetchStoryName = async () => {
    setLoading(true);
    setPhase('generatingName');
    try {
      const prompt = buildNamePrompt(selectedOption);
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: 'user', content: prompt }],
      });
      let generatedName = completion.choices[0].message.content.trim();
      generatedName = processStoryName(generatedName);
      setStoryName(generatedName);
      updateMemoryWithStory(generatedName, selectedOption);
      setPhase('done');
      // Redirect to game interface shortly after.
      if (getCurrentSetting() === 'little-martian') {
        navigate('/game'); // TODO: each kind of game was supposed to have it's own page
      }
      else {
        setTimeout(() => navigate('/game'), 1000);
      }
    } catch (err) {
      console.error("Error generating story name:", err);
      setError("Failed to generate story name.");
    }
    setLoading(false);
  };

  // Limit length of story name generated by the AI.
  const processStoryName = (name) => {
    if (name.length > 40) {
      name = name.substring(0, 40);
      let lastSpace = name.lastIndexOf(' ');
      if (lastSpace !== -1) {
        name = name.substring(0, lastSpace);
      }
    }
    return name;
  };

  // Update the stored memory with the introduction details.
  const updateMemoryWithStory = (storyName, chosenOption) => {
    const currentKey = getCurrentStoryNameID();
    let chatMemory = getGameMemory(currentKey);
    if (!chatMemory) {
      console.error("No memory found for key:", currentKey);
      return;
    }
    chatMemory.introduction = {
      chosenOption,
      storyName,
    };
    saveGameMemory(currentKey, chatMemory);
    localStorage.setItem('storyName', storyName);
  };

  return (
    <Container>
      <Title>Introduction to Your Story</Title>
      {loading && <Message>Loading...</Message>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {phase === 'displayOptions' && storyOptions.length > 0 && (
        <>
          <Message>Please select one of the following story beginnings:</Message>
          <OptionsContainer>
            {storyOptions.map((option, index) => (
              <OptionBox
                key={index}
                active={selectedOption === option}
                onClick={() => setSelectedOption(option)}
              >
                {option}
              </OptionBox>
            ))}
          </OptionsContainer>
          {selectedOption && (
            <StyledButton onClick={fetchStoryName}>
              Confirm Selection
            </StyledButton>
          )}
        </>
      )}

      {phase === 'generatingName' && <Message>Generating story name...</Message>}

      {phase === 'done' && (
        <>
          <Message>Story name generated: {storyName}</Message>
          <Message>Redirecting to game...</Message>
        </>
      )}
    </Container>
  );
};

export default IntroductionStory;

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

const Message = styled.p`
  font-size: 18px;
  color: rgb(173, 173, 173);
`;

const ErrorMessage = styled(Message)`
  color: #ff4d4f;
`;

const OptionsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
`;

const OptionBox = styled.div`
  flex: ${(props) => props.flex};
  padding: 15px;
  width: 30%;
  min-width: 150px;
  cursor: pointer;
  border-radius: 5px;
  border: ${(props) => (props.active ? '2px solid rgb(127, 127, 127)' : '1px solid #ccc')};
  background: #222;
  color: #fff;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;


const neonGlow = keyframes`
  0% { box-shadow: 0 0 10px #fff, 0 0 20px grey; }
  50% { box-shadow: 0 0 20px #fff, 0 0 40px grey; }
  100% { box-shadow: 0 0 10px #fff, 0 0 20px grey; }
`;

const StyledButton = styled.button`
flex: ${(props) => props.flex};
  padding: 12px 20px;
  font-size: 16px;
  margin-right: 10px;
  color: #fff;
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