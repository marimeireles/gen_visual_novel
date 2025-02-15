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

export const getCurrentStoryName = () => {
  return localStorage.getItem('currentStoryName');
};

export const getCurrentUserName = () => {
    const currentStoryName = getCurrentStoryName();
    if (!currentStoryName) return null;
    const memory = getGameMemory(currentStoryName);
    return memory && memory.setup ? memory.setup.userName : null;
  };
  
