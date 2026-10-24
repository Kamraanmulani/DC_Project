import React from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartPlaying = () => {
    navigate('/gamemode');
  };

  return (
    <>
      <Header />
      <Hero onStartPlaying={handleStartPlaying} />
      <Features />
      <HowItWorks />
      <Footer />
    </>
  );
};

export default HomePage;