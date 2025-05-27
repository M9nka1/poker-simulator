import React, { ReactNode } from 'react';
import { useResponsiveScale } from '../hooks/useWindowSize';
import './ResponsiveContainer.css';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minScale?: number;
  maxScale?: number;
  baseWidth?: number;
  baseHeight?: number;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  style = {},
  minScale = 0.4,
  maxScale = 1.5,
  baseWidth = 1200,
  baseHeight = 800
}) => {
  const { scale, containerWidth, containerHeight, isSmallScreen, isMobileScreen } = useResponsiveScale();

  // Адаптивные стили контейнера
  const containerStyles: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: 'var(--primary-bg, #0a0a0a)',
    ...style
  };

  // Стили для масштабируемого содержимого
  const contentStyles: React.CSSProperties = {
    width: `${baseWidth}px`,
    height: `${baseHeight}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    position: 'relative',
    overflow: 'visible',
    transition: 'transform 0.3s ease-out'
  };

  // Дополнительные классы для адаптивности
  const responsiveClasses = [
    'responsive-container',
    isSmallScreen ? 'small-screen' : '',
    isMobileScreen ? 'mobile-screen' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={responsiveClasses}
      style={containerStyles}
      data-scale={scale.toFixed(2)}
      data-container-size={`${containerWidth}x${containerHeight}`}
    >
      <div 
        className="responsive-content"
        style={contentStyles}
      >
        {children}
      </div>
      
      {/* Индикатор масштаба (только в режиме разработки) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          Scale: {(scale * 100).toFixed(0)}%<br/>
          Size: {Math.round(containerWidth)}×{Math.round(containerHeight)}
        </div>
      )}
    </div>
  );
};

export default ResponsiveContainer; 