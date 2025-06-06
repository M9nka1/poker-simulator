import React, { useState, useEffect } from 'react';
import RankCard from './RankCard';
import PlayerJoinModal from './PlayerJoinModal';
import ModernPokerTable from './ModernPokerTable';
import { websocketService, PlayerInfo } from '../services/websocket';
import './MultiplayerPokerTable.css';

interface Card {
  rank: string;
  suit: string;
  display: string;
  hidden?: boolean;
}

interface Player {
  id: number;
  name: string;
  stack: number;
  holeCards: Card[];
  position: string;
  actions: any[];
  connected: boolean;
  isHost: boolean;
}

interface TableData {
  id: number;
  players: Player[];
  board: {
    flop: Card[];
    turn: Card | null;
    river: Card | null;
  };
  pot: number;
  currentStreet: string;
  currentPlayer: number;
  handComplete: boolean;
  winner: number | null;
}

interface MultiplayerPokerTableProps {
  table: TableData;
  sessionId: string;
  playerNames?: string[];
  betSizes?: {
    quarter: boolean;
    half: boolean;
    threeQuarter: boolean;
    pot: boolean;
    allIn: boolean;
  };
  onHandComplete: (handHistory: string) => void;
  tableStyle?: string;
}

const MultiplayerPokerTable: React.FC<MultiplayerPokerTableProps> = ({ 
  table: initialTable, 
  sessionId, 
  playerNames = [],
  betSizes = {
    quarter: true,
    half: true,
    threeQuarter: true,
    pot: true,
    allIn: true
  }, 
  onHandComplete,
  tableStyle = 'classic'
}) => {
  const [table, setTable] = useState<TableData>(initialTable);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(0);
  const [useCardImages, setUseCardImages] = useState<boolean>(false);
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Подключение...');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showSizingSettings, setShowSizingSettings] = useState<boolean>(false);
  const [customSizings, setCustomSizings] = useState<{[key: string]: number}>({
    quarter: 25,
    half: 50,
    threeQuarter: 75,
    pot: 100,
    allIn: 100
  });
  const [isHost, setIsHost] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualBetAmount, setManualBetAmount] = useState<string>('');

  useEffect(() => {
    setTable(initialTable);
    setSelectedBetAmount(0); // Сбрасываем выбранный размер при обновлении стола
  }, [initialTable]);

  // Monitor WebSocket connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = websocketService.isWebSocketConnected();
      setIsConnected(connected);
      if (connected) {
        setConnectionStatus('Подключен');
      } else {
        setConnectionStatus('Подключение...');
      }
    };

    // Check immediately
    checkConnection();

    // Check periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Setup WebSocket message handlers
    websocketService.onMessage('game_state', (data) => {
      console.log('🎮 Received game_state:', data);
      setTable(data.table);
      setCurrentPlayerId(data.playerId);
      setIsHost(data.isHost || false);
      setConnectionStatus('Подключен');
      setShowJoinModal(false); // Закрываем модальное окно при успешном подключении
    });

    websocketService.onMessage('table_update', (data) => {
      console.log('🔄 Received table_update:', data);
      console.log(`   Street: ${data.table.currentStreet}, CurrentPlayer: ${data.table.currentPlayer}, Pot: ${data.table.pot}`);
      setTable(data.table);
      setIsHost(data.isHost || false);
      setSelectedBetAmount(0); // Сбрасываем выбранный размер при обновлении
      if (data.actionResult?.handComplete && data.actionResult?.handHistory) {
        onHandComplete(data.actionResult.handHistory);
      }
    });

    websocketService.onMessage('new_hand', (data) => {
      setTable(data.table);
      setIsHost(data.isHost || false);
    });

    websocketService.onMessage('player_connected', (data) => {
      setConnectionStatus(`Игрок ${data.playerId} подключился`);
      setTimeout(() => setConnectionStatus('Подключен'), 3000);
    });

    websocketService.onMessage('player_disconnected', (data) => {
      setConnectionStatus(`Игрок ${data.playerId} отключился`);
    });

    websocketService.onMessage('error', (data) => {
      alert(`Ошибка: ${data.message}`);
      setShowJoinModal(true); // Показываем модальное окно при ошибке
    });

    // Проверяем подключение WebSocket и существующую информацию об игроке
    const checkConnectionAndShowModal = () => {
      const playerInfo = websocketService.getPlayerInfo();
      const isConnected = websocketService.isWebSocketConnected();
      
      if (playerInfo && playerInfo.sessionId === sessionId && playerInfo.tableId === table.id && isConnected) {
        setCurrentPlayerId(playerInfo.playerId);
        setConnectionStatus('Подключен');
        setShowJoinModal(false);
      } else {
        // Ждем подключения WebSocket перед показом модального окна
        if (isConnected) {
          setShowJoinModal(true);
        } else {
          // Проверяем каждые 500мс до подключения
          const checkInterval = setInterval(() => {
            if (websocketService.isWebSocketConnected()) {
              setShowJoinModal(true);
              clearInterval(checkInterval);
            }
          }, 500);
          
          // Таймаут на случай если WebSocket не подключится
          setTimeout(() => {
            clearInterval(checkInterval);
            setShowJoinModal(true);
          }, 5000);
        }
      }
    };

    checkConnectionAndShowModal();

    return () => {
      // Cleanup message handlers
      websocketService.offMessage('game_state');
      websocketService.offMessage('table_update');
      websocketService.offMessage('new_hand');
      websocketService.offMessage('player_connected');
      websocketService.offMessage('player_disconnected');
      websocketService.offMessage('error');
    };
  }, [sessionId, table.id, onHandComplete]);

  const handleJoinSession = (playerId: number, playerName: string) => {
    const playerInfo: PlayerInfo = {
      playerId,
      playerName,
      sessionId,
      tableId: table.id
    };
    
    // Проверяем подключение WebSocket перед присоединением
    if (!websocketService.isWebSocketConnected()) {
      alert('WebSocket не подключен. Попробуйте еще раз через несколько секунд.');
      return;
    }
    
    setCurrentPlayerId(playerId);
    setConnectionStatus('Подключение...');
    setShowJoinModal(false);
    
    // Присоединяемся к сессии
    websocketService.joinSession(playerInfo);
  };

  const makeAction = (action: string, amount?: number) => {
    if (!currentPlayerId || table.currentPlayer !== currentPlayerId) {
      alert('Не ваш ход!');
      return;
    }

    console.log(`🎯 Making action: ${action} ${amount || 0} on ${table.currentStreet}`);
    console.log(`   Current state: Player=${currentPlayerId}, Street=${table.currentStreet}, Pot=${table.pot}`);

    setIsLoading(true);
    websocketService.sendPlayerAction(action, amount);
    
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  const dealNewHand = () => {
    setIsLoading(true);
    websocketService.requestNewHand();
    
    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000);
  };

  const calculateBetSize = (type: string): number => {
    const pot = table.pot || 100;
    const currentPlayerData = table.players.find(p => p.id === currentPlayerId);
    const maxStack = currentPlayerData?.stack || 1000;
    
    let baseAmount = 0;
    switch (type) {
      case 'quarter': baseAmount = Math.round(pot * (customSizings.quarter / 100)); break;
      case 'half': baseAmount = Math.round(pot * (customSizings.half / 100)); break;
      case 'threeQuarter': baseAmount = Math.round(pot * (customSizings.threeQuarter / 100)); break;
      case 'pot': baseAmount = Math.round(pot * (customSizings.pot / 100)); break;
      case 'allIn': baseAmount = maxStack; break;
      default: baseAmount = 0;
    }
    
    // Ограничиваем размер ставки стеком игрока
    return Math.min(baseAmount, maxStack);
  };

  // Calculate call amount based on current betting
  const getCallAmount = (): number => {
    if (!currentPlayerId) return 0;
    
    const currentPlayer = table.players.find(p => p.id === currentPlayerId);
    const otherPlayer = table.players.find(p => p.id !== currentPlayerId);
    
    if (!currentPlayer || !otherPlayer) return 0;
    
    // Правильный расчет общих ставок с учетом покерной логики
    const calculateCorrectTotals = () => {
      // Теперь в action.amount хранится реальная потраченная сумма
      // Просто суммируем все потраченные деньги каждым игроком на улице
      const myTotal = currentPlayer.actions
        .filter((a: any) => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
        .reduce((total: number, action: any) => total + (action.amount || 0), 0);
      
      const opponentTotal = otherPlayer.actions
        .filter((a: any) => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
        .reduce((total: number, action: any) => total + (action.amount || 0), 0);
      
      return { myTotal, opponentTotal };
    };
    
    const { opponentTotal } = calculateCorrectTotals();
    const myTotal = currentPlayer.actions
      .filter((a: any) => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
      .reduce((total: number, action: any) => total + (action.amount || 0), 0);
    
    // Call amount = разница между ставками, но не больше нашего стека
    const callAmount = Math.max(0, opponentTotal - myTotal);
    return Math.min(callAmount, currentPlayer.stack);
  };

  // Check if check is available (no bet to call)
  const canCheck = (): boolean => {
    const callAmount = getCallAmount();
    return callAmount === 0;
  };

  // Check if call is available (there's a bet to call)
  const canCall = (): boolean => {
    const callAmount = getCallAmount();
    return callAmount > 0;
  };

  const availableBetSizes = Object.entries(betSizes)
    .filter(([_, enabled]) => enabled)
    .map(([type, _]) => ({
      type,
      amount: calculateBetSize(type),
      label: type === 'quarter' ? `${customSizings.quarter}%` :
             type === 'half' ? `${customSizings.half}%` :
             type === 'threeQuarter' ? `${customSizings.threeQuarter}%` :
             type === 'pot' ? `${customSizings.pot}%` :
             'All-in'
    }));

  const currentPlayerData = table.players.find(p => p.id === table.currentPlayer);
  const myPlayerData = table.players.find(p => p.id === currentPlayerId);
  const isMyTurn = currentPlayerId === table.currentPlayer && !table.handComplete;

  if (showJoinModal) {
    return (
      <PlayerJoinModal
        sessionId={sessionId}
        tableId={table.id}
        playerNames={playerNames}
        onJoin={handleJoinSession}
        onCancel={() => setShowJoinModal(false)}
      />
    );
  }

  // Если выбран современный стиль, используем ModernPokerTable
  if (tableStyle === 'modern') {
    return (
      <ModernPokerTable
        table={table}
        sessionId={sessionId}
        playerNames={playerNames}
        onHandComplete={onHandComplete}
      />
    );
  }

  return (
    <div className="poker-table">
      <div className="table-header">
        <h3>Стол #{table.id}</h3>
        
        {/* Connection Status */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          marginTop: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: isConnected ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
            border: isConnected ? '2px solid #4CAF50' : '2px solid #f44336',
            color: isConnected ? '#4CAF50' : '#f44336',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            cursor: !isConnected ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (!isConnected) {
              websocketService.forceReconnect();
            }
          }}
          title={!isConnected ? 'Нажмите для переподключения' : 'Подключение активно'}
          >
            {isConnected ? '🟢 Онлайн' : '🔴 Офлайн (нажмите для переподключения)'}
          </div>
          
          <div style={{
            background: 'rgba(33,150,243,0.2)',
            border: '2px solid #2196F3',
            color: '#2196F3',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            {myPlayerData ? `👤 ${myPlayerData.name} (P${currentPlayerId})` : '👤 Наблюдатель'}
          </div>

          <button
            onClick={() => setUseCardImages(!useCardImages)}
            style={{
              background: useCardImages ? 'rgba(76,175,80,0.2)' : 'rgba(255,167,38,0.2)',
              border: useCardImages ? '2px solid #4CAF50' : '2px solid #FFA726',
              color: useCardImages ? '#4CAF50' : '#FFA726',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {useCardImages ? '🖼️ Изображения' : '🎨 Стиль'}
          </button>

          <button
            onClick={() => {
              const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
              const currentIndex = sizes.indexOf(cardSize);
              const nextIndex = (currentIndex + 1) % sizes.length;
              setCardSize(sizes[nextIndex]);
            }}
            style={{
              background: 'rgba(33,150,243,0.2)',
              border: '2px solid #2196F3',
              color: '#2196F3',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📏 {cardSize === 'small' ? 'Маленькие' : cardSize === 'medium' ? 'Средние' : 'Большие'}
          </button>
        </div>

        {table.handComplete && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ 
              background: table.winner ? '#4CAF50' : '#FF5722',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '15px',
              fontSize: '0.9rem'
            }}>
              {table.winner ? 
                `🏆 Победил: ${table.players.find(p => p.id === table.winner)?.name}` : 
                '🤝 Ничья'
              }
            </span>
          </div>
        )}
      </div>



      {/* Poker Table Layout */}
      <div className="poker-table-layout" style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '60vh',
        position: 'relative'
      }}>
        
        {/* Opponent Player (Top) */}
        {(() => {
          const opponent = table.players.find(p => p.id !== currentPlayerId);
          if (!opponent) return null;
          
          // Получаем ставку игрока на текущей улице
          const getPlayerBet = (player: Player) => {
            if (!player) return 0;
            return player.actions
              .filter(a => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
              .reduce((total, action) => total + (action.amount || 0), 0);
          };
          
          const opponentBet = getPlayerBet(opponent);
          // ИСПРАВЛЕНИЕ: Используем opponent.isHost из данных оппонента
          const isOpponentHost = opponent.isHost || false;
          
          return (
            <div 
              className={`player opponent ${opponent.id === table.currentPlayer ? 'active' : ''} ${isOpponentHost ? 'host-player' : ''}`}
              style={{
                border: opponent.id === table.currentPlayer ? '3px solid #4CAF50' : 
                        (isOpponentHost ? '3px solid #2196F3' : '2px solid #34495e'),
                borderRadius: '10px',
                padding: '15px',
                backgroundColor: isOpponentHost ? 'rgba(33,150,243,0.1)' : 'rgba(255,255,255,0.05)',
                marginBottom: '20px',
                maxWidth: '400px',
                alignSelf: 'center',
                position: 'relative',
                boxShadow: opponent.id === table.currentPlayer ? '0 0 20px rgba(76,175,80,0.3)' : 
                          (isOpponentHost ? '0 0 15px rgba(33,150,243,0.3)' : 'none')
              }}
            >
              {/* Turn Indicator */}
              {opponent.id === table.currentPlayer && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(76,175,80,0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  ⏰ ХОД
                </div>
              )}
              <div className="player-info" style={{ textAlign: 'center' }}>
                <h4 style={{ 
                  color: opponent.id === table.currentPlayer ? '#4CAF50' : 'white',
                  margin: '0 0 10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {opponent.name} 
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    ({opponent.position === 'BTN' ? 'BTN/IP' : 'BB/OOP'})
                  </span>
                  {opponent.connected && (
                    <span style={{ color: '#4CAF50', fontSize: '0.8rem' }}>🟢</span>
                  )}
                  {isOpponentHost && (
                    <span style={{ 
                      color: '#FFD700', 
                      fontSize: '0.8rem',
                      background: 'rgba(255,215,0,0.2)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,215,0,0.5)'
                    }} title="Хост игры" className="host-crown">👑</span>
                  )}
                </h4>
                <p style={{ margin: '5px 0', color: '#FFA726' }}>
                  💰 Стек: €{opponent.stack}
                </p>
              </div>
              
              <div className="hole-cards" style={{ 
                display: 'flex', 
                gap: '5px', 
                marginTop: '10px',
                justifyContent: 'center'
              }}>
                {opponent.holeCards.map((card, index) => (
                  <RankCard 
                    key={`${opponent.id}-hole-${index}`} 
                    card={card} 
                    size={cardSize}
                    useImages={useCardImages}
                  />
                ))}
              </div>
              
              {/* Opponent Bet */}
              {opponentBet > 0 && (
                <div className="player-bet" style={{
                  marginTop: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #FF5722, #D32F2F)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(255,87,34,0.4)',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    🔴 Ставка: €{opponentBet}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Center Table Area with Board and Pot */}
        <div className="center-table" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(139,195,74,0.1))',
          borderRadius: '20px',
          padding: '30px',
          margin: '20px 0',
          border: '3px solid rgba(76,175,80,0.3)',
          position: 'relative'
        }}>


          
          {/* Board Cards and Pot - Center */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center', 
            gap: '20px', 
            flexWrap: 'wrap',
            background: 'rgba(0,0,0,0.2)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            {/* Pot Display - Left of cards */}
            <div className="pot-display-left" style={{
              background: 'linear-gradient(135deg, #FFA726, #FF9800)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(255,167,38,0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
              whiteSpace: 'nowrap'
            }}>
              Банк: €{table.pot}
            </div>

            {/* Board Cards */}
            <div className="board-cards" style={{ 
              display: 'flex', 
              gap: '12px', 
              flexWrap: 'wrap'
            }}>
            {/* Флоп - всегда показываем */}
            {table.board.flop.map((card, index) => (
              <RankCard 
                key={`flop-${index}`} 
                card={card} 
                size={cardSize}
                useImages={useCardImages}
              />
            ))}
            
            {/* Тёрн - показываем только если игра дошла до тёрна */}
            {table.board.turn && (table.currentStreet === 'turn' || table.currentStreet === 'river' || table.handComplete) && (
              <RankCard 
                card={table.board.turn} 
                size={cardSize}
                useImages={useCardImages}
              />
            )}
            
            {/* Ривер - показываем только если игра дошла до ривера */}
            {table.board.river && (table.currentStreet === 'river' || table.handComplete) && (
              <RankCard 
                card={table.board.river} 
                size={cardSize}
                useImages={useCardImages}
              />
            )}
            </div>
          </div>
        </div>

        {/* Current Player (Bottom) */}
        {(() => {
          const myPlayer = table.players.find(p => p.id === currentPlayerId);
          if (!myPlayer) return null;
          
          // Получаем ставку игрока на текущей улице
          const getPlayerBet = (player: Player) => {
            if (!player) return 0;
            return player.actions
              .filter(a => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
              .reduce((total, action) => total + (action.amount || 0), 0);
          };
          
          const myBet = getPlayerBet(myPlayer);
          // ИСПРАВЛЕНИЕ: Используем myPlayer.isHost из данных игрока
          const isMyPlayerHost = myPlayer.isHost || false;
          
          return (
            <div 
              className={`player current-player ${myPlayer.id === table.currentPlayer ? 'active' : ''} ${isMyPlayerHost ? 'host-player' : ''}`}
              style={{
                border: myPlayer.id === table.currentPlayer ? '3px solid #4CAF50' : 
                        (isMyPlayerHost ? '3px solid #2196F3' : '2px solid #34495e'),
                borderRadius: '10px',
                padding: '15px',
                backgroundColor: isMyPlayerHost ? 'rgba(33,150,243,0.15)' : 'rgba(76,175,80,0.1)',
                marginTop: '20px',
                maxWidth: '400px',
                alignSelf: 'center',
                position: 'relative',
                boxShadow: myPlayer.id === table.currentPlayer ? '0 0 20px rgba(76,175,80,0.3)' : 
                          (isMyPlayerHost ? '0 0 15px rgba(33,150,243,0.3)' : 'none')
              }}
            >
              {/* Turn Indicator */}
              {myPlayer.id === table.currentPlayer && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(76,175,80,0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  ⏰ ВАШ ХОД
                </div>
              )}
              <div className="player-info" style={{ textAlign: 'center' }}>
                <h4 style={{ 
                  color: myPlayer.id === table.currentPlayer ? '#4CAF50' : 'white',
                  margin: '0 0 10px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  {myPlayer.name} 
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    ({myPlayer.position === 'BTN' ? 'BTN/IP' : 'BB/OOP'})
                  </span>
                  {myPlayer.connected && (
                    <span style={{ color: '#4CAF50', fontSize: '0.8rem' }}>🟢</span>
                  )}
                  <span style={{ color: '#2196F3', fontSize: '0.8rem' }}>👤</span>
                  {isMyPlayerHost && (
                    <span style={{ 
                      color: '#FFD700', 
                      fontSize: '0.8rem',
                      background: 'rgba(255,215,0,0.2)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,215,0,0.5)'
                    }} title="Хост игры" className="host-crown">👑</span>
                  )}
                </h4>
                <p style={{ margin: '5px 0', color: '#FFA726' }}>
                  💰 Стек: €{myPlayer.stack}
                </p>
              </div>
              
              <div className="hole-cards" style={{ 
                display: 'flex', 
                gap: '5px', 
                marginTop: '10px',
                justifyContent: 'center'
              }}>
                {myPlayer.holeCards.map((card, index) => (
                  <RankCard 
                    key={`${myPlayer.id}-hole-${index}`} 
                    card={card} 
                    size={cardSize}
                    useImages={useCardImages}
                  />
                ))}
              </div>
              
              {/* My Bet */}
              {myBet > 0 && (
                <div className="player-bet" style={{
                  marginTop: '10px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(33,150,243,0.4)',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}>
                    🔵 Ваша ставка: €{myBet}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Action Buttons */}
      {isMyTurn && (
        <div style={{ margin: '20px 0' }}>
          {/* Sizing Panel */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(33,150,243,0.1), rgba(76,175,80,0.1))',
            border: '2px solid rgba(255,167,38,0.3)',
            borderRadius: '15px',
            padding: '15px',
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            {/* Header with Settings Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                color: '#FFA726', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎯 Размеры ставок:
              </div>
              <button
                onClick={() => setShowSizingSettings(!showSizingSettings)}
                style={{
                  background: showSizingSettings ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #2196F3, #1976D2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                title="Настроить проценты"
              >
                {showSizingSettings ? '✅ Готово' : '⚙️ Настроить'}
              </button>
            </div>

            {/* Settings Panel */}
            {showSizingSettings && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '10px'
                }}>
                  {Object.entries(customSizings).filter(([key]) => key !== 'allIn').map(([key, value]) => (
                    <div key={key} style={{ textAlign: 'center' }}>
                      <label style={{
                        display: 'block',
                        color: '#FFA726',
                        fontSize: '0.8rem',
                        marginBottom: '5px',
                        fontWeight: 'bold'
                      }}>
                        {key === 'quarter' ? '1/4' :
                         key === 'half' ? '1/2' :
                         key === 'threeQuarter' ? '3/4' :
                         'Пот'}
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        step="5"
                        value={value}
                        onChange={(e) => setCustomSizings(prev => ({
                          ...prev,
                          [key]: parseInt(e.target.value) || 0
                        }))}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          border: '1px solid #FFA726',
                          background: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          textAlign: 'center',
                          fontSize: '0.9rem'
                        }}
                      />
                      <span style={{
                        color: '#FFA726',
                        fontSize: '0.8rem',
                        marginLeft: '2px'
                      }}>%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sizing buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {availableBetSizes.map(({ type, amount, label }) => (
                <button
                  key={type}
                  onClick={() => setSelectedBetAmount(amount)}
                  disabled={!isMyTurn}
                  className={`btn ${selectedBetAmount === amount ? 'btn-info' : 'btn-outline-secondary'}`}
                  style={{ 
                    fontSize: '0.9rem', 
                    padding: '8px 12px',
                    minWidth: '80px'
                  }}
                  title={`${label} банка = €${amount}`}
                >
                  {label}<br/>€{amount}
                </button>
              ))}
              
              {/* Manual input button */}
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                disabled={!isMyTurn}
                className={`btn ${showManualInput ? 'btn-warning' : 'btn-outline-warning'}`}
                style={{ 
                  fontSize: '0.9rem', 
                  padding: '8px 12px',
                  minWidth: '80px'
                }}
                title="Ручной ввод суммы"
              >
                ✏️<br/>Ручной
              </button>
            </div>
            
            {/* Manual input field */}
            {showManualInput && (
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <input
                  type="number"
                  value={manualBetAmount}
                  onChange={(e) => setManualBetAmount(e.target.value)}
                  placeholder="Введите сумму"
                  disabled={!isMyTurn}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    marginRight: '8px',
                    width: '120px',
                    textAlign: 'center'
                  }}
                  min="1"
                  max={myPlayerData?.stack || 1000}
                />
                <button
                  onClick={() => {
                    const amount = parseInt(manualBetAmount) || 0;
                    if (amount > 0 && amount <= (myPlayerData?.stack || 1000)) {
                      setSelectedBetAmount(amount);
                      setShowManualInput(false);
                    }
                  }}
                  disabled={!isMyTurn}
                  className="btn btn-sm btn-success"
                  style={{ padding: '8px 12px' }}
                >
                  ✓ Применить
                </button>
              </div>
            )}
          </div>

          {/* Main Action Buttons */}
          <div className="action-buttons" style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center', 
            flexWrap: 'wrap'
          }}>
            {/* Если нет ставки для колла - показываем ЧЕК и БЕТ */}
            {canCheck() && (
              <>
                <button
                  onClick={() => makeAction('check')}
                  disabled={isLoading || !isMyTurn}
                  className="btn btn-success"
                  style={{ fontSize: '1.1rem', padding: '12px 20px' }}
                >
                  ✓ ЧЕК
                </button>
                
                <button
                  onClick={() => makeAction('bet', selectedBetAmount || calculateBetSize('half'))}
                  disabled={isLoading || !isMyTurn || (!selectedBetAmount && calculateBetSize('half') <= 0)}
                  className="btn btn-warning"
                  style={{ fontSize: '1.1rem', padding: '12px 20px' }}
                  title={`Бет €${selectedBetAmount || calculateBetSize('half')}`}
                >
                  🎯 БЕТ €{selectedBetAmount || calculateBetSize('half')}
                </button>
              </>
            )}
            
            {/* Если есть ставка для колла - показываем ФОЛД, КОЛЛ и РЕЙЗ */}
            {canCall() && (
              <>
                <button
                  onClick={() => makeAction('fold')}
                  disabled={isLoading || !isMyTurn}
                  className="btn btn-danger"
                  style={{ fontSize: '1.1rem', padding: '12px 20px' }}
                >
                  🗂️ ФОЛД
                </button>
                
                <button
                  onClick={() => makeAction('call', getCallAmount())}
                  disabled={isLoading || !isMyTurn}
                  className="btn btn-primary"
                  style={{ fontSize: '1.1rem', padding: '12px 20px' }}
                  title={`Колл €${getCallAmount()}`}
                >
                  {getCallAmount() === myPlayerData?.stack ? 
                    `🔥 ALL-IN €${getCallAmount()}` : 
                    `📞 КОЛЛ €${getCallAmount()}`
                  }
                </button>
                
                <button
                  onClick={() => {
                    const currentPlayer = table.players.find(p => p.id === currentPlayerId);
                    const otherPlayer = table.players.find(p => p.id !== currentPlayerId);
                    
                    if (!currentPlayer || !otherPlayer) return;
                    
                    const callAmount = getCallAmount();
                    const hasOpponentBet = callAmount > 0;
                    
                    // Определяем действие и сумму
                    let actionType: string;
                    let actionAmount: number;
                    
                    if (!hasOpponentBet) {
                      // Нет активной ставки - это bet
                      actionType = 'bet';
                      actionAmount = selectedBetAmount || calculateBetSize('half');
                    } else {
                      // Есть активная ставка
                      const desiredAmount = selectedBetAmount || (callAmount + calculateBetSize('half'));
                      
                      if (desiredAmount === callAmount) {
                        // Игрок хочет уравнять ставку - это call
                        actionType = 'call';
                        actionAmount = callAmount;
                      } else if (desiredAmount > callAmount) {
                        // Игрок хочет повысить ставку - это raise
                        actionType = 'raise';
                        // Для raise отправляем доплату к максимальной ставке
                        actionAmount = desiredAmount - callAmount;
                      } else {
                        // Fallback: call
                        actionType = 'call';
                        actionAmount = callAmount;
                      }
                    }
                    
                    console.log(`🎯 Determined action: ${actionType} ${actionAmount}`);
                    makeAction(actionType, actionAmount);
                  }}
                  disabled={isLoading || !isMyTurn || (!selectedBetAmount && calculateBetSize('half') <= 0)}
                  className="btn btn-warning"
                  style={{ fontSize: '1.1rem', padding: '12px 20px' }}
                  title={`Рейз до €${selectedBetAmount || (getCallAmount() + calculateBetSize('half'))}`}
                >
                  {getCallAmount() > 0 ? 
                    `⬆️ РЕЙЗ €${selectedBetAmount || (getCallAmount() + calculateBetSize('half'))}` : 
                    `🎯 БЕТ €${selectedBetAmount || calculateBetSize('half')}`
                  }
                </button>
              </>
            )}
          </div>
          
          {/* Selected Amount Display */}
          {selectedBetAmount > 0 && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '10px',
              fontSize: '0.9rem',
              color: '#FFA726'
            }}>
              Выбранный размер: €{selectedBetAmount}
              <button
                onClick={() => setSelectedBetAmount(0)}
                style={{
                  marginLeft: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#f44336',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ✕ сбросить
              </button>
            </div>
          )}
        </div>
      )}

      {!isMyTurn && !table.handComplete && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          color: '#FFA726',
          fontSize: '1.1rem'
        }}>
          {currentPlayerData ? 
            `⏳ Ход игрока: ${currentPlayerData.name}` : 
            '⏳ Ожидание хода...'
          }
        </div>
      )}

      {/* New Hand Button */}
      {table.handComplete && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button
            onClick={dealNewHand}
            disabled={isLoading}
            className="btn btn-primary"
            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
          >
            {isLoading ? '⏳ Раздача...' : '🎲 Новая рука'}
          </button>
        </div>
      )}

      {/* Status */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '15px',
        fontSize: '0.9rem',
        color: 'rgba(255,255,255,0.7)'
      }}>
        {connectionStatus}
        {isConnected && (
          <div style={{ 
            marginTop: '5px',
            fontSize: '0.8rem',
            color: isHost ? '#FFD700' : '#2196F3'
          }}>
            {isHost ? '👑 Вы — хост игры' : '🎯 Вы — гость'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerPokerTable; 