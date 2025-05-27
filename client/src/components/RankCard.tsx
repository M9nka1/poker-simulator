import React, { useState } from 'react';
import { getCardStyles, CARD_POSITIONING } from '../utils/cardSprites';

interface Card {
  rank: string;
  suit: string;
  display: string;
  hidden?: boolean;
}

interface RankCardProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
  showSuit?: boolean;
  useImages?: boolean; // Новый параметр для выбора между изображениями и стилем
}

const RankCard: React.FC<RankCardProps> = ({ 
  card, 
  size = 'medium', 
  showSuit = true, 
  useImages = false 
}) => {
  const [imageError, setImageError] = useState(false);

  // Определяем цвет для каждого ранга как на скриншоте
  const getRankColor = (rank: string): string => {
    switch (rank) {
      case 'A': return '#e74c3c'; // Красный для туза
      case 'K': return '#e74c3c'; // Красный для короля
      case 'Q': return '#e74c3c'; // Красный для дамы
      case 'J': return '#e74c3c'; // Красный для валета
      case 'T': return '#f39c12'; // Оранжевый для десятки
      case '9': return '#f39c12'; // Оранжевый для девятки
      case '8': return '#f39c12'; // Оранжевый для восьмерки
      case '7': return '#f39c12'; // Оранжевый для семерки
      case '6': return '#3498db'; // Синий для шестерки
      case '5': return '#3498db'; // Синий для пятерки
      case '4': return '#27ae60'; // Зеленый для четверки
      case '3': return '#27ae60'; // Зеленый для тройки
      case '2': return '#27ae60'; // Зеленый для двойки
      default: return '#95a5a6'; // Серый по умолчанию
    }
  };

  // Определяем цвет масти
  const getSuitColor = (suit: string): string => {
    switch (suit) {
      case 'h': return '#e74c3c'; // Червы - красный
      case 'd': return '#e74c3c'; // Бубны - красный
      case 'c': return '#2c3e50'; // Трефы - черный
      case 's': return '#2c3e50'; // Пики - черный
      default: return '#2c3e50';
    }
  };

  // Символы мастей
  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case 'h': return '♥';
      case 'd': return '♦';
      case 'c': return '♣';
      case 's': return '♠';
      default: return suit;
    }
  };

  // Размеры в зависимости от size
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: '32px',
          height: '45px',
          fontSize: '0.8rem',
          borderRadius: '4px'
        };
      case 'large':
        return {
          width: '60px',
          height: '85px',
          fontSize: '1.4rem',
          borderRadius: '8px'
        };
      default: // medium
        return {
          width: '45px',
          height: '65px',
          fontSize: '1.1rem',
          borderRadius: '6px'
        };
    }
  };

  // Получаем стили для sprite sheet карты
  const getSpriteCardStyles = () => {
    try {
      // Конвертируем наш формат в формат sprite sheet
      const suitMap: { [key: string]: string } = {
        's': 'spades',
        'h': 'hearts',  
        'd': 'diamonds',
        'c': 'clubs'
      };
      
      const rankMap: { [key: string]: string } = {
        'T': '10'
      };
      
      const mappedRank = rankMap[card.rank] || card.rank;
      const mappedSuit = suitMap[card.suit];
      
      if (!mappedSuit) {
        throw new Error(`Unknown suit: ${card.suit}`);
      }
      
      const { width, height } = getSizePixels();
      return getCardStyles(mappedSuit as any, mappedRank as any, width, height);
    } catch (error) {
      console.warn('Error getting sprite card styles:', error);
      return null;
    }
  };

  // Получаем размеры в пикселях с учетом оптимизированных настроек
  const getSizePixels = () => {
    switch (size) {
      case 'small':
        return { 
          width: Math.round(CARD_POSITIONING.boxSize.width * 0.4), 
          height: Math.round(CARD_POSITIONING.boxSize.height * 0.4) 
        };
      case 'large':
        return { 
          width: Math.round(CARD_POSITIONING.boxSize.width * 0.75), 
          height: Math.round(CARD_POSITIONING.boxSize.height * 0.75) 
        };
      default: // medium
        return { 
          width: Math.round(CARD_POSITIONING.boxSize.width * 0.56), 
          height: Math.round(CARD_POSITIONING.boxSize.height * 0.56) 
        };
    }
  };

  // Генерируем путь к изображению карты (fallback)
  const getCardImagePath = () => {
    // Формат: /cards/AS.png, /cards/KH.png, etc.
    const suitMap: { [key: string]: string } = {
      's': 'S', // Spades
      'h': 'H', // Hearts  
      'd': 'D', // Diamonds
      'c': 'C'  // Clubs
    };
    
    const rankMap: { [key: string]: string } = {
      'T': '10'
    };
    
    const mappedRank = rankMap[card.rank] || card.rank;
    const mappedSuit = suitMap[card.suit] || card.suit.toUpperCase();
    
    return `/cards/${mappedRank}${mappedSuit}.png`;
  };

  const rankColor = getRankColor(card.rank);
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);
  const sizeStyles = getSizeStyles();

  // Если карта скрыта, показываем рубашку
  if (card.hidden) {
    return (
      <div
        className="rank-card-hidden"
        style={{
          ...sizeStyles,
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          border: '2px solid #34495e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          margin: '2px',
          transition: 'all 0.2s ease',
          cursor: 'default'
        }}
      >
        <div style={{
          color: '#7f8c8d',
          fontSize: size === 'small' ? '0.6rem' : size === 'large' ? '1rem' : '0.8rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          🂠
        </div>
      </div>
    );
  }

  // Если используем изображения - пробуем sprite sheet сначала
  if (useImages) {
    const spriteStyles = getSpriteCardStyles();
    
    // Если sprite sheet доступен, используем его
    if (spriteStyles && !imageError) {
      return (
        <div
          className="rank-card-sprite"
          style={{
            ...spriteStyles,
            margin: '2px',
            transition: 'all 0.2s ease',
            cursor: 'default'
          }}
        />
      );
    }
    
    // Fallback на отдельные файлы
    if (!imageError) {
      return (
        <div
          className="rank-card-image"
          style={{
            ...sizeStyles,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            margin: '2px',
            transition: 'all 0.2s ease',
            cursor: 'default'
          }}
        >
          <img
            src={getCardImagePath()}
            alt={`${card.rank}${card.suit}`}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: sizeStyles.borderRadius,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </div>
      );
    }
  }

  // Fallback на стандартный стиль (если не используем изображения или ошибка загрузки)
  return (
    <div
      className="rank-card"
      style={{
        ...sizeStyles,
        background: 'white',
        border: '2px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '2px',
        transition: 'all 0.2s ease',
        cursor: 'default'
      }}
    >
      {/* Цветная полоска сверху для ранга */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: rankColor,
          borderRadius: `${sizeStyles.borderRadius} ${sizeStyles.borderRadius} 0 0`
        }}
      />
      
      {/* Ранг карты */}
      <div
        style={{
          fontSize: sizeStyles.fontSize,
          fontWeight: 'bold',
          color: '#2c3e50',
          lineHeight: 1,
          marginTop: size === 'small' ? '4px' : '8px'
        }}
      >
        {card.rank}
      </div>
      
      {/* Масть карты (если нужно показывать) */}
      {showSuit && (
        <div
          style={{
            fontSize: size === 'small' ? '0.7rem' : size === 'large' ? '1.2rem' : '0.9rem',
            color: suitColor,
            lineHeight: 1,
            marginTop: '2px'
          }}
        >
          {suitSymbol}
        </div>
      )}
    </div>
  );
};

export default RankCard; 