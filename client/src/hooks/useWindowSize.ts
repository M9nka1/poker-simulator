import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

interface ScaleInfo {
  scale: number;
  containerWidth: number;
  containerHeight: number;
  isSmallScreen: boolean;
  isMobileScreen: boolean;
}

// Базовые размеры для расчета масштаба
const BASE_WIDTH = 1200;
const BASE_HEIGHT = 800;
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.5;

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export function useResponsiveScale(): ScaleInfo {
  const { width, height } = useWindowSize();

  // Вычисляем масштаб на основе размеров окна
  const scaleX = width / BASE_WIDTH;
  const scaleY = height / BASE_HEIGHT;
  
  // Используем меньший масштаб, чтобы все поместилось
  let scale = Math.min(scaleX, scaleY);
  
  // Ограничиваем масштаб
  scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
  
  // Вычисляем размеры контейнера с учетом масштаба
  const containerWidth = BASE_WIDTH * scale;
  const containerHeight = BASE_HEIGHT * scale;
  
  // Определяем типы экранов
  const isSmallScreen = width < 768;
  const isMobileScreen = width < 480;

  return {
    scale,
    containerWidth,
    containerHeight,
    isSmallScreen,
    isMobileScreen
  };
}

export default useWindowSize; 