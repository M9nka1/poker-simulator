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

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
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
  
  // Store player connection
  connectedPlayers.set(`${sessionId}-${tableId}-${playerId}`, {
    ws,
    sessionId,
    tableId,
    playerId,
    playerName: playerName || `Player ${playerId}`
  });
  
  // Update player name in table
  const player = table.players.find(p => p.id === playerId);
  if (player) {
    player.name = playerName || `Player ${playerId}`;
    player.connected = true;
  }
  
  // Send private game state to the joining player
  const privateGameState = getPrivateGameState(table, playerId);
  ws.send(JSON.stringify({
    type: 'game_state',
    table: privateGameState,
    playerId: playerId
  }));
  
  // Notify other players about the new connection
  broadcastToSession(sessionId, {
    type: 'player_connected',
    playerId: playerId,
    playerName: playerName || `Player ${playerId}`,
    tableId: tableId
  }, `${sessionId}-${tableId}-${playerId}`);
  
  console.log(`Player ${playerId} (${playerName}) joined session ${sessionId}, table ${tableId}`);
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
  
  // Verify it's the player's turn
  if (table.currentPlayer !== playerId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
    return;
  }
  
  console.log(`🎮 Player ${playerId} action: ${action} ${amount || 0} on ${table.currentStreet}`);
  console.log(`   Before: Street=${table.currentStreet}, CurrentPlayer=${table.currentPlayer}, Pot=${table.pot}`);
  
  try {
    const result = session.pokerEngine.processAction(table, playerId, action, amount);
    
    console.log(`   After: Street=${table.currentStreet}, CurrentPlayer=${table.currentPlayer}, Pot=${table.pot}, HandComplete=${result.handComplete}`);
    
    // Generate hand history if hand is complete
    if (result.handComplete) {
      const handHistory = session.handHistoryGenerator.generateHandHistory(table);
      result.handHistory = handHistory;
      console.log(`   Hand completed, winner: ${result.winner}`);
    }
    
    // Broadcast updated game state to all players in this session
    broadcastTableUpdate(sessionId, tableId, table, result);
    
  } catch (error) {
    console.error(`❌ Error processing action: ${error.message}`);
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

function getPrivateGameState(table, playerId) {
  // Create a copy of the table with only the requesting player's hole cards visible
  const privateTable = JSON.parse(JSON.stringify(table));
  
  // Hide other players' hole cards
  privateTable.players.forEach(player => {
    if (player.id !== playerId) {
      // Hide hole cards for other players
      if (player.holeCards) {
        player.holeCards = player.holeCards.map(() => ({ hidden: true }));
      }
    }
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

function broadcastTableUpdate(sessionId, tableId, table, actionResult) {
  // Send personalized updates to each connected player
  for (const [playerKey, playerData] of connectedPlayers.entries()) {
    if (playerData.sessionId === sessionId && playerData.tableId == tableId) {
      if (playerData.ws.readyState === WebSocket.OPEN) {
        const privateGameState = getPrivateGameState(table, playerData.playerId);
        playerData.ws.send(JSON.stringify({
          type: 'table_update',
          table: privateGameState,
          actionResult: actionResult,
          playerId: playerData.playerId
        }));
      }
    }
  }
}

function broadcastNewHand(sessionId, tableId, table) {
  // Send new hand with private cards to each player
  for (const [playerKey, playerData] of connectedPlayers.entries()) {
    if (playerData.sessionId === sessionId && playerData.tableId == tableId) {
      if (playerData.ws.readyState === WebSocket.OPEN) {
        const privateGameState = getPrivateGameState(table, playerData.playerId);
        playerData.ws.send(JSON.stringify({
          type: 'new_hand',
          table: privateGameState,
          playerId: playerData.playerId
        }));
      }
    }
  }
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

app.post('/api/create-session', (req, res) => {
  try {
    const {
      preflopHistory,
      boardSettings,
      handRanges,
      tableCount,
      rakeSettings
    } = req.body;

    const sessionId = uuidv4();
    
    // Парсим префлоп историю для извлечения размера банка
    const preflopParser = new PreflopParser();
    const preflopData = preflopParser.parsePreflopHistory(preflopHistory);
    const playerNames = preflopParser.extractPlayerNames(preflopHistory);
    
    console.log('Parsed preflop data:', {
      potSize: preflopData.potSize,
      actions: preflopData.actions.length,
      blinds: preflopData.blinds
    });
    
    const pokerEngine = new PokerEngine(boardSettings, handRanges, preflopHistory);
    
    const session = {
      id: sessionId,
      preflopHistory,
      preflopData, // Сохраняем парсенные данные
      playerNames, // Сохраняем имена игроков
      pokerEngine,
      handHistoryGenerator: new HandHistoryGenerator(preflopHistory, rakeSettings),
      tables: [],
      settings: { boardSettings, handRanges, tableCount, rakeSettings },
      createdAt: new Date().toISOString()
    };

    // Рассчитываем стеки после префлоп действий
    const handHistoryGenerator = new HandHistoryGenerator(preflopHistory);
    const remainingStacks = handHistoryGenerator.calculatePreflopStacks(preflopHistory);
    const activePlayers = handHistoryGenerator.getActivePlayers(preflopHistory);
    
    console.log('📊 Calculated remaining stacks after preflop:', remainingStacks);
    console.log('👥 Active players (not folded):', activePlayers);

    // Generate tables с правильным размером банка и рассчитанными стеками
    for (let i = 0; i < tableCount; i++) {
      const table = pokerEngine.createTable(i + 1, preflopData.potSize, remainingStacks, activePlayers);
      session.tables.push(table);
    }

    gameSessions.set(sessionId, session);

    res.json({
      success: true,
      sessionId,
      tables: session.tables,
      playerNames: playerNames, // Возвращаем имена игроков
      preflopInfo: {
        potSize: preflopData.potSize,
        actions: preflopData.actions.length,
        blinds: preflopData.blinds
      }
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

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Poker Simulator server running on port ${PORT}`);
}); 