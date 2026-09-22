import { useEffect, useRef } from 'react';

/**
 * Run `fn` now and every `intervalMs` while mounted (and while the tab is
 * visible), with the interval cleared on unmount — the replacement for the
 * bare `setInterval(refreshAllViews, 5000)` the ambulance page never cleared.
 * `fn` may change between renders; the latest one is called.
 */
export default function usePolling(fn, intervalMs, enabled = true) {
  const latest = useRef(fn);
  latest.current = fn;

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;
    let timer = null;
    const tick = () => { if (!document.hidden) latest.current(); };
    const start = () => { if (!timer) timer = setInterval(tick, intervalMs); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVisibility = () => { if (document.hidden) stop(); else { tick(); start(); } };
    tick();
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [intervalMs, enabled]);
}
