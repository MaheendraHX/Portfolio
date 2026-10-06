(() => {
  'use strict';

  document.body.classList.add('js-enabled');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const archive = document.getElementById('archive');
  const nav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  const meter = document.getElementById('scrollMeter');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  let entered = false;

  // Keep the original site's character-by-character, cinematic name entrance.
  document.querySelectorAll('[data-split]').forEach((line) => {
    const label = line.textContent.trim();
    line.setAttribute('aria-label', label);
    line.textContent = '';
    [...label].forEach((character, index) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--i', index);
      span.textContent = character;
      line.append(span);
    });
  });

  const ready = () => requestAnimationFrame(() => body.classList.add('is-ready'));
  if (document.fonts?.ready) document.fonts.ready.then(ready); else window.addEventListener('load', ready, { once: true });
  if (reducedMotion) body.classList.add('is-ready');

  const closeMenu = () => {
    nav?.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Open navigation');
  };

  const enterSite = (target = '#work', move = true) => {
    if (!entered) {
      entered = true;
      body.classList.remove('intro-open');
      body.classList.add('entered');
      archive.hidden = false;
      const intro = document.getElementById('home');
      intro?.setAttribute('aria-label', 'Introduction');
    }
    closeMenu();
    if (!move || !target) return;
    const destination = document.querySelector(target);
    if (!destination) return;
    requestAnimationFrame(() => destination.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }));
  };

  document.getElementById('enterWork')?.addEventListener('click', (event) => {
    event.preventDefault();
    enterSite('#work');
  });

  document.querySelectorAll('.nav-link, .wordmark, .quiet-link, .text-link[href^="#"], .back-top, .skip-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = link.getAttribute('href');
      if (!target?.startsWith('#')) return;
      event.preventDefault();
      if (target === '#home' && entered) {
        closeMenu();
        document.getElementById('home')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        return;
      }
      enterSite(target === '#home' ? '#home' : target, true);
    });
  });

  navToggle?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('is-open') ?? false;
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      closeMenu();
      navToggle?.focus();
    }
    // While the opening scene is active, an intentional downward scroll enters the archive.
    if (!entered && event.key === 'ArrowDown' && document.activeElement === document.body) enterSite('#about');
  });

  // Keep the previous scroll/touch reveal affordance, while preserving ordinary scrolling thereafter.
  let touchStartY = 0;
  window.addEventListener('touchstart', (event) => { touchStartY = event.touches[0]?.clientY ?? 0; }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    if (!entered && touchStartY - (event.touches[0]?.clientY ?? touchStartY) > 24) enterSite('#about');
  }, { passive: true });
  window.addEventListener('wheel', (event) => {
    if (!entered && event.deltaY > 12) enterSite('#about');
  }, { passive: true });

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  revealItems.forEach((item, index) => {
    if (item.classList.contains('project')) item.style.setProperty('--reveal-delay', `${(index % 3) * 65}ms`);
  });
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('in-view', entry.isIntersecting));
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));

  const sections = [...document.querySelectorAll('#home, #work, #about, #certificates, #contact')];
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const current = entry.target.id;
      navLinks.forEach((link) => link.classList.toggle('is-current', link.getAttribute('href') === `#${current}`));
    });
  }, { threshold: 0.28, rootMargin: '-15% 0px -48% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));

  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      const percent = maximum > 0 ? (window.scrollY / maximum) * 100 : 0;
      if (meter) meter.style.width = `${percent}%`;
      scrollFrame = 0;
    });
  }, { passive: true });

  // Tiny cursor-led parallax, limited to image marks and only for a fine pointer.
  if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.project-visual img').forEach((image) => {
      const parent = image.closest('.project-visual');
      if (!parent) return;
      parent.addEventListener('pointermove', (event) => {
        const bounds = parent.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        image.style.translate = `${x * 7}px ${y * 7}px`;
      });
      parent.addEventListener('pointerleave', () => {
        image.style.translate = '0 0';
      });
    });
  
  }
})();
