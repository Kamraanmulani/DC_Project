# 🏆 ChessMate - Ultimate Chess Platform

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.11.0-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue.svg)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black.svg)](https://socket.io/)
[![Chess.js](https://img.shields.io/badge/Chess.js-1.4.0-orange.svg)](https://github.com/jhlywa/chess.js)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 About ChessMate

ChessMate is a cutting-edge, full-stack chess platform that combines strategic gameplay with modern web technology. Built with React.js 19.1.1 and Node.js, it delivers an immersive chess experience featuring real-time multiplayer gameplay, intelligent AI opponents, and a sleek, responsive interface designed for chess enthusiasts of all skill levels.

### ✨ Key Features

- 🎮 **Complete Game Modes**: AI opponents, real-time multiplayer, and room-based gameplay
- 🤖 **Advanced AI Engine**: Intelligent chess AI with strategic move evaluation and multiple difficulty levels
- 🌐 **Real-time Multiplayer**: Live chess games with instant move synchronization via polling system
- 🏠 **Room-based Gaming**: Create or join game rooms with 3-digit codes for private matches
- 🔐 **Secure Authentication**: JWT-based user system with PostgreSQL backend
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- 🎨 **Modern UI/UX**: Beautiful chess-themed interface with Framer Motion animations
- ⚡ **Real-time Updates**: Live game state synchronization and player status tracking
- 🎯 **Move Validation**: Complete chess rule enforcement with check/checkmate detection
- 🎉 **Visual Effects**: Confetti celebrations, move highlighting, and smooth animations

### 🚀 Game Modes Available

- **🤖 Player vs AI**: Challenge our intelligent AI with strategic move evaluation
  - Advanced piece evaluation algorithm
  - Real-time thinking indicators
  - Balanced difficulty for engaging gameplay
  - Visual feedback with piece highlighting and animations

- **🤝 Player vs Player (Real-time Multiplayer)**: 
  - Create private rooms with 3-digit codes
  - Real-time move synchronization between players
  - Turn-based gameplay with visual turn indicators
  - Live player status and connection monitoring
  - Complete move history tracking

- **🏠 Room Management System**:
  - Easy room creation and joining
  - Player color assignment (White/Black)
  - Real-time room status updates
  - Seamless game state management

## 🛠️ Tech Stack

### Frontend
- **React.js 19.1.1** - Modern UI framework with hooks
- **Framer Motion 12.23.16** - Smooth animations and transitions
- **React Router DOM 7.9.1** - Client-side routing
- **React Icons 5.5.0** - Beautiful icon library
- **React Confetti 6.4.0** - Celebration effects
- **React Chessboard 5.6.1** - Professional chess board component
- **Canvas Confetti 1.9.3** - Victory animations
- **Chess.js 1.4.0** - Chess game logic and validation
- **Stockfish.js 10.0.2** - Chess engine integration
- **Axios 1.12.2** - HTTP client for API calls
- **Vite 6.3.6** - Fast build tool and development server

### Backend
- **Node.js 22.11.0** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework
- **PostgreSQL 8.11.3** - Robust relational database
- **Socket.IO 4.8.1** - Real-time communication
- **JWT 9.0.2** - JSON Web Token authentication
- **BCrypt 2.4.3** - Password hashing and security
- **Chess.js 1.4.0** - Server-side chess logic
- **Stockfish 17.1.0** - AI chess engine
- **Joi 17.11.0** - Data validation library
- **CORS 2.8.5** - Cross-origin resource sharing
- **Helmet 7.1.0** - Security middleware
- **Morgan 1.10.0** - HTTP request logger
- **Express Rate Limit 7.1.5** - API rate limiting

### Development Tools
- **ESLint 9.36.0** - Code linting and formatting
- **Nodemon 3.0.2** - Development server auto-restart
- **Git** - Version control system
- **VS Code** - Recommended IDE

##  📁 Project Structure

```
ChessMate/
├── ChessMate/                     # Frontend React Application
│   ├── src/
│   │   ├── components/           # Reusable React Components
│   │   │   ├── Auth/            # Authentication components
│   │   │   │   ├── AuthModal.jsx    # Modal wrapper for auth forms
│   │   │   │   ├── Login.jsx        # User login form with validation
│   │   │   │   ├── SignUp.jsx       # User registration form
│   │   │   │   ├── LoginTestCase.md # Login testing documentation
│   │   │   │   └── SignUpTestCase.md # Signup testing documentation
│   │   │   ├── Game/            # Chess game components
│   │   │   │   ├── Game.jsx         # Base game component
│   │   │   │   ├── GameAI.jsx       # AI chess game implementation
│   │   │   │   ├── GamePvP.jsx      # Multiplayer chess game
│   │   │   │   ├── GameForm.jsx     # Room creation/joining forms
│   │   │   │   ├── Game.css         # Game styling
│   │   │   │   ├── GameAI.css       # AI game specific styles
│   │   │   │   ├── GamePvP.css      # Multiplayer game styles
│   │   │   │   ├── GameForm.css     # Form styling
│   │   │   │   ├── GamePvPTestCase.md # PvP testing documentation
│   │   │   │   └── EmergencyCmd.md  # Emergency commands guide
│   │   │   ├── GameMode/        # Game mode selection
│   │   │   │   ├── GameModeSelection.jsx # Mode selection component
│   │   │   │   └── GameModeSelection.css # Mode selection styles
│   │   │   ├── Header.jsx       # Navigation header with auth
│   │   │   ├── Hero.jsx         # Landing page hero section
│   │   │   ├── Features.jsx     # Features showcase section
│   │   │   ├── HowItWorks.jsx   # How-to-play guide
│   │   │   └── Footer.jsx       # Site footer with links
│   │   ├── contexts/            # React Context providers
│   │   │   └── AuthContext.jsx  # Authentication state management
│   │   ├── pages/               # Page components
│   │   │   └── HomePage.jsx     # Main landing page
│   │   ├── services/            # API service layers
│   │   │   └── chessAPIService.js # Chess API communication
│   │   ├── utils/               # Utility functions
│   │   │   └── chessEngine.js   # Chess logic utilities
│   │   ├── assets/              # Static assets
│   │   │   └── react.svg        # React logo
│   │   ├── App.jsx              # Main application component
│   │   ├── App.css              # Global application styles
│   │   ├── index.css            # Base CSS styles
│   │   └── main.jsx             # Application entry point
│   ├── public/                  # Static public assets
│   │   └── vite.svg             # Vite logo
│   ├── debug-console.js         # Debug utilities
│   ├── test-ai-game.js          # AI game testing script
│   ├── test-components.mjs      # Component testing utilities
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── eslint.config.js         # ESLint configuration
│   └── README.md                # Frontend documentation
├── backend/                       # Backend Node.js Application
│   ├── controllers/             # Business logic controllers
│   │   └── authController.js    # Authentication logic
│   ├── middleware/              # Custom middleware
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── validation.js        # Input validation middleware
│   │   └── errorHandler.js      # Error handling middleware
│   ├── routes/                  # API route definitions
│   │   ├── authRoutes.js        # Authentication routes
│   │   └── gameRoutes.js        # Game management routes
│   ├── services/                # Business logic services
│   │   ├── chessGameService.js  # Chess game business logic
│   │   └── stockfishEngine.js   # Stockfish AI integration
│   ├── config/                  # Configuration files
│   │   └── database.js          # PostgreSQL connection config
│   ├── scripts/                 # Database and utility scripts
│   │   └── initDatabase.js      # Database initialization
│   ├── utils/                   # Utility functions
│   │   └── auth.js              # Authentication utilities
│   ├── create-user.js           # User creation utility
│   ├── direct-setup.js          # Direct setup script
│   ├── fix-permissions.js       # Permission fixing utility
│   ├── test-*.js               # Various testing scripts
│   ├── .env.example             # Environment variables template
│   ├── package.json             # Backend dependencies
│   └── server.js                # Server entry point
├── docs/                        # Documentation files
│   ├── AI_GAME_README.md        # AI game implementation guide
│   ├── MULTIPLAYER_CHESS_GUIDE.md # Multiplayer implementation
│   ├── PLAYER_STATUS_IMPLEMENTATION.md # Player status feature
│   ├── JOIN_ROOM_IMPLEMENTATION.md # Room joining feature
│   └── IC-Test-Case-Planning-and-Execution-Template-10549_WORD.dotx
├── test-*.js                    # Root level testing scripts
├── cors-test.html               # CORS testing utility
├── simple-test.js               # Simple functionality tests
└── README.md                    # Main project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22.11.0 or higher
- PostgreSQL 12 or higher
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kamraanmulani/ChessMate.git
   cd ChessMate
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in backend directory
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database and user
   psql -U postgres
   CREATE DATABASE ChessMate;
   CREATE USER chessmate_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ChessMate TO chessmate_user;
   ```

5. **Run database migrations**
   ```bash
   node scripts/initDatabase.js
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

7. **Set up the frontend**
   ```bash
   cd ../ChessMate
   npm install
   ```

8. **Start the frontend development server**
   ```bash
   npm run dev
   ```

### 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **AI Game Direct**: http://localhost:5173/gamestartsAI
- **Multiplayer Game**: http://localhost:5173/gamestartsPvP

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ChessMate
DB_USER=chessmate_user
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## 🎮 Game Features

### 🤖 AI Chess Game
- **Intelligent AI Opponent**: Advanced move evaluation algorithm
- **Visual Feedback**: Piece highlighting, move validation, thinking animations
- **Game States**: Playing, thinking, game over with win/lose/draw detection
- **Responsive Design**: Perfect experience on all devices
- **Direct Access**: Available at `/gamestartsAI`

### 🤝 Multiplayer Chess
- **Real-time Gameplay**: Live move synchronization between players
- **Room System**: Create/join rooms with 3-digit codes
- **Turn Management**: Visual turn indicators and move restrictions
- **Player Status**: Live connection monitoring and game state tracking
- **Move History**: Complete game move tracking
- **Direct Access**: Available at `/gamestartsPvP`

### 🎯 Core Chess Features
- **Complete Rule Implementation**: All chess rules including castling, en passant
- **Check/Checkmate Detection**: Automatic game end detection
- **Move Validation**: Prevents illegal moves and self-check situations
- **Visual Enhancements**: Square highlighting, move animations, confetti celebrations

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Register new user with validation
- `POST /api/auth/login` - User authentication with JWT
- `GET /api/auth/me` - Get current user info (protected route)

### Game Management Endpoints
- `POST /api/game/room` - Create new game room
- `POST /api/game/room/:roomCode/join` - Join existing room
- `GET /api/game/room/:roomCode/status` - Get room status and players
- `POST /api/game/room/:roomCode/move` - Submit chess move
- `GET /api/game/room/:roomCode/state` - Get current game state

### Health Check
- `GET /api/health` - Server health status and version info

## 🗃️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE
);
```

### Game Rooms Table
```sql
CREATE TABLE game_rooms (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(3) UNIQUE NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    creator_email VARCHAR(255) NOT NULL,
    player1_email VARCHAR(255),
    player2_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'waiting',
    current_turn VARCHAR(10) DEFAULT 'white',
    board_state TEXT,
    move_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Frontend Architecture

### Component Structure
- **App.jsx** - Main application with routing
- **AuthContext** - Global authentication state management
- **Header** - Navigation with responsive auth buttons
- **GameModeSelection** - Mode selection with game cards
- **GameAI** - Complete AI chess implementation
- **GamePvP** - Real-time multiplayer chess
- **GameForm** - Room creation and joining forms

### Styling System
- **CSS Modules** - Component-scoped styling
- **Custom Properties** - CSS variables for theming
- **Responsive Design** - Mobile-first approach
- **Animations** - Framer Motion for smooth transitions

## 🔐 Security Features

### Authentication Security
- **Password Hashing**: BCrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Input Validation**: Server and client-side validation
- **Rate Limiting**: Protection against brute force attacks

### API Security
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Middleware**: Security headers and protection
- **SQL Injection Protection**: Parameterized queries
- **Request Validation**: Joi schema validation

## 🚦 Testing & Quality Assurance

### Available Test Scripts
- `test-ai-game.js` - AI game functionality testing
- `test-complete-flow.js` - End-to-end testing
- `test-multiplayer-chess.js` - Multiplayer features testing
- `test-auth-api.js` - Authentication endpoint testing
- `test-room-api.js` - Room management testing

### Testing Instructions
1. **Backend Tests**:
   ```bash
   cd backend
   node test-api.js
   node test-db-connection.js
   ```

2. **Frontend Tests**:
   ```bash
   cd ChessMate
   node test-components.mjs
   ```

3. **Integration Tests**:
   ```bash
   node test-complete-flow.js
   ```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Features
- Touch-optimized controls for mobile
- Scalable chess board for all screen sizes
- Adaptive navigation menu
- Optimized button sizing for touch devices

## 🔧 Development Tools & Configuration

### ESLint Configuration
- React-specific rules
- Modern JavaScript standards
- Code formatting enforcement
- Import/export validation

### Vite Configuration
- Fast development server
- Hot module replacement
- Optimized production builds
- Asset handling

## 🚀 Performance Optimizations

### Frontend Optimizations
- **React.memo** for component optimization
- **useCallback/useMemo** for expensive operations
- **Code splitting** with React.lazy
- **Asset optimization** with Vite

### Backend Optimizations
- **Connection pooling** for PostgreSQL
- **Rate limiting** for API protection
- **Efficient polling** for real-time updates
- **Caching strategies** for game states

## 🐛 Troubleshooting Guide

### Common Issues & Solutions

1. **Database Connection Errors**
   ```bash
   # Check PostgreSQL status
   sudo service postgresql status
   
   # Verify database exists
   psql -U postgres -l
   ```

2. **Port Conflicts**
   ```bash
   # Check what's using port 5000
   netstat -ano | findstr :5000
   
   # Kill process if needed
   taskkill /PID <PID> /F
   ```

3. **CORS Issues**
   - Verify CORS_ORIGIN in backend .env
   - Check both servers are running
   - Clear browser cache

4. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear localStorage in browser

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kamraan Mulani**
- GitHub: [@Kamraanmulani](https://github.com/Kamraanmulani)



## �🙏 Acknowledgments

- **Chess.js** - Excellent chess logic library
- **React Team** - Amazing framework and community
- **PostgreSQL** - Robust database system
- **Stockfish** - Powerful chess engine
- **Open Source Community** - For the incredible packages and tools

## 📊 Project Statistics

- **Lines of Code**: 15,000+
- **Components**: 25+
- **API Endpoints**: 15+
- **Test Files**: 10+
- **Documentation Pages**: 5+

---

⭐ **Star this repository if you find it helpful!**

🎯 **Ready to play chess? Start your engines and may the best player win!** ♔♕♖♗♘♙