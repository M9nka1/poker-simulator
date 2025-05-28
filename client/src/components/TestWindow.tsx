import React, { useState } from 'react';
import './TestWindow.css';

const TestWindow: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
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
          <div className="grid-container">
            {renderGrid()}
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className={`main-content ${isPanelOpen ? 'panel-open' : ''}`}>
        <div className="content-wrapper">
          <h1>Тестовое окно</h1>
          <p>Современный минималистичный дизайн</p>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Дизайн</h3>
              <p>Современный темный интерфейс</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Адаптивность</h3>
              <p>Отзывчивый дизайн для всех устройств</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Производительность</h3>
              <p>Быстрая и плавная анимация</p>
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