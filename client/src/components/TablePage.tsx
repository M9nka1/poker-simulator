import React, { useState, useEffect } from 'react';
import ModernPokerTable from './ModernPokerTable';
import config from '../config';

interface TablePageProps {
  sessionId: string;
  tableId: number;
  playerNames: string[];
  tableStyle?: string;
  isGuest?: boolean;
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
  tableStyle = 'modern',
  isGuest = false 
}) => {
  const [table, setTable] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [handHistories, setHandHistories] = useState<string[]>([]);

  useEffect(() => {
    console.log(`🎮 TablePage loading - Session: ${sessionId}, Table: ${tableId}, Guest: ${isGuest}, Style: ${tableStyle}`);
    
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
        const response = await fetch(`${config.apiBaseUrl}/api/session/${sessionId}`);
        if (response.ok) {
          const sessionData = await response.json();
          console.log(`📊 Loaded session data:`, sessionData);
          
          const targetTable = sessionData.tables.find((t: any) => t.id === tableId);
          if (targetTable) {
            setTable(targetTable);
            console.log(`✅ Found target table:`, targetTable);
          } else {
            setError(`Стол #${tableId} не найден в сессии`);
          }
        } else {
          setError('Сессия не найдена');
        }
      } catch (err) {
        console.error('❌ Error loading table:', err);
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
        backgroundColor: '#0f4c2a',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        🔄 Загрузка стола...
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
        backgroundColor: '#0f4c2a',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>❌ Ошибка</h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Попробовать снова
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
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      backgroundColor: '#0f4c2a'
    }}>
      <ModernPokerTable
        table={table}
        sessionId={sessionId}
        playerNames={playerNames}
        onHandComplete={(handHistory: string) => {
          console.log('✅ Hand completed:', handHistory);
        }}
      />

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