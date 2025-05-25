import React, { useState } from 'react';

interface HandSelection {
  hand: string;
  percentage: number; // 0-100
}

interface HandRangeMatrixProps {
  selectedHands: HandSelection[];
  onSelectionChange: (selectedHands: HandSelection[]) => void;
  playerId: string;
  playerName?: string;
}

const HandRangeMatrix: React.FC<HandRangeMatrixProps> = ({
  selectedHands,
  onSelectionChange,
  playerId,
  playerName = `Player ${playerId}`
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');
  const [dragStarted, setDragStarted] = useState(false);
  const [globalPercentage, setGlobalPercentage] = useState<number>(100);

  // Покерные руки в матричном формате
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  const generateHandMatrix = () => {
    const matrix: string[][] = [];
    
    for (let i = 0; i < 13; i++) {
      const row: string[] = [];
      for (let j = 0; j < 13; j++) {
        if (i === j) {
          // Пары (диагональ)
          row.push(ranks[i] + ranks[j]);
        } else if (i < j) {
          // Suited (верхний треугольник)
          row.push(ranks[i] + ranks[j] + 's');
        } else {
          // Offsuit (нижний треугольник)
          row.push(ranks[j] + ranks[i] + 'o');
        }
      }
      matrix.push(row);
    }
    
    return matrix;
  };

  const matrix = generateHandMatrix();

  const getHandType = (hand: string): 'pair' | 'suited' | 'offsuit' => {
    if (hand.length === 2) return 'pair';
    if (hand.includes('s')) return 'suited';
    return 'offsuit';
  };

  const getHandSelection = (hand: string): HandSelection | undefined => {
    return selectedHands.find(h => h.hand === hand);
  };

  const isHandSelected = (hand: string): boolean => {
    return selectedHands.some(h => h.hand === hand);
  };

  const getHandPercentage = (hand: string): number => {
    const selection = getHandSelection(hand);
    return selection ? selection.percentage : 0;
  };

  const handleCellClick = (hand: string) => {
    // Если был drag, не обрабатываем клик
    if (dragStarted) {
      return;
    }
    
    const existingSelection = getHandSelection(hand);
    
    if (existingSelection) {
      // Если рука уже выбрана, убираем её из выбранных
      const newSelection = selectedHands.filter(h => h.hand !== hand);
      onSelectionChange(newSelection);
    } else {
      // Добавляем новую руку с глобальным процентом
      const newSelection: HandSelection[] = [...selectedHands, { hand, percentage: globalPercentage }];
      onSelectionChange(newSelection);
    }
  };

  const handleMouseDown = (hand: string, event: React.MouseEvent) => {
    setIsSelecting(true);
    setDragStarted(false);
    const isSelected = isHandSelected(hand);
    setSelectionMode(isSelected ? 'remove' : 'add');
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setDragStarted(false);
  };

  const handleMouseEnter = (hand: string) => {
    if (isSelecting) {
      // Отмечаем что начался drag
      setDragStarted(true);
      
      const isSelected = isHandSelected(hand);

      if (selectionMode === 'add' && !isSelected) {
        const newSelection: HandSelection[] = [...selectedHands, { hand, percentage: globalPercentage }];
        onSelectionChange(newSelection);
      } else if (selectionMode === 'remove' && isSelected) {
        const newSelection = selectedHands.filter(h => h.hand !== hand);
        onSelectionChange(newSelection);
      }
    }
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  const selectPreset = (hands: string[], percentage: number = globalPercentage) => {
    const newSelections: HandSelection[] = hands.map(hand => ({ hand, percentage }));
    const existingHands = selectedHands.filter(h => !hands.includes(h.hand));
    onSelectionChange([...existingHands, ...newSelections]);
  };

  const selectPairs = () => {
    const pairs = matrix.flat().filter(hand => getHandType(hand) === 'pair');
    selectPreset(pairs);
  };

  const selectBroadway = () => {
    const broadway = matrix.flat().filter(hand => {
      const ranks = hand.replace(/[so]/g, '');
      return ['A', 'K', 'Q', 'J', 'T'].every(rank => ranks.includes(rank));
    });
    selectPreset(broadway);
  };

  const selectSuited = () => {
    const suited = matrix.flat().filter(hand => getHandType(hand) === 'suited');
    selectPreset(suited);
  };

  const selectTop10Percent = () => {
    const topHands = [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s',
      'KQs', 'KJs', 'KTs', 'K9s',
      'QJs', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s',
      'AKo', 'AQo'
    ];
    selectPreset(topHands);
  };

  // Определяем цвета для игроков
  const getPlayerColors = () => {
    if (playerId === '1') {
      return {
        primary: '#9C27B0', // Фиолетовый для Player 1
        secondary: 'rgba(156, 39, 176, 0.3)',
        accent: '#7B1FA2'
      };
    } else {
      return {
        primary: '#4CAF50', // Зелёный для Player 2  
        secondary: 'rgba(76, 175, 80, 0.3)',
        accent: '#388E3C'
      };
    }
  };

  const colors = getPlayerColors();

  const getCellStyle = (hand: string) => {
    const percentage = getHandPercentage(hand);
    const isSelected = percentage > 0;
    const handType = getHandType(hand);
    
    let baseColor = '#2a2a2a';
    if (handType === 'pair') baseColor = '#FF6F00'; // Янтарный для пар
    else if (handType === 'suited') baseColor = '#00BCD4'; // Циан для suited
    else baseColor = '#424242'; // Серый для offsuit

    if (isSelected) {
      return {
        background: `linear-gradient(135deg, ${colors.primary} ${percentage}%, ${baseColor} ${percentage}%)`,
        border: `2px solid ${colors.primary}`,
        boxShadow: `0 0 10px ${colors.secondary}`,
        color: percentage > 50 ? 'white' : '#fff',
        opacity: 1,
        transform: 'scale(1)'
      };
    }

    // Невыделенные руки - блеклые
    return {
      background: baseColor,
      border: '1px solid #666',
      color: 'rgba(255, 255, 255, 0.4)', // Блеклый текст
      opacity: 0.3, // Общая прозрачность
      filter: 'brightness(0.6) saturate(0.5)' // Уменьшаем яркость и насыщенность
    };
  };

  return (
    <div>
      {/* Player Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        padding: '15px',
        background: colors.secondary,
        border: `2px solid ${colors.primary}`,
        borderRadius: '10px'
      }}>
        <h3 style={{ 
          color: colors.primary, 
          margin: '0 0 10px 0',
          fontSize: '1.3rem',
          fontWeight: 'bold'
        }}>
          🎯 {playerName}
        </h3>
        <div style={{ 
          fontSize: '0.9rem', 
          color: colors.accent,
          fontWeight: '500'
        }}>
          Выбрано рук: {selectedHands.length} | 
          Средний %: {selectedHands.length > 0 ? 
            Math.round(selectedHands.reduce((sum, h) => sum + h.percentage, 0) / selectedHands.length) : 0}%
        </div>
      </div>

      {/* Global Percentage Slider */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '10px'
        }}>
          <label style={{
            color: colors.primary,
            fontWeight: 'bold',
            fontSize: '1rem',
            minWidth: '120px'
          }}>
            🎚️ Процент для новых рук:
          </label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={globalPercentage}
            onChange={(e) => setGlobalPercentage(parseInt(e.target.value))}
            style={{
              flex: 1,
              accentColor: colors.primary,
              height: '8px'
            }}
          />
          <div style={{
            background: colors.primary,
            color: 'white',
            padding: '5px 12px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '1rem',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {globalPercentage}%
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {[25, 50, 75, 100].map(percent => (
            <button
              key={percent}
              className="btn btn-outline"
              onClick={() => setGlobalPercentage(percent)}
              style={{ 
                borderColor: globalPercentage === percent ? colors.primary : 'rgba(255,255,255,0.3)',
                color: globalPercentage === percent ? colors.primary : 'rgba(255,255,255,0.7)',
                background: globalPercentage === percent ? colors.secondary : 'transparent',
                fontSize: '0.8rem',
                padding: '5px 12px'
              }}
            >
              {percent}%
            </button>
          ))}
        </div>
        
        <p style={{ 
          textAlign: 'center', 
          margin: '8px 0 0 0', 
          fontSize: '0.8rem', 
          color: 'rgba(255,255,255,0.6)' 
        }}>
          💡 Установите процент, затем кликайте на руки для добавления
        </p>
      </div>

      <div className="matrix-controls" style={{ 
        marginBottom: '15px', 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button 
          className="btn btn-outline" 
          onClick={selectTop10Percent}
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          Топ 10%
        </button>
        <button 
          className="btn btn-outline" 
          onClick={selectPairs}
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          Пары
        </button>
        <button 
          className="btn btn-outline" 
          onClick={selectSuited}
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          Suited
        </button>
        <button 
          className="btn btn-outline" 
          onClick={selectBroadway}
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          Broadway
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={clearSelection}
        >
          Очистить
        </button>
      </div>

      <div 
        className="hand-matrix"
        onMouseUp={handleMouseUp}
        style={{ userSelect: 'none' }}
      >
        {matrix.map((row, i) =>
          row.map((hand, j) => {
            const percentage = getHandPercentage(hand);
            return (
              <div
                key={`${i}-${j}`}
                className={`hand-cell ${getHandType(hand)}`}
                style={getCellStyle(hand)}
                onMouseDown={(e) => handleMouseDown(hand, e)}
                onMouseEnter={() => handleMouseEnter(hand)}
                onClick={() => handleCellClick(hand)}
                title={`${hand} - ${getHandType(hand) === 'pair' ? 'Пара' : 
                  getHandType(hand) === 'suited' ? 'Одномастные' : 'Разномастные'}${
                  percentage > 0 ? ` (${percentage}%)` : ''
                }`}
              >
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                  {hand}
                </div>
                {percentage > 0 && percentage < 100 && (
                  <div style={{ 
                    fontSize: '7px', 
                    position: 'absolute', 
                    bottom: '1px', 
                    right: '2px',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '2px',
                    padding: '1px 2px'
                  }}>
                    {percentage}%
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ marginTop: '15px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '15px', height: '15px', fontSize: '8px', 
              background: '#FF6F00', color: 'white', borderRadius: '3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>AA</div>
            <span>Пары</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '15px', height: '15px', fontSize: '8px',
              background: '#00BCD4', color: 'white', borderRadius: '3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>AKs</div>
            <span>Suited</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '15px', height: '15px', fontSize: '8px',
              background: '#424242', color: 'white', borderRadius: '3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>AKo</div>
            <span>Offsuit</span>
          </div>
        </div>
        <p style={{ textAlign: 'center', margin: '5px 0' }}>
          💡 Установите процент выше, затем кликайте на руки | Повторный клик убирает руку | Drag для диапазона
        </p>
      </div>
    </div>
  );
};

export default HandRangeMatrix; 