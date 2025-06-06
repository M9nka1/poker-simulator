# Префлоп споты

Эта папка содержит данные о различных префлоп ситуациях для покерного симулятора.

## 📁 Поддерживаемые форматы

Система поддерживает два формата:

### 🆕 **TXT файлы (рекомендуется)**
- **Формат**: PokerStars Hand History (.txt)
- **Автозагрузка**: Все TXT файлы автоматически загружаются и парсятся
- **Название**: Берется из имени файла (заменяются _ на пробелы)

### 🔄 **JSON файл (для совместимости)**
- **Файл**: `spots.json`
- **Использование**: Fallback если TXT файлы недоступны

## ➕ Добавление новых спотов

### Метод 1: TXT файлы (простой)
1. Скопируйте hand history из PokerStars
2. Сохраните как `.txt` файл в эту папку
3. Название файла станет именем спота (например: `BTN_vs_BB_3bet.txt` → "BTN vs BB 3bet")
4. Перезагрузите приложение

### Метод 2: JSON файл (ручной)
1. Откройте файл `spots.json`
2. Добавьте новый объект в массив
3. Убедитесь, что `id` уникален
4. Проверьте корректность расчета `potSize`

## 📋 Структура TXT файла

Поддерживается стандартный формат PokerStars Hand History:

```
PokerStars Hand #123456789: Hold'em No Limit (€2.50/€5.00 EUR) - 2024/05/25 20:15:30 CET
Table 'Table Name' 2-max Seat #1 is the button
Seat 1: Player1 (€1000.00 in chips)
Seat 2: Player2 (€1000.00 in chips)
Player1: posts small blind €2.50
Player2: posts big blind €5.00
*** HOLE CARDS ***
Player1: raises €7.50 to €12.50
Player2: raises €25.00 to €37.50
Player1: calls €25.00
*** FLOP ***
```

## 🔄 Автоматический парсинг

Система автоматически извлекает:
- **Блайнды**: Из строк "posts small/big blind"  
- **Действия**: raises, calls, folds, 3bet, 4bet
- **Размер банка**: Суммирует все ставки
- **Имена игроков**: Из hand history

## 📁 Примеры файлов

- `3bet_SBvsBU.txt` - 3bet SB vs BU
- `BTN_vs_BB_3bet.txt` - BTN vs BB 3bet 
- `CO_vs_BTN_4bet.txt` - CO vs BTN 4bet

## 🛠 Техническая информация

- **Загрузка**: Асинхронная через preflopSpotsLoader
- **Fallback**: Автоматически используется spots.json при ошибках
- **MIME типы**: Настроены для корректной загрузки TXT файлов
- **Парсинг**: Поддержка различных валют (€, $) и форматов

## 🎯 Использование

Споты используются в тестовом окне для быстрой настройки префлоп ситуаций. При выборе спота автоматически устанавливаются:
- Размер банка
- Блайнды  
- История действий
- Полный текст hand history

Это позволяет быстро переключаться между различными покерными ситуациями для анализа и тренировки. 