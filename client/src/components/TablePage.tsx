import React, { useState, useEffect } from 'react';
import ModernPokerTable from './ModernPokerTable';

interface TablePageProps {
  sessionId: string;
  tableId: number;
  playerNames: string[];
  tableStyle?: string;
}

interface TableData {
  id: number;
  players: any[];
  board: {
    flop: any[];
    turn: any | null;
    river: any | null;
  };
  pot: number;
  currentStreet: string;
  currentPlayer: number;
  handComplete: boolean;
  winner: number | null;
}

const TablePage: React.FC<TablePageProps> = ({ 
  sessionId, 
  tableId, 
  playerNames,
  tableStyle = 'modern'
}) => {
  const [table, setTable] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [handHistories, setHandHistories] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId || !tableId) {
      setError('Не указаны параметры сессии или стола');
      setIsLoading(false);
      return;
    }

    // Устанавливаем заголовок окна
    document.title = `Покерный стол #${tableId} - Сессия ${sessionId.substring(0, 8)}`;

    // Загружаем данные стола
    const loadTable = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          const targetTable = sessionData.tables.find((t: any) => t.id === tableId);
          if (targetTable) {
            setTable(targetTable);
          } else {
            setError('Стол не найден');
          }
        } else {
          setError('Сессия не найдена');
        }
      } catch (err) {
        setError('Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    loadTable();
  }, [sessionId, tableId]);

  const handleHandComplete = (handHistory: string) => {
    setHandHistories(prev => [...prev, handHistory]);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white'
      }}>
        🎲 Загрузка стола...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
        <div style={{ color: '#FF5722', marginBottom: '20px' }}>{error}</div>
        <button
          onClick={() => window.close()}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Закрыть окно
        </button>
      </div>
    );
  }

  if (!table) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white'
      }}>
        ❌ Стол не найден
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      color: 'white'
    }}>
      {/* Покерный стол */}
      <div style={{ flex: 1 }}>
        <ModernPokerTable
          table={table}
          sessionId={sessionId!}
          playerNames={playerNames}
          onHandComplete={handleHandComplete}
        />
      </div>

      {/* Статистика стола */}
      {handHistories.length > 0 && (
        <div style={{
          marginTop: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '10px',
          padding: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2rem', color: '#FFA726', marginBottom: '5px' }}>
            📊 Статистика стола
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Сыграно рук: {handHistories.length} | Стол: #{tableId}
          </div>
        </div>
      )}
    </div>
  );
};

export default TablePage; 