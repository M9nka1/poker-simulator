import React, { useState } from 'react';
import { SUITS_ORDER, RANKS_ORDER, getCardStyles } from '../utils/cardSprites';

const CardTestPage: React.FC = () => {
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');

  const getSizePixels = () => {
    switch (cardSize) {
      case 'small':
        return { width: 40, height: 56 };
      case 'large':
        return { width: 80, height: 112 };
      default: // medium
        return { width: 60, height: 84 };
    }
  };

  const { width, height } = getSizePixels();

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a2e', 
      minHeight: '100vh', 
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#16537e', marginBottom: '30px' }}>
        🎴 Тест извлечения карт с точными координатами
      </h1>

      {/* Панель управления */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '30px',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ marginRight: '10px' }}>Размер карт:</label>
          <select
            value={cardSize}
            onChange={(e) => setCardSize(e.target.value as 'small' | 'medium' | 'large')}
            style={{
              padding: '8px',
              backgroundColor: '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            <option value="small">Маленький (40×56)</option>
            <option value="medium">Средний (60×84)</option>
            <option value="large">Большой (80×112)</option>
          </select>
        </div>
        
        <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#2196F3', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Текущий размер: {width}×{height}px
        </div>
      </div>

      {/* Сетка всех карт */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#4CAF50' }}>
          Все карты колоды (52 карты)
        </h2>
        
        {SUITS_ORDER.map((suit, suitIndex) => (
          <div key={suit} style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              color: suit === 'hearts' || suit === 'diamonds' ? '#e74c3c' : '#2c3e50',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              {suit === 'hearts' && '♥ Hearts (Червы)'}
              {suit === 'spades' && '♠ Spades (Пики)'}
              {suit === 'diamonds' && '♦ Diamonds (Бубны)'}
              {suit === 'clubs' && '♣ Clubs (Трефы)'}
            </h3>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              padding: '15px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {RANKS_ORDER.map((rank) => {
                try {
                  const cardStyles = getCardStyles(suit, rank, width, height);
                  return (
                    <div
                      key={`${suit}-${rank}`}
                      style={{
                        ...cardStyles,
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                      title={`${rank} of ${suit}`}
                    >
                      {/* Подпись карты */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-25px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '10px',
                        color: '#bbb',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}>
                        {rank}
                      </div>
                    </div>
                  );
                } catch (error) {
                  return (
                    <div
                      key={`${suit}-${rank}-error`}
                      style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        backgroundColor: '#f44336',
                        border: '2px solid #d32f2f',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white'
                      }}
                      title={`Error: ${rank} of ${suit}`}
                    >
                      ❌
                    </div>
                  );
                }
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Информация о координатах */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        border: '1px solid rgba(33, 150, 243, 0.3)',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#2196F3', marginBottom: '15px' }}>
          📊 Информация о координатах
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <h4 style={{ color: '#FFA726', margin: '0 0 8px 0' }}>Вертикальные линии:</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              68, 427, 786, 1145, 1504, 1863, 2222, 2581, 2940, 3299, 3658, 4017, 4376, 4735
            </div>
          </div>
          
          <div>
            <h4 style={{ color: '#4CAF50', margin: '0 0 8px 0' }}>Горизонтальные линии:</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              93, 663, 1233, 1803, 2373
            </div>
          </div>
          
          <div>
            <h4 style={{ color: '#9C27B0', margin: '0 0 8px 0' }}>Размеры карт:</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              Ширина: 359px (427-68)<br/>
              Высота: 570px (663-93)<br/>
              Всего: 13×4 = 52 карты
            </div>
          </div>
          
          <div>
            <h4 style={{ color: '#FF5722', margin: '0 0 8px 0' }}>Sprite sheet:</h4>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              Размер: 4804×2458px<br/>
              Формат: PNG<br/>
              Качество: Высокое
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка возврата */}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => window.location.hash = ''}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          ← Вернуться на главную
        </button>
      </div>
    </div>
  );
};

export default CardTestPage; 