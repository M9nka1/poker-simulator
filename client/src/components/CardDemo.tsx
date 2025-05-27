import React, { useState } from 'react';
import { extractAllCards, downloadExtractedCards } from '../utils/cardExtractor';
import { SUITS_ORDER, RANKS_ORDER } from '../utils/cardSprites';
import Card from './Card';
import cardsSprite from '../assets/cards-sprite.png';

const CardDemo: React.FC = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedCards, setExtractedCards] = useState<Map<string, string> | null>(null);
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');

  const handleExtractCards = async () => {
    setIsExtracting(true);
    try {
      const cards = await extractAllCards(cardsSprite);
      setExtractedCards(cards);
      console.log('Карты извлечены:', cards);
    } catch (error) {
      console.error('Ошибка извлечения карт:', error);
      alert('Ошибка при извлечении карт');
    }
    setIsExtracting(false);
  };

  const handleDownloadCards = async () => {
    setIsExtracting(true);
    try {
      await downloadExtractedCards(cardsSprite);
      alert('Карты успешно загружены как отдельные файлы!');
    } catch (error) {
      console.error('Ошибка загрузки карт:', error);
      alert('Ошибка при загрузке карт');
    }
    setIsExtracting(false);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#16537e' }}>
        🎴 Демо карт из Sprite Sheet
      </h1>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleExtractCards}
          disabled={isExtracting}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isExtracting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isExtracting ? '⏳ Извлекаю...' : '📤 Извлечь карты'}
        </button>

        <button
          onClick={handleDownloadCards}
          disabled={isExtracting}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isExtracting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isExtracting ? '⏳ Загружаю...' : '💾 Скачать все карты'}
        </button>

        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value as any)}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#333',
            color: 'white',
            fontSize: '16px'
          }}
        >
          <option value="small">Маленькие</option>
          <option value="medium">Средние</option>
          <option value="large">Большие</option>
        </select>
      </div>

      {/* Sprite Sheet Display */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h3>Оригинальный Sprite Sheet (4804x2458)</h3>
        <div style={{ 
          display: 'inline-block',
          border: '2px solid #333',
          borderRadius: '8px',
          overflow: 'hidden',
          maxWidth: '100%'
        }}>
          <img 
            src={cardsSprite} 
            alt="Cards Sprite Sheet" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              display: 'block'
            }} 
          />
        </div>
      </div>

      {/* Sample Cards using Sprite Sheet */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Демо карт из Sprite Sheet
        </h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {/* Показываем несколько примеров карт */}
          <Card suit="hearts" rank="A" width={selectedSize === 'small' ? 40 : selectedSize === 'large' ? 80 : 60} 
                height={selectedSize === 'small' ? 56 : selectedSize === 'large' ? 112 : 84} animated />
          <Card suit="spades" rank="K" width={selectedSize === 'small' ? 40 : selectedSize === 'large' ? 80 : 60} 
                height={selectedSize === 'small' ? 56 : selectedSize === 'large' ? 112 : 84} animated />
          <Card suit="diamonds" rank="Q" width={selectedSize === 'small' ? 40 : selectedSize === 'large' ? 80 : 60} 
                height={selectedSize === 'small' ? 56 : selectedSize === 'large' ? 112 : 84} animated />
          <Card suit="clubs" rank="J" width={selectedSize === 'small' ? 40 : selectedSize === 'large' ? 80 : 60} 
                height={selectedSize === 'small' ? 56 : selectedSize === 'large' ? 112 : 84} animated />
          <Card suit="hearts" rank="10" width={selectedSize === 'small' ? 40 : selectedSize === 'large' ? 80 : 60} 
                height={selectedSize === 'small' ? 56 : selectedSize === 'large' ? 112 : 84} animated />
          <Card hidden width={selectedSize === 'small' ? 40 : selectedSize === 'large' ? 80 : 60} 
                height={selectedSize === 'small' ? 56 : selectedSize === 'large' ? 112 : 84} animated />
        </div>
      </div>

      {/* All Cards Grid */}
      <div>
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Все карты ({SUITS_ORDER.length * RANKS_ORDER.length} штук)
        </h3>
        
        {SUITS_ORDER.map(suit => (
          <div key={suit} style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              textAlign: 'center', 
              marginBottom: '15px',
              color: suit === 'hearts' || suit === 'diamonds' ? '#e74c3c' : '#ecf0f1'
            }}>
              {suit === 'hearts' ? '♥ Червы' : 
               suit === 'diamonds' ? '♦ Бубны' :
               suit === 'clubs' ? '♣ Трефы' : '♠ Пики'}
            </h4>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              {RANKS_ORDER.map(rank => (
                <Card 
                  key={`${suit}-${rank}`}
                  suit={suit} 
                  rank={rank} 
                  width={selectedSize === 'small' ? 35 : selectedSize === 'large' ? 70 : 50} 
                  height={selectedSize === 'small' ? 49 : selectedSize === 'large' ? 98 : 70}
                  animated
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Extracted Cards Info */}
      {extractedCards && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#2a2a3e', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>
            ✅ Карты успешно извлечены!
          </h3>
          <p>
            Извлечено {extractedCards.size} карт из sprite sheet.
            <br />
            Данные карт доступны в консоли браузера.
          </p>
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#bbb' }}>
            <details>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Показать список карт
              </summary>
              <div style={{ 
                maxHeight: '200px', 
                overflow: 'auto', 
                textAlign: 'left',
                backgroundColor: '#1a1a2e',
                padding: '10px',
                borderRadius: '4px'
              }}>
                {Array.from(extractedCards.keys()).map(key => (
                  <div key={key} style={{ marginBottom: '5px' }}>
                    {key}: {extractedCards.get(key)?.substring(0, 50)}...
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardDemo; 