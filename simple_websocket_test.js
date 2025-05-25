const WebSocket = require('ws');
const http = require('http');

console.log('🧪 Простой тест WebSocket игры...');

let sessionId;

// Создаем сессию через HTTP API
function createSession() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      preflopHistory: "PokerStars Hand #123456789: Hold'em No Limit ($5/$10 USD) - 2024/01/01 12:00:00 ET\nTable 'Test' 2-max Seat #1 is the button\nSeat 1: Player1 ($1000 in chips)\nSeat 2: Player2 ($1000 in chips)\nPlayer1: posts small blind $5\nPlayer2: posts big blind $10\n*** HOLE CARDS ***\nPlayer1: calls $5\nPlayer2: checks\n*** FLOP ***",
      boardSettings: {
        flopSettings: { specific: false, twoTone: false, rainbow: false, monotone: false, paired: false },
        turnSettings: { enabled: true },
        riverSettings: { enabled: true }
      },
      handRanges: {
        player1: ['AA', 'KK'],
        player2: ['AK', 'AQ']
      },
      tableCount: 1,
      betSizes: { quarter: true, half: true, threeQuarter: true, pot: true, allIn: true }
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/create-session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          sessionId = response.sessionId;
          console.log(`✅ Сессия создана: ${sessionId}`);
          resolve(sessionId);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Тестируем игру
async function testGame() {
  try {
    // Создаем сессию
    await createSession();
    
    // Подключаем первого игрока
    const player1 = new WebSocket('ws://localhost:5000');
    
    player1.on('open', () => {
      console.log('🔗 Игрок 1 подключился');
      player1.send(JSON.stringify({
        type: 'join_session',
        sessionId: sessionId,
        tableId: 1,
        playerId: 1,
        playerName: 'Тестер1'
      }));
    });
    
    player1.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log(`📨 Игрок 1 получил: ${message.type}`);
      
      if (message.type === 'game_state') {
        console.log(`   Начальное состояние: ${message.table.currentStreet}, игрок ${message.table.currentPlayer}, банк ${message.table.pot}`);
        
        // Подключаем второго игрока
        setTimeout(() => {
          const player2 = new WebSocket('ws://localhost:5000');
          
          player2.on('open', () => {
            console.log('🔗 Игрок 2 подключился');
            player2.send(JSON.stringify({
              type: 'join_session',
              sessionId: sessionId,
              tableId: 1,
              playerId: 2,
              playerName: 'Тестер2'
            }));
          });
          
          player2.on('message', (data) => {
            const message = JSON.parse(data.toString());
            console.log(`📨 Игрок 2 получил: ${message.type}`);
            
            if (message.type === 'game_state') {
              console.log(`   Игрок 2 готов: ${message.table.currentStreet}, игрок ${message.table.currentPlayer}`);
              
              // Начинаем игру - игрок 1 делает бет
              setTimeout(() => {
                console.log('🎯 Игрок 1 делает бет 50');
                player1.send(JSON.stringify({
                  type: 'player_action',
                  sessionId: sessionId,
                  tableId: 1,
                  playerId: 1,
                  action: 'bet',
                  amount: 50
                }));
              }, 500);
            }
            
            if (message.type === 'table_update') {
              console.log(`   Обновление для игрока 2: ${message.table.currentStreet}, игрок ${message.table.currentPlayer}, банк ${message.table.pot}`);
              
              // Если сейчас ход игрока 2 и это флоп
              if (message.table.currentPlayer === 2 && message.table.currentStreet === 'flop') {
                setTimeout(() => {
                  console.log('🎯 Игрок 2 коллирует 50');
                  player2.send(JSON.stringify({
                    type: 'player_action',
                    sessionId: sessionId,
                    tableId: 1,
                    playerId: 2,
                    action: 'call',
                    amount: 50
                  }));
                }, 500);
              }
              
              // Если сейчас ход игрока 2 и это тёрн
              if (message.table.currentPlayer === 2 && message.table.currentStreet === 'turn') {
                setTimeout(() => {
                  console.log('🎯 Игрок 2 чекает на тёрне');
                  player2.send(JSON.stringify({
                    type: 'player_action',
                    sessionId: sessionId,
                    tableId: 1,
                    playerId: 2,
                    action: 'check'
                  }));
                }, 500);
              }
              
              // Если сейчас ход игрока 2 и это ривер
              if (message.table.currentPlayer === 2 && message.table.currentStreet === 'river') {
                setTimeout(() => {
                  console.log('🎯 Игрок 2 чекает на ривере');
                  player2.send(JSON.stringify({
                    type: 'player_action',
                    sessionId: sessionId,
                    tableId: 1,
                    playerId: 2,
                    action: 'check'
                  }));
                }, 500);
              }
            }
          });
          
        }, 1000);
      }
      
      if (message.type === 'table_update') {
        console.log(`   Обновление для игрока 1: ${message.table.currentStreet}, игрок ${message.table.currentPlayer}, банк ${message.table.pot}`);
        
        // Если сейчас ход игрока 1 и это тёрн
        if (message.table.currentPlayer === 1 && message.table.currentStreet === 'turn') {
          setTimeout(() => {
            console.log('🎯 Игрок 1 чекает на тёрне');
            player1.send(JSON.stringify({
              type: 'player_action',
              sessionId: sessionId,
              tableId: 1,
              playerId: 1,
              action: 'check'
            }));
          }, 500);
        }
        
        // Если сейчас ход игрока 1 и это ривер
        if (message.table.currentPlayer === 1 && message.table.currentStreet === 'river') {
          setTimeout(() => {
            console.log('🎯 Игрок 1 чекает на ривере');
            player1.send(JSON.stringify({
              type: 'player_action',
              sessionId: sessionId,
              tableId: 1,
              playerId: 1,
              action: 'check'
            }));
          }, 500);
        }
        
        // Если рука завершена
        if (message.actionResult?.handComplete) {
          console.log(`🏆 Рука завершена! Победитель: ${message.actionResult.winner}`);
          setTimeout(() => {
            player1.close();
            process.exit(0);
          }, 1000);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testGame(); 