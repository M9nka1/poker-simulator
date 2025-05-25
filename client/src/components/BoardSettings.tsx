import React from 'react';
import CardSelector from './CardSelector';
import FlopRangeSelector from './FlopRangeSelector';

interface Card {
  rank: string;
  suit: string;
  display: string;
}

interface FlopRange {
  high: string[];
  middle: string[];
  low: string[];
}

interface BoardSettingsProps {
  settings: {
    flopSettings: {
      random: boolean;
      twoTone: boolean;
      rainbow: boolean;
      monotone: boolean;
      paired: boolean;
      specific: boolean;
      specificCards: Card[];
      ranges: boolean;
      rangeSettings: FlopRange;
    };
    turnSettings: {
      enabled: boolean;
      specific: boolean;
      specificCard: Card | null;
    };
    riverSettings: {
      enabled: boolean;
      specific: boolean;
      specificCard: Card | null;
    };
  };
  onChange: (newSettings: any) => void;
}

const BoardSettings: React.FC<BoardSettingsProps> = ({ settings, onChange }) => {
  const handleFlopSettingChange = (setting: string, value: boolean) => {
    const newFlopSettings = { ...settings.flopSettings };
    
    // Если включаем конкретную настройку, отключаем "random"
    if (setting !== 'random' && value) {
      newFlopSettings.random = false;
    }
    
    // Если включаем "random", отключаем все остальные
    if (setting === 'random' && value) {
      Object.keys(newFlopSettings).forEach(key => {
        if (key !== 'random' && key !== 'specificCards' && key !== 'rangeSettings') {
          (newFlopSettings as any)[key] = false;
        }
      });
    }
    
    // Если включаем "specific" или "ranges", отключаем остальные типы флопов
    if ((setting === 'specific' || setting === 'ranges') && value) {
      newFlopSettings.random = false;
      newFlopSettings.twoTone = false;
      newFlopSettings.rainbow = false;
      newFlopSettings.monotone = false;
      newFlopSettings.paired = false;
      
      // Отключаем другую специальную опцию
      if (setting === 'specific') {
        newFlopSettings.ranges = false;
      } else if (setting === 'ranges') {
        newFlopSettings.specific = false;
      }
    }
    
    newFlopSettings[setting as keyof typeof newFlopSettings] = value as any;
    
    onChange({
      ...settings,
      flopSettings: newFlopSettings
    });
  };

  const handleSpecificFlopCardsChange = (cards: Card[]) => {
    onChange({
      ...settings,
      flopSettings: {
        ...settings.flopSettings,
        specificCards: cards
      }
    });
  };

  const handleFlopRangeChange = (ranges: FlopRange) => {
    onChange({
      ...settings,
      flopSettings: {
        ...settings.flopSettings,
        rangeSettings: ranges
      }
    });
  };

  const handleTurnSettingChange = (setting: string, value: any) => {
    onChange({
      ...settings,
      turnSettings: {
        ...settings.turnSettings,
        [setting]: value
      }
    });
  };

  const handleTurnCardChange = (cards: Card[]) => {
    onChange({
      ...settings,
      turnSettings: {
        ...settings.turnSettings,
        specificCard: cards.length > 0 ? cards[0] : null
      }
    });
  };

  const handleRiverSettingChange = (setting: string, value: any) => {
    onChange({
      ...settings,
      riverSettings: {
        ...settings.riverSettings,
        [setting]: value
      }
    });
  };

  const handleRiverCardChange = (cards: Card[]) => {
    onChange({
      ...settings,
      riverSettings: {
        ...settings.riverSettings,
        specificCard: cards.length > 0 ? cards[0] : null
      }
    });
  };

  const flopOptions = [
    { key: 'random', label: 'Случайный флоп', description: 'Любые три карты' },
    { key: 'twoTone', label: 'Двухмастный', description: 'Две карты одной масти + одна другой' },
    { key: 'rainbow', label: 'Радуга', description: 'Три карты разных мастей' },
    { key: 'monotone', label: 'Монотонный', description: 'Три карты одной масти' },
    { key: 'paired', label: 'Спаренный', description: 'Две карты одного номинала' },
    { key: 'specific', label: 'Конкретные карты', description: 'Выберите точные карты флопа' },
    { key: 'ranges', label: 'Диапазоны карт', description: 'Задайте диапазоны для высокой, средней и низкой карты' }
  ];

  return (
    <div className="board-settings">
      <div className="street-settings">
        <h3>🃏 Флоп</h3>
        <div className="checkbox-group">
          {flopOptions.map(option => (
            <div key={option.key} className="checkbox-item">
              <input
                type="checkbox"
                id={`flop-${option.key}`}
                checked={settings.flopSettings[option.key as keyof typeof settings.flopSettings] as boolean}
                onChange={(e) => handleFlopSettingChange(option.key, e.target.checked)}
              />
              <label htmlFor={`flop-${option.key}`} title={option.description}>
                {option.label}
              </label>
            </div>
          ))}
        </div>
        
        {settings.flopSettings.specific && (
          <div style={{ marginTop: '20px' }}>
            <CardSelector
              selectedCards={settings.flopSettings.specificCards || []}
              onChange={handleSpecificFlopCardsChange}
              maxCards={3}
              label="🎯 Выберите карты флопа"
            />
          </div>
        )}

        {settings.flopSettings.ranges && (
          <div style={{ marginTop: '20px' }}>
            <FlopRangeSelector
              selectedRanges={settings.flopSettings.rangeSettings || { high: [], middle: [], low: [] }}
              onChange={handleFlopRangeChange}
            />
          </div>
        )}
        
        {!settings.flopSettings.specific && !settings.flopSettings.ranges && (
          <div style={{ marginTop: '15px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            <p>💡 Можно выбрать несколько опций кроме "Случайный"</p>
            <p>Система будет случайно выбирать из активных типов флопов</p>
          </div>
        )}
      </div>

      <div className="street-settings">
        <h3>🃏 Тёрн</h3>
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="turn-enabled"
              checked={settings.turnSettings.enabled}
              onChange={(e) => handleTurnSettingChange('enabled', e.target.checked)}
            />
            <label htmlFor="turn-enabled">
              Включить тёрн
            </label>
          </div>
          
          {settings.turnSettings.enabled && (
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="turn-specific"
                checked={settings.turnSettings.specific}
                onChange={(e) => handleTurnSettingChange('specific', e.target.checked)}
              />
              <label htmlFor="turn-specific">
                Конкретная карта тёрна
              </label>
            </div>
          )}
        </div>
        
        {settings.turnSettings.enabled && settings.turnSettings.specific && (
          <div style={{ marginTop: '20px' }}>
            <CardSelector
              selectedCards={settings.turnSettings.specificCard ? [settings.turnSettings.specificCard] : []}
              onChange={handleTurnCardChange}
              maxCards={1}
              label="🎯 Выберите карту тёрна"
            />
          </div>
        )}
        
        {settings.turnSettings.enabled && !settings.turnSettings.specific && (
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            <p>🎲 Тёрн будет случайным</p>
          </div>
        )}
      </div>

      <div className="street-settings">
        <h3>🃏 Ривер</h3>
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="river-enabled"
              checked={settings.riverSettings.enabled}
              onChange={(e) => handleRiverSettingChange('enabled', e.target.checked)}
            />
            <label htmlFor="river-enabled">
              Включить ривер
            </label>
          </div>
          
          {settings.riverSettings.enabled && (
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="river-specific"
                checked={settings.riverSettings.specific}
                onChange={(e) => handleRiverSettingChange('specific', e.target.checked)}
              />
              <label htmlFor="river-specific">
                Конкретная карта ривера
              </label>
            </div>
          )}
        </div>
        
        {settings.riverSettings.enabled && settings.riverSettings.specific && (
          <div style={{ marginTop: '20px' }}>
            <CardSelector
              selectedCards={settings.riverSettings.specificCard ? [settings.riverSettings.specificCard] : []}
              onChange={handleRiverCardChange}
              maxCards={1}
              label="🎯 Выберите карту ривера"
            />
          </div>
        )}
        
        {settings.riverSettings.enabled && !settings.riverSettings.specific && (
          <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            <p>🎲 Ривер будет случайным</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardSettings; 