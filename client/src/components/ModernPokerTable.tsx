import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  currentPlayer?: {
    name: string;
    id: number;
    position: string;
  };
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
  onHandComplete,
  currentPlayer
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
  const [handHistories, setHandHistories] = useState<string[]>([]);
  const [manualBetAmount, setManualBetAmount] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [modalShown, setModalShown] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  
  // Drag and Drop Edit Mode States
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [elementPositions, setElementPositions] = useState<{[key: string]: {x: number, y: number}}>(() => {
    // Load positions from localStorage or use defaults
    const savedPositions = localStorage.getItem('poker-table-positions');
    if (savedPositions) {
      try {
        return JSON.parse(savedPositions);
      } catch (e) {
        console.warn('Failed to parse saved positions, using defaults');
      }
    }
    return {
      'opponent-player': { x: 41.4, y: 12 },
      'current-player': { x: 41.8, y: 66.5 },
      'board-container': { x: 34.8, y: 42.4 },
      'betting-panel': { x: 19.8, y: 79.1 },
      'betting-sizing-panel': { x: 15, y: 75 },
      'betting-actions-panel': { x: 25, y: 85 },
      'header-controls': { x: 2.5, y: 5 },
      'new-hand-button': { x: 79.1, y: 90.9 }
    };
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showEditHelp, setShowEditHelp] = useState<boolean>(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Table Center control states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tableCenterSize, setTableCenterSize] = useState<number>(() => {
    const saved = localStorage.getItem('poker-table-center-size');
    return saved ? parseInt(saved) : 82; // Default 82%
  });
  const [tableCenterPosition, setTableCenterPosition] = useState<{x: number, y: number}>(() => {
    const saved = localStorage.getItem('poker-table-center-position');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 }; // Default center
  });

  // Save positions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('poker-table-positions', JSON.stringify(elementPositions));
  }, [elementPositions]);

  // Save table center settings whenever they change
  useEffect(() => {
    localStorage.setItem('poker-table-center-size', tableCenterSize.toString());
  }, [tableCenterSize]);

  useEffect(() => {
    localStorage.setItem('poker-table-center-position', JSON.stringify(tableCenterPosition));
  }, [tableCenterPosition]);

  // Drag and Drop Functions
  const toggleEditMode = useCallback(() => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      // Entering edit mode - show help
      setShowEditHelp(true);
      setTimeout(() => setShowEditHelp(false), 5000); // Hide help after 5 seconds
    } else {
      // Exiting edit mode - save positions
      console.log('Сохраненные позиции элементов:', elementPositions);
      setShowEditHelp(false);
    }
  }, [isEditMode, elementPositions]);

  const resetPositions = useCallback(() => {
    const defaultPositions = {
      'opponent-player': { x: 41.4, y: 12 },
      'current-player': { x: 41.8, y: 66.5 },
      'board-container': { x: 34.8, y: 42.4 },
      'betting-panel': { x: 19.8, y: 79.1 },
      'betting-sizing-panel': { x: 15, y: 75 },
      'betting-actions-panel': { x: 25, y: 85 },
      'header-controls': { x: 2.5, y: 5 },
      'new-hand-button': { x: 79.1, y: 90.9 }
    };
    
    setElementPositions(defaultPositions);
    localStorage.removeItem('poker-table-positions');
    
    // Show feedback to user
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(76, 175, 80, 0.95);
      color: white;
      padding: 15px 25px;
      border-radius: 20px;
      z-index: 10002;
      font-weight: bold;
      box-shadow: 0 4px 20px rgba(76, 175, 80, 0.5);
    `;
    notification.textContent = '✅ Позиции сброшены к значениям по умолчанию';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  }, []);

  useEffect(() => {
    setTable(initialTable);
    setSelectedBetAmount(0);
  }, [initialTable]);

  // Keyboard shortcuts for edit mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+E or Cmd+E to toggle edit mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        toggleEditMode();
      }
      // Escape to exit edit mode
      if (event.key === 'Escape' && isEditMode) {
        setIsEditMode(false);
      }
      // Ctrl+R or Cmd+R to reset positions (only in edit mode)
      if ((event.ctrlKey || event.metaKey) && event.key === 'r' && isEditMode) {
        event.preventDefault();
        resetPositions();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, toggleEditMode, resetPositions]);

  // Отслеживаем изменение улицы торгов и сохраняем размер банка на начало
  useEffect(() => {
    // Проверяем если улица действительно изменилась
    if (prevStreetRef.current !== table.currentStreet) {
      setStreetStartPot(table.pot);
      prevStreetRef.current = table.currentStreet;
    }
  }, [table.currentStreet, table.pot]);

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
    setHandHistories(handHistories);
  }, [handHistories]);

  const handleJoinSession = useCallback((playerId: number, playerName: string) => {
    // Защита от повторных подключений
    if (isConnecting) {
      console.log('🔄 Подключение уже в процессе, игнорируем повторный запрос');
      return;
    }
    
    // Дополнительная проверка - если игрок уже подключен
    const existingPlayerInfo = websocketService.getPlayerInfo();
    if (existingPlayerInfo && 
        existingPlayerInfo.sessionId === sessionId && 
        existingPlayerInfo.tableId === table.id &&
        existingPlayerInfo.playerId === playerId) {
      console.log('🎮 Игрок уже подключен к этой сессии');
      setCurrentPlayerId(playerId);
      setConnectionStatus('Подключен');
      setShowJoinModal(false);
      return;
    }
    
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
    
    setIsConnecting(true);
    setCurrentPlayerId(playerId);
    setConnectionStatus('Подключение...');
    setShowJoinModal(false);
    
    console.log('🎮 Присоединяемся к сессии:', playerInfo);
    
    // Присоединяемся к сессии
    websocketService.joinSession(playerInfo);
    
    // Увеличиваем время сброса флага подключения до 5 секунд
    setTimeout(() => {
      setIsConnecting(false);
    }, 5000);
  }, [isConnecting, sessionId, table.id]);

  useEffect(() => {
    // Setup WebSocket message handlers
    websocketService.onMessage('game_state', (data) => {
      console.log('🎮 Received game_state:', data);
      console.log('🏆 HOST DEBUG: sessionId:', sessionId, 'playerId:', data.playerId, 'isHost:', data.isHost);
      setTable(data.table);
      setCurrentPlayerId(data.playerId);
      setIsHost(data.isHost || false);
      setConnectionStatus('Подключен');
      setShowJoinModal(false);
      setModalShown(true); // Помечаем что подключение успешно
      setIsConnecting(false);
      console.log('✅ Подключение успешно завершено');
      console.log('🏆 HOST STATE UPDATED TO:', data.isHost || false);
    });

    websocketService.onMessage('table_update', (data) => {
      console.log('🔄 Received table_update:', data);
      console.log('🏆 HOST DEBUG UPDATE: sessionId:', sessionId, 'playerId:', data.playerId, 'isHost:', data.isHost);
      setTable(data.table);
      setIsHost(data.isHost || false);
      setSelectedBetAmount(0);
      console.log('🏆 HOST STATE UPDATED TO:', data.isHost || false);
      if (data.actionResult?.handComplete && data.actionResult?.handHistory) {
        onHandComplete(data.actionResult.handHistory);
        setHandHistories(prev => [...prev, data.actionResult.handHistory]);
        setHandHistories(prev => prev.slice(0, 10)); // Ограничиваем количество сохраняемых рук
      }
    });

    websocketService.onMessage('new_hand', (data) => {
      console.log('🔄 Received new_hand:', data);
      console.log('🏆 HOST DEBUG NEW HAND: sessionId:', sessionId, 'playerId:', data.playerId, 'isHost:', data.isHost);
      setTable(data.table);
      setIsHost(data.isHost || false);
      console.log('🏆 HOST STATE UPDATED TO:', data.isHost || false);
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
      setIsConnecting(false);
    });

    // Автоматическое подключение если переданы данные currentPlayer
    const autoConnect = () => {
      if (!currentPlayer) {
        console.log('⚠️ Нет данных о текущем игроке, показываем модальное окно');
        setShowJoinModal(true);
        setModalShown(true);
        return;
      }

      const playerInfo = websocketService.getPlayerInfo();
      const isConnected = websocketService.isWebSocketConnected();
      
      // Если игрок уже подключен к этой сессии
      if (playerInfo && playerInfo.sessionId === sessionId && playerInfo.tableId === table.id && isConnected) {
        setCurrentPlayerId(playerInfo.playerId);
        setConnectionStatus('Подключен');
        setShowJoinModal(false);
        setModalShown(true);
        return;
      }
      
      // Если модальное окно уже было обработано, не подключаемся снова
      if (modalShown) {
        return;
      }
      
      // Автоматически подключаемся с данными currentPlayer
      if (isConnected) {
        console.log('🎮 Автоматическое подключение:', currentPlayer);
        handleJoinSession(currentPlayer.id, currentPlayer.name);
      } else {
        // Ждем подключения WebSocket с таймаутом
        let attempts = 0;
        const maxAttempts = 10; // 5 секунд максимум
        
        const checkInterval = setInterval(() => {
          attempts++;
          if (websocketService.isWebSocketConnected()) {
            console.log('🎮 WebSocket подключен, автоматически подключаем игрока:', currentPlayer);
            handleJoinSession(currentPlayer.id, currentPlayer.name);
            clearInterval(checkInterval);
          } else if (attempts >= maxAttempts) {
            console.log('⚠️ WebSocket не подключился, показываем модальное окно');
            setShowJoinModal(true);
            setModalShown(true);
            clearInterval(checkInterval);
          }
        }, 500);
      }
    };

    // Запускаем автоподключение только один раз при монтировании компонента
    if (!modalShown) {
      autoConnect();
    }

    return () => {
      websocketService.offMessage('game_state');
      websocketService.offMessage('table_update');
      websocketService.offMessage('new_hand');
      websocketService.offMessage('player_connected');
      websocketService.offMessage('player_disconnected');
      websocketService.offMessage('error');
    };
  }, [sessionId, table.id, onHandComplete, modalShown, currentPlayer, handleJoinSession]);

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

  const calculateBetSize = useCallback((type: string): number => {
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
  }, [table.pot, table.players, currentPlayerId, customSizings]);

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

  // Функция для обработки колесика мыши
  const handleWheelBetSize = (event: React.WheelEvent, currentAmount: number) => {
    event.preventDefault();
    const bigBlind = 10; // Размер большого блайнда (исправлено с 20 на 10)
    const delta = event.deltaY > 0 ? -bigBlind : bigBlind;
    const newAmount = Math.max(0, currentAmount + delta);
    
    const currentPlayerData = table.players.find(p => p.id === currentPlayerId);
    const maxStack = currentPlayerData?.stack || 1000;
    const finalAmount = Math.min(newAmount, maxStack);
    
    setSelectedBetAmount(finalAmount);
    if (showManualInput) {
      setManualBetAmount(finalAmount.toString());
    }
  };

  // Функция для обработки колесика мыши для всего окна
  const handleGlobalWheel = useCallback((event: WheelEvent) => {
    if (!isMyTurn) return; // Только в свой ход
    
    event.preventDefault();
    const bigBlind = 10; // Размер большого блайнда
    const delta = event.deltaY > 0 ? -bigBlind : bigBlind;
    const currentAmount = selectedBetAmount || calculateBetSize('half');
    const newAmount = Math.max(0, currentAmount + delta);
    
    const currentPlayerData = table.players.find(p => p.id === currentPlayerId);
    const maxStack = currentPlayerData?.stack || 1000;
    const finalAmount = Math.min(newAmount, maxStack);
    
    setSelectedBetAmount(finalAmount);
    if (showManualInput) {
      setManualBetAmount(finalAmount.toString());
    }
  }, [isMyTurn, selectedBetAmount, showManualInput, currentPlayerId, table.players, calculateBetSize]);

  // Добавляем глобальный обработчик колесика мыши
  useEffect(() => {
    document.addEventListener('wheel', handleGlobalWheel, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleGlobalWheel);
    };
  }, [handleGlobalWheel]);

  // Функция для обработки ручного ввода
  const handleManualBetChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    const currentPlayerData = table.players.find(p => p.id === currentPlayerId);
    const maxStack = currentPlayerData?.stack || 1000;
    const finalAmount = Math.min(Math.max(0, numValue), maxStack);
    
    setManualBetAmount(value);
    setSelectedBetAmount(finalAmount);
  };

  // Функция для применения ручного ввода
  const applyManualBet = () => {
    const numValue = parseInt(manualBetAmount) || 0;
    setSelectedBetAmount(numValue);
    setShowManualInput(false);
  };

  // Drag and Drop Functions
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    setDraggedElement(elementId);
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!tableRef.current) return;
      
      const canEscapeBounds = ['opponent-player', 'current-player', 'board-container', 'betting-sizing-panel', 'betting-actions-panel'];
      
      if (canEscapeBounds.includes(elementId)) {
        // Используем viewport координаты для элементов, которые могут выходить за границы
        const x = (moveEvent.clientX / window.innerWidth) * 100;
        const y = (moveEvent.clientY / window.innerHeight) * 100;
        
        // Разрешаем отрицательные координаты и координаты больше 100
        const clampedX = Math.max(-50, Math.min(150, x));
        const clampedY = Math.max(-50, Math.min(150, y));
        
        setElementPositions(prev => ({
          ...prev,
          [elementId]: { x: clampedX, y: clampedY }
        }));
      } else {
        // Для остальных элементов используем старую логику
        const rect = tableRef.current.getBoundingClientRect();
        const x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        const y = ((moveEvent.clientY - rect.top) / rect.height) * 100;
        
        // Ограничиваем позицию в пределах стола
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        
        setElementPositions(prev => ({
          ...prev,
          [elementId]: { x: clampedX, y: clampedY }
        }));
      }
    };
    
    const handleMouseUp = () => {
      setDraggedElement(null);
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const exportPositions = () => {
    const positionsData = {
      timestamp: new Date().toISOString(),
      positions: elementPositions
    };
    
    const dataStr = JSON.stringify(positionsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'poker-table-positions.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const importPositions = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.positions) {
              setElementPositions(data.positions);
              // Show success notification
              const notification = document.createElement('div');
              notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(76, 175, 80, 0.95);
                color: white;
                padding: 15px 25px;
                border-radius: 20px;
                z-index: 10002;
                font-weight: bold;
                box-shadow: 0 4px 20px rgba(76, 175, 80, 0.5);
              `;
              notification.textContent = '✅ Позиции успешно загружены';
              document.body.appendChild(notification);
              
              setTimeout(() => {
                document.body.removeChild(notification);
              }, 2000);
            }
          } catch (error) {
            alert('Ошибка при загрузке файла. Проверьте формат JSON.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getElementStyle = (elementId: string) => {
    const position = elementPositions[elementId];
    if (!position) return {};
    
    // Для элементов, которые должны выходить за границы TABLE CENTER
    const canEscapeBounds = ['opponent-player', 'current-player', 'board-container', 'betting-sizing-panel', 'betting-actions-panel'];
    const useFixed = canEscapeBounds.includes(elementId) && (position.y < 0 || position.y > 100);
    
    const baseStyle = {
      position: useFixed ? 'fixed' as const : 'absolute' as const,
      left: useFixed ? `${position.x}vw` : `${position.x}%`,
      top: useFixed ? `${position.y}vh` : `${position.y}%`,
      cursor: isEditMode ? (draggedElement === elementId ? 'grabbing' : 'grab') : 'default',
      zIndex: draggedElement === elementId ? 1000 : useFixed ? 999 : 'auto',
      transition: isDragging && draggedElement === elementId ? 'none' : 'all 0.2s ease',
      border: isEditMode ? '2px dashed rgba(255, 255, 255, 0.5)' : 'none',
      borderRadius: isEditMode ? '8px' : '0',
      backgroundColor: isEditMode ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      transform: draggedElement === elementId ? 'scale(1.05) rotate(1deg)' : 'scale(1)',
      boxShadow: isEditMode 
        ? (draggedElement === elementId 
          ? '0 10px 30px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2)' 
          : '0 2px 10px rgba(255, 255, 255, 0.1)')
        : 'none'
    };
    
    return baseStyle;
  };

  const moveTableCenter = (deltaX: number, deltaY: number) => {
    const newPosition = {
      x: Math.max(-500, Math.min(500, tableCenterPosition.x + deltaX)), // Расширяем лимиты движения
      y: Math.max(-800, Math.min(800, tableCenterPosition.y + deltaY))  // Разрешаем подъем до -800px
    };
    setTableCenterPosition(newPosition);
  };

  if (showJoinModal && !currentPlayer) {
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
      {/* Temporary RED LINE at very top of screen for comparison */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: 'lime',
        zIndex: 10001,
        boxShadow: '0 0 10px lime'
      }}></div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 215, 0, 0.95)',
          color: 'black',
          padding: '15px 25px',
          borderRadius: '25px',
          fontWeight: 'bold',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(255, 215, 0, 0.5)',
          border: '2px solid gold',
          textAlign: 'center',
          maxWidth: '90%'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '5px' }}>
            🔧 РЕЖИМ РЕДАКТИРОВАНИЯ АКТИВЕН
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Перетаскивайте элементы мышью для изменения позиций
          </div>
        </div>
      )}

      {/* Help popup for new users */}
      {showEditHelp && (
        <div style={{
          position: 'fixed',
          top: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(76, 175, 80, 0.95)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '20px',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(76, 175, 80, 0.5)',
          textAlign: 'center',
          maxWidth: '90%',
          animation: 'fadeInOut 5s ease-in-out'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
            💡 Подсказка
          </div>
          <div style={{ fontSize: '12px' }}>
            Нажмите и перетащите любой элемент стола для изменения его позиции
          </div>
        </div>
      )}
      
      {/* Main Game Area */}
      <div className="game-container">
        {/* Center Table Area with Players */}
        <div className="table-center">
          {/* Temporary RED LINE to show top edge of TABLE CENTER */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'red',
            zIndex: 10000,
            boxShadow: '0 0 10px red',
            animation: 'pulse 1s infinite'
          }}></div>

          <div className="poker-felt glass-morphism" 
               ref={tableRef}
               style={{
                 width: `${tableCenterSize}%`,
                 transform: `translate(${tableCenterPosition.x}px, ${tableCenterPosition.y}px)`,
                 transition: 'all 0.3s ease'
               }}
          >
            {/* Header Controls в левой части TABLE CENTER - вертикально */}
            <div 
              className="table-header-controls-left"
              style={getElementStyle('header-controls')}
              onMouseDown={(e) => handleMouseDown(e, 'header-controls')}
            >
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
                📁
              </button>
              {isEditMode && (
                <>
                  <button
                    className="control-btn"
                    onClick={resetPositions}
                    title="Сбросить позиции к значениям по умолчанию (Ctrl+R)"
                  >
                    🔄
                  </button>
                  <button
                    className="control-btn"
                    onClick={exportPositions}
                    title="Экспорт позиций в JSON файл"
                  >
                    💾
                  </button>
                  <button
                    className="control-btn"
                    onClick={importPositions}
                    title="Импорт позиций из JSON файла"
                  >
                    📁
                  </button>
                </>
              )}
              <button
                className="control-btn"
                onClick={() => window.close()}
                title="Закрыть окно стола"
              >
                ❌
              </button>
              
              {/* Table Center Controls */}
              <div className="table-center-controls" style={{ marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
                {/* Size Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {/* Removed 🔍+ and 🔍- buttons */}
                </div>
                
                {/* Position Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '5px' }}>
                  <button
                    className="control-btn"
                    onClick={() => moveTableCenter(0, -20)}
                    title="Переместить TABLE CENTER вверх (большой шаг)"
                    style={{ fontSize: '0.8rem', padding: '6px' }}
                  >
                    ⬆️
                  </button>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button
                      className="control-btn"
                      onClick={() => moveTableCenter(-20, 0)}
                      title="Переместить TABLE CENTER влево (большой шаг)"
                      style={{ fontSize: '0.8rem', padding: '6px' }}
                    >
                      ⬅️
                    </button>
                    <button
                      className="control-btn"
                      onClick={() => moveTableCenter(20, 0)}
                      title="Переместить TABLE CENTER вправо (большой шаг)"
                      style={{ fontSize: '0.8rem', padding: '6px' }}
                    >
                      ➡️
                    </button>
                  </div>
                  <button
                    className="control-btn"
                    onClick={() => moveTableCenter(0, 20)}
                    title="Переместить TABLE CENTER вниз (большой шаг)"
                    style={{ fontSize: '0.8rem', padding: '6px' }}
                  >
                    ⬇️
                  </button>
                </div>
                
                {/* Removed 🎯 reset button and quick position buttons (🔝, ⭕) */}
              </div>
            </div>

            {/* Edit Mode Button in Top Right Corner of TABLE CENTER */}
            <div className="table-edit-mode-top-right">
              <button
                className={`control-btn ${isEditMode ? 'active' : ''}`}
                onClick={toggleEditMode}
                title={isEditMode ? "Выйти из режима редактирования (Esc)" : "Режим редактирования позиций (Ctrl+E)"}
                style={{
                  backgroundColor: isEditMode ? 'rgba(255, 215, 0, 0.3)' : 'transparent',
                  border: isEditMode ? '2px solid gold' : '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                🔧
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
              // ИСПРАВЛЕНИЕ: Используем player.isHost из данных оппонента
              const isOpponentHost = opponent.isHost || false;
              
              // 🏆 ОТЛАДКА: Логируем состояние хоста
              console.log(`🏆 OPPONENT HOST DEBUG (Session: ${sessionId}):`, {
                opponentId: opponent.id,
                opponentName: opponent.name,
                opponentIsHost: opponent.isHost,
                isOpponentHost: isOpponentHost,
                currentPlayerId: currentPlayerId,
                isHost: isHost
              });
              
              return (
                <div 
                  className={`opponent-player ${isOpponentTurn ? 'active-turn' : ''}`}
                  style={getElementStyle('opponent-player')}
                  onMouseDown={(e) => handleMouseDown(e, 'opponent-player')}
                >
                  {/* Turn indicator - сверху */}
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isOpponentTurn ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    display: isOpponentTurn ? 'block' : 'none',
                    zIndex: 10000,
                    boxShadow: '0 0 10px blue'
                  }}></div>

                  <div className={`player-card glass-morphism ${isOpponentTurn ? 'player-turn-animation' : ''} ${isOpponentHost ? 'host-player' : ''}`}
                       style={{
                         border: isOpponentHost ? '3px solid #2196F3' : undefined,
                         backgroundColor: isOpponentHost ? 'rgba(33,150,243,0.1)' : undefined,
                         boxShadow: isOpponentHost ? '0 0 15px rgba(33,150,243,0.3)' : undefined
                       }}
                  >
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
                      <h3 className="player-name">
                        {opponent.name}
                        {isOpponentHost && (
                          <span style={{ 
                            color: '#FFD700', 
                            fontSize: '0.8rem',
                            background: 'rgba(255,215,0,0.2)',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,215,0,0.5)',
                            marginLeft: '8px'
                          }} title="Хост игры" className="host-indicator">👑</span>
                        )}
                      </h3>
                      <div className="player-stack">€{opponent.stack}</div>
                    </div>
                  </div>
                  
                  {/* Bet indicator - всегда отображается */}
                  {opponentBet > 0 ? (
                    <div className="bet-indicator glass-morphism">
                      <span className="bet-amount">€{opponentBet}</span>
                    </div>
                  ) : (
                    <div className="bet-indicator-placeholder">
                      <span className="bet-amount">—</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Board Cards and Pot Display Container - по центру */}
            <div 
              className="board-and-pot-container"
              style={getElementStyle('board-container')}
              onMouseDown={(e) => handleMouseDown(e, 'board-container')}
            >
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
              // ИСПРАВЛЕНИЕ: Используем myPlayer.isHost из данных игрока
              const isMyPlayerHost = myPlayer.isHost || false;
              
              // 🏆 ОТЛАДКА: Логируем состояние хоста для текущего игрока
              console.log(`🏆 MY PLAYER HOST DEBUG (Session: ${sessionId}):`, {
                myPlayerId: myPlayer.id,
                myPlayerName: myPlayer.name,
                myPlayerIsHost: myPlayer.isHost,
                isMyPlayerHost: isMyPlayerHost,
                currentPlayerId: currentPlayerId,
                isHost: isHost
              });
              
              return (
                <div 
                  className={`current-player-in-center ${isMyPlayerTurn ? 'active-turn' : ''}`}
                  style={getElementStyle('current-player')}
                  onMouseDown={(e) => handleMouseDown(e, 'current-player')}
                >
                  <div className={`player-card glass-morphism ${isMyPlayerTurn ? 'player-turn-animation' : ''} ${isMyPlayerHost ? 'host-player' : ''}`}
                       style={{
                         border: isMyPlayerHost ? '3px solid #2196F3' : undefined,
                         backgroundColor: isMyPlayerHost ? 'rgba(33,150,243,0.1)' : undefined,
                         boxShadow: isMyPlayerHost ? '0 0 15px rgba(33,150,243,0.3)' : undefined
                       }}
                  >
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
                      <h3 className="player-name">
                        {myPlayer.name}
                        {isMyPlayerHost && (
                          <span style={{ 
                            color: '#FFD700', 
                            fontSize: '0.8rem',
                            background: 'rgba(255,215,0,0.2)',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,215,0,0.5)',
                            marginLeft: '8px'
                          }} title="Хост игры" className="host-indicator">👑</span>
                        )}
                      </h3>
                      <div className="player-stack">€{myPlayer.stack}</div>
                    </div>
                  </div>
                  
                  {/* Bet indicator - всегда отображается */}
                  {myBet > 0 ? (
                    <div className="bet-indicator glass-morphism">
                      <span className="bet-amount">€{myBet}</span>
                    </div>
                  ) : (
                    <div className="bet-indicator-placeholder">
                      <span className="bet-amount">—</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bet Sizing Panel - отдельная панель */}
            {(() => {
              const myPlayerData = table.players.find(p => p.id === currentPlayerId);
              if (!myPlayerData) return null;
              const isMyTurn = myPlayerData?.id === table.currentPlayer;
              
              return (
                <div 
                  className="betting-sizing-panel-separate"
                  style={getElementStyle('betting-sizing-panel')}
                  onMouseDown={(e) => handleMouseDown(e, 'betting-sizing-panel')}
                >
                  {!table.handComplete && (
                    <div className="sizing-panel glass-morphism">
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
                              onWheel={(e) => handleWheelBetSize(e, finalAmount)}
                              disabled={!isMyTurn}
                            >
                              <span className="sizing-label">{label}</span>
                              <span className="sizing-amount">€{finalAmount}</span>
                            </button>
                          );
                        }).filter(Boolean)}
                        
                        {/* Кнопка ручного ввода */}
                        <button
                          className={`sizing-btn manual-input-btn ${showManualInput ? 'selected' : ''}`}
                          onClick={() => {
                            setShowManualInput(!showManualInput);
                            if (!showManualInput) {
                              setManualBetAmount(selectedBetAmount.toString());
                            }
                          }}
                          disabled={!isMyTurn}
                          title="Ручной ввод ставки"
                        >
                          <span className="sizing-label">Ручной</span>
                          <span className="sizing-amount">€{selectedBetAmount}</span>
                        </button>

                        {/* Кнопка настроек после кнопки ручного ввода */}
                        <button
                          className={`settings-btn ${showSizingSettings ? 'active' : ''}`}
                          onClick={() => setShowSizingSettings(!showSizingSettings)}
                          title="Настройки размеров ставок"
                        >
                          ⚙️
                        </button>
                      </div>
                      
                      {/* Настройки размеров ставок */}
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
                      
                      {/* Панель ручного ввода */}
                      {showManualInput && (
                        <div className="manual-input-panel neumorphism">
                          <input
                            type="number"
                            value={manualBetAmount}
                            onChange={(e) => handleManualBetChange(e.target.value)}
                            onWheel={(e) => handleWheelBetSize(e, parseInt(manualBetAmount) || 0)}
                            placeholder="Введите сумму"
                            className="manual-input"
                            min="0"
                            max={myPlayerData?.stack || 1000}
                            disabled={!isMyTurn}
                          />
                          <button
                            className="apply-btn"
                            onClick={applyManualBet}
                            disabled={!isMyTurn}
                          >
                            ✓
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Betting Actions Panel - отдельная панель */}
            {(() => {
              const myPlayerData = table.players.find(p => p.id === currentPlayerId);
              if (!myPlayerData) return null;
              const isMyTurn = myPlayerData?.id === table.currentPlayer;
              
              return (
                <div 
                  className="betting-actions-panel-separate"
                  style={getElementStyle('betting-actions-panel')}
                  onMouseDown={(e) => handleMouseDown(e, 'betting-actions-panel')}
                >
                  {!table.handComplete && (
                    <div className="actions-panel glass-morphism">
                      <div className="action-buttons">
                        {canCheck() && (
                          <>
                            <button
                              className="action-btn check-btn neumorphism"
                              onClick={() => makeAction('check')}
                              disabled={isLoading || !isMyTurn}
                            >
                              <span className="btn-text">ЧЕК</span>
                            </button>
                            
                            <button
                              className="action-btn bet-btn neumorphism"
                              onClick={() => makeAction('bet', selectedBetAmount || calculateBetSize('half'))}
                              onWheel={(e) => handleWheelBetSize(e, selectedBetAmount || calculateBetSize('half'))}
                              disabled={isLoading || !isMyTurn || (!selectedBetAmount && calculateBetSize('half') <= 0)}
                            >
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
                              disabled={isLoading || !isMyTurn}
                            >
                              <span className="btn-text">ФОЛД</span>
                            </button>
                            
                            <button
                              className="action-btn call-btn neumorphism"
                              onClick={() => makeAction('call', getCallAmount())}
                              disabled={isLoading || !isMyTurn}
                            >
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
                              onWheel={(e) => handleWheelBetSize(e, selectedBetAmount || (getCallAmount() > 0 ? getCallAmount() + calculateBetSize('half') : calculateBetSize('half')))}
                              disabled={isLoading || !isMyTurn || (!selectedBetAmount && calculateBetSize('half') <= 0)}
                            >
                              <span className="btn-text">{getCallAmount() > 0 ? 'РЕЙЗ' : 'БЕТ'}</span>
                              <span className="btn-amount">€{selectedBetAmount || (getCallAmount() > 0 ? getCallAmount() + calculateBetSize('half') : calculateBetSize('half'))}</span>
                            </button>
                          </>
                        )}
                      </div>
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

        {/* New Hand Button */}
        {table.handComplete && (
          <div 
            className="new-hand-panel"
            style={getElementStyle('new-hand-button')}
            onMouseDown={(e) => handleMouseDown(e, 'new-hand-button')}
          >
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
    </div>
  );
};

export default ModernPokerTable; 