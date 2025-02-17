import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import OpenAI from 'openai';
import { getCurrentStoryNameID, getCurrentStory, getCurrentUserName } from '../utils/gameMemoryManager';
import { useNavigate } from 'react-router-dom';
import boxImage from '../assets/box.png';
import textboxImage from '../assets/box.png';
// import characterImage from '../assets/default-character.png';

const apiKey = process.env.REACT_APP_API_KEY;

const openai = new OpenAI({ 
  apiKey: apiKey, 
  dangerouslyAllowBrowser: true 
});

/**
 * Save a memory record in localStorage.
 * The records are stored in an object keyed by game name.
 * Each record contains a timestamp, Assistence's text, the user's name, and the option chosen.
 */
function saveMemoryRecord(assistentText, userChoice, userName) {
  const currentStoryName = localStorage.getItem('currentStoryName');
  if (!currentStoryName) {
    console.error("No current story found. Please start a new game first.");
    return;
  }

  const memory = JSON.parse(localStorage.getItem(currentStoryName));
  if (!memory) {
    console.error("No memory data found for the current story.");
    return;
  }
  
  const timestamp = new Date().toLocaleString();
  const record = {
    timestamp,
    assistentText,
    userChoice,
    userName,
  };

  if (!Array.isArray(memory.chatHistory)) {
    memory.chatHistory = [];
  }
  memory.chatHistory.push(record);

  localStorage.setItem(currentStoryName, JSON.stringify(memory));
}

/**
 * Parse the API response text into Assistence's text and the three options.
 * Expected format:
 *   Assistence: <Assistence's text>
 *   option 1: <option 1 text>
 *   option 2: <option 2 text>
 *   option 3: <option 3 text>
 */
const parseApiResponse = (responseText) => {
  const lines = responseText.split('\n').filter(line => line.trim() !== '');
  let assistentText = "";
  let option1 = "";
  let option2 = "";
  let option3 = "";
  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("assistent:")) {
      assistentText = line.substring("assistent:".length).trim();
    } else if (line.toLowerCase().startsWith("option 1:")) {
      option1 = line.substring("option 1:".length).trim();
    } else if (line.toLowerCase().startsWith("option 2:")) {
      option2 = line.substring("option 2:".length).trim();
    } else if (line.toLowerCase().startsWith("option 3:")) {
      option3 = line.substring("option 3:".length).trim();
    }
  });
  return { assistentText, option1, option2, option3 };
};

