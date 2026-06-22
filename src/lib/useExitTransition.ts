import { useState } from "react";

// Keeps a value rendered through its closing animation.
// When `active` goes null the previous value stays with `isClosing` true until `onClosed` fires, then it drops.
// same mount-through-close idea as the menu and tool window, reusable for anything driven by a nullable value.
export function useExitTransition<T>(active: T | null) {
  const [rendered, setRendered] = useState(active);
  const [isClosing, setIsClosing] = useState(false);
  // Baselines `active` so the adjustment runs once per change, not every render (which would loop).
  const [prevActive, setPrevActive] = useState(active);

  if (active !== prevActive) {
    setPrevActive(active);
    if (active) {
      setRendered(active);
      setIsClosing(false);
    } else if (rendered) {
      setIsClosing(true);
    }
  }

  const onClosed = () => {
    setRendered(null);
    setIsClosing(false);
  };

  return { rendered, isClosing, onClosed };
}
