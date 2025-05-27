// Утилиты для работы с sprite sheet карт
import cardsSprite from '../assets/cards-sprite.png';

// Точные координаты из редактора sprite sheet
export const SPRITE_COORDINATES = {
  // Вертикальные линии (границы колонок)
  verticalLines: [68, 427, 786, 1145, 1504, 1863, 2222, 2581, 2940, 3299, 3658, 4017, 4376, 4735],
  // Горизонтальные линии (границы рядов)
  horizontalLines: [93, 663, 1233, 1803, 2373],
  // Размеры изображения
  imageWidth: 4804,
  imageHeight: 2458
};

// Вычисляем размеры карт на основе точных координат
export const SPRITE_DIMENSIONS = {
  totalWidth: SPRITE_COORDINATES.imageWidth,
  totalHeight: SPRITE_COORDINATES.imageHeight,
  // Размер карты = расстояние между соседними линиями
  cardWidth: SPRITE_COORDINATES.verticalLines[1] - SPRITE_COORDINATES.verticalLines[0], // 427 - 68 = 359
  cardHeight: SPRITE_COORDINATES.horizontalLines[1] - SPRITE_COORDINATES.horizontalLines[0], // 663 - 93 = 570
  cols: 13,
  rows: 4,
  // Смещения (отступы от краев)
  offsetX: SPRITE_COORDINATES.verticalLines[0], // 68
  offsetY: SPRITE_COORDINATES.horizontalLines[0] // 93
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
 * Получает позицию карты в sprite sheet используя точные координаты
 */
export function getCardPosition(suit: Suit, rank: Rank): CardSpritePosition {
  const suitIndex = SUITS_ORDER.indexOf(suit);
  const rankIndex = RANKS_ORDER.indexOf(rank);
  
  if (suitIndex === -1 || rankIndex === -1) {
    throw new Error(`Invalid card: ${rank} of ${suit}`);
  }
  
  // Используем точные координаты из редактора
  const x = SPRITE_COORDINATES.verticalLines[rankIndex];
  const y = SPRITE_COORDINATES.horizontalLines[suitIndex];
  
  // Вычисляем ширину и высоту карты
  const width = SPRITE_COORDINATES.verticalLines[rankIndex + 1] - x;
  const height = SPRITE_COORDINATES.horizontalLines[suitIndex + 1] - y;
  
  return {
    x,
    y,
    width,
    height
  };
}

/**
 * Создает CSS background-position для отображения карты из sprite sheet
 */
export function getCardBackgroundPosition(suit: Suit, rank: Rank): string {
  const position = getCardPosition(suit, rank);
  
  // Используем точные координаты для позиционирования
  const totalSpriteWidth = SPRITE_COORDINATES.imageWidth;
  const totalSpriteHeight = SPRITE_COORDINATES.imageHeight;
  
  // Вычисляем процентное позиционирование
  const percentX = (position.x / (totalSpriteWidth - position.width)) * 100;
  const percentY = (position.y / (totalSpriteHeight - position.height)) * 100;
  
  return `${percentX}% ${percentY}%`;
}

// Настройки позиционирования карт (оптимизированные)
export const CARD_POSITIONING = {
  // Стандартные размеры бокса для карт
  boxSize: { width: 80, height: 101 },
  // Размеры самой карты (больше бокса для лучшего качества)
  cardSize: { width: 95, height: 133 },
  // Смещение карты внутри бокса
  offset: { x: 2, y: 0 },
  // Масштаб карты
  scale: 1.0
};

/**
 * Создает объект стилей для отображения карты
 */
export function getCardStyles(suit: Suit, rank: Rank, width: number = 100, height: number = 140): React.CSSProperties {
  const backgroundPosition = getCardBackgroundPosition(suit, rank);
  const position = getCardPosition(suit, rank);
  
  // Вычисляем размер background для корректного масштабирования
  const scaleX = SPRITE_COORDINATES.imageWidth / position.width;
  const scaleY = SPRITE_COORDINATES.imageHeight / position.height;
  
  return {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(${cardsSprite})`,
    backgroundPosition,
    backgroundSize: `${scaleX * 100}% ${scaleY * 100}%`,
    backgroundRepeat: 'no-repeat',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    display: 'inline-block'
  };
}

/**
 * Создает объект стилей для отображения карты с оптимизированным позиционированием
 */
export function getOptimizedCardStyles(suit: Suit, rank: Rank, containerWidth?: number, containerHeight?: number): React.CSSProperties {
  const backgroundPosition = getCardBackgroundPosition(suit, rank);
  const position = getCardPosition(suit, rank);
  
  // Вычисляем размер background для корректного масштабирования
  const scaleX = SPRITE_COORDINATES.imageWidth / position.width;
  const scaleY = SPRITE_COORDINATES.imageHeight / position.height;
  
  return {
    width: `${CARD_POSITIONING.cardSize.width}px`,
    height: `${CARD_POSITIONING.cardSize.height}px`,
    backgroundImage: `url(${cardsSprite})`,
    backgroundPosition,
    backgroundSize: `${scaleX * 100}% ${scaleY * 100}%`,
    backgroundRepeat: 'no-repeat',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    display: 'inline-block',
    transform: `translate(${CARD_POSITIONING.offset.x}px, ${CARD_POSITIONING.offset.y}px) scale(${CARD_POSITIONING.scale})`,
    transformOrigin: 'center center',
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    marginTop: `-${CARD_POSITIONING.cardSize.height / 2}px`,
    marginLeft: `-${CARD_POSITIONING.cardSize.width / 2}px`,
    zIndex: 10
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
      
      // Используем максимальные размеры карты для canvas
      const maxCardWidth = Math.max(...SPRITE_COORDINATES.verticalLines.slice(1).map((x, i) => x - SPRITE_COORDINATES.verticalLines[i]));
      const maxCardHeight = Math.max(...SPRITE_COORDINATES.horizontalLines.slice(1).map((y, i) => y - SPRITE_COORDINATES.horizontalLines[i]));
      
      canvas.width = maxCardWidth;
      canvas.height = maxCardHeight;
      
      const extractedCards: { [key: string]: string } = {};
      
              // Извлекаем каждую карту
        SUITS_ORDER.forEach((suit) => {
          RANKS_ORDER.forEach((rank) => {
            const position = getCardPosition(suit, rank);
            
            // Очищаем canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Рисуем карту с точными координатами
            ctx.drawImage(
              img,
              position.x, position.y, position.width, position.height,
              0, 0, position.width, position.height
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
  SPRITE_COORDINATES,
  SPRITE_DIMENSIONS,
  CARD_POSITIONING,
  SUITS_ORDER,
  RANKS_ORDER,
  getCardPosition,
  getCardBackgroundPosition,
  getCardStyles,
  getOptimizedCardStyles,
  extractCardImages,
  parseCard
};

export default cardSprites; 