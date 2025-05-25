class PreflopParser {
  constructor() {
    this.actionRegexes = {
      blind: /(.+): posts (small blind|big blind|ante) [\$€]?(\d+(?:\.\d+)?)/,
      bet: /(.+): bets [\$€]?(\d+(?:\.\d+)?)/,
      raise: /(.+): raises [\$€]?(\d+(?:\.\d+)?) to [\$€]?(\d+(?:\.\d+)?)/,
      call: /(.+): calls [\$€]?(\d+(?:\.\d+)?)/,
      check: /(.+): checks/,
      fold: /(.+): folds/,
      allIn: /(.+): bets [\$€]?(\d+(?:\.\d+)?) and is all-in/
    };
  }

  parsePreflopHistory(handHistoryText) {
    if (!handHistoryText) {
      return {
        potSize: 0,
        actions: [],
        playerStacks: {},
        blinds: { small: 0, big: 0 }
      };
    }

    const lines = handHistoryText.split('\n').map(line => line.trim()).filter(line => line);
    
    let potSize = 0;
    let actions = [];
    let playerStacks = {};
    let blinds = { small: 0, big: 0 };
    let playerBets = {}; // Track total bet per player
    let inPreflop = false;

    for (let line of lines) {
      // Извлекаем стеки игроков
      const seatMatch = line.match(/Seat \d+: (.+) \([\$€]?(\d+(?:\.\d+)?) in chips\)/);
      if (seatMatch) {
        const playerName = seatMatch[1];
        const stack = parseFloat(seatMatch[2]);
        playerStacks[playerName] = stack;
        continue;
      }

      // Парсим блайнды ДО раздачи карт
      if (!inPreflop) {
        const blindMatch = line.match(/(.+): posts (small blind|big blind) [\$€]?(\d+(?:\.\d+)?)/);
        if (blindMatch) {
          const action = {
            player: blindMatch[1],
            type: blindMatch[2],
            amount: parseFloat(blindMatch[3]),
            line: line
          };
          actions.push(action);
          
          // Initialize player bet tracking
          if (!playerBets[action.player]) {
            playerBets[action.player] = 0;
          }
          playerBets[action.player] = action.amount;

          if (action.type === 'small blind') {
            blinds.small = action.amount;
          } else if (action.type === 'big blind') {
            blinds.big = action.amount;
          }
          continue;
        }
      }

      // Начало раздачи карт означает начало префлопа
      if (line.includes('*** HOLE CARDS ***')) {
        inPreflop = true;
        continue;
      }

      // Если дошли до флопа, прекращаем парсинг
      if (line.includes('*** FLOP ***')) {
        break;
      }

      // Парсим действия только в префлопе (после HOLE CARDS)
      if (inPreflop) {
        const actionResult = this.parseAction(line);
        if (actionResult) {
          actions.push(actionResult);
          
          // Update player total bet tracking for raise/call/bet
          if (!playerBets[actionResult.player]) {
            playerBets[actionResult.player] = 0;
          }
          
          if (actionResult.type === 'raise') {
            // For raise, totalBet is the final amount this player has in the pot
            playerBets[actionResult.player] = actionResult.totalBet;
          } else if (actionResult.type === 'call') {
            // For call, amount is additional money added
            playerBets[actionResult.player] += actionResult.amount;
          } else if (actionResult.type === 'bet') {
            // For bet, amount is additional money added
            playerBets[actionResult.player] += actionResult.amount;
          }
        }
      }
    }

    // Calculate total pot from all player bets
    potSize = Object.values(playerBets).reduce((sum, bet) => sum + bet, 0);

    return {
      potSize: Math.round(potSize * 100) / 100, // Округляем до центов
      actions,
      playerStacks,
      blinds,
      playerBets // Добавляем для отладки
    };
  }

  parseAction(line) {
    // Парсим блайнды
    const blindMatch = line.match(this.actionRegexes.blind);
    if (blindMatch) {
      return {
        player: blindMatch[1],
        type: blindMatch[2],
        amount: parseFloat(blindMatch[3]),
        line: line
      };
    }

    // Парсим рейз
    const raiseMatch = line.match(this.actionRegexes.raise);
    if (raiseMatch) {
      return {
        player: raiseMatch[1],
        type: 'raise',
        amount: parseFloat(raiseMatch[2]), // Размер рейза (добавленная сумма)
        totalBet: parseFloat(raiseMatch[3]), // Общая ставка
        line: line
      };
    }

    // Парсим колл
    const callMatch = line.match(this.actionRegexes.call);
    if (callMatch) {
      return {
        player: callMatch[1],
        type: 'call',
        amount: parseFloat(callMatch[2]),
        line: line
      };
    }

    // Парсим бет
    const betMatch = line.match(this.actionRegexes.bet);
    if (betMatch) {
      return {
        player: betMatch[1],
        type: 'bet',
        amount: parseFloat(betMatch[2]),
        line: line
      };
    }

    // Парсим чек
    const checkMatch = line.match(this.actionRegexes.check);
    if (checkMatch) {
      return {
        player: checkMatch[1],
        type: 'check',
        amount: 0,
        line: line
      };
    }

    // Парсим фолд
    const foldMatch = line.match(this.actionRegexes.fold);
    if (foldMatch) {
      return {
        player: foldMatch[1],
        type: 'fold',
        amount: 0,
        line: line
      };
    }

    return null;
  }

  // Получить краткую сводку префлопа
  getPreflopSummary(handHistoryText) {
    const parsed = this.parsePreflopHistory(handHistoryText);
    
    return {
      potSize: parsed.potSize,
      actionCount: parsed.actions.length,
      playersInvolved: Object.keys(parsed.playerStacks).length,
      blinds: parsed.blinds,
      lastAction: parsed.actions[parsed.actions.length - 1]
    };
  }

  // Валидация префлоп истории
  validatePreflopHistory(handHistoryText) {
    if (!handHistoryText || handHistoryText.trim().length === 0) {
      return { isValid: false, error: 'Пустая история' };
    }

    const lines = handHistoryText.split('\n');
    
    // Проверяем наличие обязательных элементов
    const hasHeader = lines.some(line => line.includes('PokerStars Hand #'));
    const hasHoleCards = lines.some(line => line.includes('*** HOLE CARDS ***'));
    const hasSeats = lines.some(line => line.includes('Seat'));

    if (!hasHeader) {
      return { isValid: false, error: 'Отсутствует заголовок руки' };
    }

    if (!hasHoleCards) {
      return { isValid: false, error: 'Отсутствует секция HOLE CARDS' };
    }

    if (!hasSeats) {
      return { isValid: false, error: 'Отсутствует информация о местах' };
    }

    return { isValid: true };
  }

  // Извлечение имен игроков из префлоп истории
  extractPlayerNames(handHistoryText) {
    if (!handHistoryText) {
      return [];
    }

    const lines = handHistoryText.split('\n').map(line => line.trim()).filter(line => line);
    const playerNames = new Set();

    for (let line of lines) {
      // Извлекаем имена из строк с местами (Seat)
      const seatMatch = line.match(/Seat \d+: (.+) \([\$€]?(\d+(?:\.\d+)?) in chips\)/);
      if (seatMatch) {
        const playerName = seatMatch[1];
        playerNames.add(playerName);
        continue;
      }

      // Извлекаем имена из действий игроков
      const actionMatches = [
        line.match(/(.+): posts (small blind|big blind|ante)/),
        line.match(/(.+): (folds|checks|calls|bets|raises)/),
        line.match(/(.+): raises .+ to/),
        line.match(/(.+): calls/),
        line.match(/(.+): bets/),
        line.match(/Dealt to (.+) \[/)
      ];

      for (let match of actionMatches) {
        if (match && match[1]) {
          const playerName = match[1].trim();
          // Исключаем системные сообщения
          if (!playerName.includes('***') && !playerName.includes('Table') && playerName.length > 0) {
            playerNames.add(playerName);
          }
        }
      }
    }

    // Возвращаем отсортированный массив уникальных имен
    return Array.from(playerNames).sort();
  }
}

module.exports = PreflopParser; 