import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { getCurrentStoryName, getCurrentUserName } from '../utils/gameMemoryManager';
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
};

const GameInterface = () => {
  const [currentStoryName, setCurrentStoryNameState] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const key = getCurrentStoryName();
    if (!key) {
      console.log('Key for game access does not exist. You might have erased your cache or this is a bigger problem, sorry!');
      // Optionally redirect or handle this case.
    }
    console.log('Current key of GameInterface:', key);
    setCurrentStoryNameState(key);
  }, []);

  const userName = getCurrentUserName();

  const [conversationHistory, setConversationHistory] = useState([{
    role: 'user',
    content: `you're a kawaii anime cat girl called "Assistence" talking to a nerd playing a visual novel
make sure to obey the following format:
Assistence: <Assistence's text>
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
    saveMemoryRecord(lastassistentText, optionText, userName);
    fetchGameData(optionText);
  };

  return (
    <div className="game-interface">
      <div
        className="background"
        style={{
          backgroundImage: `url(${boxImage})`,
          height: '100vh',
          backgroundSize: 'cover',
          position: 'relative',
        }}
      >
        {/* <img
          src={characterImage}
          alt="Character"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            maxHeight: '80vh',
          }}
        /> */}

        {/* New image-based text box overlay */}
        <div
          className="text-box"
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '50px',
            right: '50px',
            height: '200px',
            backgroundImage: `url(${textboxImage})`,
            backgroundPosition: 'center',
            padding: '20px',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '18px',
          }}
        >
          {loading ? (
            <p>Loading...</p>
          ) : !showOptions ? (
            <>
              <p>{characterPages[currentPageIndex]}</p>
              <button onClick={handleNextText}>Next</button>
            </>
          ) : (
            <div className="options">
              {options.map((option, index) => (
                <button key={index} onClick={() => handleOptionClick(option)}>
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInterface;
