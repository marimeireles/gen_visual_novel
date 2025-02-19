import React from 'react';
import styled, { keyframes } from 'styled-components';

const About = () => {
  return (
    <Container>
      <Title>About This Project</Title>
      <Paragraph>
      <Paragraph></Paragraph>
      This code was written in a week at Mars College 2025 and you're free to learn, study and modify this code however way you want as long as you keep it open. Thanks to all folks that talked to me about this project or supported me in one way or the other:
      </Paragraph>
      <List>
        <ListItem>Gene, Flo, @drmbt for coding</ListItem>
        <ListItem>Alejandro, Jack, Xander for discussing the RAG algorithm</ListItem>
        <ListItem>Vanessa and Maria Clara for their universes and LoRAs</ListItem>
        <ListItem>Eden people for building Eden</ListItem>
        <ListItem>Martians for building an environment that I can feel happy debugging React code</ListItem>
      </List>
    </Container>
  );
};

export default About;

// Styled Components

const Container = styled.div`
  text-align: center;
  padding: 50px 20px;
  background: linear-gradient(135deg, #000, #111);
  min-height: 100vh;
  color: #fff;
`;

const Title = styled.h2`
  font-family: 'Cinzel', serif;
  font-size: 48px;
  color: rgb(173, 173, 173);
  margin-bottom: 30px;
  text-shadow: 0 0 20px grey, 0 0 40px grey;
`;

const Paragraph = styled.p`
  font-size: 20px;
  color: rgb(173, 173, 173);
  margin-bottom: 30px;
  line-height: 1.5;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const Subtitle = styled.h3`
  font-size: 24px;
  color: rgb(173, 173, 173);
  margin-bottom: 20px;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  font-size: 20px;
  color: rgb(173, 173, 173);
  margin-bottom: 10px;
`;

// Optional: You can add neon animation if you'd like to spice up elements such as the Title

const neonGlow = keyframes`
  0% { text-shadow: 0 0 10px #fff, 0 0 20px grey; }
  50% { text-shadow: 0 0 20px #fff, 0 0 40px grey; }
  100% { text-shadow: 0 0 10px #fff, 0 0 20px grey; }
`;

const NeonTitle = styled(Title)`
  animation: ${neonGlow} 2s infinite;
`;

