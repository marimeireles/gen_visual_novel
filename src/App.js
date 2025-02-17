// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import NewGameSetup from './components/NewGameSetup';
import IntroductionStory from './components/IntroductionStory';
import GameInterface from './components/GameInterface';
import LoadGame from './components/LoadGame';
import LittleMartianGame from './components/LittleMartianGame';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/new-game" element={<NewGameSetup />} />
        <Route path="/introduction" element={<IntroductionStory />} />
        <Route path="/load-game" element={<LoadGame />} />
        <Route path="/game" element={<GameInterface />} />
        <Route path="/litle-martian" element={<LittleMartianGame />} />
      </Routes>
    </Router>
  );
}

export default App;
