// Глобальный счетчик номеров рук
let globalHandNumber = 1748175114; // Начинаем с номера как в примере

class HandHistoryGenerator {
  constructor(preflopHistory, rakeSettings = null) {
    this.preflopHistory = preflopHistory || '';
    this.rakeSettings = rakeSettings || { percentage: 5.0, cap: 3.0 };
    // Определяем валюту из префлоп файла
    this.currency = this.detectCurrency(preflopHistory);
  }

  detectCurrency(preflopHistory) {
    if (!preflopHistory) return '$'; // По умолчанию доллары
    
    // Ищем валюту в префлоп файле
    if (preflopHistory.includes('$')) {
      return '$';
    } else if (preflopHistory.includes('€')) {
      return '€';
    }
    
    return '$'; // По умолчанию доллары
  }

  generateHandHistory(table) {
    const handId = this.generateHandId();
    
    let handHistory = '';
    
    // Extract header from preflop history or use default
    if (this.preflopHistory) {
      const preflopHeader = this.extractPreflopHeader(this.preflopHistory, handId);
      handHistory += preflopHeader;
    } else {
      // Fallback to default header
      const timestamp = new Date();
      const currencyCode = this.currency === '$' ? 'USD' : 'EUR';
      handHistory += `PokerStars Hand #${handId}: Hold'em No Limit (${this.currency}5/${this.currency}10 ${currencyCode}) - ${this.formatTimestamp(timestamp)}\n`;
      handHistory += `Table 'Simulator ${table.id}' 2-max Seat #1 is the button\n`;
      
      const player1 = table.players.find(p => p.id === 1);
      const player2 = table.players.find(p => p.id === 2);
      
      handHistory += `Seat 1: ${player1.name} (${this.currency}${player1.stack + this.getTotalBet(player1)} in chips)\n`;
      handHistory += `Seat 2: ${player2.name} (${this.currency}${player2.stack + this.getTotalBet(player2)} in chips)\n`;
    }
    
    // Add preflop actions if available (extract only actions, not header)
    if (this.preflopHistory) {
      const preflopActions = this.extractPreflopActions(this.preflopHistory);
      if (preflopActions) {
        handHistory += preflopActions + '\n';
      }
    }
    
    // Hole cards
    const player1 = table.players.find(p => p.id === 1);
    const player2 = table.players.find(p => p.id === 2);
    
    handHistory += `*** HOLE CARDS ***\n`;
    handHistory += `Dealt to ${player1.name} [${this.formatCards(player1.holeCards)}]\n`;
    handHistory += `Dealt to ${player2.name} [${this.formatCards(player2.holeCards)}]\n`;
    
    // Flop
    handHistory += `*** FLOP *** [${this.formatCards(table.board.flop)}]\n`;
    handHistory += this.generateStreetActions(table, 'flop');
    
    // Turn (if exists)
    if (table.board.turn) {
      handHistory += `*** TURN *** [${this.formatCards(table.board.flop)}] [${this.formatCard(table.board.turn)}]\n`;
      handHistory += this.generateStreetActions(table, 'turn');
    }
    
    // River (if exists)
    if (table.board.river) {
      handHistory += `*** RIVER *** [${this.formatCards(table.board.flop)} ${this.formatCard(table.board.turn)}] [${this.formatCard(table.board.river)}]\n`;
      handHistory += this.generateStreetActions(table, 'river');
    }
    
    // Summary
    handHistory += this.generateSummary(table);
    
    return handHistory;
  }

