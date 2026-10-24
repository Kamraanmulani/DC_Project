/**
 * Node.js Test for ChessMate AI Game Components
 * This test verifies the component files and structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 Testing ChessMate AI Game Components...\n');

// Test 1: Check if GameAI component exists
const gameAIPath = path.join(__dirname, 'src', 'components', 'Game', 'GameAI.jsx');
if (fs.existsSync(gameAIPath)) {
  console.log('✅ GameAI.jsx component found');
  
  const gameAIContent = fs.readFileSync(gameAIPath, 'utf8');
  
  // Test AI-specific features
  const requiredFeatures = [
    'isThinking',
    'makeAIMove',
    'evaluateMove',
    'isKingInCheck',
    'getValidMovesForPiece',
    'gameStatus',
    'Player vs AI'
  ];
  
  let featuresFound = 0;
  requiredFeatures.forEach(feature => {
    if (gameAIContent.includes(feature)) {
      console.log(`  ✅ ${feature} - implemented`);
      featuresFound++;
    } else {
      console.log(`  ❌ ${feature} - missing`);
    }
  });
  
  console.log(`\n📊 AI Features: ${featuresFound}/${requiredFeatures.length} implemented\n`);
} else {
  console.log('❌ GameAI.jsx component not found');
}

// Test 2: Check if GameAI CSS exists
const gameAICSSPath = path.join(__dirname, 'src', 'components', 'Game', 'GameAI.css');
if (fs.existsSync(gameAICSSPath)) {
  console.log('✅ GameAI.css stylesheet found');
  
  const cssContent = fs.readFileSync(gameAICSSPath, 'utf8');
  
  const requiredStyles = [
    'thinking',
    'game-over',
    'last-move',
    'ai-piece',
    'pulse',
    'fadeIn'
  ];
  
  let stylesFound = 0;
  requiredStyles.forEach(style => {
    if (cssContent.includes(style)) {
      console.log(`  ✅ .${style} - styled`);
      stylesFound++;
    } else {
      console.log(`  ❌ .${style} - missing`);
    }
  });
  
  console.log(`\n🎨 UI Styles: ${stylesFound}/${requiredStyles.length} implemented\n`);
} else {
  console.log('❌ GameAI.css stylesheet not found');
}

// Test 3: Check App.jsx routing
const appPath = path.join(__dirname, 'src', 'App.jsx');
if (fs.existsSync(appPath)) {
  console.log('✅ App.jsx found');
  
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  if (appContent.includes('/gamestartsAI') && appContent.includes('GameAI')) {
    console.log('  ✅ /gamestartsAI route configured correctly');
  } else {
    console.log('  ❌ /gamestartsAI route not configured');
  }
} else {
  console.log('❌ App.jsx not found');
}

// Test 4: Check GameModeSelection component
const gameModeSelectionPath = path.join(__dirname, 'src', 'components', 'GameMode', 'GameModeSelection.jsx');
if (fs.existsSync(gameModeSelectionPath)) {
  console.log('✅ GameModeSelection.jsx found');
  
  const gameModeContent = fs.readFileSync(gameModeSelectionPath, 'utf8');
  
  if (gameModeContent.includes('/gamestartsAI')) {
    console.log('  ✅ AI game navigation configured');
  } else {
    console.log('  ❌ AI game navigation missing');
  }
} else {
  console.log('❌ GameModeSelection.jsx not found');
}

// Test 5: Check package.json for required dependencies
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json found');
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['react', 'react-router-dom', 'framer-motion'];
  
  let depsFound = 0;
  requiredDeps.forEach(dep => {
    if (packageContent.dependencies?.[dep] || packageContent.devDependencies?.[dep]) {
      console.log(`  ✅ ${dep} - installed`);
      depsFound++;
    } else {
      console.log(`  ❌ ${dep} - missing`);
    }
  });
  
  console.log(`\n📦 Dependencies: ${depsFound}/${requiredDeps.length} installed\n`);
} else {
  console.log('❌ package.json not found');
}

// Test 6: Component structure validation
console.log('🔍 Component Structure Analysis:');

try {
  const srcPath = path.join(__dirname, 'src');
  const componentsPath = path.join(srcPath, 'components');
  const gamePath = path.join(componentsPath, 'Game');
  
  if (fs.existsSync(gamePath)) {
    const gameFiles = fs.readdirSync(gamePath);
    console.log(`  📁 Game components: ${gameFiles.join(', ')}`);
    
    // Check for all game components
    const expectedGameFiles = ['GameAI.jsx', 'GameAI.css', 'GamePvP.jsx', 'GameForm.jsx'];
    const foundGameFiles = expectedGameFiles.filter(file => gameFiles.includes(file));
    console.log(`  ✅ Found ${foundGameFiles.length}/${expectedGameFiles.length} game components`);
  }
} catch (error) {
  console.log('  ❌ Could not analyze component structure');
}

console.log('\n🎮 Component Test Summary:');
console.log('─'.repeat(40));
console.log('✅ All tests completed');
console.log('🚀 To test the actual game:');
console.log('   1. Run: npm run dev');
console.log('   2. Open: http://localhost:5173/gamestartsAI');
console.log('   3. Play against the AI!');
console.log('─'.repeat(40));