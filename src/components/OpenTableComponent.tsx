import React, { useState, useEffect } from 'react';

interface OpenTableComponentProps {
  sessionId: string;
  tableId: number;
  isGuest?: boolean;
}

interface TableData {
  sessionId: string;
  tableId: number;
  players: { [position: string]: any };
  availablePositions: string[];
  gameStarted: boolean;
  board: any[];
}

const OpenTableComponent: React.FC<OpenTableComponentProps> = ({ 
  sessionId, 
  tableId, 
  isGuest = false 
}) => {
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Подключение к WebSocket
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:5000');
    
    websocket.onopen = () => {
      console.log('🔗 Connected to open table WebSocket');
      setConnected(true);
      
      // Запрашиваем доступные позиции
      websocket.send(JSON.stringify({
        type: 'getAvailablePositions',
        sessionId,
        tableId
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'availablePositions') {
        setTableData({
          sessionId,
          tableId,
          players: data.players,
          availablePositions: data.positions,
          gameStarted: false,
          board: []
        });
      } else if (data.type === 'tableUpdate') {
        setTableData(data);
      } else if (data.type === 'error') {
        console.error('❌ WebSocket error:', data.message);
      }
    };

    websocket.onclose = () => {
      console.log('🚪 Disconnected from WebSocket');
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [sessionId, tableId]);

  // Присоединение к столу
  const joinTable = () => {
    if (!ws || !selectedPosition || !playerName.trim()) return;

    ws.send(JSON.stringify({
      type: 'joinOpenTable',
      sessionId,
      tableId,
      playerName: playerName.trim(),
      selectedPosition
    }));
  };

  // Игровое действие
  const makeAction = (action: string, amount?: number) => {
    if (!ws) return;

    ws.send(JSON.stringify({
      type: 'gameAction',
      sessionId,
      tableId,
      action,
      amount,
      street: 'flop' // для простоты пока только флоп
    }));
  };

  // Генерация имени по позиции
  const getPositionNames = (position: string) => {
    const baseNames = {
      'BTN': ['Pio_IP_c3bBU', 'Pio_IP_Hero', 'Player_BTN'],
      'BB': ['Pio_OOP_3bet_SB', 'Pio_BB_Hero', 'Player_BB']
    };
    return baseNames[position as keyof typeof baseNames] || ['Player'];
  };

  if (!tableData) {
    return (
      <div className="open-table-loading">
        <h2>🔄 Загрузка стола...</h2>
        <p>Подключение к сессии {sessionId}, стол {tableId}</p>
      </div>
    );
  }

  const myPosition = Object.keys(tableData.players).find(pos => 
    tableData.players[pos].name === playerName
  );

  return (
    <div className="open-table-container">
      <div className="table-header">
        <h2>🎮 Открытый стол {tableId}</h2>
        <p>Сессия: <code>{sessionId}</code></p>
        <div className="connection-status">
          {connected ? '🟢 Подключен' : '🔴 Отключен'}
        </div>
      </div>

      {!myPosition ? (
        // Выбор позиции
        <div className="position-selector">
          <h3>🪑 Выберите место за столом</h3>
          
          <div className="player-name-input">
            <label>Ваше имя:</label>
            <select
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            >
              <option value="">Выберите имя...</option>
              {selectedPosition && getPositionNames(selectedPosition).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="available-positions">
            <h4>Доступные позиции:</h4>
            {tableData.availablePositions.map(position => (
              <button
                key={position}
                onClick={() => {
                  setSelectedPosition(position);
                  if (!playerName) {
                    setPlayerName(getPositionNames(position)[0]);
                  }
                }}
                className={`position-button ${selectedPosition === position ? 'selected' : ''}`}
              >
                {position}
                <div className="position-info">
                  {position === 'BTN' && '(Button, IP)'}
                  {position === 'BB' && '(Big Blind, OOP)'}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={joinTable}
            disabled={!selectedPosition || !playerName.trim()}
            className="join-table-button"
          >
            🪑 Сесть за стол
          </button>

          <div className="occupied-seats">
            <h4>Занятые места:</h4>
            {Object.entries(tableData.players).map(([pos, player]) => (
              <div key={pos} className="occupied-seat">
                <strong>{pos}</strong>: {player.name}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Игровой интерфейс
        <div className="game-interface">
          <div className="table-view">
            <h3>🃏 Стол запущен!</h3>
            <p>Ваша позиция: <strong>{myPosition}</strong></p>
            
            {tableData.board.length > 0 && (
              <div className="board">
                <h4>Доска:</h4>
                <div className="cards">
                  {tableData.board.map((card, index) => (
                    <span key={index} className="card">
                      {card.display}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="players-info">
              {Object.entries(tableData.players).map(([pos, player]) => (
                <div 
                  key={pos} 
                  className={`player-info ${pos === myPosition ? 'my-position' : ''}`}
                >
                  <strong>{pos}</strong>: {player.name}
                  {pos === myPosition && player.cards && (
                    <div className="my-cards">
                      Карты: {player.cards.map((c: any) => c.display).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {tableData.gameStarted && (
              <div className="action-buttons">
                <button onClick={() => makeAction('check')}>Check</button>
                <button onClick={() => makeAction('bet', 50)}>Bet 50</button>
                <button onClick={() => makeAction('fold')}>Fold</button>
                <button onClick={() => makeAction('call')}>Call</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenTableComponent; 