  extractPreflopHeader(preflopHistory, newHandId) {
    if (!preflopHistory) return '';
    
    const lines = preflopHistory.split('\n');
    let header = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Заменяем номер руки на новый
      if (trimmedLine.includes('PokerStars Hand #')) {
        const updatedLine = trimmedLine.replace(/Hand #\d+/, `Hand #${newHandId}`);
        // Обновляем время на текущее
        const timestamp = this.formatTimestamp(new Date());
        const timeUpdatedLine = updatedLine.replace(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} \w+/, timestamp);
        header += timeUpdatedLine + '\n';
        continue;
      }
      
      // Добавляем строки до HOLE CARDS, но исключаем префлоп действия
      if (trimmedLine.includes('*** HOLE CARDS ***')) {
        break;
      }
      
      // Пропускаем префлоп действия (они будут добавлены отдельно)
      if (trimmedLine.includes('posts small blind') || 
          trimmedLine.includes('posts big blind') ||
          trimmedLine.includes(': folds') || 
          trimmedLine.includes(': calls') || 
          trimmedLine.includes(': raises') || 
          trimmedLine.includes(': bets') || 
          trimmedLine.includes(': checks')) {
        continue;
      }
      
      // Добавляем только строки шапки (Table, Seat)
      if (trimmedLine && !trimmedLine.startsWith('Dealt to')) {
        // Сохраняем оригинальную валюту из префлоп файла
        header += trimmedLine + '\n';
      }
    }
    
