import React, { useState, useEffect, useCallback } from 'react';
import './TestWindow.css';
import preflopSpotsLoader, { PreflopSpot } from '../utils/preflopSpotsLoader';
import Card from './Card';
import { SUITS_ORDER, RANKS_ORDER, Suit, Rank } from '../utils/cardSprites';
import ModernPokerTable from './ModernPokerTable';
import HandRangeMatrix from './HandRangeMatrix';
import BoardSettings from './BoardSettings';
import parsePokerLogFile from '../utils/preflopSpotsLoader';
import config from '../config';

interface RakeSettings {
  percentage: number;
  cap: number;
}

interface BoardSettings {
  activeStreet: 'flop' | 'turn' | 'river';
  flop: {
    specific: boolean;
    specificCards: string[];
    suits: string[];
    paired: string[];
    highCard: string[];
    middleCard: string[];
    lowCard: string[];
  };
}

interface HandMatrix {
  [hand: string]: number; // процент с которым играется рука (0-100)
}

interface MatrixSettings {
  ip: {
    selectedPlayer: string;
    percentage: number;
    matrix: HandMatrix;
  };
  oop: {
    selectedPlayer: string;
    percentage: number;
    matrix: HandMatrix;
  };
}

const TestWindow: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<string>('');
  const [tableCount, setTableCount] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragField, setDragField] = useState<'highCard' | 'middleCard' | 'lowCard' | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [rakeSettings, setRakeSettings] = useState<RakeSettings>({
    percentage: 2.5,
    cap: 5
  });
  const [boardSettings, setBoardSettings] = useState<BoardSettings>({
    activeStreet: 'flop',
    flop: {
      specific: false,
      specificCards: ['', '', ''],
      suits: ['any'],
      paired: ['any'],
      highCard: ['any'],
      middleCard: ['any'],
      lowCard: ['any']
    }
  });

  // Состояние для матриц рук
  const [matrixSettings, setMatrixSettings] = useState<MatrixSettings>({
    ip: {
      selectedPlayer: '',
      percentage: 50,
      matrix: {}
    },
    oop: {
      selectedPlayer: '',
      percentage: 50,
      matrix: {}
    }
  });

  // Состояние для игровой симуляции
  const [selectedPosition, setSelectedPosition] = useState<'ip' | 'oop'>('ip');
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  // Состояние для игровой сессии
  const [gameSession, setGameSession] = useState<any>(null);
  const [handHistories, setHandHistories] = useState<string[]>([]);

  // Состояния для спотов
  const [preflopSpots, setPreflopSpots] = useState<PreflopSpot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);

  // Состояние для уведомления о копировании
  const [copyNotification, setCopyNotification] = useState<string>('');

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleSpotChange = (spotId: string) => {
    setSelectedSpot(spotId);
  };

  const handleRakeChange = (field: keyof RakeSettings, value: number) => {
    setRakeSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleBoardStreetChange = (street: 'flop' | 'turn' | 'river') => {
    setBoardSettings(prev => ({ ...prev, activeStreet: street }));
  };

  const handleCardRankSelection = (field: 'highCard' | 'middleCard' | 'lowCard', card: string) => {
    setBoardSettings(prev => {
      const currentSelection = prev.flop[field];
      let newSelection: string[];

      if (card === 'any') {
        // Если выбрано "Любой", сбрасываем выбор к только "any"
        newSelection = ['any'];
      } else {
        // Если в текущем выборе есть "any", убираем его при выборе конкретной карты
        const filteredSelection = currentSelection.filter(c => c !== 'any');
        
        if (filteredSelection.includes(card)) {
          // Убираем карту из выбора
          newSelection = filteredSelection.filter(c => c !== card);
          // Если ничего не осталось, возвращаем "any"
          if (newSelection.length === 0) {
            newSelection = ['any'];
          }
        } else {
          // Добавляем карту к выбору
          newSelection = [...filteredSelection, card];
        }
      }

      return {
        ...prev,
        flop: { ...prev.flop, [field]: newSelection }
      };
    });
  };

  const handleCardRankMouseDown = (field: 'highCard' | 'middleCard' | 'lowCard', card: string) => {
    setIsDragging(true);
    setDragField(field);
    handleCardRankSelection(field, card);
  };

  const handleCardRankMouseEnter = (field: 'highCard' | 'middleCard' | 'lowCard', card: string) => {
    if (isDragging && dragField === field) {
      handleCardRankSelection(field, card);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragField(null);
  };

  // Добавляем обработчик mouseup на весь документ
  React.useEffect(() => {
    const handleDocumentMouseUp = () => {
      setIsDragging(false);
      setDragField(null);
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, []);

  const handleBoardOptionSelection = (field: 'suits' | 'paired', option: string) => {
    setBoardSettings(prev => {
      const currentSelection = prev.flop[field];
      let newSelection: string[];

      if (option === 'any') {
        // Если выбрано "Любой", сбрасываем выбор к только "any"
        newSelection = ['any'];
      } else {
        // Если в текущем выборе есть "any", убираем его при выборе конкретной опции
        const filteredSelection = currentSelection.filter(c => c !== 'any');
        
        if (filteredSelection.includes(option)) {
          // Убираем опцию из выбора
          newSelection = filteredSelection.filter(c => c !== option);
          // Если ничего не осталось, возвращаем "any"
          if (newSelection.length === 0) {
            newSelection = ['any'];
          }
        } else {
          // Добавляем опцию к выбору
          newSelection = [...filteredSelection, option];
        }
      }

      return {
        ...prev,
        flop: { ...prev.flop, [field]: newSelection }
      };
    });
  };

  const openCardModal = (index: number) => {
    setSelectedCardIndex(index);
    setIsCardModalOpen(true);
  };

  const openFreeCardModal = () => {
    setSelectedCardIndex(null);
    setIsCardModalOpen(true);
  };

  const closeCardModal = () => {
    setIsCardModalOpen(false);
    setSelectedCardIndex(null);
  };

  const selectCard = (card: string) => {
    if (selectedCardIndex !== null) {
      const currentCards = [...boardSettings.flop.specificCards];
      
      // Проверяем, есть ли эта карта уже в любой позиции
      const existingCardIndex = currentCards.findIndex(c => c === card);
      
      if (existingCardIndex !== -1) {
        // Карта уже выбрана где-то - отменяем её выбор
        currentCards[existingCardIndex] = '';
        setBoardSettings(prev => ({
          ...prev,
          flop: { ...prev.flop, specificCards: currentCards }
        }));
        return; // Не закрываем модальное окно при отмене
      } else {
        // Выбираем новую карту в текущую позицию
        currentCards[selectedCardIndex] = card;
        setBoardSettings(prev => ({
          ...prev,
          flop: { ...prev.flop, specificCards: currentCards }
        }));
        
        // Автоматически переходим к следующей пустой позиции
        const nextEmptyIndex = currentCards.findIndex((c, i) => i > selectedCardIndex && !c);
        if (nextEmptyIndex !== -1) {
          setSelectedCardIndex(nextEmptyIndex);
        } else {
          // Если все карты заполнены, автоматически закрываем
          const allFilled = currentCards.every(c => c !== '');
          if (allFilled) {
            closeCardModal();
          }
        }
      }
    }
  };

  // Функция для быстрого выбора всех карт флопа
  const selectCardForAnyPosition = (card: string) => {
    const currentCards = [...boardSettings.flop.specificCards];
    
    // Проверяем, не выбрана ли уже эта карта
    const existingIndex = currentCards.findIndex(c => c === card);
    if (existingIndex !== -1) {
      // Карта уже выбрана - отменяем выбор
      currentCards[existingIndex] = '';
      setBoardSettings(prev => ({
        ...prev,
        flop: { ...prev.flop, specificCards: currentCards }
      }));
      return;
    }
    
    // Ищем первую пустую позицию
    const emptyIndex = currentCards.findIndex(c => !c);
    if (emptyIndex !== -1) {
      currentCards[emptyIndex] = card;
      setBoardSettings(prev => ({
        ...prev,
        flop: { ...prev.flop, specificCards: currentCards }
      }));
      
      // Если все позиции заполнены, закрываем модальное окно
      const allFilled = currentCards.every(c => c !== '');
      if (allFilled) {
        closeCardModal();
      }
    }
  };

  const selectRandomFlop = () => {
    // Выбираем 3 случайные карты для флопа
    const allCards: string[] = [];
    
    SUITS_ORDER.forEach(suitName => {
      RANKS_ORDER.forEach(rank => {
        // Конвертируем формат карты для нашего компонента
        const displayRank = rank === '10' ? 'T' : rank;
        let suitSymbol = '';
        switch(suitName) {
          case 'hearts': suitSymbol = '♥'; break;
          case 'diamonds': suitSymbol = '♦'; break;
          case 'clubs': suitSymbol = '♣'; break;
          case 'spades': suitSymbol = '♠'; break;
        }
        allCards.push(`${displayRank}${suitSymbol}`);
      });
    });
    
    const shuffled = [...allCards].sort(() => 0.5 - Math.random());
    const selectedCards = shuffled.slice(0, 3);
    
    // Устанавливаем выбранные карты
    setBoardSettings(prev => ({
      ...prev,
      flop: { ...prev.flop, specificCards: selectedCards }
    }));
    
    closeCardModal();
  };

  // Конвертируем наш формат карты в формат спрайтов
  const convertCardToSprite = (cardString: string) => {
    if (!cardString) return null;
    
    const rank = cardString.slice(0, -1); // Все символы кроме последнего
    const suitSymbol = cardString.slice(-1); // Последний символ
    
    // Конвертируем ранг
    const spriteRank = rank === 'T' ? '10' : rank;
    
    // Конвертируем масть
    let spriteSuit: Suit;
    switch(suitSymbol) {
      case '♥': spriteSuit = 'hearts'; break;
      case '♦': spriteSuit = 'diamonds'; break;
      case '♣': spriteSuit = 'clubs'; break;
      case '♠': spriteSuit = 'spades'; break;
      default: return null;
    }
    
    return { suit: spriteSuit, rank: spriteRank as Rank };
  };

  // Конвертируем из формата спрайтов в наш формат
  const convertSpriteToCard = (suit: Suit, rank: Rank): string => {
    const displayRank = rank === '10' ? 'T' : rank;
    let suitSymbol = '';
    switch(suit) {
      case 'hearts': suitSymbol = '♥'; break;
      case 'diamonds': suitSymbol = '♦'; break;
      case 'clubs': suitSymbol = '♣'; break;
      case 'spades': suitSymbol = '♠'; break;
    }
    return `${displayRank}${suitSymbol}`;
  };

  // Проверяем, выбрана ли карта
  const isCardSelected = (suit: Suit, rank: Rank): boolean => {
    const cardString = convertSpriteToCard(suit, rank);
    
    if (selectedCardIndex !== null) {
      // В режиме выбора по позиции - проверяем только текущую позицию
      return boardSettings.flop.specificCards[selectedCardIndex] === cardString;
    } else {
      // В режиме быстрого выбора - проверяем все позиции
      return boardSettings.flop.specificCards.includes(cardString);
    }
  };

  const cards = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: '♥', name: 'hearts', color: '#e74c3c' },
    { symbol: '♦', name: 'diamonds', color: '#e74c3c' },
    { symbol: '♣', name: 'clubs', color: '#2c3e50' },
    { symbol: '♠', name: 'spades', color: '#2c3e50' }
  ];

  const getSelectedSpotData = useCallback((): PreflopSpot | null => {
    return preflopSpots.find(spot => spot.id === selectedSpot) || null;
  }, [preflopSpots, selectedSpot]);

  // Загрузка имен игроков из выбранного спота
  const getPlayerNamesFromSpot = useCallback((spotId: string): string[] => {
    const spot = preflopSpots.find(s => s.id === spotId);
    if (!spot) return ['Player1', 'Player2'];
    
    // Извлекаем имена игроков из названия спота
    const spotName = spot.name.replace('.txt', '');
    const parts = spotName.split(' vs ');
    
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    }
    
    return ['Player1', 'Player2'];
  }, [preflopSpots]);

  // Обновляем имена игроков при изменении выбранного спота
  useEffect(() => {
    if (selectedSpot) {
      const names = getPlayerNamesFromSpot(selectedSpot);
      setMatrixSettings(prev => ({
        ...prev,
        ip: { ...prev.ip, selectedPlayer: names[0] },
        oop: { ...prev.oop, selectedPlayer: names[1] }
      }));
    }
  }, [selectedSpot, getPlayerNamesFromSpot]);

  // Матрицы рук
  const renderHandMatrix = (position: 'ip' | 'oop') => {
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const matrix: React.ReactElement[] = [];
    
    // Создаем сетку 13x13
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j < 13; j++) {
        let hand = '';
        let className = 'matrix-cell';
        
        if (i === j) {
          // Пары на диагонали
          hand = `${ranks[i]}${ranks[i]}`;
          className += ' pair';
        } else if (i < j) {
          // Suited руки выше диагонали
          hand = `${ranks[i]}${ranks[j]}s`;
          className += ' suited';
        } else {
          // Offsuit руки ниже диагонали
          hand = `${ranks[j]}${ranks[i]}o`;
          className += ' offsuit';
        }
        
        const percentage = matrixSettings[position].matrix[hand] || 0;
        const intensity = percentage / 100;
        
        matrix.push(
          <div
            key={`${position}-${i}-${j}`}
            className={`${className} ${percentage > 0 ? 'selected' : ''}`}
            style={{
              backgroundColor: percentage > 0 
                ? `rgba(34, 197, 94, ${0.2 + intensity * 0.6})` 
                : 'rgba(255, 255, 255, 0.05)',
              borderColor: percentage > 0 
                ? `rgba(34, 197, 94, ${0.3 + intensity * 0.4})` 
                : 'rgba(255, 255, 255, 0.15)'
            }}
            onClick={() => toggleHandSelection(position, hand)}
            title={`${hand}: ${percentage}%`}
          >
            <span className="hand-text">{hand}</span>
            {percentage > 0 && (
              <span className="percentage-text">{percentage}%</span>
            )}
          </div>
        );
      }
    }
    
    return <div className="poker-matrix">{matrix}</div>;
  };

  const toggleHandSelection = (position: 'ip' | 'oop', hand: string) => {
    const currentPercentage = matrixSettings[position].matrix[hand] || 0;
    const selectedPercentage = matrixSettings[position].percentage;
    
    setMatrixSettings(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        matrix: {
          ...prev[position].matrix,
          [hand]: currentPercentage === 0 ? selectedPercentage : 0
        }
      }
    }));
  };

  const handleMatrixPlayerChange = (position: 'ip' | 'oop', player: string) => {
    setMatrixSettings(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        selectedPlayer: player
      }
    }));
  };

  const handleMatrixPercentageChange = (position: 'ip' | 'oop', percentage: number) => {
    setMatrixSettings(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        percentage
      }
    }));
  };

  const handlePasteFromClipboard = async (position: 'ip' | 'oop') => {
    try {
      const text = await navigator.clipboard.readText();
      // Парсинг текста рук
      const hands = text.split(/[\s,]+/).filter(hand => hand.length >= 2);
      const newMatrix: HandMatrix = {};
      
      hands.forEach(hand => {
        if (hand) {
          const cleanHand = hand.trim();
          
          // Проверяем, есть ли в руке указание процента (формат "рука:процент")
          let handName = cleanHand;
          let percentage = 100; // По умолчанию 100%
          
          if (cleanHand.includes(':')) {
            const parts = cleanHand.split(':');
            handName = parts[0].trim();
            const percentValue = parseFloat(parts[1]);
            
            // Конвертируем процент: если меньше 1, то это десятичная дробь (0.55 = 55%)
            if (percentValue < 1) {
              percentage = Math.round(percentValue * 100);
            } else {
              percentage = Math.round(percentValue);
            }
          }
          
          // Проверяем, есть ли в руке указание на suited/offsuit
          if (handName.endsWith('s') || handName.endsWith('o')) {
            // Рука уже имеет указание - добавляем как есть
            newMatrix[handName] = percentage;
          } else {
            // Рука без указания - добавляем обе версии (suited и offsuit)
            const baseHand = handName;
            if (baseHand.length >= 2) {
              // Для пар добавляем только саму пару
              if (baseHand[0] === baseHand[1]) {
                newMatrix[baseHand] = percentage;
              } else {
                // Для непарных рук добавляем обе версии
                newMatrix[`${baseHand}s`] = percentage;
                newMatrix[`${baseHand}o`] = percentage;
              }
            }
          }
        }
      });
      
      setMatrixSettings(prev => ({
        ...prev,
        [position]: {
          ...prev[position],
          matrix: { ...prev[position].matrix, ...newMatrix }
        }
      }));
    } catch (err) {
      console.error('Ошибка при вставке из буфера обмена:', err);
    }
  };

  const startGameSimulation = async () => {
    // Создаем сессию через API с настройками из TestWindow
    try {
      // Конвертируем настройки для API
      const convertedHandRanges = {
        player1: Object.keys(matrixSettings.ip.matrix).filter(hand => matrixSettings.ip.matrix[hand] > 0),
        player2: Object.keys(matrixSettings.oop.matrix).filter(hand => matrixSettings.oop.matrix[hand] > 0)
      };

      // Если диапазоны пусты, добавляем базовые руки
      if (convertedHandRanges.player1.length === 0) {
        convertedHandRanges.player1 = ['AA', 'KK', 'QQ', 'AKs', 'AKo'];
      }
      if (convertedHandRanges.player2.length === 0) {
        convertedHandRanges.player2 = ['AA', 'KK', 'QQ', 'AKs', 'AKo'];
      }

      // Получаем данные выбранного спота
      const spotData = getSelectedSpotData();
      let preflopHistory = '';
      let preflopInfo = null;
      
      if (spotData) {
        console.log('📊 Используем данные спота:', spotData);
        
        // Используем полный текст hand history если доступен
        if (spotData.handHistoryText) {
          preflopHistory = spotData.handHistoryText;
        } else {
          // Создаем базовую префлоп историю на основе спота
          preflopHistory = `PokerStars Hand #${Date.now()}: Hold'em No Limit (€${spotData.blinds.small}/€${spotData.blinds.big} EUR) - ${new Date().toISOString().replace('T', ' ').slice(0, 19)} ET
Table '${spotData.name}' 2-max Seat #1 is the button
Seat 1: Player1 (€1000 in chips)
Seat 2: Player2 (€1000 in chips)
Player1: posts small blind €${spotData.blinds.small}
Player2: posts big blind €${spotData.blinds.big}
*** HOLE CARDS ***`;

          // Добавляем действия из спота
          for (const action of spotData.actions) {
            if (action.action === 'raise') {
              preflopHistory += `\n${action.player}: raises €${action.amount}`;
            } else if (action.action === 'call') {
              preflopHistory += `\n${action.player}: calls €${action.amount}`;
            } else if (action.action === '3bet') {
              preflopHistory += `\n${action.player}: raises €${action.amount}`;
            }
            // Добавить другие действия по необходимости
          }
          
          preflopHistory += '\n*** FLOP ***';
        }
        
        // Создаем объект preflopInfo с данными спота
        preflopInfo = {
          potSize: spotData.potSize,
          blinds: spotData.blinds,
          actions: spotData.actions,
          playerNames: spotData.actions.map(action => action.player).filter((name, index, arr) => arr.indexOf(name) === index)
        };
        
        console.log('💰 Передаем данные о банке и стеках:', preflopInfo);
      }

      // Определяем имя игрока и позицию на основе выбранных настроек
      const playerNames = getPlayerNamesFromSpot(selectedSpot);
      let currentPlayerName = '';
      let currentPlayerId = 1;
      let otherPlayerName = '';
      let finalPlayerNames: string[] = [];
      
      console.log('🎮 Определяем игроков:');
      console.log('📍 Выбранная позиция:', selectedPosition);
      console.log('🏷️ IP игрок:', matrixSettings.ip.selectedPlayer);
      console.log('🏷️ OOP игрок:', matrixSettings.oop.selectedPlayer);
      console.log('👥 Доступные игроки:', playerNames);
      
      if (selectedPosition === 'ip') {
        // Играем за IP - используем выбранного IP игрока как currentPlayer
        currentPlayerName = matrixSettings.ip.selectedPlayer || 'Player1';
        currentPlayerId = 1; // IP всегда позиция 1
        otherPlayerName = matrixSettings.oop.selectedPlayer || 'Player2';
        // Порядок: [IP игрок, OOP игрок]
        finalPlayerNames = [currentPlayerName, otherPlayerName];
      } else if (selectedPosition === 'oop') {
        // Играем за OOP - используем выбранного OOP игрока как currentPlayer  
        currentPlayerName = matrixSettings.oop.selectedPlayer || 'Player2';
        currentPlayerId = 2; // OOP всегда позиция 2
        otherPlayerName = matrixSettings.ip.selectedPlayer || 'Player1';
        // Порядок: [IP игрок, OOP игрок] (НЕ меняем, просто указываем кто текущий)
        finalPlayerNames = [otherPlayerName, currentPlayerName];
      }
      
      console.log('✅ Итоговые игроки:');
      console.log('🎯 Текущий игрок (за кого играем):', currentPlayerName, '(позиция', selectedPosition.toUpperCase(), ')');
      console.log('👤 Другой игрок:', otherPlayerName);
      console.log('📋 Порядок передачи на сервер:', finalPlayerNames);

      const sessionData = {
        preflopHistory,
        preflopInfo, // Добавляем структурированные данные о префлопе
        boardSettings: {
          flopSettings: {
            // Конкретные карты
            specific: boardSettings.flop.specific && boardSettings.flop.specificCards.every(card => card !== ''),
            specificCards: boardSettings.flop.specific ? boardSettings.flop.specificCards : [],
            
            // Настройки мастей - конвертируем из массива в boolean флаги
            twoTone: boardSettings.flop.suits.includes('flush-draw'),
            rainbow: boardSettings.flop.suits.includes('rainbow'),
            monotone: boardSettings.flop.suits.includes('monotone'),
            
            // Настройки спаренности - конвертируем из массива в boolean флаги
            unpaired: boardSettings.flop.paired.includes('unpaired'),
            paired: boardSettings.flop.paired.includes('paired'),
            trips: boardSettings.flop.paired.includes('trips'),
            
            // Диапазоны карт
            ranges: !boardSettings.flop.highCard.includes('any') && 
                   (boardSettings.flop.highCard.length > 0 || 
                    boardSettings.flop.middleCard.length > 0 || 
                    boardSettings.flop.lowCard.length > 0),
            rangeSettings: {
              high: boardSettings.flop.highCard.includes('any') ? [] : boardSettings.flop.highCard,
              middle: boardSettings.flop.middleCard.includes('any') ? [] : boardSettings.flop.middleCard,
              low: boardSettings.flop.lowCard.includes('any') ? [] : boardSettings.flop.lowCard
            }
          },
          turnSettings: { enabled: true },
          riverSettings: { enabled: true }
        },
        handRanges: convertedHandRanges,
        tableCount,
        rakeSettings,
        hostPlayerId: currentPlayerId, // ИСПРАВЛЕНИЕ: Хост - это тот игрок за которого мы играем
        // Передаем правильные имена игроков в правильном порядке
        playerNames: finalPlayerNames,
        // Передаем информацию о текущем игроке
        currentPlayer: {
          name: currentPlayerName,
          id: currentPlayerId,
          position: selectedPosition
        }
      };

      console.log('🚀 Отправляем данные на сервер:', sessionData);

      const response = await fetch('/api/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log('✅ Получили ответ от сервера:', result);
        
        // Теперь result содержит sessionIds - массив ID сессий
        setGameSession({
          sessionIds: result.sessionIds, // Массив ID сессий
          sessionId: result.sessionIds[0], // Используем первый ID для совместимости
          tables: result.tables,
          settings: sessionData,
          playerNames: result.playerNames || playerNames,
          preflopInfo: result.preflopInfo || preflopInfo,
          // Передаем информацию о текущем игроке
          currentPlayer: {
            name: currentPlayerName,
            id: currentPlayerId,
            position: selectedPosition
          }
        });
        setIsGameStarted(true);
        setIsPanelOpen(false);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Ошибка при создании сессии. Проверьте подключение к серверу.');
    }
  };

  const joinSessionFromClipboard = async () => {
    try {
      // Читаем ID сессии из буфера обмена
      const clipboardContent = await navigator.clipboard.readText();
      
      if (!clipboardContent || clipboardContent.trim().length === 0) {
        alert('Буфер обмена пуст. Скопируйте ID сессии и попробуйте снова.');
        return;
      }
      
      const cleanContent = clipboardContent.trim();
      console.log('🔗 Clipboard content:', cleanContent);
      
      // Проверяем если это несколько ID (разделенных переносами строк)
      const sessionIds = cleanContent.split('\n').map(id => id.trim()).filter(id => id.length > 0);
      
      if (sessionIds.length === 0) {
        alert('Не удалось найти действительные ID сессий в буфере обмена.');
        return;
      }
      
      if (sessionIds.length === 1) {
        // Одна сессия - подключаемся напрямую
        const sessionId = sessionIds[0];
        console.log('🔗 Joining single session:', sessionId);
        
        try {
          const response = await fetch(`/api/session/${sessionId}`);
          const sessionData = await response.json();
          
          if (!response.ok) {
            throw new Error(sessionData.error || 'Failed to load session');
          }
          
          // Устанавливаем режим гостя
          setGameSession({
            sessionId: sessionId,
            tables: sessionData.tables,
            playerNames: sessionData.playerNames,
            isGuest: true
          });
          
        } catch (error: any) {
          console.error('Failed to join session:', error);
          alert(`Не удалось подключиться к сессии: ${error.message}`);
        }
      } else {
        // Множественные сессии - открываем отдельные окна для каждой БЕЗ предварительной проверки
        console.log(`🔗 Opening ${sessionIds.length} separate windows for sessions:`, sessionIds);
        
        // Открываем отдельное окно для каждой сессии сразу
        const openedWindows = [];
        for (let i = 0; i < sessionIds.length; i++) {
          const sessionId = sessionIds[i];
          
          try {
            console.log(`🪟 Opening window ${i + 1}/${sessionIds.length} for session ${sessionId}`);
            const newWindow = openSessionWindow(sessionId, i + 1);
            if (newWindow) {
              openedWindows.push(newWindow);
            }
            
            // Небольшая задержка между открытием окон
            if (i < sessionIds.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (error: any) {
            console.error(`Failed to open window for session ${sessionId}:`, error);
          }
        }
        
        console.log(`✅ Successfully opened ${openedWindows.length} windows for ${sessionIds.length} sessions`);
        
        if (openedWindows.length > 0) {
          alert(`Успешно подключились к ${sessionIds.length} столам!\nОткрыто ${openedWindows.length} окон.`);
        } else {
          alert('Не удалось открыть окна. Проверьте настройки блокировки всплывающих окон в браузере.');
        }
      }
      
    } catch (error: any) {
      console.error('Error reading clipboard:', error);
      alert('Ошибка при чтении буфера обмена. Убедитесь, что страница имеет разрешение на доступ к буферу обмена.');
    }
  };

  const openSessionWindow = (sessionId: string, tableNumber: number) => {
    // Создаем URL для подключения гостя к сессии
    const baseUrl = config.apiBaseUrl;
    
    // Упрощенный URL без hash для тестирования
    const guestUrl = `${baseUrl}/#join?sessionId=${sessionId}&isGuest=true&tableStyle=modern`;
    
    console.log(`🪟 Opening window ${tableNumber} for session ${sessionId}`);
    console.log(`🔗 URL: ${guestUrl}`);
    
    // Настройки окна
    const windowFeatures = [
      'width=1200',
      'height=800',
      `left=${200 + (tableNumber - 1) * 150}`, // Увеличиваем смещение для лучшей видимости
      `top=${100 + (tableNumber - 1) * 150}`,
      'resizable=yes',
      'scrollbars=no',
      'status=no',
      'menubar=no',
      'toolbar=no',
      'location=no',
      'directories=no'
    ].join(',');
    
    try {
      // Открываем новое окно
      const newWindow = window.open(
        guestUrl,
        `poker-guest-table-${tableNumber}`,
        windowFeatures
      );
      
      if (newWindow) {
        console.log(`✅ Window opened successfully for table ${tableNumber}`);
        
        // Фокусируемся на новом окне
        setTimeout(() => {
          try {
            newWindow.focus();
            console.log(`✅ Focused window ${tableNumber}`);
          } catch (e: any) {
            console.log(`⚠️ Could not focus window ${tableNumber}:`, e.message);
          }
        }, 500);
        
        return newWindow;
      } else {
        console.error(`❌ Failed to open window for session ${sessionId} - window.open returned null`);
        // Если окно не открылось (заблокировано браузером)
        if (tableNumber === 1) {
          alert('Не удалось открыть новые окна. Проверьте настройки блокировки всплывающих окон в браузере.\n\nРазрешите всплывающие окна для этого сайта в настройках браузера.');
        }
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Exception when opening window for session ${sessionId}:`, error);
      if (tableNumber === 1) {
        alert(`Ошибка при открытии окон: ${error.message}\n\nПроверьте настройки браузера.`);
      }
      return null;
    }
  };

  const createSingleSession = () => {
    // Возвращаемся к основному окну создания игры
    window.location.href = '/';
  };

  // Загрузка спотов при монтировании компонента
  useEffect(() => {
    const loadSpots = async () => {
      setSpotsLoading(true);
      try {
        const spots = await preflopSpotsLoader.loadSpotsFromFolder();
        setPreflopSpots(spots);
      } catch (error) {
        console.error('Ошибка загрузки спотов:', error);
      } finally {
        setSpotsLoading(false);
      }
    };

    loadSpots();
  }, []);

  // Функция для копирования Session ID
  const copySessionId = async (sessionId: string) => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopyNotification('Скопировано!');
      setTimeout(() => setCopyNotification(''), 2000);
    } catch (error) {
      console.error('Ошибка копирования:', error);
      setCopyNotification('Ошибка копирования');
      setTimeout(() => setCopyNotification(''), 2000);
    }
  };

  const copyAllSessionIds = async (sessionIds: string[]) => {
    try {
      const allIds = sessionIds.join('\n');
      await navigator.clipboard.writeText(allIds);
      setCopyNotification('Все ID скопированы!');
      setTimeout(() => setCopyNotification(''), 2000);
    } catch (error) {
      console.error('Ошибка копирования всех ID:', error);
      setCopyNotification('Ошибка копирования всех ID');
      setTimeout(() => setCopyNotification(''), 2000);
    }
  };

  return (
    <div className="test-window">
      {/* Кнопка открытия панели */}
      <button 
        className={`panel-toggle-btn ${isPanelOpen ? 'active' : ''}`}
        onClick={togglePanel}
        aria-label={isPanelOpen ? 'Закрыть панель' : 'Открыть панель'}
      >
        <span className="toggle-icon">
          {isPanelOpen ? '✕' : '☰'}
        </span>
      </button>

      {/* Боковая панель */}
      <div className={`side-panel ${isPanelOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <div className="header-content">
            <h2>Панель управления</h2>
            {isGameStarted && gameSession && (
              <div className="session-id-display">
                {gameSession.sessionIds ? (
                  // Если есть массив ID сессий - показываем их все
                  <div className="multiple-sessions">
                    <span className="session-label">Session IDs ({gameSession.sessionIds.length}):</span>
                    <div className="session-list">
                      {gameSession.sessionIds.map((sessionId: string, index: number) => (
                        <div key={sessionId} className="session-item">
                          <span className="session-number">{index + 1}:</span>
                          <span 
                            className="session-id"
                            onClick={() => copySessionId(sessionId)}
                            title="Нажмите для копирования"
                          >
                            {sessionId}
                          </span>
                        </div>
                      ))}
                      <button
                        className="copy-all-btn"
                        onClick={() => copyAllSessionIds(gameSession.sessionIds)}
                        title="Копировать все ID в формате для подключения"
                      >
                        📋 Копировать все
                      </button>
                    </div>
                  </div>
                ) : gameSession.sessionId ? (
                  // Fallback для одного ID
                  <div className="single-session">
                    <span className="session-label">Session ID:</span>
                    <span 
                      className="session-id"
                      onClick={() => copySessionId(gameSession.sessionId)}
                      title="Нажмите для копирования"
                    >
                      {gameSession.sessionId}
                    </span>
                  </div>
                ) : null}
                {copyNotification && (
                  <span className="copy-notification">
                    {copyNotification}
                  </span>
                )}
              </div>
            )}
            <div className="position-selector">
              <span className="position-label">За кого играть:</span>
              <div className="position-buttons">
                <button 
                  className={`position-btn ${selectedPosition === 'ip' ? 'active' : ''}`}
                  onClick={() => setSelectedPosition('ip')}
                  disabled={isGameStarted}
                >
                  IP
                </button>
                <button 
                  className={`position-btn ${selectedPosition === 'oop' ? 'active' : ''}`}
                  onClick={() => setSelectedPosition('oop')}
                  disabled={isGameStarted}
                >
                  OOP
                </button>
              </div>
            </div>
            <div className="control-section">
              <div className="control-group">
                <div className="control-row" style={{ gap: '8px' }}>
                  <button
                    className="start-simulation-btn"
                    onClick={startGameSimulation}
                    disabled={tableCount === 0}
                    title="Начать симуляцию"
                  >
                    ▶
                  </button>
                  <button
                    className="join-session-btn"
                    onClick={joinSessionFromClipboard}
                    title="Подключиться к сессии (ID из буфера обмена)"
                  >
                    🔗
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button 
            className="close-btn"
            onClick={togglePanel}
            aria-label="Закрыть панель"
          >
            ✕
          </button>
        </div>
        
        <div className="panel-content">
          {/* Префлоп споты */}
          <div className="control-section">
            <label className="control-label">Префлоп спот</label>
            <select 
              className="modern-select modern-select-narrow"
              value={selectedSpot}
              onChange={(e) => handleSpotChange(e.target.value)}
              disabled={spotsLoading}
            >
              <option value="">
                {spotsLoading ? "Загрузка спотов..." : "Выберите спот..."}
              </option>
              {preflopSpots.map((spot: PreflopSpot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
            </select>
            {spotsLoading && (
              <div className="spots-loading">
                <span>🔄 Загрузка TXT файлов...</span>
              </div>
            )}
            {!spotsLoading && preflopSpots.length > 0 && (
              <div className="spots-info">
                <span className="spots-count">📁 Загружено {preflopSpots.length} спотов</span>
              </div>
            )}
            {getSelectedSpotData() && (
              <div className="spot-info">
                <p className="spot-description">{getSelectedSpotData()!.description}</p>
                <div className="spot-details">
                  <span className="pot-size">Банк: €{getSelectedSpotData()!.potSize}</span>
                  <span className="blinds">
                    Блайнды: {getSelectedSpotData()!.blinds.small}/{getSelectedSpotData()!.blinds.big}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Количество столов и Настройки рейка в одной строке */}
          <div className="control-section">
            <div className="controls-row">
              {/* Количество столов */}
              <div className="control-group">
                <label className="control-label">Количество столов</label>
                <div className="button-group button-group-tight">
                  {[1, 2, 3, 4].map(count => (
                    <button
                      key={count}
                      className={`rank-btn ${tableCount === count ? 'active' : ''}`}
                      onClick={() => setTableCount(count)}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Настройки рейка */}
              <div className="control-group">
                <label className="control-label">Настройки рейка</label>
                <div className="rake-controls-inline">
                  <div className="rake-input-group">
                    <input
                      type="number"
                      className="modern-input compact-input"
                      min="0"
                      max="10"
                      step="0.1"
                      value={rakeSettings.percentage}
                      onChange={(e) => handleRakeChange('percentage', parseFloat(e.target.value) || 0)}
                    />
                    <label className="input-label input-label-right">%</label>
                  </div>
                  <div className="rake-input-group">
                    <input
                      type="number"
                      className="modern-input compact-input"
                      min="0"
                      max="50"
                      step="0.5"
                      value={rakeSettings.cap}
                      onChange={(e) => handleRakeChange('cap', parseFloat(e.target.value) || 0)}
                    />
                    <label className="input-label input-label-right">$</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Настройки борда */}
          <div className="control-section">
            <label className="control-label">🃏 Настройки борда</label>
            <div className="street-buttons">
              {(['flop', 'turn', 'river'] as const).map(street => (
                <button
                  key={street}
                  className={`street-btn ${boardSettings.activeStreet === street ? 'active' : ''}`}
                  onClick={() => handleBoardStreetChange(street)}
                >
                  {street === 'flop' ? 'Флоп' : street === 'turn' ? 'Тёрн' : 'Ривер'}
                </button>
              ))}
            </div>

            {/* Настройки флопа */}
            {boardSettings.activeStreet === 'flop' && (
              <div className="flop-settings">
                {/* Конкретный флоп */}
                <div className="flop-subsection">
                  <div className="subsection-header">
                    <input
                      type="checkbox"
                      id="specific-flop"
                      checked={boardSettings.flop.specific}
                      onChange={(e) => setBoardSettings(prev => ({
                        ...prev,
                        flop: { ...prev.flop, specific: e.target.checked }
                      }))}
                    />
                    <label htmlFor="specific-flop" className="subsection-label">Конкретный флоп</label>
                  </div>
                  {boardSettings.flop.specific && (
                    <div className="specific-cards-row">
                      {[0, 1, 2].map(index => {
                        const cardString = boardSettings.flop.specificCards[index];
                        const cardData = convertCardToSprite(cardString);
                        
                        return (
                          <div 
                            key={index}
                            className="card-slot"
                            onClick={() => openCardModal(index)}
                          >
                            {cardData ? (
                              <Card
                                suit={cardData.suit}
                                rank={cardData.rank}
                                width={50}
                                height={70}
                                animated={true}
                              />
                            ) : (
                              <div className="card-back">
                                🂠
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button 
                        className="quick-select-btn" 
                        onClick={openFreeCardModal}
                        title="Быстрый выбор карт"
                      >
                        ⚡ Выбрать карты
                      </button>
                    </div>
                  )}
                </div>

                {/* Масти */}
                <div className="flop-subsection">
                  <label className="subsection-label">Масти</label>
                  <div className="button-group button-group-tight">
                    {[
                      { value: 'flush-draw', label: 'Флеш-дро' },
                      { value: 'rainbow', label: 'Радуга' },
                      { value: 'monotone', label: 'Монотонный' },
                      { value: 'any', label: 'Любой' }
                    ].map(option => (
                      <button
                        key={option.value}
                        className={`option-btn ${boardSettings.flop.suits.includes(option.value) ? 'active' : ''}`}
                        onClick={() => handleBoardOptionSelection('suits', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Спаренность */}
                <div className="flop-subsection">
                  <label className="subsection-label">Спаренность</label>
                  <div className="button-group button-group-tight">
                    {[
                      { value: 'unpaired', label: 'Не спаренный' },
                      { value: 'paired', label: 'Спаренный' },
                      { value: 'trips', label: 'Трипл' },
                      { value: 'any', label: 'Любой' }
                    ].map(option => (
                      <button
                        key={option.value}
                        className={`option-btn ${boardSettings.flop.paired.includes(option.value) ? 'active' : ''}`}
                        onClick={() => handleBoardOptionSelection('paired', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Старшинство карт */}
                <div className="flop-subsection">
                  <label className="subsection-label">Старшинство карт</label>
                  
                  {/* Высокая карта */}
                  <div className="card-rank-group">
                    <span className="rank-label">Высокая карта</span>
                    <div className="button-group button-group-tight">
                      {['any', ...cards].map(card => (
                        <button
                          key={`high-${card}`}
                          className={`rank-btn ${boardSettings.flop.highCard.includes(card) ? 'active' : ''}`}
                          onMouseDown={() => handleCardRankMouseDown('highCard', card)}
                          onMouseEnter={() => handleCardRankMouseEnter('highCard', card)}
                          onMouseUp={handleMouseUp}
                        >
                          {card === 'any' ? 'Любой' : card}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Средняя карта */}
                  <div className="card-rank-group">
                    <span className="rank-label">Средняя карта</span>
                    <div className="button-group button-group-tight">
                      {['any', ...cards].map(card => (
                        <button
                          key={`middle-${card}`}
                          className={`rank-btn ${boardSettings.flop.middleCard.includes(card) ? 'active' : ''}`}
                          onMouseDown={() => handleCardRankMouseDown('middleCard', card)}
                          onMouseEnter={() => handleCardRankMouseEnter('middleCard', card)}
                          onMouseUp={handleMouseUp}
                        >
                          {card === 'any' ? 'Любой' : card}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Нижняя карта */}
                  <div className="card-rank-group">
                    <span className="rank-label">Нижняя карта</span>
                    <div className="button-group button-group-tight">
                      {['any', ...cards].map(card => (
                        <button
                          key={`low-${card}`}
                          className={`rank-btn ${boardSettings.flop.lowCard.includes(card) ? 'active' : ''}`}
                          onMouseDown={() => handleCardRankMouseDown('lowCard', card)}
                          onMouseEnter={() => handleCardRankMouseEnter('lowCard', card)}
                          onMouseUp={handleMouseUp}
                        >
                          {card === 'any' ? 'Любой' : card}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Заглушки для Тёрна и Ривера */}
            {boardSettings.activeStreet === 'turn' && (
              <div className="coming-soon">
                <p>🚧 Настройки тёрна в разработке</p>
              </div>
            )}

            {boardSettings.activeStreet === 'river' && (
              <div className="coming-soon">
                <p>🚧 Настройки ривера в разработке</p>
              </div>
            )}
          </div>

          {/* Матрицы рук */}
          <div className="control-section">
            <label className="control-label">🂡 Матрицы рук</label>
            <div className="matrices-container">
              {/* IP Матрица */}
              <div className="matrix-group">
                <div className="matrix-header">
                  <span className="matrix-title">IP (In Position)</span>
                  <div className="matrix-controls">
                    <select 
                      className="modern-select matrix-player-select"
                      value={matrixSettings.ip.selectedPlayer}
                      onChange={(e) => handleMatrixPlayerChange('ip', e.target.value)}
                    >
                      <option value="">Выберите игрока</option>
                      {getPlayerNamesFromSpot(selectedSpot).map(playerName => (
                        <option key={`ip-${playerName}`} value={playerName}>
                          {playerName}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="paste-btn" 
                      title="Вставить из буфера обмена"
                      onClick={() => handlePasteFromClipboard('ip')}
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="matrix-content">
                  <div className="percentage-slider-horizontal">
                    <span className="slider-label">Процент для ручного выбора:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={matrixSettings.ip.percentage}
                      onChange={(e) => handleMatrixPercentageChange('ip', parseInt(e.target.value))}
                      className="slider horizontal-slider"
                    />
                    <span className="slider-value">{matrixSettings.ip.percentage}%</span>
                  </div>
                  <div className="hand-matrix">
                    {renderHandMatrix('ip')}
                  </div>
                </div>
              </div>

              {/* OOP Матрица */}
              <div className="matrix-group">
                <div className="matrix-header">
                  <span className="matrix-title">OOP (Out of Position)</span>
                  <div className="matrix-controls">
                    <select 
                      className="modern-select matrix-player-select"
                      value={matrixSettings.oop.selectedPlayer}
                      onChange={(e) => handleMatrixPlayerChange('oop', e.target.value)}
                    >
                      <option value="">Выберите игрока</option>
                      {getPlayerNamesFromSpot(selectedSpot).map(playerName => (
                        <option key={`oop-${playerName}`} value={playerName}>
                          {playerName}
                        </option>
                      ))}
                    </select>
                    <button 
                      className="paste-btn" 
                      title="Вставить из буфера обмена"
                      onClick={() => handlePasteFromClipboard('oop')}
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="matrix-content">
                  <div className="percentage-slider-horizontal">
                    <span className="slider-label">Процент для ручного выбора:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="25"
                      value={matrixSettings.oop.percentage}
                      onChange={(e) => handleMatrixPercentageChange('oop', parseInt(e.target.value))}
                      className="slider horizontal-slider"
                    />
                    <span className="slider-value">{matrixSettings.oop.percentage}%</span>
                  </div>
                  <div className="hand-matrix">
                    {renderHandMatrix('oop')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className={`main-content ${isPanelOpen ? 'panel-open' : ''}`}>
        {isGameStarted ? (
          <div className="game-mode">
            <button 
              className="back-to-settings-btn"
              onClick={() => setIsGameStarted(false)}
              title="Вернуться к настройкам"
            >
              ⚙️ Настройки
            </button>
            {gameSession ? (
              <div className={`tables-container tables-${gameSession.tables.length}`}>
                {gameSession.tables.map((table: any, index: number) => (
                  <div key={table.sessionId || table.id} className="table-wrapper">
                    <div className="table-header">
                      <h3>Стол {table.tableNumber || index + 1}</h3>
                      {table.sessionId && (
                        <div className="session-info">
                          Сессия: {table.sessionId.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                    <ModernPokerTable
                      table={table}
                      sessionId={table.sessionId || gameSession.sessionId}
                      playerNames={gameSession.playerNames}
                      currentPlayer={gameSession.currentPlayer}
                      onHandComplete={(handHistory: string) => {
                        setHandHistories(prev => [...prev, handHistory]);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="session-creation">
                <h2>Покерный симулятор</h2>
                <button 
                  onClick={createSingleSession}
                  className="btn-primary"
                >
                  Создать новую игру
                </button>
                
                <div className="join-session">
                  <h3>Присоединиться к игре</h3>
                  <button 
                    onClick={joinSessionFromClipboard}
                    className="btn-secondary"
                  >
                    Подключиться по ID из буфера обмена
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="content-wrapper">
            <h1>Тестовое окно</h1>
            <p>Современная панель управления покерными настройками</p>
            
            {/* Отображение текущих настроек */}
            <div className="settings-preview">
              <div className="preview-card">
                <h3>🎯 Текущие настройки</h3>
                <div className="settings-grid">
                  <div className="setting-item">
                    <span className="setting-label">Префлоп спот:</span>
                    <span className="setting-value">
                      {getSelectedSpotData()?.name || 'Не выбран'}
                    </span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Позиция:</span>
                    <span className="setting-value">{selectedPosition.toUpperCase()}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Столов:</span>
                    <span className="setting-value">{tableCount}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Рейк:</span>
                    <span className="setting-value">{rakeSettings.percentage}% / €{rakeSettings.cap}</span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Борд:</span>
                    <span className="setting-value">
                      {boardSettings.activeStreet === 'flop' ? 'Флоп' : 
                       boardSettings.activeStreet === 'turn' ? 'Тёрн' : 'Ривер'}
                    </span>
                  </div>
                  <div className="setting-item">
                    <span className="setting-label">Hand Histories:</span>
                    <span className="setting-value">{handHistories.length} рук</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h3>Современный дизайн</h3>
                <p>Минималистичный интерфейс с glass morphism эффектами</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚙️</div>
                <h3>Гибкие настройки</h3>
                <p>Полный контроль над префлоп спотами и настройками борда</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🚀</div>
                <h3>Быстрая настройка</h3>
                <p>Интуитивно понятные элементы управления</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Оверлей для закрытия панели на мобильных */}
      {isPanelOpen && (
        <div 
          className="panel-overlay"
          onClick={togglePanel}
          aria-hidden="true"
        />
      )}

      {/* Модальное окно выбора карт */}
      {isCardModalOpen && (
        <div className="modal-overlay" onClick={closeCardModal}>
          <div className="card-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {selectedCardIndex !== null 
                  ? `Выберите карту ${selectedCardIndex + 1}`
                  : 'Выберите карты флопа'
                }
              </h3>
              <div className="modal-actions">
                <button className="random-flop-btn" onClick={selectRandomFlop}>
                  🎲 Случайный флоп
                </button>
                <button className="done-btn" onClick={closeCardModal}>
                  ✅ Готово
                </button>
                <button className="close-modal-btn" onClick={closeCardModal}>✕</button>
              </div>
            </div>
            <div className="cards-grid-suits">
              {suits.map(suit => (
                <div key={suit.name} className="suit-row">
                  <div className="cards-row">
                    {RANKS_ORDER.map(rank => {
                      const spriteSuit = suit.name as Suit;
                      const isSelected = isCardSelected(spriteSuit, rank);
                      const cardString = convertSpriteToCard(spriteSuit, rank);
                      const isAlreadyUsed = boardSettings.flop.specificCards.includes(cardString);
                      
                      return (
                        <div
                          key={`${rank}${suit.symbol}`}
                          className={`card-option-container ${isSelected ? 'selected' : ''} ${isAlreadyUsed ? 'used' : ''}`}
                          onClick={() => {
                            if (selectedCardIndex !== null) {
                              selectCard(cardString);
                            } else {
                              selectCardForAnyPosition(cardString);
                            }
                          }}
                        >
                          <Card
                            suit={spriteSuit}
                            rank={rank}
                            width={60}
                            height={84}
                            animated={false}
                            selected={isSelected}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestWindow; 