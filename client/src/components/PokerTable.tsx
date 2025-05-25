import React, { useState, useEffect } from 'react';
import RankCard from './RankCard';

interface Card {
  rank: string;
  suit: string;
  display: string;
}

interface Player {
  id: string;
  name: string;
  stack: number;
  holeCards: Card[];
  position: string;
  actions: any[];
}

interface TableData {
  id: number;
  players: {
    player1: Player;
    player2: Player;
  };
  board: {
    flop: Card[];
    turn: Card | null;
    river: Card | null;
  };
  pot: number;
  currentStreet: string;
  currentPlayer: string;
  handComplete: boolean;
  winner: string | null;
}

interface PokerTableProps {
  table: TableData;
  sessionId: string;
  betSizes: {
    quarter: boolean;
    half: boolean;
    threeQuarter: boolean;
    pot: boolean;
    allIn: boolean;
  };
  onHandComplete: (handHistory: string) => void;
}

const PokerTable: React.FC<PokerTableProps> = ({ 
  table: initialTable, 
  sessionId, 
  betSizes, 
  onHandComplete 
}) => {
  const [table, setTable] = useState<TableData>(initialTable);
  const [isLoading, setIsLoading] = useState(false);
  const [useCardImages, setUseCardImages] = useState<boolean>(false);

  useEffect(() => {
    setTable(initialTable);
  }, [initialTable]);

  const makeAction = async (action: string, amount?: number) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/action/${sessionId}/${table.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: table.currentPlayer,
          action,
          amount: amount || 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTable(result.table);
        
        if (result.handComplete && result.handHistory) {
          onHandComplete(result.handHistory);
        }
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('Ошибка при выполнении действия');
    } finally {
      setIsLoading(false);
    }
  };

  const dealNewHand = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/new-hand/${sessionId}/${table.id}`, {
        method: 'POST'
      });

      if (response.ok) {
        const newTable = await response.json();
        setTable(newTable);
      } else {
        throw new Error('Failed to deal new hand');
      }
    } catch (error) {
      console.error('New hand error:', error);
      alert('Ошибка при раздаче новой руки');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBetSize = (type: string): number => {
    const pot = table.pot || 100; // Default pot size
    switch (type) {
      case 'quarter': return Math.round(pot * 0.25);
      case 'half': return Math.round(pot * 0.5);
      case 'threeQuarter': return Math.round(pot * 0.75);
      case 'pot': return pot;
      case 'allIn': return Math.min(table.players.player1.stack, table.players.player2.stack);
      default: return 0;
    }
  };

  const availableBetSizes = Object.entries(betSizes)
    .filter(([_, enabled]) => enabled)
    .map(([type, _]) => ({
      type,
      amount: calculateBetSize(type),
      label: type === 'quarter' ? '25%' :
             type === 'half' ? '50%' :
             type === 'threeQuarter' ? '75%' :
             type === 'pot' ? '100%' :
             'All-in'
    }));

  const currentPlayer = table.players[table.currentPlayer as keyof typeof table.players];
  const isCurrentPlayerActive = !table.handComplete;

  return (
    <div className="poker-table">
      <div className="table-header">
        <h3>Стол #{table.id}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={() => setUseCardImages(!useCardImages)}
            style={{
              background: useCardImages ? 'rgba(76,175,80,0.2)' : 'rgba(255,167,38,0.2)',
              border: useCardImages ? '2px solid #4CAF50' : '2px solid #FFA726',
              color: useCardImages ? '#4CAF50' : '#FFA726',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {useCardImages ? '🖼️ Изображения' : '🎨 Стиль'}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            Стиль карт
          </span>
        </div>
        {table.handComplete && (
          <div style={{ marginTop: '10px' }}>
            <span style={{ 
              background: table.winner ? '#4CAF50' : '#FF5722',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '15px',
              fontSize: '0.9rem'
            }}>
              {table.winner ? `🏆 Победил: ${table.players[table.winner as keyof typeof table.players].name}` : '🤝 Ничья'}
            </span>
          </div>
        )}
      </div>

      <div className="street-indicator">
        {table.currentStreet === 'flop' ? '🃏 Флоп' :
         table.currentStreet === 'turn' ? '🎯 Тёрн' :
         table.currentStreet === 'river' ? '🌊 Ривер' : '🎲 Игра'}
      </div>

      <div className="pot-display">
        💰 Банк: €{table.pot}
      </div>

      {/* Board Cards */}
      <div className="board" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '8px', 
        margin: '20px 0',
        flexWrap: 'wrap'
      }}>
        {table.board.flop?.map((card, index) => (
          <RankCard key={`flop-${index}`} card={card} size="large" useImages={useCardImages} />
        ))}
        {table.board.turn && (
          <RankCard key="turn" card={table.board.turn} size="large" useImages={useCardImages} />
        )}
        {table.board.river && (
          <RankCard key="river" card={table.board.river} size="large" useImages={useCardImages} />
        )}
      </div>

      {/* Players */}
      <div className="players" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        margin: '20px 0' 
      }}>
        <div className={`player ${table.currentPlayer === 'player1' ? 'active' : ''}`} style={{
          background: table.currentPlayer === 'player1' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)',
          border: table.currentPlayer === 'player1' ? '2px solid #4CAF50' : '2px solid rgba(255,255,255,0.3)',
          borderRadius: '12px',
          padding: '15px',
          textAlign: 'center'
        }}>
          <div className="player-name" style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: table.currentPlayer === 'player1' ? '#4CAF50' : 'white'
          }}>
            {table.players.player1.name} ({table.players.player1.position})
          </div>
          <div className="player-stack" style={{ 
            fontSize: '1.1rem', 
            marginBottom: '12px',
            color: '#FFA726'
          }}>
            €{table.players.player1.stack}
          </div>
          <div className="hole-cards" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '6px' 
          }}>
            {table.players.player1.holeCards?.map((card, index) => 
              <RankCard key={`p1-${index}`} card={card} size="medium" useImages={useCardImages} />
            )}
          </div>
        </div>

        <div className={`player ${table.currentPlayer === 'player2' ? 'active' : ''}`} style={{
          background: table.currentPlayer === 'player2' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)',
          border: table.currentPlayer === 'player2' ? '2px solid #4CAF50' : '2px solid rgba(255,255,255,0.3)',
          borderRadius: '12px',
          padding: '15px',
          textAlign: 'center'
        }}>
          <div className="player-name" style={{ 
            fontWeight: 'bold', 
            marginBottom: '8px',
            color: table.currentPlayer === 'player2' ? '#4CAF50' : 'white'
          }}>
            {table.players.player2.name} ({table.players.player2.position})
          </div>
          <div className="player-stack" style={{ 
            fontSize: '1.1rem', 
            marginBottom: '12px',
            color: '#FFA726'
          }}>
            €{table.players.player2.stack}
          </div>
          <div className="hole-cards" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '6px' 
          }}>
            {table.players.player2.holeCards?.map((card, index) => 
              <RankCard key={`p2-${index}`} card={card} size="medium" useImages={useCardImages} />
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isCurrentPlayerActive && (
        <div className="action-buttons" style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          margin: '20px 0'
        }}>
          <button
            className="action-btn check"
            onClick={() => makeAction('check')}
            disabled={isLoading}
            style={{
              background: 'rgba(76,175,80,0.2)',
              border: '2px solid #4CAF50',
              color: '#4CAF50',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✓ Чек
          </button>

          {availableBetSizes.map(({ type, amount, label }) => (
            <button
              key={type}
              className="action-btn bet"
              onClick={() => makeAction('bet', amount)}
              disabled={isLoading || amount > currentPlayer.stack}
              title={`Ставка €${amount} (${label} пота)`}
              style={{
                background: 'rgba(255,167,38,0.2)',
                border: '2px solid #FFA726',
                color: '#FFA726',
                padding: '10px 15px',
                borderRadius: '8px',
                cursor: amount > currentPlayer.stack ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: amount > currentPlayer.stack ? 0.5 : 1
              }}
            >
              🎯 {label} (€{amount})
            </button>
          ))}

          <button
            className="action-btn call"
            onClick={() => makeAction('call', 50)} // Simplified call amount
            disabled={isLoading}
            style={{
              background: 'rgba(33,150,243,0.2)',
              border: '2px solid #2196F3',
              color: '#2196F3',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📞 Колл
          </button>

          <button
            className="action-btn fold"
            onClick={() => makeAction('fold')}
            disabled={isLoading}
            style={{
              background: 'rgba(255,82,67,0.2)',
              border: '2px solid #FF5243',
              color: '#FF5243',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🗂️ Фолд
          </button>
        </div>
      )}



      {/* New Hand Button */}
      {table.handComplete && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            className="btn btn-primary"
            onClick={dealNewHand}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            {isLoading ? '🎲 Раздача...' : '🎲 Новая рука'}
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px'
        }}>
          <div style={{ color: 'white', fontSize: '1.2rem' }}>
            ⏳ Обработка...
          </div>
        </div>
      )}
    </div>
  );
};

export default PokerTable; 