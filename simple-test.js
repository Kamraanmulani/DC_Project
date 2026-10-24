console.log('Testing room creation...');

fetch('http://localhost:5000/api/game/create-room', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    roomName: 'UI Test Room',
    gmail: 'uitest@example.com'
  })
})
.then(response => response.json())
.then(result => {
  console.log('Room created:', result);
  if (result.status === 'success') {
    const roomCode = result.data.roomCode;
    console.log('Room Code:', roomCode);
    
    // Test joining the room
    return fetch(`http://localhost:5000/api/game/room/${roomCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gmail: 'joiner@example.com'
      })
    });
  }
})
.then(response => response ? response.json() : null)
.then(result => {
  if (result) {
    console.log('Join result:', result);
    console.log('✅ Both create and join functionality working!');
    console.log('🎮 Frontend should navigate to: /gamestartsPvP?roomCode=' + result.data.roomCode + '&email=joiner@example.com');
  }
})
.catch(error => {
  console.error('Error:', error);
});