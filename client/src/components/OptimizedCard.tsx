import React from 'react';
import { getOptimizedCardStyles, CARD_POSITIONING, parseCard, Suit, Rank } from '../utils/cardSprites';

interface OptimizedCardProps {
  // Можно передать либо suit+rank, либо cardString (например "As", "Kh")
  suit?: Suit;
  rank?: Rank;
  cardString?: string;
  
  // Размеры контейнера (бокса)
  containerWidth?: number;
  containerHeight?: number;
  
  // Дополнительные стили для контейнера
  containerStyle?: React.CSSProperties;
  className?: string;
  
  // Скрыта ли карта (показать рубашку)
  hidden?: boolean;
  
  // Обработчики событий
  onClick?: () => void;
  onHover?: () => void;
  
  // Анимации
  animated?: boolean;
  selected?: boolean;
}

const OptimizedCard: React.FC<OptimizedCardProps> = ({
  suit,
  rank,
  cardString,
  containerWidth,
  containerHeight,
  containerStyle = {},
  className = '',
  hidden = false,
  onClick,
  onHover,
  animated = false,
  selected = false
}) => {
  // Определяем масть и ранг карты
  let cardSuit: Suit;
  let cardRank: Rank;
  
  if (cardString) {
    const parsed = parseCard(cardString);
    cardSuit = parsed.suit;
    cardRank = parsed.rank;
  } else if (suit && rank) {
    cardSuit = suit;
    cardRank = rank;
  } else {
    throw new Error('OptimizedCard component requires either suit+rank or cardString');
  }
  
  // Размеры контейнера
  const boxWidth = containerWidth || CARD_POSITIONING.boxSize.width;
  const boxHeight = containerHeight || CARD_POSITIONING.boxSize.height;
  
  // Получаем стили для отображения карты
  const cardStyles = hidden ? {} : getOptimizedCardStyles(cardSuit, cardRank, boxWidth, boxHeight);
  
  // Стили контейнера
  const finalContainerStyles: React.CSSProperties = {
    position: 'relative',
    width: `${boxWidth}px`,
    height: `${boxHeight}px`,
    cursor: onClick ? 'pointer' : 'default',
    transition: animated ? 'all 0.3s ease' : 'none',
    transform: selected ? 'translateY(-10px)' : 'none',
    filter: selected ? 'brightness(1.2)' : 'none',
    overflow: 'hidden',
    borderRadius: '8px',
    ...containerStyle
  };
  
  // Классы CSS
  const cssClasses = [
    'optimized-card-container',
    hidden ? 'card-hidden' : 'card-visible',
    animated ? 'card-animated' : '',
    selected ? 'card-selected' : '',
    onClick ? 'card-clickable' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={cssClasses}
      style={finalContainerStyles}
      onClick={onClick}
      onMouseEnter={onHover}
      title={hidden ? 'Hidden card' : `${cardRank} of ${cardSuit}`}
    >
      {hidden ? (
        // Рубашка карты
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${CARD_POSITIONING.cardSize.width}px`,
            height: `${CARD_POSITIONING.cardSize.height}px`,
            background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            border: '2px solid #34495e',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 10
          }}
        >
          <div style={{
            color: '#7f8c8d',
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            🂠
          </div>
        </div>
      ) : (
        // Карта из sprite sheet
        <div style={cardStyles} />
      )}
    </div>
  );
};

export default OptimizedCard; 