import React, { useState } from 'react';

interface HandSelection {
  hand: string;
  percentage: number;
}

const HandRangeTest: React.FC = () => {
  const [testInput, setTestInput] = useState<string>('AA,KK,QQ,JJ,TT,99:0.35,88,77,66:0.6,55,44,33:0.6,22:0.75,AK,AQ,AJ,AT,A9,A8,A7,A6,A5,A4s:0.6,A4o,A3,A2s:0.75,A2o,KQ,KJ,KT,K9s:0.35,K9o,K8,K7s,K6s,K5s,K4s:0.6,K3,K2s:0.75,K2o,QJ,QT,Q9s:0.35,Q9o,Q8s,Q7s:0.6,Q6,Q5,Q4s:0.6,Q3,Q2s:0.75,Q2o,JT,J9s:0.35,J9o,J8,J7s:0.6,J7o,J6,J5,J4s:0.6,J3,J2s:0.75,J2o,T9s:0.35,T9o,T8,T7s:0.6,T7o,T6,T5,T4s:0.6,T4o,T3,T2s:0.75,T2o,98s,98o:0.35,97s:0.6,97o,96,95,94s:0.6,94o,93,92s:0.75,92o,87s:0.6,87o,86s:0.6,86o,85,84s:0.6,84o,83,82s:0.75,82o,76s:0.6,76o,75,74s:0.6,74o,73s:0.6,73o,72s:0.75,72o,65s,65o:0.6,64s,64o:0.6,63:0.6,62s:0.75,62o,54,53:0.6,52s:0.75,52o:0.6,43:0.6,42s:0.75,42o:0.6,32s:0.75,32o');
  const [parsedHands, setParsedHands] = useState<HandSelection[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const parseHandRange = (rangeText: string): { hands: HandSelection[], errors: string[] } => {
    if (!rangeText.trim()) return { hands: [], errors: [] };
    
    const hands: HandSelection[] = [];
    const errors: string[] = [];
    const parts = rangeText.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      if (trimmed.includes(':')) {
        const [hand, percentStr] = trimmed.split(':');
        const percentage = parseFloat(percentStr);
        if (hand && !isNaN(percentage) && percentage >= 0 && percentage <= 1) {
          const expandedHands = expandHandNotation(hand.trim());
          expandedHands.forEach(expandedHand => {
            hands.push({ hand: expandedHand, percentage: percentage * 100 });
          });
        } else {
          errors.push(`Ошибка в "${trimmed}": неверный процент`);
        }
      } else {
        const expandedHands = expandHandNotation(trimmed);
        expandedHands.forEach(expandedHand => {
          hands.push({ hand: expandedHand, percentage: 100 });
        });
      }
    }
    
    return { hands, errors };
  };

  const expandHandNotation = (hand: string): string[] => {
    if (hand.endsWith('s') || hand.endsWith('o')) {
      return [hand];
    }
    
    if (hand.length === 2 && hand[0] === hand[1]) {
      return [hand];
    }
    
    if (hand.length === 2 && hand[0] !== hand[1]) {
      return [`${hand}s`, `${hand}o`];
    }
    
    return [hand];
  };

  const handleTest = () => {
    const result = parseHandRange(testInput);
    setParsedHands(result.hands);
    setErrors(result.errors);
  };

  const groupHandsByPercentage = () => {
    const groups: { [key: number]: string[] } = {};
    parsedHands.forEach(hand => {
      if (!groups[hand.percentage]) {
        groups[hand.percentage] = [];
      }
      groups[hand.percentage].push(hand.hand);
    });
    return groups;
  };

  const groups = groupHandsByPercentage();

  return (
    <div style={{
      padding: '20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          🧪 Тест парсинга Hand Ranges
        </h1>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Введите hand range для тестирования:
          </label>
          <textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '5px',
              fontSize: '0.9rem',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleTest}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔍 Протестировать
          </button>
        </div>

        {errors.length > 0 && (
          <div style={{
            background: 'rgba(255,0,0,0.2)',
            border: '1px solid rgba(255,0,0,0.5)',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#FF5722', margin: '0 0 10px 0' }}>❌ Ошибки парсинга:</h3>
            {errors.map((error, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>• {error}</div>
            ))}
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>📊 Результаты парсинга:</h3>
          <div style={{ marginBottom: '15px' }}>
            <strong>Всего рук распознано: {parsedHands.length}</strong>
          </div>

          {Object.keys(groups).length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Группировка по процентам:</h4>
              {Object.entries(groups)
                .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                .map(([percentage, hands]) => (
                  <div key={percentage} style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      marginBottom: '5px',
                      color: percentage === '100' ? '#4CAF50' : '#FFA726'
                    }}>
                      {percentage}% ({hands.length} рук):
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-all'
                    }}>
                      {hands.join(', ')}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0' }}>📝 Все распознанные руки:</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {parsedHands.map((hand, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '8px',
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 'bold' }}>{hand.hand}</span>
                <span style={{ 
                  color: hand.percentage === 100 ? '#4CAF50' : '#FFA726',
                  fontSize: '0.9rem'
                }}>
                  {hand.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => window.location.hash = '#'}
            style={{
              padding: '10px 20px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🏠 Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandRangeTest; 