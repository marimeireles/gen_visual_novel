// src/components/GameInterface.js
import React, { useState, useEffect } from 'react';
// NOTE: Using the OpenAI library in a client-side app can expose your API key.
// In a real-world app, proxy these requests through a secure backend.
import OpenAI from 'openai';
import { getCurrentStoryName, getCurrentUserName } from '../utils/gameMemoryManager';
import { useNavigate } from 'react-router-dom';

const apiKey = process.env.API_KEY;

const openai = new OpenAI({ 
  apiKey: apiKey, 
  dangerouslyAllowBrowser: true 
});

/**
 * Save a memory record in localStorage.
 * The records are stored in an object keyed by game name.
 * Each record contains a timestamp, Kat's text, the user's name, and the option chosen.
 */
function saveMemoryRecord(katText, userChoice, userName) {
  // Retrieve the current story name.
  const currentStoryName = localStorage.getItem('currentStoryName');
  if (!currentStoryName) {
    console.error("No current story found. Please start a new game first.");
    return;
  }
  
  // Retrieve the existing memory for the current story.
  const memory = JSON.parse(localStorage.getItem(currentStoryName));
  if (!memory) {
    console.error("No memory data found for the current story.");
    return;
  }
  
  // Create a timestamp.
  const timestamp = new Date().toLocaleString();
  // Build the new record.
  const record = {
    timestamp,
    katText,
    userChoice,
    userName,
  };

  // Append the record to the chatHistory.
  if (!Array.isArray(memory.chatHistory)) {
    memory.chatHistory = [];
  }
  memory.chatHistory.push(record);
  
  // Save the updated memory back under the current story key.
  localStorage.setItem(currentStoryName, JSON.stringify(memory));
}



/**
 * Parse the API response text into Kat's text and the three options.
 * The expected format is:
 *   Kat: <Kat's text>
 *   option 1: <option 1 text>
 *   option 2: <option 2 text>
 *   option 3: <option 3 text>
 */
const parseApiResponse = (responseText) => {
  const lines = responseText.split('\n').filter(line => line.trim() !== '');
  let katText = "";
  let option1 = "";
  let option2 = "";
  let option3 = "";
  lines.forEach((line) => {
    if (line.toLowerCase().startsWith("kat:")) {
      katText = line.substring("kat:".length).trim();
    } else if (line.toLowerCase().startsWith("option 1:")) {
      option1 = line.substring("option 1:".length).trim();
    } else if (line.toLowerCase().startsWith("option 2:")) {
      option2 = line.substring("option 2:".length).trim();
    } else if (line.toLowerCase().startsWith("option 3:")) {
      option3 = line.substring("option 3:".length).trim();
    }
  });
  return { katText, option1, option2, option3 };
};

const GameInterface = () => {
  const [currentStoryName, setCurrentStoryNameState] = useState('');

  useEffect(() => {
    const key = getCurrentStoryName();
    if (!key) {
      console.log('Key for game access doesnt exist. You might have erased your cache or this is a bigger problem sorry!')
    }
    console.log('this is the current key of this GameInterface', key)
    setCurrentStoryNameState(key);
  }, []);

  const userName = getCurrentUserName();;

  // State to manage conversation history, text pagination, options, and the last response from Kat.
  const [conversationHistory, setConversationHistory] = useState([{
    role: 'user',
    content: `you're a kawaii anime cat girl called "Kat" talking to a nerd playing a visual novel
make sure to obey the following format:
Kat: <Kat's text>
option 1: <option 1 text>
option 2: <option 2 text>
option 3: <option 3 text>`
  }]);
  const [characterPages, setCharacterPages] = useState([]); // Paginated text of Kat's response
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [options, setOptions] = useState([]); // Option strings for the user to choose from
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  // Store the full Kat text from the most recent API response (before pagination)
  const [lastKatText, setLastKatText] = useState("");

  // Helper function to split text into pages (200 characters each)
  const paginateText = (text, pageSize = 200) => {
    const pages = [];
    for (let i = 0; i < text.length; i += pageSize) {
      pages.push(text.substring(i, i + pageSize));
    }
    return pages;
  };

  // Function to call the OpenAI API and update state with the response.
  const fetchGameData = async (newMessage = null) => {
    setLoading(true);
    // Build the messages array for the API call.
    const messages = newMessage
      ? [...conversationHistory, { role: 'user', content: newMessage }]
      : conversationHistory;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        store: true,
        messages: messages,
      });
      // Extract the assistant's response.
      const responseContent = completion.choices[0].message.content;
      const parsed = parseApiResponse(responseContent);

      // Save the full Kat text in state (to use when the user picks an option)
      setLastKatText(parsed.katText);

      // Update conversation history with the API response.
      const responseMessage = { role: 'assistant', content: responseContent };
      setConversationHistory([...messages, responseMessage]);

      // Paginate Kat's text for display purposes.
      const pages = paginateText(parsed.katText, 200);
      setCharacterPages(pages);
      setCurrentPageIndex(0);

      // Set the options for the user to choose from.
      setOptions([parsed.option1, parsed.option2, parsed.option3]);
      setShowOptions(false);
    } catch (error) {
      console.error("API error:", error);
    }
    setLoading(false);
  };

  // Initial API call when the component mounts.
  useEffect(() => {
    fetchGameData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler for displaying the next chunk of Kat's text.
  const handleNextText = () => {
    if (currentPageIndex < characterPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      // Once all pages are shown, reveal the options.
      setShowOptions(true);
    }
  };

  /**
   * When the user selects an option, we first save the memory record.
   * The memory record includes:
   *  - The current timestamp
   *  - Kat's full text (from the last API response)
   *  - The user's selected option
   *  - The user's name
   * Then, we send the chosen option back to the API.
   */
  const handleOptionClick = (optionText) => {
    // Save the memory record.
    saveMemoryRecord(lastKatText, optionText, userName);
    // Then, send the user's option to fetch the next game state.
    fetchGameData(optionText);
  };

  return (
    <div className="game-interface">
      <div
        className="background"
        style={{
          backgroundImage: `url(${"default-background.jpg"})`, // Replace with your dynamic background if needed.
          height: '100vh',
          backgroundSize: 'cover',
          position: 'relative',
        }}
      >
        {/* Character overlay image (if needed) */}
        <img
          src={"default-character.png"} // Replace with your dynamic character image if needed.
          alt="Character"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            maxHeight: '80vh',
          }}
        />

        {/* Text box overlay */}
        <div
          className="text-box"
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '10%',
            right: '10%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            padding: '20px',
            borderRadius: '8px',
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
            // Render option buttons when all of Kat's text has been shown.
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
