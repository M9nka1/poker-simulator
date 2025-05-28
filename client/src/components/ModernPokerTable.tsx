import React, { useState, useEffect, useRef } from 'react';
import RankCard from './RankCard';
import PlayerJoinModal from './PlayerJoinModal';
import { websocketService, PlayerInfo } from '../services/websocket';
import './ModernPokerTable.css';

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

interface ModernPokerTableProps {
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
}

const ModernPokerTable: React.FC<ModernPokerTableProps> = ({ 
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
  onHandComplete 
}) => {
  const [table, setTable] = useState<TableData>(initialTable);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBetAmount, setSelectedBetAmount] = useState<number>(0);
  const useCardImages = true; // В современном стиле всегда используются настоящие изображения карт
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [connectionStatus, setConnectionStatus] = useState<string>('Подключение...');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showSizingSettings, setShowSizingSettings] = useState<boolean>(false);
  const [customSizings, setCustomSizings] = useState<{[key: string]: number}>({
    quarter: 25,
    half: 50,
    threeQuarter: 75,
    pot: 100,
    allIn: 100
  });
  const [colorTheme, setColorTheme] = useState<'dark' | 'light' | 'neon'>('dark');
  const [streetStartPot, setStreetStartPot] = useState<number>(100); // Размер банка на начало текущей улицы
  const prevStreetRef = useRef<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [handCount, setHandCount] = useState<number>(1);
  const [handHistories, setHandHistories] = useState<string[]>([]);

  useEffect(() => {
    setTable(initialTable);
    setSelectedBetAmount(0);
  }, [initialTable]);

  // Отслеживаем изменение улицы торгов и сохраняем размер банка на начало
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Проверяем если улица действительно изменилась
    if (prevStreetRef.current !== table.currentStreet) {
      setStreetStartPot(table.pot);
      prevStreetRef.current = table.currentStreet;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.currentStreet]);

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

    checkConnection();
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Setup WebSocket message handlers
    websocketService.onMessage('game_state', (data) => {
      console.log('🎮 Received game_state:', data);
      setTable(data.table);
      setCurrentPlayerId(data.playerId);
      setConnectionStatus('Подключен');
    });

    websocketService.onMessage('table_update', (data) => {
      console.log('🔄 Received table_update:', data);
      setTable(data.table);
      setSelectedBetAmount(0);
      if (data.actionResult?.handComplete && data.actionResult?.handHistory) {
        onHandComplete(data.actionResult.handHistory);
        setHandHistories(prev => [...prev, data.actionResult.handHistory]);
        setHandCount(prev => prev + 1);
      }
    });

    websocketService.onMessage('new_hand', (data) => {
      setTable(data.table);
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
    });

    // Check if already connected
    const playerInfo = websocketService.getPlayerInfo();
    if (playerInfo && playerInfo.sessionId === sessionId && playerInfo.tableId === table.id) {
      setCurrentPlayerId(playerInfo.playerId);
      setConnectionStatus('Подключен');
    } else {
      setShowJoinModal(true);
    }

    return () => {
      websocketService.offMessage('game_state');
      websocketService.offMessage('table_update');
      websocketService.offMessage('new_hand');
      websocketService.offMessage('player_connected');
      websocketService.offMessage('player_disconnected');
      websocketService.offMessage('error');
    };
  }, [sessionId, table.id, onHandComplete]);

  const handleJoinSession = (playerId: number, playerName: string, tableStyle?: string) => {
    const playerInfo: PlayerInfo = {
      playerId,
      playerName,
      sessionId,
      tableId: table.id
    };
    
    // Если выбран классический стиль, перенаправляем на классический стол
    if (tableStyle === 'classic') {
      // Открываем новое окно с классическим стилем
      const baseUrl = window.location.origin;
      const tableUrl = new URL(`${baseUrl}`);
      tableUrl.hash = `table?sessionId=${sessionId}&tableId=${table.id}&playerNames=${encodeURIComponent(JSON.stringify(playerNames))}&tableStyle=classic`;
      
      const windowFeatures = [
        'width=1200',
        'height=800',
        'left=150',
        'top=150',
        'resizable=yes',
        'scrollbars=no',
        'status=no',
        'menubar=no',
        'toolbar=no',
        'location=no'
      ].join(',');
      
      const newWindow = window.open(
        tableUrl.toString(),
        `poker-table-classic-${sessionId}-${table.id}`,
        windowFeatures
      );
      
      if (newWindow) {
        newWindow.focus();
        // Закрываем текущее окно современного стола
        window.close();
      } else {
        alert('Не удалось открыть новое окно. Проверьте настройки блокировки всплывающих окон в браузере.');
      }
      return;
    }
    
    websocketService.joinSession(playerInfo);
    setCurrentPlayerId(playerId);
    setShowJoinModal(false);
    setConnectionStatus('Подключение...');
  };

  const makeAction = (action: string, amount?: number) => {
    if (!currentPlayerId || table.currentPlayer !== currentPlayerId) {
      alert('Не ваш ход!');
      return;
    }

    console.log(`🎯 Making action: ${action} ${amount || 0} on ${table.currentStreet}`);
    setIsLoading(true);
    websocketService.sendPlayerAction(action, amount);
    
    setTimeout(() => setIsLoading(false), 1000);
  };

  const dealNewHand = () => {
    setIsLoading(true);
    websocketService.requestNewHand();
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
    
    return Math.min(baseAmount, maxStack);
  };

  const getCallAmount = (): number => {
    if (!currentPlayerId) return 0;
    
    const currentPlayer = table.players.find(p => p.id === currentPlayerId);
    const otherPlayer = table.players.find(p => p.id !== currentPlayerId);
    
    if (!currentPlayer || !otherPlayer) return 0;
    
    const calculateCorrectTotals = () => {
      const myTotal = currentPlayer.actions
        .filter((a: any) => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
        .reduce((total: number, action: any) => total + (action.amount || 0), 0);
      
      const opponentTotal = otherPlayer.actions
        .filter((a: any) => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
        .reduce((total: number, action: any) => total + (action.amount || 0), 0);
      
      return { myTotal, opponentTotal };
    };
    
    const { myTotal, opponentTotal } = calculateCorrectTotals();
    const callAmount = Math.max(0, opponentTotal - myTotal);
    return Math.min(callAmount, currentPlayer.stack);
  };

  const canCheck = (): boolean => {
    const callAmount = getCallAmount();
    return callAmount === 0;
  };

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

  const exportHandHistories = () => {
    if (handHistories.length === 0) {
      alert('Нет сыгранных рук для экспорта');
      return;
    }
    
    const content = handHistories.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poker-hands-${sessionId.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  return (
    <div className={`modern-poker-table theme-${colorTheme}`}>
      {/* Main Game Area */}
      <div className="game-container">
        {/* Center Table Area with Players */}
        <div className="table-center">
          <div className="poker-felt glass-morphism">
            {/* Header Controls в правом верхнем углу TABLE CENTER */}
            <div className="table-header-controls">
              <div className="theme-selector">
                <button
                  className={`theme-btn ${colorTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setColorTheme('dark')}
                  title="Темная тема"
                >
                  🌙
                </button>
                <button
                  className={`theme-btn ${colorTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setColorTheme('light')}
                  title="Светлая тема"
                >
                  ☀️
                </button>
                <button
                  className={`theme-btn ${colorTheme === 'neon' ? 'active' : ''}`}
                  onClick={() => setColorTheme('neon')}
                  title="Неоновая тема"
                >
                  ⚡
                </button>
              </div>
              <button
                className="control-btn export-btn"
                onClick={exportHandHistories}
                title={`Экспорт Hand History (${handHistories.length} рук)`}
              >
                📁 Export
              </button>
            </div>

            {/* Opponent Player - внутри TABLE CENTER */}
            {(() => {
              const opponent = table.players.find(p => p.id !== currentPlayerId);
              if (!opponent) return null;
              
              const getPlayerBet = (player: Player) => {
                if (!player) return 0;
                return player.actions
                  .filter(a => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
                  .reduce((total, action) => total + (action.amount || 0), 0);
              };
              
              const opponentBet = getPlayerBet(opponent);
              const isOpponentTurn = opponent.id === table.currentPlayer;
              
              return (
                <div className={`opponent-in-center ${isOpponentTurn ? 'active-turn' : ''}`}>
                  <div className={`player-card glass-morphism ${isOpponentTurn ? 'player-turn-animation' : ''}`}>
                    <div className="hole-cards">
                      {opponent.holeCards.map((card, index) => (
                        <RankCard 
                          key={`${opponent.id}-hole-${index}`} 
                          card={card} 
                          size={cardSize}
                          useImages={useCardImages}
                        />
                      ))}
                    </div>
                    
                    <div className="player-info">
                      <h3 className="player-name">{opponent.name}</h3>
                      <div className="player-stack">€{opponent.stack}</div>
                      {opponent.connected && <div className="online-indicator"></div>}
                    </div>
                  </div>
                  
                  {opponentBet > 0 && (
                    <div className="bet-indicator glass-morphism">
                      <span className="bet-amount">€{opponentBet}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Board Cards and Pot Display Container - по центру */}
            <div className="board-and-pot-container">
              {/* Board Cards - фиксированная ширина для всех 5 карт */}
              <div className="board-container-fixed">
                <div className="board-cards">
                  {/* Флоп */}
                  <div className="board-card-slot">
                    {table.board.flop[0] && (
                      <RankCard 
                        card={table.board.flop[0]} 
                        size={cardSize}
                        useImages={useCardImages}
                      />
                    )}
                  </div>
                  <div className="board-card-slot">
                    {table.board.flop[1] && (
                      <RankCard 
                        card={table.board.flop[1]} 
                        size={cardSize}
                        useImages={useCardImages}
                      />
                    )}
                  </div>
                  <div className="board-card-slot">
                    {table.board.flop[2] && (
                      <RankCard 
                        card={table.board.flop[2]} 
                        size={cardSize}
                        useImages={useCardImages}
                      />
                    )}
                  </div>
                  
                  {/* Тёрн */}
                  <div className="board-card-slot">
                    {table.board.turn && (table.currentStreet === 'turn' || table.currentStreet === 'river' || table.handComplete) && (
                      <RankCard 
                        card={table.board.turn} 
                        size={cardSize}
                        useImages={useCardImages}
                      />
                    )}
                  </div>
                  
                  {/* Ривер */}
                  <div className="board-card-slot">
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
              
              {/* Pot Display - справа от карт */}
              <div className="pot-container-fixed">
                <div className="pot-display neumorphism">
                  <div className="pot-label">БАНК</div>
                  <div className="pot-amount">€{streetStartPot}</div>
                </div>
              </div>
            </div>
            
            {/* Current Player - внутри TABLE CENTER */}
            {(() => {
              const myPlayer = table.players.find(p => p.id === currentPlayerId);
              if (!myPlayer) return null;
              
              const getPlayerBet = (player: Player) => {
                if (!player) return 0;
                return player.actions
                  .filter(a => a.street === table.currentStreet && (a.action === 'bet' || a.action === 'raise' || a.action === 'call'))
                  .reduce((total, action) => total + (action.amount || 0), 0);
              };
              
              const myBet = getPlayerBet(myPlayer);
              const isMyPlayerTurn = myPlayer.id === table.currentPlayer;
              
              return (
                <div className={`current-player-in-center ${isMyPlayerTurn ? 'active-turn' : ''}`}>
                  <div className={`player-card glass-morphism ${isMyPlayerTurn ? 'player-turn-animation' : ''}`}>
                    <div className="hole-cards">
                      {myPlayer.holeCards.map((card, index) => (
                        <RankCard 
                          key={`${myPlayer.id}-hole-${index}`} 
                          card={card} 
                          size={cardSize}
                          useImages={useCardImages}
                        />
                      ))}
                    </div>
                    
                    <div className="player-info">
                      <h3 className="player-name">{myPlayer.name}</h3>
                      <div className="player-stack">€{myPlayer.stack}</div>
                      {myPlayer.connected && <div className="online-indicator"></div>}
                      <div className="you-indicator">YOU</div>
                    </div>
                  </div>
                  
                  {myBet > 0 && (
                    <div className="bet-indicator glass-morphism">
                      <span className="bet-amount">€{myBet}</span>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Hand Result */}
            {table.handComplete && (
              <div className="hand-result glass-morphism">
                {table.winner ? 
                  `🏆 Победил: ${table.players.find(p => p.id === table.winner)?.name}` : 
                  '🤝 Ничья'
                }
              </div>
            )}
          </div>
        </div>

        {/* Action Panel - отдельно внизу */}
        {(() => {
          const myPlayer = table.players.find(p => p.id === currentPlayerId);
          if (!myPlayer) return null;
          
          return (
            <div className="action-panel-container">
              {!table.handComplete && (
                <div className="inline-action-panel glass-morphism">
                  {/* Bet Sizing */}
                  <div className="bet-sizing-panel">
                    <div className="sizing-header">
                      <span className="sizing-title">Размеры ставок</span>
                      <button
                        className={`settings-btn ${showSizingSettings ? 'active' : ''}`}
                        onClick={() => setShowSizingSettings(!showSizingSettings)}
                      >
                        ⚙️
                      </button>
                    </div>
                    
                    {showSizingSettings && (
                      <div className="sizing-settings neumorphism">
                        {Object.entries(customSizings).filter(([key]) => key !== 'allIn').map(([key, value]) => (
                          <div key={key} className="sizing-control">
                            <label>{key === 'quarter' ? '1/4' : key === 'half' ? '1/2' : key === 'threeQuarter' ? '3/4' : 'Пот'}</label>
                            <input
                              type="range"
                              min="5"
                              max="200"
                              step="5"
                              value={value}
                              onChange={(e) => setCustomSizings(prev => ({
                                ...prev,
                                [key]: parseInt(e.target.value)
                              }))}
                              className="sizing-slider"
                            />
                            <span>{value}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="sizing-buttons">
                      {availableBetSizes.map(({ type, amount, label }) => {
                        const callAmount = getCallAmount();
                        const isRaise = callAmount > 0;
                        let finalAmount: number = amount;
                        
                        if (isRaise && finalAmount <= 0) {
                          return null;
                        }
                        
                        const isSelected = selectedBetAmount === finalAmount;
                        
                        return (
                          <button
                            key={type}
                            className={`sizing-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedBetAmount(finalAmount)}
                            disabled={!isMyTurn}
                          >
                            <span className="sizing-label">{label}</span>
                            <span className="sizing-amount">€{finalAmount}</span>
                          </button>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    {isMyTurn ? (
                      <>
                        {canCheck() && (
                          <>
                            <button
                              className="action-btn check-btn neumorphism"
                              onClick={() => makeAction('check')}
                              disabled={isLoading}
                            >
                              <span className="btn-icon">✋</span>
                              <span className="btn-text">ЧЕК</span>
                            </button>
                            
                            <button
                              className="action-btn bet-btn neumorphism"
                              onClick={() => makeAction('bet', selectedBetAmount || calculateBetSize('half'))}
                              disabled={isLoading || (!selectedBetAmount && calculateBetSize('half') <= 0)}
                            >
                              <span className="btn-icon">💰</span>
                              <span className="btn-text">БЕТ</span>
                              <span className="btn-amount">€{selectedBetAmount || calculateBetSize('half')}</span>
                            </button>
                          </>
                        )}
                        
                        {canCall() && (
                          <>
                            <button
                              className="action-btn fold-btn neumorphism"
                              onClick={() => makeAction('fold')}
                              disabled={isLoading}
                            >
                              <span className="btn-icon">🗂️</span>
                              <span className="btn-text">ФОЛД</span>
                            </button>
                            
                            <button
                              className="action-btn call-btn neumorphism"
                              onClick={() => makeAction('call', getCallAmount())}
                              disabled={isLoading}
                            >
                              <span className="btn-icon">{getCallAmount() === myPlayerData?.stack ? '🔥' : '📞'}</span>
                              <span className="btn-text">{getCallAmount() === myPlayerData?.stack ? 'ALL-IN' : 'КОЛЛ'}</span>
                              <span className="btn-amount">€{getCallAmount()}</span>
                            </button>
                            
                            <button
                              className="action-btn raise-btn neumorphism"
                              onClick={() => {
                                const callAmount = getCallAmount();
                                const hasOpponentBet = callAmount > 0;
                                
                                let actionType: string;
                                let actionAmount: number;
                                
                                if (!hasOpponentBet) {
                                  actionType = 'bet';
                                  actionAmount = selectedBetAmount || calculateBetSize('half');
                                } else {
                                  const desiredAmount = selectedBetAmount || (callAmount + calculateBetSize('half'));
                                  
                                  if (desiredAmount === callAmount) {
                                    actionType = 'call';
                                    actionAmount = callAmount;
                                  } else if (desiredAmount > callAmount) {
                                    actionType = 'raise';
                                    actionAmount = desiredAmount - callAmount;
                                  } else {
                                    actionType = 'call';
                                    actionAmount = callAmount;
                                  }
                                }
                                
                                makeAction(actionType, actionAmount);
                              }}
                              disabled={isLoading || (!selectedBetAmount && calculateBetSize('half') <= 0)}
                            >
                              <span className="btn-icon">🚀</span>
                              <span className="btn-text">{getCallAmount() > 0 ? 'РЕЙЗ' : 'БЕТ'}</span>
                              <span className="btn-amount">€{selectedBetAmount || (getCallAmount() > 0 ? getCallAmount() + calculateBetSize('half') : calculateBetSize('half'))}</span>
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="waiting-turn">
                        <div className="waiting-spinner"></div>
                        <span>
                          {currentPlayerData ? 
                            `Ход игрока: ${currentPlayerData.name}` : 
                            'Ожидание хода...'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {selectedBetAmount > 0 && (
                    <div className="selected-amount">
                      <span>Выбрано: €{selectedBetAmount}</span>
                      <button
                        className="clear-btn"
                        onClick={() => setSelectedBetAmount(0)}
                        disabled={!isMyTurn}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* New Hand Button */}
      {table.handComplete && (
        <div className="new-hand-panel">
          <button
            className="new-hand-btn neumorphism"
            onClick={dealNewHand}
            disabled={isLoading}
          >
            <span className="btn-icon">🎲</span>
            <span className="btn-text">{isLoading ? 'Раздача...' : 'Новая рука'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ModernPokerTable; 