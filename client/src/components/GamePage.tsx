import React, { useState } from 'react';
import MultiplayerPokerTable from './MultiplayerPokerTable';
import { GameSession } from '../App';

interface GamePageProps {
  session: GameSession;
  onBackToSetup: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ session, onBackToSetup }) => {
  const [handHistories, setHandHistories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleHandComplete = (handHistory: string) => {
    setHandHistories(prev => [...prev, handHistory]);
  };

  const exportHandHistories = async () => {
    if (handHistories.length === 0) {
      alert('Нет сыгранных рук для экспорта');
      return;
    }

    setIsExporting(true);
    
    try {
      const response = await fetch('/api/export-hand-histories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handHistories,
          sessionId: session.sessionId
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hand2note-export-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`✅ Экспортировано ${handHistories.length} рук для Hand2Note`);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      
      // Fallback: создаем файл на клиенте
      const content = handHistories.join('\n\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hand2note-export-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert(`✅ Экспортировано ${handHistories.length} рук (локальный экспорт)`);
    } finally {
      setIsExporting(false);
    }
  };

  const clearHandHistories = () => {
    if (window.confirm('Очистить все сохраненные истории рук?')) {
      setHandHistories([]);
    }
  };

  return (
    <div className="game-page">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ margin: '0', color: '#4CAF50' }}>
            🎮 Игровая Сессия
          </h2>
          <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
            ID: {session.sessionId} | Столов: {session.tables.length} | Рук сыграно: {handHistories.length}
            {session.preflopInfo && session.preflopInfo.potSize > 0 && (
              <span> | Префлоп банк: €{session.preflopInfo.potSize}</span>
            )}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-primary ${isExporting ? 'pulsing' : ''}`}
            onClick={exportHandHistories}
            disabled={isExporting || handHistories.length === 0}
            title={`Экспорт ${handHistories.length} рук для Hand2Note`}
          >
            {isExporting ? '📤 Экспорт...' : `📤 Экспорт Hand History (${handHistories.length})`}
          </button>
          
          {handHistories.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={clearHandHistories}
              title="Очистить все сохраненные истории рук"
            >
              🗑️ Очистить
            </button>
          )}
          
          <button
            className="btn btn-outline"
            onClick={onBackToSetup}
            title="Вернуться к настройкам"
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>

      {handHistories.length === 0 && (
        <div style={{ 
          background: 'rgba(255, 167, 38, 0.1)', 
          border: '1px solid rgba(255, 167, 38, 0.3)',
          borderRadius: '10px',
          padding: '15px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0', color: '#FFA726' }}>
            💡 Сыграйте несколько рук, чтобы начать генерацию Hand History для Hand2Note
          </p>
        </div>
      )}

      <div className="tables-grid">
        {session.tables.map((table, index) => (
          <MultiplayerPokerTable
            key={table.id}
            table={table}
            sessionId={session.sessionId}
            playerNames={session.playerNames}
            betSizes={session.settings.betSizes}
            onHandComplete={handleHandComplete}
          />
        ))}
      </div>

      {/* Статистика сессии */}
      <div style={{ 
        marginTop: '30px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        padding: '20px'
      }}>
        <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>📊 Статистика сессии</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#FFA726' }}>{handHistories.length}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Рук сыграно</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#4CAF50' }}>{session.tables.length}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Активных столов</div>
          </div>
          
          {session.preflopInfo && session.preflopInfo.potSize > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#4CAF50' }}>€{session.preflopInfo.potSize}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Префлоп банк</div>
            </div>
          )}
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#2196F3' }}>
              {session.settings.handRanges.player1.length}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Рук в диапазоне P1</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', color: '#FF5722' }}>
              {session.settings.handRanges.player2.length}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Рук в диапазоне P2</div>
          </div>
        </div>

        {handHistories.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
              💾 Hand History готовы для импорта в Hand2Note. 
              Нажмите "Экспорт Hand History" для скачивания .txt файла.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage; 