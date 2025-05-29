import React, { useState } from 'react';
import './TestWindow.css';
import preflopSpots from '../data/preflop-spots/spots.json';
import Card from './Card';
import { SUITS_ORDER, RANKS_ORDER, Suit, Rank } from '../utils/cardSprites';

interface PreflopSpot {
  id: string;
  name: string;
  description: string;
  potSize: number;
  blinds: { small: number; big: number };
  actions: Array<{ player: string; action: string; amount: number }>;
}

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

  const getSelectedSpotData = (): PreflopSpot | null => {
    return preflopSpots.find(spot => spot.id === selectedSpot) || null;
  };

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

  const startGameSimulation = () => {
    setIsGameStarted(true);
    setIsPanelOpen(false);
  };

  // Генерация случайной руки из матрицы
  const generateRandomHandFromMatrix = (position: 'ip' | 'oop'): string[] => {
    const matrix = matrixSettings[position].matrix;
    const hands = Object.keys(matrix).filter(hand => matrix[hand] > 0);
    
    if (hands.length === 0) {
      // Если матрица пуста, возвращаем случайную руку
      const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
      const suits = ['♠', '♥', '♦', '♣'];
      
      const randomRank1 = ranks[Math.floor(Math.random() * ranks.length)];
      const randomRank2 = ranks[Math.floor(Math.random() * ranks.length)];
      const randomSuit1 = suits[Math.floor(Math.random() * suits.length)];
      const randomSuit2 = suits[Math.floor(Math.random() * suits.length)];
      
      return [`${randomRank1}${randomSuit1}`, `${randomRank2}${randomSuit2}`];
    }
    
    // Выбираем случайную руку из матрицы с учетом вероятности
    const totalWeight = hands.reduce((sum, hand) => sum + matrix[hand], 0);
    let random = Math.random() * totalWeight;
    
    for (const hand of hands) {
      random -= matrix[hand];
      if (random <= 0) {
        return convertHandNotationToCards(hand);
      }
    }
    
    return convertHandNotationToCards(hands[0]);
  };

  // Конвертация нотации руки в карты
  const convertHandNotationToCards = (handNotation: string): string[] => {
    const suits = ['♠', '♥', '♦', '♣'];
    
    if (handNotation.length === 2) {
      // Пара (например, AA)
      const rank = handNotation[0];
      const suit1 = suits[Math.floor(Math.random() * suits.length)];
      let suit2 = suits[Math.floor(Math.random() * suits.length)];
      while (suit2 === suit1) {
        suit2 = suits[Math.floor(Math.random() * suits.length)];
      }
      return [`${rank}${suit1}`, `${rank}${suit2}`];
    } else {
      // Непарная рука (например, AKs, AKo)
      const rank1 = handNotation[0];
      const rank2 = handNotation[1];
      const suitType = handNotation[2]; // 's' или 'o'
      
      if (suitType === 's') {
        // Suited
        const suit = suits[Math.floor(Math.random() * suits.length)];
        return [`${rank1}${suit}`, `${rank2}${suit}`];
      } else {
        // Offsuit
        const suit1 = suits[Math.floor(Math.random() * suits.length)];
        let suit2 = suits[Math.floor(Math.random() * suits.length)];
        while (suit2 === suit1) {
          suit2 = suits[Math.floor(Math.random() * suits.length)];
        }
        return [`${rank1}${suit1}`, `${rank2}${suit2}`];
      }
    }
  };

  // Генерация флопа по настройкам
  const generateFlopFromSettings = (): string[] => {
    if (boardSettings.flop.specificCards.every(card => card !== '')) {
      // Используем конкретный флоп
      return boardSettings.flop.specificCards;
    }
    
    // Генерируем случайный флоп по параметрам
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    // Простая генерация (можно расширить логику для учета всех параметров)
    const flop = [];
    const usedCards = new Set();
    
    for (let i = 0; i < 3; i++) {
      let card;
      do {
        const rank = ranks[Math.floor(Math.random() * ranks.length)];
        const suit = suits[Math.floor(Math.random() * suits.length)];
        card = `${rank}${suit}`;
      } while (usedCards.has(card));
      
      usedCards.add(card);
      flop.push(card);
    }
    
    return flop;
  };

  // Компонент покерного стола
  const PokerTable = ({ tableIndex }: { tableIndex: number }) => {
    const playerHand = generateRandomHandFromMatrix(selectedPosition);
    const opponentHand = generateRandomHandFromMatrix(selectedPosition === 'ip' ? 'oop' : 'ip');
    const flop = generateFlopFromSettings();
    
    return (
      <div className="poker-table">
        <div className="table-surface">
          <div className="table-number">Стол {tableIndex + 1}</div>
          
          {/* Флоп */}
          <div className="community-cards">
            {flop.map((card, index) => (
              <div key={index} className="community-card">
                {card}
              </div>
            ))}
          </div>
          
          {/* Игрок */}
          <div className="player-position player">
            <div className="player-label">Вы ({selectedPosition.toUpperCase()})</div>
            <div className="player-cards">
              {playerHand.map((card, index) => (
                <div key={index} className="player-card">
                  {card}
                </div>
              ))}
            </div>
          </div>
          
          {/* Оппонент */}
          <div className="player-position opponent">
            <div className="player-label">Оппонент ({selectedPosition === 'ip' ? 'OOP' : 'IP'})</div>
            <div className="player-cards">
              {opponentHand.map((card, index) => (
                <div key={index} className="player-card">
                  {card}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
            <div className="position-selector">
              <span className="position-label">За кого играть:</span>
              <div className="position-buttons">
                <button 
                  className={`position-btn ${selectedPosition === 'ip' ? 'active' : ''}`}
                  onClick={() => setSelectedPosition('ip')}
                >
                  IP
                </button>
                <button 
                  className={`position-btn ${selectedPosition === 'oop' ? 'active' : ''}`}
                  onClick={() => setSelectedPosition('oop')}
                >
                  OOP
                </button>
              </div>
            </div>
            <button 
              className="start-btn"
              onClick={startGameSimulation}
              title="Начать симуляцию"
            >
              ▶
            </button>
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
            >
              <option value="">Выберите спот...</option>
              {preflopSpots.map((spot: PreflopSpot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.name}
                </option>
              ))}
            </select>
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
                  <label className="subsection-label">Конкретный флоп</label>
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
                      <option value="tight">Tight Player</option>
                      <option value="loose">Loose Player</option>
                      <option value="aggressive">Aggressive Player</option>
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
                      <option value="tight">Tight Player</option>
                      <option value="loose">Loose Player</option>
                      <option value="aggressive">Aggressive Player</option>
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
            <div className={`tables-container tables-${tableCount}`}>
              {Array.from({ length: tableCount }, (_, index) => (
                <PokerTable key={index} tableIndex={index} />
              ))}
            </div>
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