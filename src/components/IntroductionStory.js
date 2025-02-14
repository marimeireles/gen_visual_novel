// src/components/IntroductionStory.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OpenAI from 'openai';
import { getCurrentStoryName, getGameMemory, saveGameMemory } from '../utils/gameMemoryManager';

const openai = new OpenAI({ 
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const storyKey = getCurrentStoryName();
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
        model: "gpt-4o",
        messages: [{ role: 'user', content: prompt }],
      });
      let generatedName = completion.choices[0].message.content.trim();
      generatedName = processStoryName(generatedName);
      setStoryName(generatedName);
      updateMemoryWithStory(generatedName, selectedOption);
      setPhase('done');
      // Redirect to game interface shortly after.
      setTimeout(() => navigate('/game'), 1000);
    } catch (err) {
      console.error("Error generating story name:", err);
      setError("Failed to generate story name.");
    }
    setLoading(false);
  };

  // Process the generated story name: remove non-ASCII, replace spaces, and limit length.
  const processStoryName = (name) => {
    name = name.replace(/[^\x00-\x7F]/g, "");
    name = name.replace(/\s+/g, "_");
    if (name.length > 30) {
      name = name.substring(0, 30);
    }
    return name;
  };

  // Update the stored memory with the introduction details.
  const updateMemoryWithStory = (storyName, chosenOption) => {
    const currentKey = getCurrentStoryName(); // e.g., "story-Mari-<timestamp>"
    let chatMemory = getGameMemory(currentKey);
    if (!chatMemory) {
      console.error("No memory found for key:", currentKey);
      return;
    }
    // Update the memory with introduction info.
    chatMemory.introduction = {
      chosenOption,
      storyName,
    };
    // Save the updated memory using our memory manager.
    saveGameMemory(currentKey, chatMemory);
    // Optionally store the final story name separately.
    localStorage.setItem('storyName', storyName);
  };

  return (
    <div style={styles.container}>
      <h2>Introduction to Your Story</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {phase === 'displayOptions' && storyOptions.length > 0 && (
        <div>
          <p>Please select one of the following story beginnings:</p>
          <div style={styles.optionsContainer}>
            {storyOptions.map((option, index) => (
              <div
                key={index}
                style={{
                  ...styles.optionBox,
                  border: selectedOption === option ? '2px solid #007bff' : '1px solid #ccc',
                }}
                onClick={() => setSelectedOption(option)}
              >
                {option}
              </div>
            ))}
          </div>
          {selectedOption && (
            <button style={styles.button} onClick={fetchStoryName}>
              Confirm Selection
            </button>
          )}
        </div>
      )}

      {phase === 'generatingName' && <p>Generating story name...</p>}

      {phase === 'done' && (
        <div>
          <p>Story name generated: {storyName}</p>
          <p>Redirecting to game...</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '50px',
  },
  optionsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
  },
  optionBox: {
    padding: '15px',
    width: '30%',
    minWidth: '150px',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default IntroductionStory;
