import http from 'http';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Leaderboard API...\n');

  try {
    // Test leaderboard endpoint
    console.log('📊 Testing GET /leaderboard...');
    const leaderboardResult = await makeRequest('/leaderboard');
    
    if (leaderboardResult.status === 200) {
      console.log('✅ Leaderboard endpoint working!');
      console.log(`📋 Found ${leaderboardResult.data.data.leaderboard.length} players`);
      
      if (leaderboardResult.data.data.leaderboard.length > 0) {
        const topPlayer = leaderboardResult.data.data.leaderboard[0];
        console.log(`🏆 Top Player: ${topPlayer.player_name} (${topPlayer.total_points} points, ${topPlayer.win_percentage}% win rate)`);
      }
    } else {
      console.log('❌ Leaderboard endpoint failed:', leaderboardResult.status);
    }

    console.log('\n👤 Testing GET /leaderboard/player/alice@example.com...');
    const playerResult = await makeRequest('/leaderboard/player/alice@example.com');
    
    if (playerResult.status === 200) {
      console.log('✅ Player stats endpoint working!');
      const player = playerResult.data.data.player;
      console.log(`📊 ${player.player_name}: Rank #${player.rank}, ${player.total_points} points, ${player.win_percentage}% win rate`);
    } else {
      console.log('❌ Player stats endpoint failed:', playerResult.status);
    }

    console.log('\n🏅 Testing GET /leaderboard/top/3...');
    const topResult = await makeRequest('/leaderboard/top/3');
    
    if (topResult.status === 200) {
      console.log('✅ Top players endpoint working!');
      topResult.data.data.topPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.player_name} - ${player.total_points} pts (${player.win_percentage}% win rate)`);
      });
    } else {
      console.log('❌ Top players endpoint failed:', topResult.status);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAPI();