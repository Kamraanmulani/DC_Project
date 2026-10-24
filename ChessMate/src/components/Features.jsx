import React from 'react'
import { FaGlobeAmericas, FaBrain, FaUsers, FaMobile, FaClock, FaShieldAlt } from 'react-icons/fa'
import { motion } from 'framer-motion'

const Features = () => {
  const features = [
    {
      icon: <FaGlobeAmericas />,
      title: "Global Multiplayer",
      description: "Play with chess enthusiasts from around the world in real-time matches."
    },
    {
      icon: <FaBrain />,
      title: "AI Training",
      description: "Practice against intelligent AI opponents with adjustable difficulty levels."
    },
    {
      icon: <FaUsers />,
      title: "Community",
      description: "Join tournaments, leagues, and connect with fellow chess players."
    },
    {
      icon: <FaMobile />,
      title: "Cross-Platform",
      description: "Play seamlessly across desktop, tablet, and mobile devices."
    },
    {
      icon: <FaClock />,
      title: "Various Time Controls",
      description: "From bullet to classical games, choose your preferred time format."
    },
    {
      icon: <FaShieldAlt />,
      title: "Fair Play",
      description: "Advanced anti-cheat system ensures fair and competitive gameplay."
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <section id="features" className="features">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Why Choose ChessMate?</h2>
          <p className="section-description">
            Experience chess like never before with our comprehensive platform 
            designed for players of all skill levels.
          </p>
        </motion.div>

        <motion.div 
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="feature-card"
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Features