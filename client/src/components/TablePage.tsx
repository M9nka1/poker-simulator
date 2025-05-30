import React, { useState, useEffect } from 'react';
import ModernPokerTable from './ModernPokerTable';
import config from '../config';

interface TablePageProps {
  sessionId: string;
  tableId: number;
  playerNames: string[];
  tableStyle?: string;
  isGuest?: boolean;
}

interface TableData {
  id: number;
  players: any[];
  board: {
    flop: any[];
    turn: any | null;
    river: any | null;
  };
  pot: number;
  currentStreet: string;
  currentPlayer: number;
  handComplete: boolean;
  winner: number | null;
}

const TablePage: React.FC<TablePageProps> = ({ 
  sessionId, 
  tableId, 
  playerNames, 
  tableStyle = 'modern',
  isGuest = false 
}) => {
  const [table, setTable] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 🔥 НОВАЯ АРХИТЕКТУРА: Состояние для открытых столов
  const [isOpenTable, setIsOpenTable] = useState(false);
  const [openTableParams, setOpenTableParams] = useState<{
    sessionId: string;
    tableId: number;
    isGuest: boolean;
  } | null>(null);
  const [tableData, setTableData] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Проверяем URL параметры для определения типа стола
  useEffect(() => {
    const checkParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tableStyle = urlParams.get('tableStyle');
      const sessionId = urlParams.get('sessionId');
      const tableId = urlParams.get('tableId');
      const isGuest = urlParams.get('isGuest') === 'true';

      // 🔥 НОВАЯ АРХИТЕКТУРА: Открытые столы
      if (tableStyle === 'open' && sessionId && tableId) {
        console.log('🆕 Loading open table:', { sessionId, tableId, isGuest });
        setIsOpenTable(true);
        setOpenTableParams({ sessionId, tableId: parseInt(tableId), isGuest });
        return;
      }

      // ... existing param handling ...
    };

    checkParams();
  }, []);

  // 🔥 НОВАЯ АРХИТЕКТУРА: WebSocket для открытых столов
  useEffect(() => {
    if (!isOpenTable || !openTableParams) return;

    const websocket = new WebSocket('ws://localhost:5000');
    
    websocket.onopen = () => {
      console.log('🔗 Connected to open table WebSocket');
      
      // Запрашиваем доступные позиции
      websocket.send(JSON.stringify({
        type: 'getAvailablePositions',
        sessionId: openTableParams.sessionId,
        tableId: openTableParams.tableId
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'availablePositions') {
        setTableData({
          sessionId: openTableParams.sessionId,
          tableId: openTableParams.tableId,
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
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [isOpenTable, openTableParams]);

  // Основной useEffect для загрузки стола (только для обычных столов)
  useEffect(() => {
    if (isOpenTable) return; // Не выполняем для открытых столов
    
    console.log(`🎮 TablePage loading - Session: ${sessionId}, Table: ${tableId}, Guest: ${isGuest}, Style: ${tableStyle}`);
    
    if (!sessionId || !tableId) {
      setError('Не указаны параметры сессии или стола');
      setIsLoading(false);
      return;
    }

    // Устанавливаем заголовок окна
    document.title = `Покерный стол #${tableId} - Сессия ${sessionId.substring(0, 8)}`;

    // Загружаем данные стола
    const loadTable = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/session/${sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          console.log(`📊 Loaded session data:`, sessionData);
          
          const targetTable = sessionData.tables.find((t: any) => t.id === tableId);
          if (targetTable) {
            setTable(targetTable);
            console.log(`✅ Found target table:`, targetTable);
          } else {
            setError(`Стол #${tableId} не найден в сессии`);
          }
        } else {
          setError('Сессия не найдена');
        }
      } catch (err) {
        console.error('❌ Error loading table:', err);
        setError('Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    loadTable();
  }, [sessionId, tableId, isGuest, tableStyle, isOpenTable]);

  // 🔥 НОВАЯ АРХИТЕКТУРА: Присоединение к открытому столу
  const joinOpenTable = () => {
    if (!ws || !selectedPosition || !playerName.trim() || !openTableParams) return;

    ws.send(JSON.stringify({
      type: 'joinOpenTable',
      sessionId: openTableParams.sessionId,
      tableId: openTableParams.tableId,
      playerName: playerName.trim(),
      selectedPosition
    }));
  };

  // 🔥 НОВАЯ АРХИТЕКТУРА: Генерация имён по позиции
  const getPositionNames = (position: string) => {
    const baseNames = {
      'BTN': ['Pio_IP_c3bBU', 'Pio_IP_Hero', 'Player_BTN'],
      'BB': ['Pio_OOP_3bet_SB', 'Pio_BB_Hero', 'Player_BB']
    };
    return baseNames[position as keyof typeof baseNames] || ['Player'];
  };

  // 🔥 НОВАЯ АРХИТЕКТУРА: Рендер открытого стола
  if (isOpenTable) {
    if (!tableData) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>🔄 Загрузка открытого стола...</h2>
          <p>Подключение к сессии {openTableParams?.sessionId}</p>
          <p>Стол #{openTableParams?.tableId}</p>
        </div>
      );
    }

    const myPosition = Object.keys(tableData.players).find(pos => 
      tableData.players[pos].name === playerName
    );

    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h1>🎮 Открытый стол #{tableData.tableId}</h1>
          <p>Сессия: <code style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
            {tableData.sessionId.substring(0, 8)}...
          </code></p>
        </div>

        {!myPosition ? (
          // Выбор позиции
          <div style={{ 
            border: '2px solid #4CAF50', 
            borderRadius: '10px', 
            padding: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>🪑 Выберите место за столом</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Выберите позицию:
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {tableData.availablePositions.map((position: string) => (
                  <button
                    key={position}
                    onClick={() => {
                      setSelectedPosition(position);
                      setPlayerName(getPositionNames(position)[0]);
                    }}
                    style={{
                      padding: '15px 20px',
                      border: selectedPosition === position ? '3px solid #4CAF50' : '2px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: selectedPosition === position ? '#e8f5e8' : 'white',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    <div>{position}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {position === 'BTN' && '(Button, IP)'}
                      {position === 'BB' && '(Big Blind, OOP)'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedPosition && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Выберите имя игрока:
                </label>
                <select
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  style={{
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    width: '100%',
                    maxWidth: '300px'
                  }}
                >
                  <option value="">Выберите имя...</option>
                  {getPositionNames(selectedPosition).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={joinOpenTable}
              disabled={!selectedPosition || !playerName.trim()}
              style={{
                backgroundColor: selectedPosition && playerName.trim() ? '#4CAF50' : '#ccc',
                color: 'white',
                padding: '15px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: selectedPosition && playerName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              🪑 Сесть за стол
            </button>

            {Object.keys(tableData.players).length > 0 && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                <h4>👥 Занятые места:</h4>
                {Object.entries(tableData.players).map(([pos, player]: [string, any]) => (
                  <div key={pos} style={{ margin: '5px 0' }}>
                    <strong>{pos}</strong>: {player.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Игровой интерфейс
          <div style={{ 
            border: '2px solid #2196F3', 
            borderRadius: '10px', 
            padding: '20px',
            backgroundColor: '#f0f8ff'
          }}>
            <h3>🃏 Вы за столом!</h3>
            <p>Ваша позиция: <strong style={{ color: '#2196F3' }}>{myPosition}</strong></p>
            <p>Имя: <strong>{playerName}</strong></p>
            
            {tableData.gameStarted ? (
              <div style={{ marginTop: '20px' }}>
                <h4>🎮 Игра началась!</h4>
                {tableData.board && tableData.board.length > 0 && (
                  <div style={{ margin: '10px 0' }}>
                    <strong>Доска:</strong> {tableData.board.map((card: any) => card.display).join(' ')}
                  </div>
                )}
                <div style={{ marginTop: '15px' }}>
                  <button style={{ margin: '5px', padding: '10px 15px' }}>Check</button>
                  <button style={{ margin: '5px', padding: '10px 15px' }}>Bet</button>
                  <button style={{ margin: '5px', padding: '10px 15px' }}>Fold</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px' }}>
                ⏳ Ожидание второго игрока для начала игры...
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <h4>👥 Игроки за столом:</h4>
              {Object.entries(tableData.players).map(([pos, player]: [string, any]) => (
                <div 
                  key={pos}
                  style={{ 
                    margin: '5px 0',
                    padding: '8px',
                    backgroundColor: pos === myPosition ? '#e8f5e8' : '#f5f5f5',
                    borderRadius: '4px',
                    border: pos === myPosition ? '2px solid #4CAF50' : '1px solid #ddd'
                  }}
                >
                  <strong>{pos}</strong>: {player.name}
                  {pos === myPosition && ' (Вы)'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0f4c2a',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        🔄 Загрузка стола...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0f4c2a',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>❌ Ошибка</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Попробовать снова
        </button>
      </div>
    );
  }

  if (!table) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white'
      }}>
        ❌ Стол не найден
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: '#0f4c2a'
    }}>
      <ModernPokerTable
        table={table}
        sessionId={sessionId}
        playerNames={playerNames}
        onHandComplete={(handHistory: string) => {
          console.log('✅ Hand completed:', handHistory);
        }}
      />
    </div>
  );
};

export default TablePage; 