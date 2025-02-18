import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import OpenAI from 'openai';
import { getCurrentStoryNameID, getCurrentStory, getCurrentUserName } from '../utils/gameMemoryManager';
import { useNavigate } from 'react-router-dom';
import boxImage from '../assets/box.png';
import textboxImage from '../assets/box.png';

const key_eden = process.env.EDEN_API_KEY;
const key_openai = process.env.REACT_APP_API_KEY;

const openai = new OpenAI({ 
  apiKey: key_openai, 
  dangerouslyAllowBrowser: true 
});

/**
 * Save a memory record in localStorage.
 */
function saveMemoryRecord(assistentText, userChoice, userName, characterName) {
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
  const record = { timestamp, userChoice, userName };
  if (characterName) {
    record[`assistent_${characterName}`] = assistentText;
  } else {
    record.assistentText = assistentText;
  }
  if (!Array.isArray(memory.chatHistory)) {
    memory.chatHistory = [];
  }
  memory.chatHistory.push(record);
  localStorage.setItem(currentStoryName, JSON.stringify(memory));
}

/**
 * Parse the API response text into assistant's text and the three options.
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

/**
 * Extracts a character name from the beginning of the text if present.
 * For example, if the text starts with "Narrator: ..." it returns { characterName: "Narrator", cleanedText: "..." }.
 */
const extractCharacterName = (text) => {
  const colonIndex = text.indexOf(':');
  if (colonIndex !== -1) {
    const potentialName = text.substring(0, colonIndex).trim();
    if (potentialName.length > 0) {
      const cleanedText = text.substring(colonIndex + 1).trim();
      return { characterName: potentialName, cleanedText };
    }
  }
  return { characterName: null, cleanedText: text };
};

/**
 * Calls the image generation API with a prompt and returns an image URL.
 * Adapted to use a simple fetch() call instead of the eden-sdk.
 */
const fetchGeneratedImage = async (prompt) => {
  try {
    // Step 1: Create the image generation task
    const createResponse = await fetch('https://api.eden.art/v2/tasks/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': '4de5af1e9409b0e000d2445643f171427c41013ac32ca7f4', // Make sure key_eden is correctly set (consider using process.env.REACT_APP_EDEN_API_KEY)
      },
      body: JSON.stringify({
        tool: 'flux_dev_lora',
        args: {
          prompt: 'generate a flower field',
          aspect_ratio: "1:1",
          prompt_strength: 0.8,
          output_format: "png",
          output_quality: 95,
          disable_safety_checker: true,
          go_fast: false,
          seed: 274941510,
          num_inference_steps: 30,
          guidance: 2.5,
          lora_strength: 0.85,
          n_samples: 1
        }
      })
    });
    
    if (!createResponse.ok) {
      console.error("Error creating task:", createResponse.statusText);
      return null;
    }
    
    const createData = await createResponse.json();
    const taskId = createData.task._id;
    console.log('Task created with id:', taskId);
    
    // Step 2: Poll for the task completion (up to ~30 seconds)
    let attempts = 0;
    let result = null;
    while (attempts < 15) { // 15 attempts * 2 seconds = 30 seconds
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds between attempts
      
      const statusResponse = await fetch(`https://api.eden.art/v2/tasks/${taskId}`, {
        headers: {
          'X-Api-Key': '4de5af1e9409b0e000d2445643f171427c41013ac32ca7f4',
        }
      });
      
      if (!statusResponse.ok) {
        console.error("Error fetching task status:", statusResponse.statusText);
        break;
      }
      
      const statusData = await statusResponse.json();
      console.log('Task status:', statusData.task.status);
      
      // Check if the task is completed and a result exists
      if (statusData.task.status === "completed" && statusData.task.result) {
        result = statusData.task.result;
        break;
      }
      
      attempts++;
    }
    
    if (!result) {
      console.error("Task did not complete in time or returned no result.");
      return null;
    }
    
    // Parse the result to extract the image URL.
    // According to your sample, the result is an array containing an object with an "output" array.
    const imageUrl = result[0]?.output[0]?.url || null;
    console.log('Generated image URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

const GameInterface = () => {
  const [currentStoryName, setCurrentStoryNameState] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [lastGeneratedCharacter, setLastGeneratedCharacter] = useState(null);
  const navigate = useNavigate();
  const didFetch = useRef(false);

  useEffect(() => {
    const key = getCurrentStoryNameID();
    if (!key) {
      console.log('Key for game access does not exist.');
      // Optionally redirect or handle this case.
    }
    console.log('DEBUG: Current key of GameInterface:', key);
    setCurrentStoryNameState(key);
  }, []);

  const userName = getCurrentUserName();
  const storySummary = getCurrentStory();
  const objective = 'make the player have fun';
  const charTrait = ['fun', 'sexy', 'wild'];
  const context = '';

  const [conversationHistory, setConversationHistory] = useState([{
    role: 'user',
    content: `this is the summary of the story ${storySummary}
this is what happened up until now ${context}
you're both the narrator and different characters, think of an RPG and you're the dm.
currently you're an alien and your objective is ${objective}.
you can either say something as the narrator or as the current character.
please add this into the <assistent's text> tag.
dont talk about yourself in the 3rd person.
make sure to always say something as an assistent, and always start the assistent's text with who's currently talking (e.g., Narrator or the character's name).
you also give the player three different options, each corresponding to one of the player's character traits ${charTrait}.
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
  const [characterName, setCharacterName] = useState(null);

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

      // Extract character name and clean the assistant text.
      const { characterName: extractedName, cleanedText } = extractCharacterName(parsed.assistentText);
      setCharacterName(extractedName);
      setLastassistentText(cleanedText);

      // Check if we need to trigger a new image generation.
      if (extractedName && extractedName !== lastGeneratedCharacter) {
        // Build a prompt for image generation that combines the character and the context.
        const imagePrompt = `A detailed illustration of ${extractedName} in a scene that reflects the story: ${storySummary}`;
        const imageUrl = await fetchGeneratedImage(imagePrompt);
        if (imageUrl) {
          setGeneratedImage(imageUrl);
          setLastGeneratedCharacter(extractedName);
        }
      }

      const responseMessage = { role: 'assistant', content: responseContent };
      setConversationHistory([...messages, responseMessage]);

      // Use the cleaned text for pagination.
      const pages = paginateText(cleanedText, 200);
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
    saveMemoryRecord(lastassistentText, optionText, userName, characterName);
    fetchGameData(optionText);
  };

  return (
    <GameInterfaceContainer>
      {/* If there's a generated image, display it as a background overlay */}
      {generatedImage && <BackgroundImage src={generatedImage} alt="Generated Scene" />}
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

/* Styled Components for aesthetic adjustments only. */

const GameInterfaceContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
`;

const BackgroundImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: 0.5;
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
    animation: ${shimmer} 10s infinite;
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

const DialogueText = styled.p`
  margin: 0;
  padding: 0 10px;
  font-size: 24px;
  color: rgb(222, 222, 222);
`;

const MetalButton = styled.button`
  padding: 10px;
  font-size: 24px;
  font-family: 'Cinzel', serif;
  font-weight: bold;
  letter-spacing: 1px;
  color: rgb(222, 222, 222);
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

const OptionButton = styled(SpecialMetalButton)``;
