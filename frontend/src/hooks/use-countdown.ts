import { useState, useEffect } from "react";

export function useCountdown(endsAt: number | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    let rafId: number;
    const tick = () => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r > 0) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [endsAt]);
  return remaining;
}