    return header;
  }

  extractPreflopActions(preflopHistory) {
    if (!preflopHistory) return '';
    
    const lines = preflopHistory.split('\n');
    let actions = '';
    let inPreflopActions = false;
    let foundHoleCards = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Начинаем собирать действия после информации о местах
      if (trimmedLine.includes('Seat ') && trimmedLine.includes('in chips')) {
        inPreflopActions = true;
        continue;
      }
      
      // Отмечаем что нашли HOLE CARDS, но продолжаем
      if (trimmedLine.includes('*** HOLE CARDS ***')) {
        foundHoleCards = true;
        continue;
      }
      
      // Останавливаемся на флопе
      if (trimmedLine.includes('*** FLOP ***')) {
        break;
      }
      
      // Пропускаем строки с раздачей карт
      if (trimmedLine.startsWith('Dealt to')) {
        continue;
      }
      
      // Добавляем действия игроков в префлопе (включая после HOLE CARDS)
      if (inPreflopActions && trimmedLine && 
          (trimmedLine.includes(': folds') || 
           trimmedLine.includes(': calls') || 
           trimmedLine.includes(': raises') || 
           trimmedLine.includes(': bets') || 
           trimmedLine.includes(': checks') ||
           trimmedLine.includes('posts small blind') ||
           trimmedLine.includes('posts big blind'))) {
        
        // Сохраняем оригинальную валюту из префлоп файла
        actions += trimmedLine + '\n';
      }
    }
    
    return actions.trim();
  }

  calculatePreflopStacks(preflopHistory) {
    if (!preflopHistory) return {};
    
    const lines = preflopHistory.split('\n');
    const playerStacks = {};
    const playerBets = {};
    
    // Сначала извлекаем начальные стеки
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Парсим начальные стеки из строк Seat
      const seatMatch = trimmedLine.match(/Seat \d+: (\w+) \([\$€](\d+(?:\.\d+)?) in chips\)/);
      if (seatMatch) {
        const playerName = seatMatch[1];
        const initialStack = parseFloat(seatMatch[2]);
        playerStacks[playerName] = initialStack;
        playerBets[playerName] = 0;
      }
    }
    
    // Затем вычитаем все ставки в префлопе
    let inPreflopActions = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Начинаем отслеживать действия после информации о местах
      if (trimmedLine.includes('Seat ') && trimmedLine.includes('in chips')) {
        inPreflopActions = true;
        continue;
      }
      
      // Останавливаемся на флопе
      if (trimmedLine.includes('*** FLOP ***')) {
        break;
      }
      
      if (inPreflopActions) {
        // Парсим блайнды
        const blindMatch = trimmedLine.match(/(\w+): posts (?:small |big )?blind [\$€](\d+(?:\.\d+)?)/);
        if (blindMatch) {
          const playerName = blindMatch[1];
          const amount = parseFloat(blindMatch[2]);
          if (playerBets[playerName] !== undefined) {
            playerBets[playerName] += amount;
          }
          continue;
        }
        
        // Парсим рейзы с "to" (например: raises $15.00 to $25.00)
        const raiseToMatch = trimmedLine.match(/(\w+): raises [\$€](\d+(?:\.\d+)?) to [\$€](\d+(?:\.\d+)?)/);
        if (raiseToMatch) {
          const playerName = raiseToMatch[1];
          const totalBet = parseFloat(raiseToMatch[3]);
          if (playerBets[playerName] !== undefined) {
            playerBets[playerName] = totalBet; // Общая ставка игрока
          }
          continue;
        }
        
        // Парсим коллы
        const callMatch = trimmedLine.match(/(\w+): calls [\$€](\d+(?:\.\d+)?)/);
        if (callMatch) {
          const playerName = callMatch[1];
          const amount = parseFloat(callMatch[2]);
          if (playerBets[playerName] !== undefined) {
            playerBets[playerName] += amount;
          }
          continue;
        }
        
        // Парсим обычные рейзы (без "to")
        const raiseMatch = trimmedLine.match(/(\w+): raises [\$€](\d+(?:\.\d+)?)/);
        if (raiseMatch) {
          const playerName = raiseMatch[1];
          const amount = parseFloat(raiseMatch[2]);
          if (playerBets[playerName] !== undefined) {
            playerBets[playerName] += amount;
          }
          continue;
        }
        
        // Парсим беты
        const betMatch = trimmedLine.match(/(\w+): bets [\$€](\d+(?:\.\d+)?)/);
        if (betMatch) {
          const playerName = betMatch[1];
          const amount = parseFloat(betMatch[2]);
          if (playerBets[playerName] !== undefined) {
            playerBets[playerName] += amount;
          }
          continue;
        }
      }
    }
    
    // Вычисляем оставшиеся стеки
    const remainingStacks = {};
    for (const playerName in playerStacks) {
      remainingStacks[playerName] = playerStacks[playerName] - playerBets[playerName];
    }
    
    return remainingStacks;
  }

  // Новый метод для определения активных игроков (тех, кто не сфолдил в префлопе)
  getActivePlayers(preflopHistory) {
    if (!preflopHistory) return [];
    
    const lines = preflopHistory.split('\n');
    const allPlayers = new Set();
    const foldedPlayers = new Set();
    let foundHoleCards = false;
    
    // Сначала собираем всех игроков
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Извлекаем имена из строк с местами (Seat)
      const seatMatch = trimmedLine.match(/Seat \d+: (\w+) \([\$€](\d+(?:\.\d+)?) in chips\)/);
      if (seatMatch) {
        const playerName = seatMatch[1];
        allPlayers.add(playerName);
        continue;
      }
      
      // Отмечаем начало префлоп действий
      if (trimmedLine.includes('*** HOLE CARDS ***')) {
        foundHoleCards = true;
        continue;
      }
      
      // Останавливаемся на флопе
      if (trimmedLine.includes('*** FLOP ***')) {
        break;
      }
      
      // Отслеживаем фолды в префлопе (включая до и после HOLE CARDS)
      const foldMatch = trimmedLine.match(/(\w+): folds/);
      if (foldMatch) {
        const playerName = foldMatch[1];
        foldedPlayers.add(playerName);
      }
    }
    
    // Возвращаем игроков, которые не сфолдили
    const activePlayers = Array.from(allPlayers).filter(player => !foldedPlayers.has(player));
    return activePlayers;
  }

  generateHandId() {
    return globalHandNumber++;
  }

  formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds} CET`;
  }

  formatCard(card) {
    if (!card) return '';
    // Используем буквенные обозначения мастей как в оригинальных Hand History
    const suitMap = {
      'h': 'h', // hearts
      'd': 'd', // diamonds  
      'c': 'c', // clubs
      's': 's'  // spades
    };
    return card.rank + (suitMap[card.suit] || card.suit);
  }

  formatCards(cards) {
    if (!cards || !Array.isArray(cards)) return '';
    return cards.map(card => this.formatCard(card)).join(' ');
  }

  generateStreetActions(table, street) {
    let actions = '';
    const allActions = [];
    
    // Collect all actions for this street
    table.players.forEach(player => {
      const streetActions = player.actions.filter(action => action.street === street);
      streetActions.forEach(action => {
        allActions.push({
          ...action,
          playerName: player.name
        });
      });
    });
    
    // Sort actions by timestamp (chronological order)
    allActions.sort((a, b) => a.timestamp - b.timestamp);
    
    allActions.forEach(action => {
      switch (action.action) {
        case 'check':
          actions += `${action.playerName}: checks\n`;
          break;
        case 'bet':
          actions += `${action.playerName}: bets ${this.currency}${action.amount}\n`;
          break;
        case 'call':
          actions += `${action.playerName}: calls ${this.currency}${action.amount}\n`;
          break;
        case 'raise':
          actions += `${action.playerName}: raises ${this.currency}${action.amount}\n`;
          break;
        case 'fold':
          actions += `${action.playerName}: folds\n`;
          break;
      }
    });
    
    return actions;
  }

  generateSummary(table) {
    let summary = `*** SUMMARY ***\n`;
    
    // Рассчитываем рейк
    const rakeAmount = this.calculateRake(table.pot);
    const potAfterRake = table.pot - rakeAmount;
    
    // Отображаем общий банк и рейк
    if (rakeAmount > 0) {
      summary += `Total pot ${this.currency}${table.pot.toFixed(2)} | Rake ${this.currency}${rakeAmount.toFixed(2)}\n`;
    } else {
      summary += `Total pot ${this.currency}${table.pot.toFixed(2)}\n`;
    }
    
    summary += `Board [${this.formatCards(table.board.flop)}`;
    
    if (table.board.turn) {
      summary += ` ${this.formatCard(table.board.turn)}`;
    }
    if (table.board.river) {
      summary += ` ${this.formatCard(table.board.river)}`;
    }
    summary += `]\n`;
    
    // Player summaries
    if (table.winner === 'tie') {
      // Split pot scenario
      const splitAmount = Math.floor(potAfterRake / 2);
      table.players.forEach(player => {
        const folded = player.actions.some(action => action.action === 'fold');
        if (folded) {
          summary += `Seat ${player.id}: ${player.name} folded\n`;
        } else {
          summary += `Seat ${player.id}: ${player.name} showed [${this.formatCards(player.holeCards)}] and won (${this.currency}${splitAmount.toFixed(2)}) with split pot\n`;
        }
      });
    } else {
      // Regular winner scenario
      table.players.forEach(player => {
        if (table.winner === player.id) {
          summary += `Seat ${player.id}: ${player.name} showed [${this.formatCards(player.holeCards)}] and won (${this.currency}${potAfterRake.toFixed(2)})\n`;
        } else {
          const folded = player.actions.some(action => action.action === 'fold');
          if (folded) {
            summary += `Seat ${player.id}: ${player.name} folded\n`;
          } else {
            summary += `Seat ${player.id}: ${player.name} showed [${this.formatCards(player.holeCards)}] and lost\n`;
          }
        }
      });
    }
    
    summary += '\n\n';
    return summary;
  }

  calculateRake(pot) {
    if (!this.rakeSettings || pot <= 0) return 0;
    
    // Рассчитываем рейк как процент от банка
    const rakeAmount = (pot * this.rakeSettings.percentage) / 100;
    
    // Применяем максимальный лимит (кеп)
    return Math.min(rakeAmount, this.rakeSettings.cap);
  }

  getTotalBet(player) {
    return player.actions
      .filter(action => ['bet', 'call', 'raise'].includes(action.action))
      .reduce((total, action) => total + action.amount, 0);
  }

  saveHandHistory(handHistory, filename) {
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = './hand-histories';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const filePath = path.join(outputDir, filename || `hand-${Date.now()}.txt`);
    fs.writeFileSync(filePath, handHistory, 'utf8');
    
    return filePath;
  }

  exportForHand2Note(handHistories) {
    // Combine multiple hand histories for export
    let export_content = '';
    handHistories.forEach(hh => {
      export_content += hh + '\n';
    });
    
    return this.saveHandHistory(export_content, `hand2note-export-${Date.now()}.txt`);
  }
}

module.exports = HandHistoryGenerator; 