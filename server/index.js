const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const http = require('http');

const PokerEngine = require('./poker-engine');
const HandHistoryGenerator = require('./hand-history');
const PreflopParser = require('./preflop-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Настройка MIME типов для TXT файлов
express.static.mime.define({'text/plain': ['txt']});

app.use(express.static(path.join(__dirname, '../client/build')));

// Storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `preflop-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Game sessions storage
const gameSessions = new Map();
// Connected players storage
const connectedPlayers = new Map(); // playerId -> { ws, sessionId, tableId, playerId }
// Host tracking - sessionId -> hostPlayerId (кто создал сессию)
const sessionHosts = new Map();

// Функция для генерации уникального ID сессии
function generateSessionId() {
  return uuidv4();
}

// Функция для расчета финальных стеков игроков
function calculateFinalStacks(playerNames, remainingStacks, activePlayers) {
  const stacksWithCorrectNames = {};
  
  // ИСПРАВЛЕНИЕ: Правильно сопоставляем стеки с именами игроков
  if (Object.keys(remainingStacks).length >= 2 && playerNames.length >= 2) {
    // Для каждого финального игрока ищем его стек в remainingStacks
    playerNames.forEach((playerName, index) => {
      console.log(`🔍 Processing player ${index + 1}: "${playerName}"`);
      console.log(`   Available stacks:`, Object.keys(remainingStacks));
      
      // Сначала пытаемся найти точное совпадение
      if (remainingStacks[playerName] !== undefined) {
        stacksWithCorrectNames[playerName] = remainingStacks[playerName];
        console.log(`✅ Found exact stack match: ${playerName} = €${remainingStacks[playerName]}`);
      } else {
        // Если точного совпадения нет, берем стек из активных игроков
        const activePlayersWithStacks = activePlayers.filter(name => remainingStacks[name] !== undefined);
        console.log(`   🔍 Active players with stacks:`, activePlayersWithStacks);
        
        if (activePlayersWithStacks[index]) {
          const matchedPlayerName = activePlayersWithStacks[index];
          const matchedStack = remainingStacks[matchedPlayerName];
          stacksWithCorrectNames[playerName] = matchedStack;
          console.log(`🔄 Matched by position: ${playerName} ← ${matchedPlayerName} = €${matchedStack}`);
        } else {
          // Fallback к значению по умолчанию
          stacksWithCorrectNames[playerName] = 1000;
          console.log(`⚠️ No stack found for ${playerName}, using default €1000`);
        }
      }
    });
  } else {
    // Fallback если нет достаточно данных
    playerNames.forEach(playerName => {
      stacksWithCorrectNames[playerName] = 1000;
    });
    console.log('⚠️ Using default stacks €1000 for all players');
  }
  
  return stacksWithCorrectNames;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'create_session') {
        console.log('🔧 Converting board settings:', JSON.stringify(data.boardSettings, null, 2));
        
        // Конвертируем настройки борда
        const convertedBoardSettings = convertBoardSettings(data.boardSettings);
        console.log('Converted board settings:', JSON.stringify(convertedBoardSettings, null, 2));
        
        // Получаем имена игроков
        const playerNames = data.playerNames || ['Player1', 'Player2'];
        const currentPlayerInfo = data.currentPlayerInfo;
        console.log(`👥 Player names from client:`, playerNames);
        console.log(`🎯 Current player info:`, currentPlayerInfo);
        
        // Парсим префлоп данные
        const preflopData = data.preflopHistory ? 
          handHistoryGenerator.parsePreflopHistory(data.preflopHistory) : 
          { potSize: 0, actions: 0, blinds: { small: 0, big: 0 } };
        
        console.log(`📊 Parsed preflop data:`, preflopData);
        
        // Рассчитываем стеки после префлоп действий
        const handHistoryGenerator = new HandHistoryGenerator(data.preflopHistory);
        const remainingStacks = data.preflopHistory ? 
          handHistoryGenerator.calculatePreflopStacks(data.preflopHistory) : {};
        
        console.log(`📊 Calculated remaining stacks after preflop:`, remainingStacks);
        
        // Получаем активных игроков (не сфолдивших)
        const activePlayers = data.preflopHistory ? 
          handHistoryGenerator.getActivePlayers(data.preflopHistory) : [];
        
        console.log(`👥 Active players (not folded):`, activePlayers);
        
        // Определяем финальные стеки для игроков
        const finalStacks = calculateFinalStacks(playerNames, remainingStacks, activePlayers);
        console.log(`🎯 Final stacks mapping:`, finalStacks);
        
        const tableCount = data.tableCount || 1;
        
        // 🔧 ИСПРАВЛЕНИЕ: Создаем ОТДЕЛЬНЫЕ сессии для каждого стола
        console.log(`🏗️ Creating ${tableCount} separate sessions with unique cards`);
        
        const sessionIds = [];
        
        // Создаем отдельную сессию для каждого стола
        for (let i = 0; i < tableCount; i++) {
          const sessionId = generateSessionId();
          const handRanges = {
            player1: data.handRanges?.player1 || [],
            player2: data.handRanges?.player2 || []
          };
          
          // Создаем уникальный PokerEngine для каждой сессии (уникальные карты)
          const pokerEngine = new PokerEngine(convertedBoardSettings, handRanges, data.preflopHistory);
          const table = pokerEngine.createTable(
            1, // всегда table ID = 1 в каждой сессии
            preflopData.potSize,
            finalStacks,
            activePlayers.length > 0 ? activePlayers : playerNames,
            currentPlayerInfo
          );
          
          // Устанавливаем хоста для каждой сессии - всегда Player 1 (создатель сессий)
          const hostPlayerId = 1; // Всегда Player 1 является хостом
          sessionHosts.set(sessionId, hostPlayerId);
          
          // Сохраняем сессию
          gameSessions.set(sessionId, {
            tables: [table],
            playerNames: playerNames,
            currentPlayerInfo: currentPlayerInfo
          });
          
          sessionIds.push(sessionId);
          console.log(`✅ Created session ${i + 1}/${tableCount}: ${sessionId} with unique cards`);
        }
        
        // 🔧 ИСПРАВЛЕНИЕ: Отправляем массив уникальных sessionId
        ws.send(JSON.stringify({
          type: 'session_created',
          sessionIds: sessionIds,  // Массив уникальных sessionId
          success: true
        }));
        
        console.log(`📤 Sent ${tableCount} unique session IDs:`, sessionIds.map(id => id.substring(0, 8)).join(', '));
      } else {
        handleWebSocketMessage(ws, data);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    // Remove player from connected players when they disconnect
    for (const [playerId, playerData] of connectedPlayers.entries()) {
      if (playerData.ws === ws) {
        console.log(`Player ${playerId} disconnected`);
        connectedPlayers.delete(playerId);
        
        // Notify other players in the same session
        broadcastToSession(playerData.sessionId, {
          type: 'player_disconnected',
          playerId: playerId
        }, playerId);
        break;
      }
    }
  });
});

