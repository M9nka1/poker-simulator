# 🎴 Система карт с Sprite Sheet

## 📋 Обзор

Реализована полная система для работы с картами из sprite sheet размером 4804x2458 пикселей, содержащего все 52 карты колоды.

## 🗂️ Структура файлов

```
client/src/
├── assets/
│   ├── cards-sprite.png      # Основной sprite sheet (4804x2458)
│   └── table.png            # Изображение покерного стола
├── utils/
│   ├── cardSprites.ts       # Утилиты для работы со sprite sheet
│   └── cardExtractor.ts     # Программная нарезка карт
├── components/
│   ├── Card.tsx            # Компонент отдельной карты
│   ├── Card.css            # Стили для карт
│   ├── CardDemo.tsx        # Демо страница карт
│   └── RankCard.tsx        # Обновленный компонент (поддержка sprite sheet)
```

## 🎯 Компоненты

### 1. Card.tsx - Универсальный компонент карты
```tsx
import Card from './components/Card';

// Использование со sprite sheet
<Card suit="hearts" rank="A" width={80} height={112} animated />
<Card cardString="Ks" width={60} height={84} />
<Card hidden width={80} height={112} /> // Рубашка карты
```

### 2. cardSprites.ts - Утилиты sprite sheet
```tsx
import { getCardStyles, parseCard, SUITS_ORDER, RANKS_ORDER } from './utils/cardSprites';

// Получение стилей карты
const styles = getCardStyles('hearts', 'A', 80, 112);

// Парсинг строки карты  
const card = parseCard('Ah'); // { suit: 'hearts', rank: 'A' }

// Доступные масти и ранги
console.log(SUITS_ORDER); // ['hearts', 'spades', 'diamonds', 'clubs']
console.log(RANKS_ORDER); // ['2', '3', ..., 'K', 'A']
```

### 3. cardExtractor.ts - Программная нарезка
```tsx
import { extractAllCards, downloadExtractedCards } from './utils/cardExtractor';

// Извлечение всех карт в base64
const cards = await extractAllCards('/path/to/sprite.png');

// Автоматическая загрузка всех карт как .png файлы
await downloadExtractedCards('/path/to/sprite.png');
```

## 🎨 Sprite Sheet Layout

**Размер:** 4804 x 2458 пикселей
**Карта:** 369.5 x 614.5 пикселей (4804/13 x 2458/4)

### Расположение мастей (сверху вниз):
1. ♥ Hearts (Червы)
2. ♠ Spades (Пики) 
3. ♦ Diamonds (Бубны)
4. ♣ Clubs (Трефы)

### Расположение рангов (слева направо):
2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A

## 🚀 Использование

### Базовое отображение карты
```tsx
<Card 
  suit="hearts" 
  rank="A" 
  width={80} 
  height={112} 
  animated={true}
  selected={false}
/>
```

### Обработка событий
```tsx
<Card 
  suit="spades" 
  rank="K"
  onClick={() => console.log('Карта нажата')}
  onHover={() => console.log('Наведение на карту')}
  animated={true}
/>
```

### Скрытая карта (рубашка)
```tsx
<Card hidden width={80} height={112} />
```

## 🔧 Программная нарезка

### Извлечение всех карт
```tsx
import { extractAllCards } from './utils/cardExtractor';
import cardsSprite from './assets/cards-sprite.png';

const handleExtract = async () => {
  const cards = await extractAllCards(cardsSprite);
  console.log(`Извлечено ${cards.size} карт`);
  
  // Доступ к конкретной карте
  const aceOfHearts = cards.get('A_hearts');
};
```

### Загрузка отдельных файлов
```tsx
import { downloadExtractedCards } from './utils/cardExtractor';

const handleDownload = async () => {
  await downloadExtractedCards(cardsSprite);
  // Загрузится 52 .png файла: A_hearts.png, K_spades.png, etc.
};
```

## 🎭 Демо страница

Доступна по адресу: `http://localhost:3000/#cards`

### Возможности демо:
- 🎴 Отображение полного sprite sheet
- 📤 Извлечение всех карт в base64
- 💾 Загрузка отдельных .png файлов
- 🎯 Демонстрация всех 52 карт
- ⚙️ Переключение размеров карт
- ✨ Анимации и эффекты

## 📱 Адаптивность

### Размеры карт:
- **Small:** 35x49px
- **Medium:** 50x70px  
- **Large:** 70x98px

### Автоматическая адаптация:
```css
@media (max-width: 768px) {
  .poker-card {
    border-radius: 6px;
  }
}

@media (max-width: 480px) {
  .card-animated:hover {
    transform: none; /* Отключение анимаций на мобильных */
  }
}
```

## 🎨 Стили и анимации

### CSS классы:
- `.poker-card` - базовый класс карты
- `.card-animated` - карта с анимациями
- `.card-selected` - выбранная карта
- `.card-hidden` - скрытая карта
- `.card-clickable` - кликабельная карта

### Анимации:
- **Hover эффект:** масштабирование и тень
- **Deal анимация:** появление карты сверху
- **Flip анимация:** переворот карты
- **Glow эффект:** подсветка выигрышных карт

## 🔄 Интеграция с игрой

### В компонентах покера:
```tsx
// Карты игрока
{player.holeCards.map((card, index) => (
  <Card 
    key={index}
    cardString={card.display} // "Ah", "Ks", etc.
    size="medium"
    animated={true}
  />
))}

// Борд карты  
{board.flop.map((card, index) => (
  <Card 
    key={index}
    cardString={card.display}
    size="large"
    animated={true}
  />
))}
```

## 🎯 API Reference

### Card Props
```tsx
interface CardProps {
  suit?: 'hearts' | 'spades' | 'diamonds' | 'clubs';
  rank?: '2'...'A';
  cardString?: string; // "Ah", "Ks", etc.
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  hidden?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  animated?: boolean;
  selected?: boolean;
}
```

### Sprite Functions
```tsx
// Получение позиции карты в sprite
getCardPosition(suit, rank): CardSpritePosition

// CSS background-position
getCardBackgroundPosition(suit, rank): string

// Полные стили карты
getCardStyles(suit, rank, width, height): React.CSSProperties

// Парсинг строки карты
parseCard(cardString): { suit, rank }
```

## ✅ Преимущества системы

1. **Производительность:** Один файл вместо 52 отдельных
2. **Качество:** Высокое разрешение (369x614 на карту)
3. **Консистентность:** Единый стиль всех карт
4. **Гибкость:** Поддержка разных размеров
5. **Анимации:** Плавные переходы и эффекты
6. **Адаптивность:** Работа на всех устройствах

## 🚀 Доступ к демо

1. Запустите сервер: `npm run dev`
2. Откройте: `http://localhost:3000`
3. Нажмите кнопку "🎴 Демо карт"
4. Или перейдите напрямую: `http://localhost:3000/#cards` 