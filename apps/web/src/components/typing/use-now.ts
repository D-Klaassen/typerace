"use client";

import { useEffect, useEffectEvent, useState } from "react";

/** Re-reads a clock every animation frame; null until the first frame. */
export function useNow(read: () => number): number | null {
  const [now, setNow] = useState<number | null>(null);
  const readClock = useEffectEvent(read);

  useEffect(() => {
    let frame = requestAnimationFrame(function loop() {
      setNow(readClock());
      frame = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return now;
}
