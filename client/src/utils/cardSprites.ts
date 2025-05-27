// Утилиты для работы с sprite sheet карт
import cardsSprite from '../assets/cards-sprite.png';

// Размеры sprite sheet
export const SPRITE_DIMENSIONS = {
  totalWidth: 4804,
  totalHeight: 2458,
  cardWidth: 4804 / 13, // 13 карт в ряду (2-10, J, Q, K, A)
  cardHeight: 2458 / 4, // 4 масти
  cols: 13,
  rows: 4
};

// Порядок мастей в sprite sheet (сверху вниз)
export const SUITS_ORDER = ['hearts', 'spades', 'diamonds', 'clubs'] as const;

// Порядок рангов в sprite sheet (слева направо)
export const RANKS_ORDER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof SUITS_ORDER[number];
export type Rank = typeof RANKS_ORDER[number];

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface CardSpritePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Получает позицию карты в sprite sheet
 */
export function getCardPosition(suit: Suit, rank: Rank): CardSpritePosition {
  const suitIndex = SUITS_ORDER.indexOf(suit);
  const rankIndex = RANKS_ORDER.indexOf(rank);
  
  if (suitIndex === -1 || rankIndex === -1) {
    throw new Error(`Invalid card: ${rank} of ${suit}`);
  }
  
  return {
    x: rankIndex * SPRITE_DIMENSIONS.cardWidth,
    y: suitIndex * SPRITE_DIMENSIONS.cardHeight,
    width: SPRITE_DIMENSIONS.cardWidth,
    height: SPRITE_DIMENSIONS.cardHeight
  };
}

/**
 * Создает CSS background-position для отображения карты из sprite sheet
 */
export function getCardBackgroundPosition(suit: Suit, rank: Rank): string {
  const position = getCardPosition(suit, rank);
  const percentX = (position.x / (SPRITE_DIMENSIONS.totalWidth - SPRITE_DIMENSIONS.cardWidth)) * 100;
  const percentY = (position.y / (SPRITE_DIMENSIONS.totalHeight - SPRITE_DIMENSIONS.cardHeight)) * 100;
  
  return `${percentX}% ${percentY}%`;
}

/**
 * Создает объект стилей для отображения карты
 */
export function getCardStyles(suit: Suit, rank: Rank, width: number = 100, height: number = 140): React.CSSProperties {
  const backgroundPosition = getCardBackgroundPosition(suit, rank);
  
  return {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${cardsSprite})`,
    backgroundPosition,
    backgroundSize: `${(SPRITE_DIMENSIONS.totalWidth / SPRITE_DIMENSIONS.cardWidth) * 100}% ${(SPRITE_DIMENSIONS.totalHeight / SPRITE_DIMENSIONS.cardHeight) * 100}%`,
    backgroundRepeat: 'no-repeat',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    display: 'inline-block'
  };
}

/**
 * Функция для программной нарезки sprite sheet (если нужно создать отдельные файлы)
 */
export async function extractCardImages(): Promise<{ [key: string]: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = SPRITE_DIMENSIONS.cardWidth;
      canvas.height = SPRITE_DIMENSIONS.cardHeight;
      
      const extractedCards: { [key: string]: string } = {};
      
      // Извлекаем каждую карту
      SUITS_ORDER.forEach((suit, suitIndex) => {
        RANKS_ORDER.forEach((rank, rankIndex) => {
          const position = getCardPosition(suit, rank);
          
          // Очищаем canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Рисуем карту
          ctx.drawImage(
            img,
            position.x, position.y, position.width, position.height,
            0, 0, canvas.width, canvas.height
          );
          
          // Получаем base64 изображение
          const cardKey = `${rank}_${suit}`;
          extractedCards[cardKey] = canvas.toDataURL('image/png');
        });
      });
      
      resolve(extractedCards);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load sprite image'));
    };
    
    img.src = cardsSprite;
  });
}

/**
 * Конвертирует стандартное обозначение карты в наш формат
 */
export function parseCard(cardString: string): Card {
  if (cardString.length < 2) {
    throw new Error(`Invalid card string: ${cardString}`);
  }
  
  const rank = cardString.slice(0, -1) as Rank;
  const suitChar = cardString.slice(-1);
  
  const suitMap: { [key: string]: Suit } = {
    'h': 'hearts',
    's': 'spades', 
    'd': 'diamonds',
    'c': 'clubs',
    '♥': 'hearts',
    '♠': 'spades',
    '♦': 'diamonds', 
    '♣': 'clubs'
  };
  
  const suit = suitMap[suitChar];
  if (!suit) {
    throw new Error(`Invalid suit: ${suitChar}`);
  }
  
  if (!RANKS_ORDER.includes(rank)) {
    throw new Error(`Invalid rank: ${rank}`);
  }
  
  return { suit, rank };
}

// Экспорт всех утилит как именованный объект
const cardSprites = {
  SPRITE_DIMENSIONS,
  SUITS_ORDER,
  RANKS_ORDER,
  getCardPosition,
  getCardBackgroundPosition,
  getCardStyles,
  extractCardImages,
  parseCard
};

export default cardSprites; 