import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import OpenAI from 'openai';
import { getCurrentStoryNameID, getCurrentStory, getCurrentUserName } from '../utils/gameMemoryManager';
import { useNavigate } from 'react-router-dom';
import textboxImage from '../assets/box.png'; // Could be custom

const apiKey = process.env.REACT_APP_API_KEY;
const openai = new OpenAI({ 
  apiKey, 
  dangerouslyAllowBrowser: true 
});

const LittleMartianGame = () => {
  const navigate = useNavigate();
  const [currentStoryName, setCurrentStoryNameState] = useState('');
  const [conversationHistory, setConversationHistory] = useState([
    {
      role: 'user',
      content: `Welcome to the Little Martian Adventure!
                You are a daring little martian setting out on an interplanetary quest across the red planet.
                Follow this format in your responses:
                Assistence: <Assistence's text>
                option 1: <option 1 text>
                option 2: <option 2 text>
                option 3: <option 3 text>
                `
    }
  ]);
  const [characterPages, setCharacterPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAssistentText, setLastAssistentText] = useState("");

  // Retrieve current story key on mount
  useEffect(() => {
    const key = getCurrentStoryNameID();
    if (!key) {
      console.error("No current story found. Please start a new game first.");
      // Optionally redirect the user back to setup
      navigate('/');
      return;
    }
    setCurrentStoryNameState(key);
  }, [navigate]);

  const userName = getCurrentUserName();
  const storySummary = getCurrentStory();

  // Simple text pagination: splits the text into pages of up to 200 characters
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
        messages,
      });
      const responseContent = completion.choices[0].message.content;
      const parsed = parseApiResponse(responseContent);

      setLastAssistentText(parsed.assistentText);
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
    fetchGameData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextText = () => {
    if (currentPageIndex < characterPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      setShowOptions(true);
    }
  };

  const handleOptionClick = (optionText) => {
    saveMemoryRecord(lastAssistentText, optionText, userName);
    fetchGameData(optionText);
  };

  return (
    <MartianGameContainer>
      <MartianTextBoxBackground />
      <MartianContentContainer>
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
      </MartianContentContainer>
    </MartianGameContainer>
  );
};

export default LittleMartianGame;

/**
 * Parses the API response into the assistant's text and the three option texts.
 * Expected format:
 *   Assistence: <Assistence's text>
 *   option 1: <option 1 text>
 *   option 2: <option 2 text>
 *   option 3: <option 3 text>
 */
function parseApiResponse(responseText) {
  const lines = responseText.split('\n').filter(line => line.trim() !== '');
  let assistentText = "";
  let option1 = "";
  let option2 = "";
  let option3 = "";
  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("assistence:")) {
      assistentText = line.substring("assistence:".length).trim();
    } else if (line.toLowerCase().startsWith("option 1:")) {
      option1 = line.substring("option 1:".length).trim();
    } else if (line.toLowerCase().startsWith("option 2:")) {
      option2 = line.substring("option 2:".length).trim();
    } else if (line.toLowerCase().startsWith("option 3:")) {
      option3 = line.substring("option 3:".length).trim();
    }
  });
  return { assistentText, option1, option2, option3 };
}

/**
 * Saves a memory record to localStorage for the current game.
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

/* ===================== Styled Components ===================== */

const MartianGameContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  /* Martian-themed background: dark red to burnt orange */
  background: linear-gradient(135deg, #4b0000, #ff4500);
  overflow: hidden;
`;

const martianShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const MartianTextBoxBackground = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 100%;
  height: 250px;
  background-image: url(${textboxImage});
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  filter: drop-shadow(0 0 0.1rem rgba(150, 0, 0, 0.7));
  z-index: 0;
  
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
    animation: ${martianShimmer} 15s infinite;
    mask-image: url(${textboxImage});
    mask-size: cover;
    mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-image: url(${textboxImage});
    -webkit-mask-size: cover;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
  }
`;

const MartianContentContainer = styled.div`
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

const DialogueText = styled.p`
  margin: 0;
  padding: 0 10px;
  font-size: 24px;
  color: #ffe4e1;
`;

const MetalButton = styled.button`
  padding: 10px;
  font-size: 24px;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  letter-spacing: 1px;
  color: #ffe4e1;
  text-align: center;
  white-space: normal;
  overflow-wrap: break-word;
  background: linear-gradient(145deg, #330000, #660000);
  border: 2px solid #990000;
  border-radius: 15px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.8),
              inset 0 -4px 10px rgba(255, 255, 255, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  clip-path: polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #660000, #330000);
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
    animation: ${martianShimmer} 3s infinite;
  }
`;

const NextButton = styled(MetalButton)`
  position: absolute;
  left: 85%;
  bottom: -20px;
  z-index: 2;
`;

const OptionsContainer = styled.div`
  display: flex;
  gap: 15px;
`;

const OptionButton = styled(MetalButton)`
  font-size: 18px;
`;

