import { useEffect, useState } from 'react';
import { etaMinutesFor } from './transportSteps';

/**
 * ETATimer from ambulance/app.js as a hook: a per-step countdown that
 * restarts whenever the request or its status changes and is cleared on
 * unmount. (The original wrote into `#eta-<id>`, an element the page never
 * had, so its banner always read "--:--".)
 * Returns "m:ss", "Completed" once the estimate has elapsed, or null when the
 * step has no estimate.
 */
export default function useTransportEta(requestId, status) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    const minutes = etaMinutesFor(status);
    if (!requestId || !minutes) { setRemaining(null); return undefined; }
    let seconds = minutes * 60;
    setRemaining(seconds);
    const timer = setInterval(() => {
      seconds -= 1;
      setRemaining(seconds);
      if (seconds <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [requestId, status]);

  if (remaining === null) return null;
  if (remaining <= 0) return 'Completed';
  return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
}
