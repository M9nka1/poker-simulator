import React from 'react';
import RankCard from './RankCard';

interface Card {
  rank: string;
  suit: string;
  display: string;
}

interface CardSelectorProps {
  selectedCards: Card[];
  onChange: (cards: Card[]) => void;
  maxCards: number;
  label: string;
  useImages?: boolean;
}

const CardSelector: React.FC<CardSelectorProps> = ({ selectedCards, onChange, maxCards, label, useImages = false }) => {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: '♠', value: 's', color: '#000', name: 'spades' },
    { symbol: '♥', value: 'h', color: '#e74c3c', name: 'hearts' },
    { symbol: '♦', value: 'd', color: '#e74c3c', name: 'diamonds' },
    { symbol: '♣', value: 'c', color: '#000', name: 'clubs' }
  ];

  const isCardSelected = (rank: string, suit: string) => {
    return selectedCards.some(card => card.rank === rank && card.suit === suit);
  };

  const isCardDisabled = (rank: string, suit: string) => {
    return selectedCards.length >= maxCards && !isCardSelected(rank, suit);
  };

  const toggleCard = (rank: string, suit: string) => {
    const cardExists = isCardSelected(rank, suit);
    
    if (cardExists) {
      // Remove card
      const newCards = selectedCards.filter(card => 
        !(card.rank === rank && card.suit === suit)
      );
      onChange(newCards);
    } else if (selectedCards.length < maxCards) {
      // Add card
      const newCard: Card = {
        rank,
        suit,
        display: rank + suit
      };
      onChange([...selectedCards, newCard]);
    }
  };

  const clearSelection = () => {
    onChange([]);
  };

  return (
    <div className="card-selector">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#4CAF50' }}>{label}</h4>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginRight: '10px' }}>
            {selectedCards.length}/{maxCards} карт
          </span>
          {selectedCards.length > 0 && (
            <button 
              onClick={clearSelection}
              style={{
                background: 'rgba(255,82,67,0.2)',
                border: '1px solid rgba(255,82,67,0.3)',
                color: '#ff5243',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      {selectedCards.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
            Выбранные карты:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedCards.map((card, index) => (
              <RankCard 
                key={`${card.rank}${card.suit}-${index}`} 
                card={card} 
                size="small" 
                useImages={useImages}
              />
            ))}
          </div>
        </div>
      )}

      <div className="card-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'auto repeat(4, 1fr)',
        gap: '4px',
        fontSize: '0.8rem'
      }}>
        {/* Header row */}
        <div></div>
        {suits.map(suit => (
          <div key={suit.value} style={{ 
            textAlign: 'center', 
            padding: '8px',
            color: suit.color,
            fontWeight: 'bold',
            fontSize: '1.2rem'
          }}>
            {suit.symbol}
          </div>
        ))}

        {/* Rank rows */}
        {ranks.map(rank => (
          <React.Fragment key={rank}>
            <div style={{ 
              padding: '8px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: 'white',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px'
            }}>
              {rank}
            </div>
            {suits.map(suit => {
              const selected = isCardSelected(rank, suit.value);
              const disabled = isCardDisabled(rank, suit.value);
              
              return (
                <button
                  key={`${rank}${suit.value}`}
                  onClick={() => toggleCard(rank, suit.value)}
                  disabled={disabled}
                  style={{
                    background: selected 
                      ? '#4CAF50' 
                      : disabled 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'white',
                    color: selected 
                      ? 'white' 
                      : disabled 
                        ? 'rgba(255,255,255,0.3)' 
                        : suit.color,
                    border: selected 
                      ? '2px solid #4CAF50' 
                      : '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '6px',
                    padding: '8px 4px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    minHeight: '36px',
                    transition: 'all 0.2s ease',
                    opacity: disabled ? 0.5 : 1
                  }}
                >
                  {rank}
                  <br />
                  {suit.symbol}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {maxCards > 1 && selectedCards.length < maxCards && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '0.8rem', 
          color: 'rgba(255,167,38,0.8)',
          textAlign: 'center'
        }}>
          💡 Выберите еще {maxCards - selectedCards.length} карт(у)
        </div>
      )}
    </div>
  );
};

export default CardSelector; 