function handleWebSocketMessage(ws, data) {
  const { type, sessionId, tableId, playerId, action, amount, playerName } = data;
  
  switch (type) {
    case 'join_session':
      handleJoinSession(ws, { sessionId, tableId, playerId, playerName });
      break;
      
    case 'player_action':
      handlePlayerAction(ws, { sessionId, tableId, playerId, action, amount });
      break;
      
    case 'request_new_hand':
      handleNewHandRequest(ws, { sessionId, tableId, playerId });
      break;
      
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

function handleJoinSession(ws, { sessionId, tableId, playerId, playerName }) {
  const session = gameSessions.get(sessionId);
  if (!session) {
    ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
    return;
  }
  
  const table = session.tables.find(t => t.id == tableId);
  if (!table) {
    ws.send(JSON.stringify({ type: 'error', message: 'Table not found' }));
    return;
  }
  
  // Check if player slot is available
  if (playerId !== 1 && playerId !== 2) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid player ID. Must be 1 or 2' }));
    return;
  }
  
  const playerKey = `${sessionId}-${tableId}-${playerId}`;
  
  // Check if player is already connected and disconnect old connection
  if (connectedPlayers.has(playerKey)) {
    const oldConnection = connectedPlayers.get(playerKey);
    console.log(`🔄 Player ${playerId} reconnecting, closing old connection`);
    try {
      oldConnection.ws.close();
    } catch (error) {
      console.log('Old connection already closed');
    }
    connectedPlayers.delete(playerKey);
  }
  
  // Store new player connection
  connectedPlayers.set(playerKey, {
    ws,
    sessionId,
    tableId,
    playerId,
    playerName: playerName || `Player ${playerId}`
  });
  
  // Update player connection status in table - НО НЕ ИЗМЕНЯЕМ КАРТЫ И ИМЕНА!
  const player = table.players.find(p => p.id === playerId);
  if (player) {
    console.log(`🔍 Player ${playerId} details before update:`, {
      name: player.name,
      stack: player.stack,
      holeCards: player.holeCards ? player.holeCards.map(c => c.display || `${c.rank}${c.suit}`).join(', ') : 'none',
      position: player.position
    });
    
    // ИСПРАВЛЕНИЕ: Сохраняем оригинальное имя из hand history
    const originalName = player.name; // Сохраняем оригинальное имя
    const oldCards = player.holeCards; // Сохраняем старые карты
    
    // Только обновляем статус подключения, НЕ МЕНЯЕМ имя если оно уже правильное
    if (originalName && !originalName.startsWith('Player ')) {
      // Если у игрока уже есть правильное имя из hand history, сохраняем его
      console.log(`✅ Preserving original name from hand history: ${originalName}`);
      // НЕ МЕНЯЕМ player.name!
    } else {
      // Только если имя было общим, обновляем его
      player.name = playerName || `Player ${playerId}`;
      console.log(`🔄 Updated generic name to: ${player.name}`);
    }
    
    player.connected = true;
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: убеждаемся что карты НЕ изменились
    if (oldCards && player.holeCards && JSON.stringify(oldCards) !== JSON.stringify(player.holeCards)) {
      console.error('❌ CRITICAL ERROR: Cards were unexpectedly changed during reconnection!');
      console.error('   Old cards:', oldCards.map(c => c.display).join(', '));
      console.error('   New cards:', player.holeCards.map(c => c.display).join(', '));
    } else if (oldCards && player.holeCards) {
      console.log(`✅ Cards preserved during reconnection:`, player.holeCards.map(c => c.display).join(', '));
    }
    
    console.log(`✅ Player ${playerId} updated:`, {
      name: player.name,
      stack: player.stack,
      position: player.position
    });
  } else {
    console.error(`❌ Player ${playerId} not found in table ${tableId}`);
  }
  
  // Send private game state to the joining player
  const privateGameState = getPrivateGameState(table, playerId, sessionId);
  ws.send(JSON.stringify({
    type: 'game_state',
    table: privateGameState,
    playerId: playerId,
    isHost: isPlayerHost(sessionId, playerId)
  }));
  
  // Notify other players about the new connection
  broadcastToSession(sessionId, {
    type: 'player_connected',
    playerId: playerId,
    playerName: player ? player.name : (playerName || `Player ${playerId}`),
    tableId: tableId,
    isHost: isPlayerHost(sessionId, playerId)
  }, playerKey);
  
  console.log(`Player ${playerId} (${player ? player.name : playerName}) joined session ${sessionId}, table ${tableId}`);
}

function handlePlayerAction(ws, { sessionId, tableId, playerId, action, amount }) {
  const session = gameSessions.get(sessionId);
  if (!session) {
    ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
    return;
  }
  
  const table = session.tables.find(t => t.id == tableId);
  if (!table) {
    ws.send(JSON.stringify({ type: 'error', message: 'Table not found' }));
    return;
  }
  
  // ИСПРАВЛЕНИЕ: Добавляем более детальное логирование для диагностики
  console.log(`🎮 Player ${playerId} attempting action: ${action} ${amount || 0} on ${table.currentStreet}`);
  console.log(`   Current table state: Street=${table.currentStreet}, CurrentPlayer=${table.currentPlayer}, Pot=${table.pot}`);
  console.log(`   Player positions: P1=${table.players[0].position}, P2=${table.players[1].position}`);
  
  // Verify it's the player's turn
  if (table.currentPlayer !== playerId) {
    console.log(`❌ TURN ERROR: Expected player ${table.currentPlayer}, but got ${playerId}`);
    console.log(`   Player ${table.currentPlayer} details:`, table.players.find(p => p.id === table.currentPlayer));
    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
    return;
  }
  
  console.log(`✅ Turn validation passed: Player ${playerId} is current player`);
  
  try {
    const result = session.pokerEngine.processAction(table, playerId, action, amount);
    
    console.log(`   After action: Street=${table.currentStreet}, CurrentPlayer=${table.currentPlayer}, Pot=${table.pot}, HandComplete=${result.handComplete}`);
    
    // Generate hand history if hand is complete
    if (result.handComplete) {
      const handHistory = session.handHistoryGenerator.generateHandHistory(table);
      result.handHistory = handHistory;
      console.log(`   Hand completed, winner: ${result.winner}`);
    }
    
    // Broadcast updated game state to all players in this session
    console.log(`📡 About to broadcast table update...`);
    broadcastTableUpdate(sessionId, tableId, table, result);
    console.log(`📡 Broadcast completed successfully`);
    
  } catch (error) {
    console.error(`❌ Error processing action: ${error.message}`);
    console.error(`❌ Error stack:`, error.stack);
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
}

function handleNewHandRequest(ws, { sessionId, tableId, playerId }) {
  const session = gameSessions.get(sessionId);
  if (!session) {
    ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
    return;
  }
  
  const table = session.tables.find(t => t.id == tableId);
  if (!table) {
    ws.send(JSON.stringify({ type: 'error', message: 'Table not found' }));
    return;
  }
  
  try {
    const newHand = session.pokerEngine.dealNewHand(table);
    
    // Broadcast new hand to all players with their private cards
    broadcastNewHand(sessionId, tableId, table);
    
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: error.message }));
  }
}

