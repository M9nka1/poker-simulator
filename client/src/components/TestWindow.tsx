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

  const handleFlopSettingChange = (field: string, value: any) => {
    setBoardSettings(prev => ({
      ...prev,
      flop: { ...prev.flop, [field]: value }
    }));
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

  const handleSpecificCardChange = (index: number, value: string) => {
    const newCards = [...boardSettings.flop.specificCards];
    newCards[index] = value;
    handleFlopSettingChange('specificCards', newCards);
  };

  const openCardModal = (index: number) => {
    setSelectedCardIndex(index);
    setIsCardModalOpen(true);
  };

  const closeCardModal = () => {
    setIsCardModalOpen(false);
    setSelectedCardIndex(null);
  };

  const selectCard = (card: string) => {
    if (selectedCardIndex !== null) {
      handleSpecificCardChange(selectedCardIndex, card);
      
      // Автоматически переходим к следующей карте если это не последняя
      if (selectedCardIndex < 2) {
        setSelectedCardIndex(selectedCardIndex + 1);
      } else {
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
    return boardSettings.flop.specificCards.includes(cardString);
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

  // Создаем сетку 75 строк и 25 колонок
  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row < 75; row++) {
      for (let col = 0; col < 25; col++) {
        cells.push(
          <div 
            key={`${row}-${col}`} 
            className="grid-cell"
            data-row={row + 1}
            data-col={col + 1}
          />
        );
      }
    }
    return cells;
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
          <h2>Панель управления</h2>
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

          {/* Старая сетка для демонстрации */}
          <div className="control-section">
            <label className="control-label">📊 Демо сетка</label>
            <div className="grid-container">
              {renderGrid()}
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className={`main-content ${isPanelOpen ? 'panel-open' : ''}`}>
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
              <h3>Выберите карту {selectedCardIndex !== null ? selectedCardIndex + 1 : ''}</h3>
              <div className="modal-actions">
                <button className="random-flop-btn" onClick={selectRandomFlop}>
                  🎲 Случайный флоп
                </button>
                <button className="close-modal-btn" onClick={closeCardModal}>✕</button>
              </div>
            </div>
            <div className="cards-grid-suits">
              {suits.map(suit => (
                <div key={suit.name} className="suit-row">
                  <div className="suit-label" style={{ color: suit.color }}>
                    <span className="suit-symbol">{suit.symbol}</span>
                    <span className="suit-name">
                      {suit.name === 'hearts' ? 'Червы' : 
                       suit.name === 'diamonds' ? 'Бубны' :
                       suit.name === 'clubs' ? 'Трефы' : 'Пики'}
                    </span>
                  </div>
                  <div className="cards-row">
                    {RANKS_ORDER.map(rank => {
                      const spriteSuit = suit.name as Suit;
                      const isSelected = isCardSelected(spriteSuit, rank);
                      const cardString = convertSpriteToCard(spriteSuit, rank);
                      
                      return (
                        <div
                          key={`${rank}${suit.symbol}`}
                          className={`card-option-container ${isSelected ? 'selected' : ''}`}
                          onClick={() => selectCard(cardString)}
                        >
                          <Card
                            suit={spriteSuit}
                            rank={rank}
                            width={60}
                            height={84}
                            animated={true}
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