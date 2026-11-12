import { useEffect, useState } from 'react';

/**
 * Normalized cursor position in [-1, 1] across the viewport using rAF throttling.
 */
export function usePointerParallax(maxOffset = 3.2): { dx: number; dy: number } {
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });

  useEffect(() => {
    let ticking = false;

    const handlePointer = (clientX: number, clientY: number) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const winW = window.innerWidth || 1;
        const winH = window.innerHeight || 1;
        const normX = Math.max(-1, Math.min(1, (clientX / winW - 0.5) * 2));
        const normY = Math.max(-1, Math.min(1, (clientY / winH - 0.5) * 2));

        setOffset({
          dx: normX * maxOffset,
          dy: normY * maxOffset,
        });
        ticking = false;
      });
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [maxOffset]);

  return offset;
}