function getPrivateGameState(table, playerId, sessionId) {
  // Create a copy of the table with only the requesting player's hole cards visible
  const privateTable = JSON.parse(JSON.stringify(table));
  
  console.log(`🃏 Creating private state for player ${playerId}:`);
  
  // Hide other players' hole cards and add host status
  privateTable.players.forEach(player => {
    // Add host status to each player
    player.isHost = isPlayerHost(sessionId, player.id);
    console.log(`   🏆 Player ${player.id} (${player.name}) isHost: ${player.isHost}`);
    
    if (player.id !== playerId) {
      // Hide hole cards for other players
      if (player.holeCards) {
        console.log(`   🙈 Hiding cards for player ${player.id} (${player.name}): ${player.holeCards.map(c => c.display || `${c.rank}${c.suit}`).join(', ')}`);
        player.holeCards = player.holeCards.map(() => ({ hidden: true }));
      }
    } else {
      // Show current player's cards
      if (player.holeCards) {
        console.log(`   👀 Showing cards for player ${player.id} (${player.name}): ${player.holeCards.map(c => c.display || `${c.rank}${c.suit}`).join(', ')}`);
      }
    }
  });
  
  // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительно устанавливаем isHost в исходной таблице тоже
  table.players.forEach(player => {
    player.isHost = isPlayerHost(sessionId, player.id);
  });
  
  return privateTable;
}

