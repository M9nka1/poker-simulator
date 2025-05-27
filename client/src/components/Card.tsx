import React from 'react';
import { getCardStyles, parseCard, Suit, Rank } from '../utils/cardSprites';
import './Card.css';

interface CardProps {
  // Можно передать либо suit+rank, либо cardString (например "As", "Kh")
  suit?: Suit;
  rank?: Rank;
  cardString?: string;
  
  // Размеры карты
  width?: number;
  height?: number;
  
  // Дополнительные стили
  className?: string;
  style?: React.CSSProperties;
  
  // Скрыта ли карта (показать рубашку)
  hidden?: boolean;
  
  // Обработчики событий
  onClick?: () => void;
  onHover?: () => void;
  
  // Анимации
  animated?: boolean;
  selected?: boolean;
}

const Card: React.FC<CardProps> = ({
  suit,
  rank,
  cardString,
  width = 80,
  height = 112,
  className = '',
  style = {},
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
    throw new Error('Card component requires either suit+rank or cardString');
  }
  
  // Получаем стили для отображения карты из sprite sheet
  const cardStyles = hidden ? {} : getCardStyles(cardSuit, cardRank, width, height);
  
  // Собираем финальные стили
  const finalStyles: React.CSSProperties = {
    ...cardStyles,
    ...style,
    cursor: onClick ? 'pointer' : 'default',
    transition: animated ? 'all 0.3s ease' : 'none',
    transform: selected ? 'translateY(-10px)' : 'none',
    filter: selected ? 'brightness(1.2)' : 'none'
  };
  
  // Классы CSS
  const cssClasses = [
    'poker-card',
    hidden ? 'card-hidden' : 'card-visible',
    animated ? 'card-animated' : '',
    selected ? 'card-selected' : '',
    onClick ? 'card-clickable' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={cssClasses}
      style={finalStyles}
      onClick={onClick}
      onMouseEnter={onHover}
      title={hidden ? 'Hidden card' : `${cardRank} of ${cardSuit}`}
    >
      {hidden && (
        <div className="card-back" style={{ width, height }}>
          {/* Можно добавить рубашку карты */}
          <div className="card-back-pattern"></div>
        </div>
      )}
    </div>
  );
};

export default Card; 