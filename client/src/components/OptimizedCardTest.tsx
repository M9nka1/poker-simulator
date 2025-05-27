import React, { useState } from 'react';
import OptimizedCard from './OptimizedCard';
import { SUITS_ORDER, RANKS_ORDER, CARD_POSITIONING } from '../utils/cardSprites';

const OptimizedCardTest: React.FC = () => {
  const [selectedSuit, setSelectedSuit] = useState<'hearts' | 'spades' | 'diamonds' | 'clubs'>('hearts');
  const [selectedRank, setSelectedRank] = useState<'2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'>('A');
  const [showHidden, setShowHidden] = useState(false);
  const [animated, setAnimated] = useState(true);
  const [selected, setSelected] = useState(false);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a1a2e', 
      minHeight: '100vh', 
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#16537e', marginBottom: '30px' }}>
        🎴 Тест оптимизированных карт
      </h1>

      <div style={{ display: 'flex', gap: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Панель управления */}
        <div style={{ 
          width: '300px', 
          backgroundColor: '#2a2a3e', 
          borderRadius: '12px', 
          padding: '20px',
          height: 'fit-content'
        }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '20px' }}>⚙️ Настройки</h3>
          
          {/* Выбор карты */}
          <div style={{ marginBottom: '20px' }}>
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

          {/* Настройки отображения */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#2196F3', marginBottom: '10px' }}>🎛️ Отображение</h4>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              Показать рубашку
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={animated}
                onChange={(e) => setAnimated(e.target.checked)}
              />
              Анимации
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => setSelected(e.target.checked)}
              />
              Выделена
            </label>
          </div>

          {/* Информация о настройках */}
          <div style={{
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#2196F3', marginBottom: '10px' }}>📊 Настройки позиционирования</h4>
            
            <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              <div><strong>Бокс:</strong> {CARD_POSITIONING.boxSize.width}×{CARD_POSITIONING.boxSize.height}px</div>
              <div><strong>Карта:</strong> {CARD_POSITIONING.cardSize.width}×{CARD_POSITIONING.cardSize.height}px</div>
              <div><strong>Смещение:</strong> X:{CARD_POSITIONING.offset.x}px, Y:{CARD_POSITIONING.offset.y}px</div>
              <div><strong>Масштаб:</strong> {(CARD_POSITIONING.scale * 100).toFixed(0)}%</div>
            </div>
          </div>

          <button
            onClick={() => window.location.hash = ''}
            style={{
              width: '100%',
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

        {/* Область тестирования */}
        <div style={{ flex: 1 }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '20px' }}>🧪 Тестирование карт</h3>
          
          {/* Одиночная карта */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ color: '#FFA726', marginBottom: '15px' }}>Одиночная карта</h4>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '200px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '2px dashed rgba(255, 255, 255, 0.2)'
            }}>
              <OptimizedCard
                suit={selectedSuit}
                rank={selectedRank}
                hidden={showHidden}
                animated={animated}
                selected={selected}
                onClick={() => console.log('Card clicked!')}
              />
            </div>
          </div>

          {/* Ряд карт */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ color: '#FFA726', marginBottom: '15px' }}>Ряд карт (флоп)</h4>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '20px',
              minHeight: '150px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              padding: '20px'
            }}>
              <OptimizedCard suit="hearts" rank="A" animated={animated} />
              <OptimizedCard suit="spades" rank="K" animated={animated} />
              <OptimizedCard suit="diamonds" rank="Q" animated={animated} />
            </div>
          </div>

          {/* Разные размеры */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ color: '#FFA726', marginBottom: '15px' }}>Разные размеры контейнеров</h4>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '20px',
              minHeight: '150px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              padding: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <OptimizedCard 
                  suit="hearts" 
                  rank="A" 
                  containerWidth={60} 
                  containerHeight={76}
                  animated={animated} 
                />
                <div style={{ fontSize: '12px', color: '#bbb', marginTop: '5px' }}>60×76</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <OptimizedCard 
                  suit="spades" 
                  rank="K" 
                  animated={animated} 
                />
                <div style={{ fontSize: '12px', color: '#bbb', marginTop: '5px' }}>80×101 (стандарт)</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <OptimizedCard 
                  suit="diamonds" 
                  rank="Q" 
                  containerWidth={100} 
                  containerHeight={126}
                  animated={animated} 
                />
                <div style={{ fontSize: '12px', color: '#bbb', marginTop: '5px' }}>100×126</div>
              </div>
            </div>
          </div>

          {/* Все масти */}
          <div>
            <h4 style={{ color: '#FFA726', marginBottom: '15px' }}>Все масти</h4>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '15px',
              minHeight: '150px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              padding: '20px',
              flexWrap: 'wrap'
            }}>
              {SUITS_ORDER.map(suit => (
                <div key={suit} style={{ textAlign: 'center' }}>
                  <OptimizedCard 
                    suit={suit as any} 
                    rank={selectedRank} 
                    animated={animated}
                  />
                  <div style={{ fontSize: '12px', color: '#bbb', marginTop: '5px' }}>
                    {suit === 'hearts' ? '♥' : suit === 'spades' ? '♠' : suit === 'diamonds' ? '♦' : '♣'}
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

export default OptimizedCardTest; 