function broadcastToSession(sessionId, message, excludePlayerId = null) {
  for (const [playerKey, playerData] of connectedPlayers.entries()) {
    if (playerData.sessionId === sessionId && playerKey !== excludePlayerId) {
      if (playerData.ws.readyState === WebSocket.OPEN) {
        playerData.ws.send(JSON.stringify(message));
      }
    }
  }
}

// Функция для проверки является ли игрок хостом
function isPlayerHost(sessionId, playerId) {
  const hostPlayerId = sessionHosts.get(sessionId);
  return hostPlayerId === playerId;
}

function broadcastTableUpdate(sessionId, tableId, table, actionResult) {
  console.log(`📡 Broadcasting table update for session ${sessionId}, table ${tableId}`);
  
  // Send personalized updates to each connected player
  let sentCount = 0;
  for (const [playerKey, playerData] of connectedPlayers.entries()) {
    console.log(`   Checking player ${playerKey}: sessionId=${playerData.sessionId}, tableId=${playerData.tableId}`);
    
    if (playerData.sessionId === sessionId && playerData.tableId == tableId) {
      if (playerData.ws.readyState === WebSocket.OPEN) {
        const privateGameState = getPrivateGameState(table, playerData.playerId, sessionId);
        playerData.ws.send(JSON.stringify({
          type: 'table_update',
          table: privateGameState,
          actionResult: actionResult,
          playerId: playerData.playerId,
          isHost: isPlayerHost(sessionId, playerData.playerId)
        }));
        sentCount++;
        console.log(`   ✅ Sent update to player ${playerData.playerId} (${playerData.playerName})`);
      } else {
        console.log(`   ❌ WebSocket not open for player ${playerData.playerId}`);
      }
    } else {
      console.log(`   🔍 Player ${playerKey} doesn't match: session ${playerData.sessionId} vs ${sessionId}, table ${playerData.tableId} vs ${tableId}`);
    }
  }
  
  console.log(`📡 Broadcast complete: sent to ${sentCount} players`);
}

