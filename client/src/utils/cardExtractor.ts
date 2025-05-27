// Утилита для извлечения отдельных карт из sprite sheet
import { 
  SPRITE_DIMENSIONS, 
  SUITS_ORDER, 
  RANKS_ORDER, 
  getCardPosition 
} from './cardSprites';

/**
 * Извлекает все карты из sprite sheet и возвращает их как base64 строки
 */
export async function extractAllCards(spriteImageUrl: string): Promise<Map<string, string>> {
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
      
      // Устанавливаем размер canvas под одну карту
      canvas.width = SPRITE_DIMENSIONS.cardWidth;
      canvas.height = SPRITE_DIMENSIONS.cardHeight;
      
      const extractedCards = new Map<string, string>();
      
      // Извлекаем каждую карту
      SUITS_ORDER.forEach((suit) => {
        RANKS_ORDER.forEach((rank) => {
          const position = getCardPosition(suit, rank);
          
          // Очищаем canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Рисуем карту из sprite sheet
          ctx.drawImage(
            img,
            position.x, position.y, position.width, position.height,  // источник
            0, 0, canvas.width, canvas.height  // назначение
          );
          
          // Получаем base64 изображение карты
          const cardKey = `${rank}_${suit}`;
          const cardDataUrl = canvas.toDataURL('image/png', 1.0);
          extractedCards.set(cardKey, cardDataUrl);
          
          console.log(`Extracted card: ${cardKey}`);
        });
      });
      
      resolve(extractedCards);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load sprite image'));
    };
    
    img.src = spriteImageUrl;
  });
}

/**
 * Создает файлы карт и автоматически загружает их как .png файлы
 */
export async function downloadExtractedCards(spriteImageUrl: string): Promise<void> {
  try {
    const extractedCards = await extractAllCards(spriteImageUrl);
    
    // Создаем и загружаем каждую карту как отдельный файл
    extractedCards.forEach((dataUrl, cardKey) => {
      downloadImageAsFile(dataUrl, `${cardKey}.png`);
    });
    
    console.log(`Successfully extracted and downloaded ${extractedCards.size} cards`);
  } catch (error) {
    console.error('Error extracting cards:', error);
    throw error;
  }
}

/**
 * Вспомогательная функция для загрузки изображения как файла
 */
function downloadImageAsFile(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Создает ZIP архив со всеми картами (требует библиотеку JSZip)
 * Опциональная функция - работает только если JSZip установлен
 */
export async function createCardsZip(spriteImageUrl: string): Promise<Blob> {
  // Эта функция требует установки JSZip
  // npm install jszip @types/jszip
  
  try {
    // Динамический импорт JSZip с обработкой ошибок
    let jsZipModule = null;
    try {
      // @ts-ignore - JSZip является опциональной зависимостью
      jsZipModule = await import('jszip');
    } catch (error) {
      console.warn('JSZip not available:', error);
      jsZipModule = null;
    }
    
    if (!jsZipModule) {
      throw new Error('JSZip library not installed. Run: npm install jszip @types/jszip');
    }
    
    const JSZip = jsZipModule.default;
    const zip = new JSZip();
    
    const extractedCards = await extractAllCards(spriteImageUrl);
    
    // Добавляем каждую карту в ZIP
    extractedCards.forEach((dataUrl, cardKey) => {
      // Конвертируем dataUrl в blob
      const base64Data = dataUrl.split(',')[1];
      zip.file(`${cardKey}.png`, base64Data, { base64: true });
    });
    
    // Создаем ZIP файл
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
    
  } catch (error) {
    console.error('JSZip not available. Install it with: npm install jszip @types/jszip');
    throw new Error(`JSZip library required for ZIP creation: ${error}`);
  }
}

/**
 * Создает структуру папок с картами, организованными по мастям
 */
export async function extractCardsToStructure(spriteImageUrl: string): Promise<{
  hearts: Map<string, string>;
  spades: Map<string, string>;
  diamonds: Map<string, string>;
  clubs: Map<string, string>;
}> {
  const allCards = await extractAllCards(spriteImageUrl);
  
  const structure = {
    hearts: new Map<string, string>(),
    spades: new Map<string, string>(),
    diamonds: new Map<string, string>(),
    clubs: new Map<string, string>()
  };
  
  allCards.forEach((dataUrl, cardKey) => {
    const [rank, suit] = cardKey.split('_');
    structure[suit as keyof typeof structure].set(rank, dataUrl);
  });
  
  return structure;
}

/**
 * Генерирует CSS спрайт для использования в веб-приложениях
 */
export function generateCSSSprite(): string {
  let css = '/* Generated CSS Sprite for Playing Cards */\n\n';
  css += '.card-sprite {\n';
  css += `  background-image: url('../assets/cards-sprite.png');\n`;
  css += `  background-size: ${SPRITE_DIMENSIONS.totalWidth}px ${SPRITE_DIMENSIONS.totalHeight}px;\n`;
  css += '  background-repeat: no-repeat;\n';
  css += '  display: inline-block;\n';
  css += '}\n\n';
  
  SUITS_ORDER.forEach((suit) => {
    RANKS_ORDER.forEach((rank) => {
      const position = getCardPosition(suit, rank);
      const className = `.card-${rank.toLowerCase()}-${suit}`;
      
      css += `${className} {\n`;
      css += `  background-position: -${position.x}px -${position.y}px;\n`;
      css += `  width: ${SPRITE_DIMENSIONS.cardWidth}px;\n`;
      css += `  height: ${SPRITE_DIMENSIONS.cardHeight}px;\n`;
      css += '}\n\n';
    });
  });
  
  // Используем CSS для демонстрации
  console.log('Generated CSS sprite classes');
  return css;
}

/**
 * Демо функция для тестирования извлечения
 */
export async function runExtractionDemo(spriteImageUrl: string): Promise<void> {
  console.log('🎴 Starting card extraction demo...');
  
  try {
    // Извлекаем все карты
    const cards = await extractAllCards(spriteImageUrl);
    console.log(`✅ Successfully extracted ${cards.size} cards`);
    
    // Показываем первые несколько карт для проверки
    const sampleCards = Array.from(cards.entries()).slice(0, 5);
    console.log('🔍 Sample cards:');
    sampleCards.forEach(([key, dataUrl]) => {
      console.log(`  ${key}: ${dataUrl.substring(0, 50)}...`);
    });
    
    // Генерируем CSS спрайт и используем его
    generateCSSSprite();
    
    return;
  } catch (error) {
    console.error('❌ Error in extraction demo:', error);
    throw error;
  }
}

// Экспорт всех функций как именованный объект
const cardExtractor = {
  extractAllCards,
  downloadExtractedCards,
  createCardsZip,
  extractCardsToStructure,
  generateCSSSprite,
  runExtractionDemo
};

export default cardExtractor; 