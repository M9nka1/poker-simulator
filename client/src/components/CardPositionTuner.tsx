import React, { useState } from 'react';
import { getCardStyles, RANKS_ORDER } from '../utils/cardSprites';

const CardPositionTuner: React.FC = () => {
  // Настройки карты
  const [selectedSuit, setSelectedSuit] = useState<'hearts' | 'spades' | 'diamonds' | 'clubs'>('hearts');
  const [selectedRank, setSelectedRank] = useState<'2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'>('A');
  
  // Настройки бокса
  const [boxWidth, setBoxWidth] = useState(80);
  const [boxHeight, setBoxHeight] = useState(112);
  
  // Настройки карты
  const [cardWidth, setCardWidth] = useState(80);
  const [cardHeight, setCardHeight] = useState(112);
  
  // Позиционирование карты внутри бокса
  const [cardOffsetX, setCardOffsetX] = useState(0);
  const [cardOffsetY, setCardOffsetY] = useState(0);
  
  // Масштабирование карты
  const [cardScale, setCardScale] = useState(1.0);
  
  // Показать сетку
  const [showGrid, setShowGrid] = useState(true);
  
  // Получаем стили карты
  const getAdjustedCardStyles = () => {
    const baseStyles = getCardStyles(selectedSuit, selectedRank, cardWidth, cardHeight);
    
    return {
      ...baseStyles,
      transform: `translate(${cardOffsetX}px, ${cardOffsetY}px) scale(${cardScale})`,
      transformOrigin: 'center center',
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      marginTop: `-${cardHeight / 2}px`,
      marginLeft: `-${cardWidth / 2}px`,
      zIndex: 10
    };
  };

  // Экспорт настроек
  const exportSettings = () => {
    const settings = {
      boxSize: { width: boxWidth, height: boxHeight },
      cardSize: { width: cardWidth, height: cardHeight },
      cardOffset: { x: cardOffsetX, y: cardOffsetY },
      cardScale,
      testCard: { suit: selectedSuit, rank: selectedRank }
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'card-position-settings.json';
    link.click();
    
    // Также выводим в консоль для копирования
    console.log('Card Position Settings:', settings);
    alert('Настройки экспортированы в файл и выведены в консоль браузера (F12)');
  };

  // Сброс настроек
  const resetSettings = () => {
    setBoxWidth(80);
    setBoxHeight(112);
    setCardWidth(80);
    setCardHeight(112);
    setCardOffsetX(0);
    setCardOffsetY(0);
    setCardScale(1.0);
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a2e', 
      minHeight: '100vh', 
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#16537e', marginBottom: '30px' }}>
        🎯 Настройка позиционирования карт
      </h1>

      <div style={{ display: 'flex', gap: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Панель управления */}
        <div style={{ 
          width: '350px', 
          backgroundColor: '#2a2a3e', 
          borderRadius: '12px', 
          padding: '20px',
          height: 'fit-content'
        }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '20px' }}>⚙️ Настройки</h3>
          
          {/* Выбор карты */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#FFA726', marginBottom: '10px' }}>🎴 Тестовая карта</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Масть:</label>
              <select
                value={selectedSuit}
                onChange={(e) => setSelectedSuit(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px'
                }}
              >
                <option value="hearts">♥ Hearts (Червы)</option>
                <option value="spades">♠ Spades (Пики)</option>
                <option value="diamonds">♦ Diamonds (Бубны)</option>
                <option value="clubs">♣ Clubs (Трефы)</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ранг:</label>
              <select
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '4px'
                }}
              >
                {RANKS_ORDER.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Размеры бокса */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#2196F3', marginBottom: '10px' }}>📦 Размеры бокса</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ширина: {boxWidth}px</label>
              <input
                type="range"
                min="40"
                max="200"
                value={boxWidth}
                onChange={(e) => setBoxWidth(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Высота: {boxHeight}px</label>
              <input
                type="range"
                min="56"
                max="280"
                value={boxHeight}
                onChange={(e) => setBoxHeight(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Размеры карты */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#9C27B0', marginBottom: '10px' }}>🎴 Размеры карты</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ширина: {cardWidth}px</label>
              <input
                type="range"
                min="20"
                max="150"
                value={cardWidth}
                onChange={(e) => setCardWidth(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Высота: {cardHeight}px</label>
              <input
                type="range"
                min="28"
                max="210"
                value={cardHeight}
                onChange={(e) => setCardHeight(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Позиционирование */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#FF5722', marginBottom: '10px' }}>📍 Позиционирование</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Смещение X: {cardOffsetX}px</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={cardOffsetX}
                onChange={(e) => setCardOffsetX(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Смещение Y: {cardOffsetY}px</label>
              <input
                type="range"
                min="-50"
                max="50"
                value={cardOffsetY}
                onChange={(e) => setCardOffsetY(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Масштаб: {cardScale.toFixed(2)}</label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={cardScale}
                onChange={(e) => setCardScale(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Дополнительные настройки */}
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{ color: '#607D8B', marginBottom: '10px' }}>🔧 Дополнительно</h4>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Показать сетку
            </label>
          </div>

          {/* Кнопки управления */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={exportSettings}
              style={{
                padding: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              💾 Экспорт настроек
            </button>
            
            <button
              onClick={resetSettings}
              style={{
                padding: '12px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔄 Сброс
            </button>
            
            <button
              onClick={() => window.location.hash = ''}
              style={{
                padding: '12px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ← Назад
            </button>
          </div>
        </div>

        {/* Область предпросмотра */}
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '20px' }}>👁️ Предпросмотр</h3>
          
          {/* Основной бокс с картой */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '400px',
            marginBottom: '30px'
          }}>
            <div
              style={{
                position: 'relative',
                width: `${boxWidth}px`,
                height: `${boxHeight}px`,
                border: '2px solid #4CAF50',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backgroundImage: showGrid ? 
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)' : 
                  'none',
                backgroundSize: showGrid ? '10px 10px' : 'auto',
                overflow: 'hidden'
              }}
            >
              {/* Центральные линии */}
              {showGrid && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '0',
                    right: '0',
                    height: '1px',
                    backgroundColor: '#FF5722',
                    zIndex: 5
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    bottom: '0',
                    left: '50%',
                    width: '1px',
                    backgroundColor: '#FF5722',
                    zIndex: 5
                  }} />
                </>
              )}
              
              {/* Карта */}
              <div style={getAdjustedCardStyles()} />
            </div>
          </div>

          {/* Информация о настройках */}
          <div style={{
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#2196F3', marginBottom: '15px' }}>📊 Текущие настройки</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong style={{ color: '#FFA726' }}>Бокс:</strong><br />
                {boxWidth} × {boxHeight} px
              </div>
              
              <div>
                <strong style={{ color: '#9C27B0' }}>Карта:</strong><br />
                {cardWidth} × {cardHeight} px
              </div>
              
              <div>
                <strong style={{ color: '#FF5722' }}>Смещение:</strong><br />
                X: {cardOffsetX}px, Y: {cardOffsetY}px
              </div>
              
              <div>
                <strong style={{ color: '#4CAF50' }}>Масштаб:</strong><br />
                {(cardScale * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Примеры разных размеров */}
          <div>
            <h4 style={{ color: '#4CAF50', marginBottom: '15px' }}>📏 Примеры разных размеров</h4>
            
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {[
                { name: 'Маленький', width: 40, height: 56 },
                { name: 'Средний', width: 60, height: 84 },
                { name: 'Большой', width: 80, height: 112 },
                { name: 'Очень большой', width: 100, height: 140 }
              ].map(size => (
                <div key={size.name} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: `${size.width}px`,
                      height: `${size.height}px`,
                      border: '1px solid #666',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      margin: '0 auto 10px',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      ...getCardStyles(selectedSuit, selectedRank, size.width, size.height),
                      transform: `translate(${cardOffsetX}px, ${cardOffsetY}px) scale(${cardScale})`,
                      transformOrigin: 'center center',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: `-${size.height / 2}px`,
                      marginLeft: `-${size.width / 2}px`
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#bbb' }}>
                    {size.name}<br />
                    {size.width}×{size.height}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPositionTuner; 