function broadcastNewHand(sessionId, tableId, table) {
  // Send new hand with private cards to each player
  for (const [playerKey, playerData] of connectedPlayers.entries()) {
    if (playerData.sessionId === sessionId && playerData.tableId == tableId) {
      if (playerData.ws.readyState === WebSocket.OPEN) {
        const privateGameState = getPrivateGameState(table, playerData.playerId, sessionId);
        playerData.ws.send(JSON.stringify({
          type: 'new_hand',
          table: privateGameState,
          playerId: playerData.playerId,
          isHost: isPlayerHost(sessionId, playerData.playerId)
        }));
      }
    }
  }
}

// Функция для конвертации настроек борда с клиента в серверный формат
function convertBoardSettings(clientBoardSettings) {
  console.log('🔧 Converting board settings:', JSON.stringify(clientBoardSettings, null, 2));
  
  const serverBoardSettings = {
    flopSettings: {},
    turnSettings: { enabled: true },
    riverSettings: { enabled: true }
  };

  if (clientBoardSettings && clientBoardSettings.flopSettings) {
    const flopSettings = clientBoardSettings.flopSettings;
    console.log('📋 Processing flop settings:', JSON.stringify(flopSettings, null, 2));
    
    // Конвертируем specific карты
    if (flopSettings.specific && flopSettings.specificCards && flopSettings.specificCards.length === 3) {
      serverBoardSettings.flopSettings.specific = true;
      serverBoardSettings.flopSettings.specificCards = flopSettings.specificCards.map(cardString => {
        if (!cardString) return null;
        
        // Парсим карту из формата "A♥" в объект карты
        const rank = cardString.slice(0, -1); // Все символы кроме последнего
        const suitSymbol = cardString.slice(-1); // Последний символ
        
        // Конвертируем масть
        let suit;
        switch(suitSymbol) {
          case '♥': suit = 'h'; break;
          case '♦': suit = 'd'; break;
          case '♣': suit = 'c'; break;
          case '♠': suit = 's'; break;
          default: suit = 'h';
        }
        
        return {
          rank: rank === 'T' ? '10' : rank,
          suit: suit,
          display: `${rank}${suitSymbol}`
        };
      }).filter(card => card !== null);
      console.log('🎯 Specific cards converted:', serverBoardSettings.flopSettings.specificCards);
    } else {
      serverBoardSettings.flopSettings.specific = false;
    }
    
    // Конвертируем настройки мастей - новый формат (boolean поля)
    if (flopSettings.twoTone) {
      serverBoardSettings.flopSettings.twoTone = true;
      console.log('🎨 Two-tone enabled');
    }
    if (flopSettings.rainbow) {
      serverBoardSettings.flopSettings.rainbow = true;
      console.log('🌈 Rainbow enabled');
    }
    if (flopSettings.monotone) {
      serverBoardSettings.flopSettings.monotone = true;
      console.log('🔵 Monotone enabled');
    }
    
    // Конвертируем настройки спаренности - новый формат (boolean поля)
    if (flopSettings.unpaired) {
      serverBoardSettings.flopSettings.unpaired = true;
      console.log('🚫 Unpaired enabled');
    }
    if (flopSettings.paired) {
      serverBoardSettings.flopSettings.paired = true;
      console.log('👫 Paired enabled');
    }
    if (flopSettings.trips) {
      serverBoardSettings.flopSettings.trips = true;
      console.log('🎯 Trips enabled');
    }
    
    // Конвертируем старый формат настроек мастей (массив строк) - оставляем для совместимости
    if (flopSettings.suits && flopSettings.suits.length > 0) {
      flopSettings.suits.forEach(suitSetting => {
        switch(suitSetting) {
          case 'flush-draw':
            serverBoardSettings.flopSettings.twoTone = true;
            console.log('🎨 Two-tone enabled (legacy)');
            break;
          case 'rainbow':
            serverBoardSettings.flopSettings.rainbow = true;
            console.log('🌈 Rainbow enabled (legacy)');
            break;
          case 'monotone':
            serverBoardSettings.flopSettings.monotone = true;
            console.log('🔵 Monotone enabled (legacy)');
            break;
          case 'any':
          default:
            // Не устанавливаем никаких ограничений
            break;
        }
      });
    }
    
    // Конвертируем старый формат настроек спаренности (массив строк) - оставляем для совместимости
    if (flopSettings.paired && flopSettings.paired.length > 0) {
      flopSettings.paired.forEach(pairedSetting => {
        switch(pairedSetting) {
          case 'unpaired':
            serverBoardSettings.flopSettings.unpaired = true;
            console.log('🚫 Unpaired enabled (legacy)');
            break;
          case 'paired':
            serverBoardSettings.flopSettings.paired = true;
            console.log('👫 Paired enabled (legacy)');
            break;
          case 'trips':
            serverBoardSettings.flopSettings.trips = true;
            console.log('🎯 Trips enabled (legacy)');
            break;
          case 'any':
          default:
            // Не устанавливаем никаких ограничений
            break;
        }
      });
    }
    
    // Конвертируем настройки старшинства карт
    if (flopSettings.ranges && flopSettings.rangeSettings) {
      serverBoardSettings.flopSettings.ranges = true;
      serverBoardSettings.flopSettings.rangeSettings = flopSettings.rangeSettings;
      console.log('📊 Ranges enabled:', flopSettings.rangeSettings);
    } else if (flopSettings.highCard && flopSettings.highCard.length > 0 && !flopSettings.highCard.includes('any')) {
      // Старый формат диапазонов
      serverBoardSettings.flopSettings.ranges = true;
      serverBoardSettings.flopSettings.rangeSettings = {
        high: flopSettings.highCard,
        middle: flopSettings.middleCard || [],
        low: flopSettings.lowCard || []
      };
      console.log('📊 Ranges enabled (legacy):', serverBoardSettings.flopSettings.rangeSettings);
    }
  }

  console.log('✅ Final server board settings:', JSON.stringify(serverBoardSettings, null, 2));
  return serverBoardSettings;
}

