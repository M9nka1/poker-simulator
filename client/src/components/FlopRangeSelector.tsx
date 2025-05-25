import React from 'react';

interface FlopRange {
  high: string[];
  middle: string[];
  low: string[];
}

interface FlopRangeSelectorProps {
  selectedRanges: FlopRange;
  onChange: (ranges: FlopRange) => void;
}

const FlopRangeSelector: React.FC<FlopRangeSelectorProps> = ({ selectedRanges, onChange }) => {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

  const isRankSelected = (position: keyof FlopRange, rank: string) => {
    return selectedRanges[position].includes(rank);
  };

  const toggleRank = (position: keyof FlopRange, rank: string) => {
    const currentRanks = [...selectedRanges[position]];
    const rankIndex = currentRanks.indexOf(rank);
    
    if (rankIndex > -1) {
      // Удаляем ранг
      currentRanks.splice(rankIndex, 1);
    } else {
      // Добавляем ранг
      currentRanks.push(rank);
    }
    
    onChange({
      ...selectedRanges,
      [position]: currentRanks
    });
  };

  const selectRange = (position: keyof FlopRange, startRank: string, endRank: string) => {
    const startIndex = ranks.indexOf(startRank);
    const endIndex = ranks.indexOf(endRank);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const rangeRanks = ranks.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
    
    onChange({
      ...selectedRanges,
      [position]: rangeRanks
    });
  };

  const clearPosition = (position: keyof FlopRange) => {
    onChange({
      ...selectedRanges,
      [position]: []
    });
  };

  const clearAll = () => {
    onChange({
      high: [],
      middle: [],
      low: []
    });
  };

  const PositionSelector: React.FC<{ 
    position: keyof FlopRange; 
    title: string; 
    emoji: string;
    color: string;
  }> = ({ position, title, emoji, color }) => (
    <div style={{ 
      background: 'rgba(255,255,255,0.05)', 
      borderRadius: '12px', 
      padding: '20px',
      border: `2px solid ${color}20`
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '15px' 
      }}>
        <h4 style={{ 
          margin: 0, 
          color: color,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {emoji} {title}
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ 
            fontSize: '0.8rem', 
            color: 'rgba(255,255,255,0.7)' 
          }}>
            {selectedRanges[position].length} карт
          </span>
          {selectedRanges[position].length > 0 && (
            <button 
              onClick={() => clearPosition(position)}
              style={{
                background: 'rgba(255,82,67,0.2)',
                border: '1px solid rgba(255,82,67,0.3)',
                color: '#ff5243',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                cursor: 'pointer'
              }}
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Быстрые диапазоны */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          fontSize: '0.8rem', 
          color: 'rgba(255,255,255,0.8)', 
          marginBottom: '8px' 
        }}>
          Быстрый выбор:
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => selectRange(position, 'A', 'T')}
            style={{
              background: 'rgba(76,175,80,0.2)',
              border: '1px solid rgba(76,175,80,0.3)',
              color: '#4CAF50',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            A-T
          </button>
          <button
            onClick={() => selectRange(position, '9', '6')}
            style={{
              background: 'rgba(255,167,38,0.2)',
              border: '1px solid rgba(255,167,38,0.3)',
              color: '#FFA726',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            9-6
          </button>
          <button
            onClick={() => selectRange(position, '5', '2')}
            style={{
              background: 'rgba(158,158,158,0.2)',
              border: '1px solid rgba(158,158,158,0.3)',
              color: '#9E9E9E',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer'
            }}
          >
            5-2
          </button>
        </div>
      </div>

      {/* Выбранные карты */}
      {selectedRanges[position].length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'rgba(255,255,255,0.8)', 
            marginBottom: '8px' 
          }}>
            Выбранные ранги:
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {selectedRanges[position]
              .sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b))
              .map(rank => (
                <div
                  key={rank}
                  style={{
                    background: color,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}
                >
                  {rank}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Сетка выбора рангов */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(13, 1fr)',
        gap: '4px',
        fontSize: '0.8rem'
      }}>
        {ranks.map(rank => {
          const selected = isRankSelected(position, rank);
          
          return (
            <button
              key={rank}
              onClick={() => toggleRank(position, rank)}
              style={{
                background: selected ? color : 'rgba(255,255,255,0.1)',
                color: selected ? 'white' : 'rgba(255,255,255,0.8)',
                border: selected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '8px 4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                minHeight: '32px',
                transition: 'all 0.2s ease'
              }}
            >
              {rank}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flop-range-selector">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ margin: 0, color: '#4CAF50' }}>
          🎯 Диапазоны карт флопа
        </h3>
        <button 
          onClick={clearAll}
          style={{
            background: 'rgba(255,82,67,0.2)',
            border: '1px solid rgba(255,82,67,0.3)',
            color: '#ff5243',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          Очистить всё
        </button>
      </div>

      <div style={{ 
        fontSize: '0.9rem', 
        color: 'rgba(255,255,255,0.7)', 
        marginBottom: '20px',
        background: 'rgba(255,167,38,0.1)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,167,38,0.2)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#FFA726' }}>
          💡 Как это работает:
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Выберите диапазоны рангов для каждой позиции на флопе</li>
          <li>Высокая карта - самая старшая карта флопа</li>
          <li>Средняя карта - карта посередине по старшинству</li>
          <li>Низкая карта - самая младшая карта флопа</li>
          <li>Система будет генерировать флопы согласно выбранным диапазонам</li>
        </ul>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <PositionSelector 
          position="high" 
          title="Высокая карта" 
          emoji="🔥"
          color="#e74c3c"
        />
        <PositionSelector 
          position="middle" 
          title="Средняя карта" 
          emoji="⚡"
          color="#f39c12"
        />
        <PositionSelector 
          position="low" 
          title="Низкая карта" 
          emoji="❄️"
          color="#3498db"
        />
      </div>

      {/* Примеры флопов */}
      {(selectedRanges.high.length > 0 || selectedRanges.middle.length > 0 || selectedRanges.low.length > 0) && (
        <div style={{ 
          marginTop: '20px',
          background: 'rgba(76,175,80,0.1)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid rgba(76,175,80,0.2)'
        }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: '10px', 
            color: '#4CAF50',
            fontSize: '0.9rem'
          }}>
            📋 Примеры возможных флопов:
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
            {selectedRanges.high.length > 0 && (
              <div>Высокая: {selectedRanges.high.join(', ')}</div>
            )}
            {selectedRanges.middle.length > 0 && (
              <div>Средняя: {selectedRanges.middle.join(', ')}</div>
            )}
            {selectedRanges.low.length > 0 && (
              <div>Низкая: {selectedRanges.low.join(', ')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlopRangeSelector; 