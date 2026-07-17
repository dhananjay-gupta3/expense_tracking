import { flushSync } from 'react-dom';

/**
 * Runs a state update inside a View Transition so the browser animates
 * list reorders, insertions and removals. Falls back to a plain update
 * where unsupported or when the user prefers reduced motion.
 */
export function withViewTransition(update) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.startViewTransition || reduceMotion) {
    update();
    return;
  }

  document.startViewTransition(() => {
    flushSync(update);
  });
}