const GameInterface = () => {
  const [currentStoryName, setCurrentStoryNameState] = useState('');
  const navigate = useNavigate();
  const didFetch = useRef(false);

  useEffect(() => {
    const key = getCurrentStoryNameID();
    if (!key) {
      console.log('Key for game access does not exist. You might have erased your cache or this is a bigger problem, sorry!');
      // TODO: Optionally redirect or handle this case.
    }
    console.log('DEBUG: Current key of GameInterface:', key);
    setCurrentStoryNameState(key);
  }, []);

  const userName = getCurrentUserName();
  const storySummary = getCurrentStory();
  const objective = 'make the player have fun'
  const charTrait = ['fun', 'sexy', 'wild']
  const context = ''

  const [conversationHistory, setConversationHistory] = useState([{
    role: 'user',
    content: `this is the summary of the story ${storySummary}
    this is what happened up until now ${context}
    you're both the narrator and different characters, think of an RPG and you're the dm
    currently you're an alien and your objective is ${objective}
    you can either say smth as the narrator or as the current character. please add this into the <assistent's text> tag
    dont talk about yourself in the 3rd person
    make sure to always say something as an assistent. always talk about yourself in the first person and the player in the 2nd person
    you also give the player three different options, each one of them corresponding to one of the player's character traits ${charTrait}
    make sure your replies obey the following format:
    assistent: <assistent's text>
    option 1: <option 1 text>
    option 2: <option 2 text>
    option 3: <option 3 text>`
  }]);
  const [characterPages, setCharacterPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastassistentText, setLastassistentText] = useState("");

  const paginateText = (text, pageSize = 200) => {
    const pages = [];
    for (let i = 0; i < text.length; i += pageSize) {
      pages.push(text.substring(i, i + pageSize));
    }
    return pages;
  };

  const fetchGameData = async (newMessage = null) => {
    setLoading(true);
    const messages = newMessage
      ? [...conversationHistory, { role: 'user', content: newMessage }]
      : conversationHistory;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: messages,
      });
      const responseContent = completion.choices[0].message.content;
      const parsed = parseApiResponse(responseContent);

      setLastassistentText(parsed.assistentText);
      const responseMessage = { role: 'assistant', content: responseContent };
      setConversationHistory([...messages, responseMessage]);

      const pages = paginateText(parsed.assistentText, 200);
      setCharacterPages(pages);
      setCurrentPageIndex(0);
      setOptions([parsed.option1, parsed.option2, parsed.option3]);
      setShowOptions(false);
    } catch (error) {
      console.error("API error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!didFetch.current) {
      fetchGameData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      didFetch.current = true;
    }
  }, []);

  const handleNextText = () => {
    if (currentPageIndex < characterPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      setShowOptions(true);
    }
  };

  const handleOptionClick = (optionText) => {
    saveMemoryRecord(lastassistentText, optionText, userName);
    fetchGameData(optionText); // This sends the selected option as the next user message.
  };

  return (
    <GameInterfaceContainer>
      <TextBoxBackground />
      <ContentContainer>
        {loading ? (
          <DialogueText>Loading...</DialogueText>
        ) : !showOptions ? (
          <>
            <DialogueText>{characterPages[currentPageIndex]}</DialogueText>
            <NextButton onClick={handleNextText}>Next</NextButton>
          </>
        ) : (
          <OptionsContainer>
            {options.map((option, index) => (
              <OptionButton key={index} onClick={() => handleOptionClick(option)}>
                {option}
              </OptionButton>
            ))}
          </OptionsContainer>
        )}
      </ContentContainer>
    </GameInterfaceContainer>
  );
};

export default GameInterface;

/* Styled Components for aesthetic adjustments only.
   Layout dimensions and positions remain the same as before.
*/

const GameInterfaceContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const TextBoxBackground = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 100%;
  height: 250px;
  background-image: url(${textboxImage});
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 0.1rem rgb(122, 122, 122));
  z-index: 0;
  
  /* Pseudo-element for shimmering effect */
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 15s infinite;
    
    /* Apply the PNG as a mask so the shimmer only appears on opaque parts */
    mask-image: url(${textboxImage});
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-image: url(${textboxImage});
    -webkit-mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
  }
`;

const ContentContainer = styled.div`
  position: absolute;
  bottom: 100px;
  left: 200px;
  width: 75%;
  height: 100px;
  z-index: 1;
  font-family: 'Cinzel', serif;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

// Increased font-size for larger text display
const DialogueText = styled.p`
  margin: 0;
  padding: 0 10px;
  font-size: 24px;
  color: rgb(222, 222, 222); /* Updated text color */
`;

const MetalButton = styled.button`
  padding: 10px;
  font-size: 24px;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  letter-spacing: 1px;
  color: rgb(222, 222, 222); /* Updated text color */
  text-align: center;
  white-space: normal;
  overflow-wrap: break-word;
  background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
  border: 2px solid #333;
  border-radius: 15px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.8),
              inset 0 -4px 10px rgba(255, 255, 255, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  clip-path: polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #333, #1a1a1a);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6),
                0 10px 20px rgba(0, 0, 0, 1);
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

const SpecialMetalButton = styled.button`
  padding: 10px;
  font-size: 18px;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  letter-spacing: 1px;
  color: #fff;
  text-align: center;
  white-space: normal;
  overflow-wrap: break-word;
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
    box-shadow: 0 0 20px rgba(222, 222, 222, 0.6), 0 10px 20px rgba(0, 0, 0, 1);
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

// Next button uses the metal style while preserving its absolute position.
const NextButton = styled(MetalButton)`
  position: absolute;
  left: 85%;
  bottom: -20px;
  z-index: 2;
`;

// Container for option buttons when options are shown.
const OptionsContainer = styled.div`
  display: flex;
  gap: 15px;
`;

// Option buttons using the same metal style.
const OptionButton = styled(SpecialMetalButton)``;
