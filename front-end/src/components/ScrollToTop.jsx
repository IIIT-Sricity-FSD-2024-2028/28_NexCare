import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ensures that whenever route navigation happens (including clicking back buttons,
 * links, or browser back/forward), the viewport scrolls immediately to the top
 * of the destination page.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const scrollToTarget = () => {
      if (!hash) {
        window.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0);
        document.body.scrollTo(0, 0);
      } else {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo(0, 0);
        }
      }
    };

    scrollToTarget();
    const rafId = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(rafId);
  }, [pathname, hash]);

  return null;
}
