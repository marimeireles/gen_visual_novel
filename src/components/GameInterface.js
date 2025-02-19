import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import OpenAI from 'openai';
import { getCurrentStoryNameID, getCurrentStory, getCurrentUserName, getPersonalityTraits } from '../utils/gameMemoryManager';
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

  // Build a summary of the conversation (assistant texts and chosen options)
  let summary = '';
  memory.chatHistory.forEach(rec => {
    // Append the user option
    if (rec.userChoice) {
      summary += `Option: ${rec.userChoice}\n`;
    }
    // Append the assistant's text. It might be stored under a generic key or under a character-specific key.
    if (rec.assistentText) {
      summary += `Assistant: ${rec.assistentText}\n`;
    } else {
      Object.keys(rec).forEach(key => {
        if (key.startsWith("assistent_")) {
          // Remove the "assistent_" prefix for clarity
          const charName = key.replace("assistent_", "");
          summary += `Assistant (${charName}): ${rec[key]}\n`;
        }
      });
    }
  });

  // Add the summary as a top-level entry in the memory object
  memory.summary = summary;

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
 */
const fetchGeneratedImage = async (prompt) => {
  try {
    // Step 1: Create the image generation task
    const createResponse = await fetch('https://api.eden.art/v2/tasks/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': '4de5af1e9409b0e000d2445643f171427c41013ac32ca7f4',
      },
      body: JSON.stringify({
        tool: 'flux_dev_lora',
        args: {
          lora: '677f7f35021f37c66c49a20b',
          prompt: prompt,
          aspect_ratio: "1:1",
          prompt_strength: 0.8,
          output_format: "png",
          output_quality: 95,
          disable_safety_checker: true,
          go_fast: false,
          seed: 274941510,
          num_inference_steps: 30,
          guidance: 2.5,
          lora_strength: 1,
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

    // Poll for the task completion
    let attempts = 0;
    let result = null;
    while (attempts < 25) { // 15 attempts * 2 seconds = 30 seconds
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
    const imageUrl = result[0]?.output[0]?.url || null;
    console.log('Generated image URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};

/**
 * Summarizes the conversation history by filtering out the initial prompt.
 * Only includes exchanges between the assistant and the user.
 */
const summarizeBackstory = async (conversation) => {
  // Filter out the initial long prompt message if present.
  const gameMessages = conversation.filter((msg, index) => {
    // Assume the first message (system or user) is the setup prompt if it contains "this is the summary"
    if (
      index === 0 &&
      msg.role === 'user' &&
      msg.content.toLowerCase().includes('this is the summary of the story')
    ) {
      return false;
    }
    return msg.role === 'user' || msg.role === 'assistant';
  });

  const promptForSummary =
    `Summarize the following game conversation, focusing on the assistant's responses and the user's choices, and ignoring the initial prompt:\n\n` +
    gameMessages
      .map(
        (msg) =>
          `${msg.role === 'assistant' ? 'Assistant' : 'User'}: ${msg.content}`
      )
      .join('\n');

  try {
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: 'system', content: 'You are an assistant that summarizes game conversations.' },
        { role: 'user', content: promptForSummary }
      ],
    });
    const summary = summaryResponse.choices[0].message.content.trim();
    return summary;
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return "";
  }
};

const GameInterface = () => {
  const [currentStoryName, setCurrentStoryNameState] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [lastGeneratedCharacter, setLastGeneratedCharacter] = useState(null);
  // Keep track of the last used background prompt
  const [lastBackgroundPrompt, setLastBackgroundPrompt] = useState('');
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
  const charTrait = getPersonalityTraits();
  const context = '';

  // Initialize conversationHistory with the initial long prompt.
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
it's very important you always say something your role as a narrator/game master is the most important
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

  // Helper function to decide if we should change the background image
  const decideIfBackgroundShouldChange = async (previousPrompt, newPrompt) => {
    try {
      const decisionMessages = [
        {
          role: 'system',
          content: 'You are an assistant that determines if the background image should be updated based on changes in character or scene description. Answer only with "yes" or "no".'
        },
        {
          role: 'user',
          content: `The previous background prompt was: ${previousPrompt || "none"}. The new background prompt is: ${newPrompt}. Should we update the background image?`
        }
      ];
      const decisionResponse = await openai.chat.completions.create({
         model: "gpt-4o-mini",
         messages: decisionMessages,
      });
      const decisionText = decisionResponse.choices[0].message.content.trim().toLowerCase();
      console.log("Decision from OpenAI:", decisionText);
      if (decisionText.includes("yes")) {
         return "yes";
      }
      return "no";
    } catch (error) {
       console.error("Error deciding background change:", error);
       return "no";
    }
  };

  const fetchGameData = async (newMessage = null) => {
    setLoading(true);
    // If a new user message exists, append it; otherwise use the current conversation history.
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

      let conversationSnippet = "";
      if (newMessage) {
        conversationSnippet = `User: ${newMessage} Assistant: ${cleanedText}`;
      } else if (conversationHistory.length > 0) {
        // If the conversation has already been summarized, use that summary.
        conversationSnippet = conversationHistory[0].role === 'system'
          ? conversationHistory[0].content
          : storySummary;
      } else {
        conversationSnippet = storySummary;
      }
      const userName = getCurrentUserName();
      const currentStoryName = localStorage.getItem('currentStoryName');
      const memoryData = currentStoryName ? JSON.parse(localStorage.getItem(currentStoryName)) : {};
      const memorySummary = memoryData.summary || "";
      console.log('memorySummary: ', memorySummary)
      const newImagePrompt = `A detailed illustration representing this scenario ${conversationSnippet}, remember the ${userName} shouldn’t be represented in the story nor the narrator, only other characters should be represented. This is what happened last: ${memorySummary}`;

      // Only check for a new background image if the character has changed or the prompt is different.
      if (extractedName !== lastGeneratedCharacter || newImagePrompt !== lastBackgroundPrompt) {
        const decision = await decideIfBackgroundShouldChange(lastBackgroundPrompt, newImagePrompt);
        if (decision === 'yes') {
          const imageUrl = await fetchGeneratedImage(newImagePrompt);
          if (imageUrl) {
            setGeneratedImage(imageUrl);
            setLastBackgroundPrompt(newImagePrompt);
            setLastGeneratedCharacter(extractedName);
          }
        }
      }

      // Append the assistant's response to the conversation.
      const responseMessage = { role: 'assistant', content: responseContent };
      const updatedHistory = [...messages, responseMessage];
      setConversationHistory(updatedHistory);

      // Paginate the cleaned assistant text.
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