// Routes
app.post('/api/upload-preflop', upload.single('preflopHistory'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Парсим и валидируем префлоп историю
    const preflopParser = new PreflopParser();
    const validation = preflopParser.validatePreflopHistory(content);
    const preflopSummary = preflopParser.getPreflopSummary(content);
    
    res.json({
      success: true,
      filename: req.file.filename,
      content: content,
      path: filePath,
      validation: validation,
      summary: preflopSummary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Новый endpoint для анализа префлоп текста (без файла)
app.post('/api/analyze-preflop', (req, res) => {
  try {
    const { preflopText } = req.body;
    
    if (!preflopText) {
      return res.status(400).json({ error: 'No preflop text provided' });
    }
    
    const preflopParser = new PreflopParser();
    const validation = preflopParser.validatePreflopHistory(preflopText);
    const summary = preflopParser.getPreflopSummary(preflopText);
    const detailed = preflopParser.parsePreflopHistory(preflopText);
    
    res.json({
      success: true,
      validation: validation,
      summary: summary,
      detailed: {
        potSize: detailed.potSize,
        actionsCount: detailed.actions.length,
        actions: detailed.actions,
        blinds: detailed.blinds,
        playerStacks: detailed.playerStacks
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Новый endpoint для извлечения имен игроков из префлоп истории
app.post('/api/extract-player-names', (req, res) => {
  try {
    const { preflopText } = req.body;
    
    if (!preflopText) {
      return res.status(400).json({ error: 'No preflop text provided' });
    }
    
    const preflopParser = new PreflopParser();
    const playerNames = preflopParser.extractPlayerNames(preflopText);
    
    res.json({
      success: true,
      playerNames: playerNames
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Новый endpoint для получения списка доступных сессий
app.get('/api/sessions', (req, res) => {
  try {
    const sessionsList = [];
    
    for (const [sessionId, session] of gameSessions.entries()) {
      // Извлекаем тип игры из названия файла префлоп истории
      let gameType = 'Покер сессия';
      if (session.preflopHistory) {
        // Пытаемся извлечь информацию о типе игры из префлоп истории
        const lines = session.preflopHistory.split('\n');
        const firstLine = lines[0];
        if (firstLine && firstLine.includes('Table')) {
          const tableMatch = firstLine.match(/Table '([^']+)'/);
          if (tableMatch) {
            gameType = tableMatch[1];
          }
        }
      }
      
      // Подсчитываем количество подключенных игроков
      let playerCount = 0;
      for (const [playerId, playerData] of connectedPlayers.entries()) {
        if (playerData.sessionId === sessionId) {
          playerCount++;
        }
      }
      
      sessionsList.push({
        sessionId: sessionId,
        gameType: gameType,
        tableCount: session.tables.length,
        createdAt: session.createdAt || new Date().toISOString(),
        playerCount: playerCount,
        maxPlayers: session.tables.length * 2 // 2 игрока на стол
      });
    }
    
    // Сортируем по времени создания (новые сначала)
    sessionsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(sessionsList);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Новый endpoint для очистки неиспользуемых сессий
app.delete('/api/sessions/cleanup', (req, res) => {
  try {
    let removedCount = 0;
    const sessionsToRemove = [];
    
    // Находим сессии без подключенных игроков
    for (const [sessionId, session] of gameSessions.entries()) {
      let hasConnectedPlayers = false;
      
      // Проверяем есть ли подключенные игроки в этой сессии
      for (const [playerId, playerData] of connectedPlayers.entries()) {
        if (playerData.sessionId === sessionId) {
          hasConnectedPlayers = true;
          break;
        }
      }
      
      // Если нет подключенных игроков, помечаем для удаления
      if (!hasConnectedPlayers) {
        sessionsToRemove.push(sessionId);
      }
    }
    
    // Удаляем неиспользуемые сессии
    sessionsToRemove.forEach(sessionId => {
      gameSessions.delete(sessionId);
      removedCount++;
    });
    
    console.log(`🧹 Cleaned up ${removedCount} unused sessions`);
    
    res.json({
      success: true,
      removedCount: removedCount,
      message: `Удалено ${removedCount} неиспользуемых сессий`
    });
  } catch (error) {
    console.error('Cleanup sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-session', (req, res) => {
  try {
    const {
      preflopHistory,
      boardSettings,
      handRanges,
      tableCount,
      rakeSettings,
      playerNames, // Получаем имена игроков от клиента
      currentPlayer, // Получаем информацию о текущем игроке
      hostPlayerId // Получаем hostPlayerId
    } = req.body;

    // Создаем группу сессий - по одной на каждый стол
    const sessionGroup = {
      sessionIds: [],
      tables: [],
      playerNames: [],
      preflopInfo: null
    };
    
    // Конвертируем настройки борда в серверный формат
    const convertedBoardSettings = convertBoardSettings(boardSettings);
    console.log('Converted board settings:', JSON.stringify(convertedBoardSettings, null, 2));
    
    // Парсим префлоп историю для извлечения размера банка
    const preflopParser = new PreflopParser();
    const preflopData = preflopParser.parsePreflopHistory(preflopHistory);
    
    // ВАЖНО: Используем имена от клиента ПРИОРИТЕТНО
    console.log('👥 Player names from client:', playerNames);
    console.log('🎯 Current player info:', currentPlayer);
    
    // Используем имена игроков от клиента, если они есть
    let finalPlayerNames = [];
    if (playerNames && playerNames.length >= 2) {
      finalPlayerNames = playerNames;
      console.log('✅ Using client player names:', finalPlayerNames);
    } else {
      // Fallback: пытаемся извлечь из hand history
      const parsedPlayerNames = preflopParser.extractPlayerNames(preflopHistory);
      finalPlayerNames = parsedPlayerNames.length >= 2 ? parsedPlayerNames : ['Player 1', 'Player 2'];
      console.log('⚠️ Fallback to parsed/default names:', finalPlayerNames);
    }
    
    console.log('📊 Parsed preflop data:', {
      potSize: preflopData.potSize,
      actions: preflopData.actions.length,
      blinds: preflopData.blinds
    });
    
    // Рассчитываем стеки после префлоп действий
    const handHistoryGenerator = new HandHistoryGenerator(preflopHistory);
    const remainingStacks = handHistoryGenerator.calculatePreflopStacks(preflopHistory);
    const activePlayers = handHistoryGenerator.getActivePlayers(preflopHistory);
    
    console.log('📊 Calculated remaining stacks after preflop:', remainingStacks);
    console.log('👥 Active players (not folded):', activePlayers);

    // Создаем карту стеков с правильными именами игроков
    const stacksWithCorrectNames = {};
    
    // ИСПРАВЛЕНИЕ: Правильно сопоставляем стеки с именами игроков
    if (Object.keys(remainingStacks).length >= 2 && finalPlayerNames.length >= 2) {
      // Для каждого финального игрока ищем его стек в remainingStacks
      finalPlayerNames.forEach((playerName, index) => {
        console.log(`🔍 Processing player ${index + 1}: "${playerName}"`);
        console.log(`   Available stacks:`, Object.keys(remainingStacks));
        
        // Сначала пытаемся найти точное совпадение
        if (remainingStacks[playerName] !== undefined) {
          stacksWithCorrectNames[playerName] = remainingStacks[playerName];
          console.log(`✅ Found exact stack match: ${playerName} = €${remainingStacks[playerName]}`);
        } else {
          // Если точного совпадения нет, берем стек из активных игроков
          const activePlayersWithStacks = activePlayers.filter(name => remainingStacks[name] !== undefined);
          console.log(`   🔍 Active players with stacks:`, activePlayersWithStacks);
          
          if (activePlayersWithStacks[index]) {
            const matchedPlayerName = activePlayersWithStacks[index];
            const matchedStack = remainingStacks[matchedPlayerName];
            stacksWithCorrectNames[playerName] = matchedStack;
            console.log(`🔄 Matched by position: ${playerName} ← ${matchedPlayerName} = €${matchedStack}`);
          } else {
            // Fallback к значению по умолчанию
            stacksWithCorrectNames[playerName] = 1000;
            console.log(`⚠️ No stack found for ${playerName}, using default €1000`);
          }
        }
      });
    } else {
      // Fallback если нет достаточно данных
      finalPlayerNames.forEach(playerName => {
        stacksWithCorrectNames[playerName] = 1000;
      });
      console.log('⚠️ Using default stacks €1000 for all players');
    }
    
    console.log('🎯 Final stacks mapping:', stacksWithCorrectNames);

    console.log('🏗️ Creating multiple sessions for', tableCount, 'tables');

    // Создаем отдельную сессию для каждого стола
    for (let i = 0; i < tableCount; i++) {
      const sessionId = uuidv4();
      const pokerEngine = new PokerEngine(convertedBoardSettings, handRanges, preflopHistory);
      
      const session = {
        id: sessionId,
        preflopHistory,
        preflopData, // Сохраняем парсенные данные
        playerNames: finalPlayerNames, // Используем финальные имена игроков
        currentPlayer, // Сохраняем информацию о текущем игроке
        pokerEngine,
        handHistoryGenerator: new HandHistoryGenerator(preflopHistory, rakeSettings),
        tables: [],
        settings: { boardSettings, handRanges, tableCount: 1, rakeSettings }, // Каждая сессия - один стол
        createdAt: new Date().toISOString(),
        hostPlayerId
      };

      console.log(`🎯 Creating session ${i + 1}/${tableCount} with unique cards`);
      const table = pokerEngine.createTable(1, preflopData.potSize, stacksWithCorrectNames, finalPlayerNames, currentPlayer, null);
      session.tables.push(table);

      // Сохраняем сессию
      gameSessions.set(sessionId, session);
      sessionHosts.set(sessionId, hostPlayerId);

      // Добавляем в группу
      sessionGroup.sessionIds.push(sessionId);
      sessionGroup.tables.push(table);
    }

    sessionGroup.playerNames = finalPlayerNames;
    sessionGroup.preflopInfo = {
      potSize: preflopData.potSize,
      actions: preflopData.actions.length,
      blinds: preflopData.blinds
    };

    res.json({
      success: true,
      sessionIds: sessionGroup.sessionIds, // Возвращаем массив ID сессий
      tables: sessionGroup.tables,
      playerNames: finalPlayerNames,
      currentPlayer,
      preflopInfo: sessionGroup.preflopInfo
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/action/:sessionId/:tableId', (req, res) => {
  try {
    const { sessionId, tableId } = req.params;
    const { playerId, action, amount } = req.body;

    const session = gameSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const table = session.tables.find(t => t.id == tableId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const result = session.pokerEngine.processAction(table, playerId, action, amount);
    
    // Generate hand history if hand is complete
    if (result.handComplete) {
      const handHistory = session.handHistoryGenerator.generateHandHistory(table);
      result.handHistory = handHistory;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = gameSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      sessionId,
      tables: session.tables,
      settings: session.settings,
      playerNames: session.playerNames || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/new-hand/:sessionId/:tableId', (req, res) => {
  try {
    const { sessionId, tableId } = req.params;
    const session = gameSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const table = session.tables.find(t => t.id == tableId);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const newHand = session.pokerEngine.dealNewHand(table);
    res.json(newHand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export-hand-histories', (req, res) => {
  try {
    const { handHistories, sessionId } = req.body;
    
    if (!handHistories || handHistories.length === 0) {
      return res.status(400).json({ error: 'No hand histories provided' });
    }

    // Combine all hand histories
    const combinedContent = handHistories.join('\n\n');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="hand2note-export-${Date.now()}.txt"`);
    
    res.send(combinedContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Раздача статических файлов для префлоп спотов
app.use('/preflop-spots', express.static(path.join(__dirname, '../client/src/data/preflop-spots')));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Poker Simulator server running on port ${PORT}`);
}); 