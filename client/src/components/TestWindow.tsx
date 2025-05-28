import React, { useState } from 'react';
import './TestWindow.css';
import preflopSpots from '../data/preflop-spots/spots.json';

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
    suits: 'flush-draw' | 'rainbow' | 'monotone' | 'any';
    paired: 'unpaired' | 'paired' | 'trips' | 'any';
    highCard: string;
    middleCard: string;
    lowCard: string;
  };
}

const TestWindow: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<string>('');
  const [tableCount, setTableCount] = useState<number>(1);
  const [rakeSettings, setRakeSettings] = useState<RakeSettings>({
    percentage: 2.5,
    cap: 5
  });
  const [boardSettings, setBoardSettings] = useState<BoardSettings>({
    activeStreet: 'flop',
    flop: {
      specific: false,
      specificCards: ['', '', ''],
      suits: 'any',
      paired: 'any',
      highCard: 'any',
      middleCard: 'any',
      lowCard: 'any'
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

  const handleSpecificCardChange = (index: number, value: string) => {
    const newCards = [...boardSettings.flop.specificCards];
    newCards[index] = value;
    handleFlopSettingChange('specificCards', newCards);
  };

  const cards = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = ['♠', '♥', '♦', '♣'];

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
            <label className="control-label">🎯 Префлоп спот</label>
            <select 
              className="modern-select"
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

          {/* Количество столов */}
          <div className="control-section">
            <label className="control-label">🎲 Количество столов</label>
            <div className="table-count-controls">
              {[1, 2, 3, 4, 5, 6].map(count => (
                <button
                  key={count}
                  className={`count-btn ${tableCount === count ? 'active' : ''}`}
                  onClick={() => setTableCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Настройки рейка */}
          <div className="control-section">
            <label className="control-label">💰 Настройки рейка</label>
            <div className="rake-controls">
              <div className="rake-input-group">
                <label className="input-label">%</label>
                <input
                  type="number"
                  className="modern-input"
                  min="0"
                  max="10"
                  step="0.1"
                  value={rakeSettings.percentage}
                  onChange={(e) => handleRakeChange('percentage', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="rake-input-group">
                <label className="input-label">Кэп</label>
                <input
                  type="number"
                  className="modern-input"
                  min="0"
                  max="50"
                  step="0.5"
                  value={rakeSettings.cap}
                  onChange={(e) => handleRakeChange('cap', parseFloat(e.target.value) || 0)}
                />
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
                      onChange={(e) => handleFlopSettingChange('specific', e.target.checked)}
                    />
                    <label htmlFor="specific-flop">Конкретный флоп</label>
                  </div>
                  {boardSettings.flop.specific && (
                    <div className="specific-cards">
                      {[0, 1, 2].map(index => (
                        <select
                          key={index}
                          className="card-select"
                          value={boardSettings.flop.specificCards[index]}
                          onChange={(e) => handleSpecificCardChange(index, e.target.value)}
                        >
                          <option value="">Карта {index + 1}</option>
                          {cards.map(card => 
                            suits.map(suit => (
                              <option key={`${card}${suit}`} value={`${card}${suit}`}>
                                {card}{suit}
                              </option>
                            ))
                          )}
                        </select>
                      ))}
                    </div>
                  )}
                </div>

                {/* Масти */}
                <div className="flop-subsection">
                  <label className="subsection-label">Масти</label>
                  <div className="button-group">
                    {[
                      { value: 'flush-draw', label: 'Флеш-дро' },
                      { value: 'rainbow', label: 'Радуга' },
                      { value: 'monotone', label: 'Монотонный' },
                      { value: 'any', label: 'Любой' }
                    ].map(option => (
                      <button
                        key={option.value}
                        className={`option-btn ${boardSettings.flop.suits === option.value ? 'active' : ''}`}
                        onClick={() => handleFlopSettingChange('suits', option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Спаренность */}
                <div className="flop-subsection">
                  <label className="subsection-label">Спаренность</label>
                  <div className="button-group">
                    {[
                      { value: 'unpaired', label: 'Не спаренный' },
                      { value: 'paired', label: 'Спаренный' },
                      { value: 'trips', label: 'Трипл' },
                      { value: 'any', label: 'Любой' }
                    ].map(option => (
                      <button
                        key={option.value}
                        className={`option-btn ${boardSettings.flop.paired === option.value ? 'active' : ''}`}
                        onClick={() => handleFlopSettingChange('paired', option.value)}
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
                    <div className="button-group">
                      {['any', ...cards].map(card => (
                        <button
                          key={`high-${card}`}
                          className={`rank-btn ${boardSettings.flop.highCard === card ? 'active' : ''}`}
                          onClick={() => handleFlopSettingChange('highCard', card)}
                        >
                          {card === 'any' ? 'Любой' : card}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Средняя карта */}
                  <div className="card-rank-group">
                    <span className="rank-label">Средняя карта</span>
                    <div className="button-group">
                      {['any', ...cards].map(card => (
                        <button
                          key={`middle-${card}`}
                          className={`rank-btn ${boardSettings.flop.middleCard === card ? 'active' : ''}`}
                          onClick={() => handleFlopSettingChange('middleCard', card)}
                        >
                          {card === 'any' ? 'Любой' : card}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Нижняя карта */}
                  <div className="card-rank-group">
                    <span className="rank-label">Нижняя карта</span>
                    <div className="button-group">
                      {['any', ...cards].map(card => (
                        <button
                          key={`low-${card}`}
                          className={`rank-btn ${boardSettings.flop.lowCard === card ? 'active' : ''}`}
                          onClick={() => handleFlopSettingChange('lowCard', card)}
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
    </div>
  );
};

export default TestWindow; 