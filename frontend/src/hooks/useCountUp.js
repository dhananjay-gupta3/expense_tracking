import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ease-out cubic — fast start, gentle landing
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Animates a number from its previous value to `target`.
 * Snaps instantly on first render and when the user prefers reduced motion.
 */
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return undefined;

    if (prefersReducedMotion()) {
      fromRef.current = target;
      setValue(target);
      return undefined;
    }

    let start = null;

    const tick = (now) => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const current = from + (target - from) * easeOut(progress);
      // Remember what's on screen so an interrupted animation resumes
      // from the displayed value instead of jumping
      fromRef.current = current;
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

export default useCountUp;
