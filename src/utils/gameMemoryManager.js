const GAME_MEMORY_PREFIX = 'story-';

export const saveGameMemory = (key, memory) => {
  localStorage.setItem(key, JSON.stringify(memory));
};

export const getGameMemory = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const removeGameMemory = (key) => {
  localStorage.removeItem(key);
};

export const listGameMemories = () => {
  return Object.keys(localStorage).filter(key => key.startsWith(GAME_MEMORY_PREFIX));
};

export const setCurrentStoryName = (key) => {
  localStorage.setItem('currentStoryName', key);
};

export const getCurrentStoryNameID = () => {
  return localStorage.getItem('currentStoryName');
};

export const getCurrentUserName = () => {
    const currentStoryName = getCurrentStoryNameID();
    if (!currentStoryName) return null;
    const memory = getGameMemory(currentStoryName);
    return memory && memory.setup ? memory.setup.userName : null;
};

export const getCurrentStory = () => {
    const currentStoryKey = getCurrentStoryNameID();
    if (!currentStoryKey) return null;
    return getGameMemory(currentStoryKey);
};

export const getCurrentSetting = () => {
  const currentStoryKey = getCurrentStoryNameID();
  if (!currentStoryKey) return null;
  const memory = getGameMemory(currentStoryKey);
  return memory?.setup?.genreSetting?.setting || null;
};

export const getPersonalityTraits = () => {
  const currentStoryKey = getCurrentStoryNameID();
  if (!currentStoryKey) return null;
  const memory = getGameMemory(currentStoryKey);
  return memory?.setup?.personalityTraits || null;
};

