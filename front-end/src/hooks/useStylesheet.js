import { useEffect, useLayoutEffect } from 'react';

// Some HTML pages shipped stylesheets full of element selectors (`body`, `h1`,
// `.btn-primary`, `.container`) that would fight the portal CSS if they were
// bundled globally. This mounts such a stylesheet as a <link> for the life of
// the route and disables it on unmount, keeping it cached in memory so
// navigating back never produces a flash of unstyled content (FOUC).
//
//   import landingCss from '../../styles/landing.css?url';
//   useStylesheet(landingCss);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const refCounts = new Map();
const disableTimers = new Map();

export default function useStylesheet(href) {
  useIsomorphicLayoutEffect(() => {
    if (!href) return undefined;

    // If there was a pending disable timer for this href, cancel it immediately
    if (disableTimers.has(href)) {
      clearTimeout(disableTimers.get(href));
      disableTimers.delete(href);
    }

    let link = document.querySelector(`link[data-route-css="${href}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.routeCss = href;
      document.head.appendChild(link);
    } else {
      link.disabled = false;
    }
    refCounts.set(href, (refCounts.get(href) || 0) + 1);

    return () => {
      const n = (refCounts.get(href) || 1) - 1;
      refCounts.set(href, n);
      if (n <= 0) {
        refCounts.delete(href);
        // Delay disabling so back/forward navigation or fast page swaps don't cause FOUC
        const timer = setTimeout(() => {
          if (!refCounts.has(href)) {
            const currentLink = document.querySelector(`link[data-route-css="${href}"]`);
            if (currentLink) {
              currentLink.disabled = true;
            }
          }
          disableTimers.delete(href);
        }, 1500);
        disableTimers.set(href, timer);
      }
    };
  }, [href]);
}
