import React from 'react'
import { FaUserPlus, FaSearch, FaPlay, FaTrophy } from 'react-icons/fa'
import { motion } from 'framer-motion'

const HowItWorks = () => {
  const steps = [
    {
      icon: <FaUserPlus />,
      title: "Sign Up",
      description: "Create your free account and set up your chess profile in minutes."
    },
    {
      icon: <FaSearch />,
      title: "Find Opponents",
      description: "Browse online players or let our matchmaking system find the perfect opponent."
    },
    {
      icon: <FaPlay />,
      title: "Play & Learn",
      description: "Enjoy exciting games while improving your skills with built-in analysis tools."
    },
    {
      icon: <FaTrophy />,
      title: "Climb Rankings",
      description: "Earn rating points, unlock achievements, and compete in tournaments."
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">How It Works</h2>
          <p className="section-description">
            Getting started with ChessMate is simple. Follow these easy steps 
            to begin your chess journey.
          </p>
        </motion.div>

        <motion.div 
          className="steps-container"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className="step"
              variants={itemVariants}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <div className="step-icon">
                  {step.icon}
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="cta-section"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3 className="cta-title">Ready to Start Playing?</h3>
          <p className="cta-description">
            Join thousands of chess players and experience the game like never before.
          </p>
          <button className="btn btn-primary btn-large">
            Get Started Free
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks