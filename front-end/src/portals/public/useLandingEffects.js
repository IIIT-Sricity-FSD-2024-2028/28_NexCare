import { useEffect } from 'react';

// front-end/landing/landing.js as one effect over the page root: navbar shadow
// on scroll, smooth-scroll anchors, reveal-on-scroll, the animated counters,
// hero fade-in, parallax, button press scaling and the active nav link. The
// page is static marketing content, so this is DOM work on purpose — there is
// no state a component would own.
export default function useLandingEffects(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const cleanups = [];
    const on = (target, evt, fn, opts) => {
      target.addEventListener(evt, fn, opts);
      cleanups.push(() => target.removeEventListener(evt, fn, opts));
    };

    // Navbar scroll effect
    const navbar = root.querySelector('#navbar');
    on(window, 'scroll', () => navbar && navbar.classList.toggle('scrolled', window.scrollY > 20));

    // Smooth scroll for in-page anchors
    root.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      on(anchor, 'click', (e) => {
        const target = root.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Counter animation
    const timers = [];
    function animateCounter(element, target, duration = 2000) {
      const totalFrames = Math.round(duration / (1000 / 60));
      const step = target / totalFrames;
      let start = 0;
      let frame = 0;
      element.textContent = '0';
      const timer = setInterval(() => {
        frame += 1;
        start += step;
        if (frame >= totalFrames) {
          element.textContent = `${target.toLocaleString()}+`;
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(start).toLocaleString();
        }
      }, 1000 / 60);
      timers.push(timer);
    }

    // Reveal + counters
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('active');
        if (entry.target.classList.contains('stat-number')) {
          if (entry.target.classList.contains('counted')) return;
          entry.target.classList.add('counted');
          animateCounter(entry.target, parseInt(entry.target.dataset.target, 10));
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    root.querySelectorAll('.feature-card, .role-card, .step, .benefit-card, .testimonial-card, .dashboard-card-preview, .stat-card-large, .section-header')
      .forEach((el) => { el.classList.add('reveal'); observer.observe(el); });
    root.querySelectorAll('.stat-number').forEach((el) => observer.observe(el));
    cleanups.push(() => observer.disconnect());
    cleanups.push(() => timers.forEach(clearInterval));

    // Hero load animation (the HTML did this on window load; the route is already loaded)
    const heroContent = root.querySelector('.hero-content');
    const heroIllustration = root.querySelector('.hero-illustration');
    requestAnimationFrame(() => {
      if (heroContent) { heroContent.style.opacity = '1'; heroContent.style.transform = 'translateY(0)'; }
      if (heroIllustration) { heroIllustration.style.opacity = '1'; heroIllustration.style.transform = 'translateX(0)'; }
    });

    // Parallax
    on(window, 'scroll', () => {
      if (!heroIllustration) return;
      const scroll = window.pageYOffset;
      if (scroll < window.innerHeight) heroIllustration.style.transform = `translateY(${scroll * 0.1}px)`;
    });

    // Button hover / press scaling
    root.querySelectorAll('.btn-primary, .btn-outline, .btn-white, .btn-outline-white, .btn-signin').forEach((button) => {
      on(button, 'mouseenter', () => { button.style.transform = 'scale(1.05)'; });
      on(button, 'mouseleave', () => { button.style.transform = 'scale(1)'; });
      on(button, 'mousedown', () => { button.style.transform = 'scale(0.95)'; });
      on(button, 'mouseup', () => { button.style.transform = 'scale(1.05)'; });
    });

    // Active nav link
    on(window, 'scroll', () => {
      let current = '';
      root.querySelectorAll('section[id]').forEach((section) => {
        if (window.pageYOffset >= section.offsetTop - 200) current = section.getAttribute('id');
      });
      root.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
      });
    });

    document.body.classList.add('loaded');
    cleanups.push(() => document.body.classList.remove('loaded'));

    return () => cleanups.forEach((fn) => fn());
  }, [rootRef]);
}
