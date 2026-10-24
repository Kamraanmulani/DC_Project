/**
 * Quick Debug Console Commands for ChessMate AI
 * 
 * Paste these into browser console to debug AI issues:
 */

// Check current game state
window.debugGameState = () => {
  console.log('🎮 Current Game State:');
  console.log('Board squares:', document.querySelectorAll('.square').length);
  console.log('Chess pieces:', document.querySelectorAll('.piece').length);
  console.log('Status text:', document.querySelector('.status')?.textContent);
  console.log('Thinking indicator:', !!document.querySelector('.thinking'));
  console.log('Game over state:', !!document.querySelector('.game-over'));
};

// Monitor React state (if available)
window.monitorReactState = () => {
  const gameComponent = document.querySelector('.chess-app');
  if (gameComponent && gameComponent._reactInternals) {
    console.log('⚛️ React component found');
  } else {
    console.log('❌ React component not accessible');
  }
};

// Force trigger a test move
window.forceTestMove = () => {
  console.log('🎯 Forcing test move...');
  const squares = document.querySelectorAll('.square');
  
  // Try clicking e2 pawn
  const e2 = squares[52]; // Usually e2
  const e4 = squares[36]; // Usually e4
  
  if (e2 && e4) {
    console.log('Clicking e2...');
    e2.click();
    
    setTimeout(() => {
      console.log('Clicking e4...');
      e4.click();
    }, 100);
  } else {
    console.log('❌ Could not find e2/e4 squares');
  }
};

// Check for JavaScript errors
window.checkErrors = () => {
  console.log('🔍 Checking for errors...');
  
  // Check if React has errors
  if (window.React) {
    console.log('✅ React loaded');
  } else {
    console.log('❌ React not found');
  }
  
  // Check console for errors
  const originalError = console.error;
  let errorCount = 0;
  
  console.error = (...args) => {
    errorCount++;
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.log(`📊 Errors detected: ${errorCount}`);
    console.error = originalError;
  }, 1000);
};

// Clear all timeouts (in case AI is stuck)
window.clearAllTimeouts = () => {
  console.log('🧹 Clearing all timeouts...');
  const highestId = setTimeout(() => {});
  for (let i = 0; i < highestId; i++) {
    clearTimeout(i);
  }
  console.log('✅ All timeouts cleared');
};

// Reset AI thinking state (emergency fix)
window.resetAI = () => {
  console.log('🔄 Attempting to reset AI state...');
  
  // Try to find and click the reset button
  const resetBtn = document.querySelector('button[class*="btn"]:not([class*="alt"])');
  if (resetBtn && resetBtn.textContent.includes('Reset')) {
    console.log('🔄 Clicking reset button...');
    resetBtn.click();
  } else {
    console.log('❌ Reset button not found');
  }
};

// Test AI move directly
window.testAI = () => {
  console.log('🤖 Testing AI directly...');
  
  // Check current turn
  const statusElement = document.querySelector('.status');
  if (statusElement) {
    console.log('Status:', statusElement.textContent);
    
    if (statusElement.textContent.includes('AI')) {
      console.log('✅ It is AI turn');
      
      // Check if thinking
      const thinkingElement = document.querySelector('.thinking');
      if (thinkingElement) {
        console.log('🤔 AI is currently thinking...');
        console.log('💡 If stuck, try: clearAllTimeouts() then resetAI()');
      } else {
        console.log('❓ AI should be moving but not thinking...');
      }
    } else {
      console.log('👤 It is player turn - make a move first');
    }
  }
};

console.log('🛠️ Debug tools loaded!');
console.log('Available commands:');
console.log('  debugGameState() - Check current state');
console.log('  forceTestMove() - Make a test move');
console.log('  checkErrors() - Look for JS errors');
console.log('  clearAllTimeouts() - Clear stuck timeouts');
console.log('  resetAI() - Emergency AI reset');
console.log('  testAI() - Test AI state directly');
console.log('');
console.log('👀 Watch the console for AI debug messages after making moves!');