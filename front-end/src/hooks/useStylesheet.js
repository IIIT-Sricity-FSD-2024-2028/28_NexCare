import { useEffect } from 'react';

// Some HTML pages shipped stylesheets full of element selectors (`body`, `h1`,
// `.btn-primary`, `.container`) that would fight the portal CSS if they were
// bundled globally. This mounts such a stylesheet as a <link> for the life of
// the route and removes it on unmount, so the file can stay a verbatim copy.
//
//   import landingCss from '../../styles/landing.css?url';
//   useStylesheet(landingCss);
const refCounts = new Map();

export default function useStylesheet(href) {
  useEffect(() => {
    if (!href) return undefined;
    let link = document.querySelector(`link[data-route-css="${href}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.routeCss = href;
      document.head.appendChild(link);
    }
    refCounts.set(href, (refCounts.get(href) || 0) + 1);
    return () => {
      const n = (refCounts.get(href) || 1) - 1;
      refCounts.set(href, n);
      if (n <= 0) {
        refCounts.delete(href);
        link.remove();
      }
    };
  }, [href]);
}
