(() => {
  'use strict';

  const body = document.body;
  body.classList.add('js-enabled');

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const archive = document.getElementById('archive');
  const nav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  const themeToggle = document.getElementById('themeToggle');
  const meter = document.getElementById('scrollMeter');
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const root = document.documentElement;

  let entered = false;
  let introRevealed = false;
  let introTimer = 0;
  let themeTransitionRunning = false;

  const updateTheme = (theme) => {
    root.dataset.theme = theme;

    if (themeToggle) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      const label = `Switch to ${nextTheme} theme`;

      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      themeToggle.title = label;
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');

    if (themeColor) {
      themeColor.content = theme === 'light' ? '#F8F9F5' : '#080808';
    }

    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch (error) {
      console.warn('Unable to save the portfolio theme preference.', error);
    }
  };

  const makeInkShape = (x, y, radius, width, height) => {
    const points = [];
    const pointCount = 88;
    const tendrils = [
      [-2.25, 0.12, 0.13],
      [-0.74, 0.15, 0.17],
      [0.58, 0.11, 0.14],
      [2.4, 0.14, 0.16]
    ];

    for (let index = 0; index < pointCount; index += 1) {
      const angle = (index / pointCount) * Math.PI * 2;
      const branches = tendrils.reduce((total, [direction, spread, length]) => {
        const difference = Math.atan2(
          Math.sin(angle - direction),
          Math.cos(angle - direction)
        );

        return total + length * Math.exp(-((difference / spread) ** 2));
      }, 0);
      const contour =
        1 +
        0.105 * Math.sin(angle * 3 + 0.35) +
        0.075 * Math.sin(angle * 5 - 1.1) +
        0.045 * Math.sin(angle * 9 + 1.7) +
        0.018 * Math.sin(angle * 17 - 0.6) +
        branches;
      const pointX = x + Math.cos(angle) * radius * contour;
      const pointY = y + Math.sin(angle) * radius * contour;

      points.push(
        `${(pointX / width) * 100}% ${(pointY / height) * 100}%`
      );
    }

    return `polygon(${points.join(',')})`;
  };

  const switchTheme = () => {
    if (!themeToggle || themeTransitionRunning) return;

    const nextTheme =
      root.dataset.theme === 'light' ? 'dark' : 'light';
    const applyTheme = () => updateTheme(nextTheme);

    if (
      reducedMotion ||
      typeof document.startViewTransition !== 'function'
    ) {
      if (!reducedMotion) {
        root.classList.add('theme-switching');
        window.setTimeout(() => {
          root.classList.remove('theme-switching');
        }, 420);
      }

      applyTheme();
      return;
    }

    const rect = themeToggle.getBoundingClientRect();
    const width = Math.max(document.documentElement.clientWidth, 1);
    const height = Math.max(document.documentElement.clientHeight, 1);
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const farthestCorner = Math.max(
      Math.hypot(originX, originY),
      Math.hypot(width - originX, originY),
      Math.hypot(originX, height - originY),
      Math.hypot(width - originX, height - originY)
    );
    const startShape = makeInkShape(originX, originY, 5, width, height);
    const endShape = makeInkShape(
      originX,
      originY,
      (farthestCorner + 40) / 0.72,
      width,
      height
    );

    root.style.setProperty('--theme-wipe-start', startShape);
    root.style.setProperty('--theme-wipe-end', endShape);
    themeTransitionRunning = true;

    let transition;

    try {
      transition = document.startViewTransition(applyTheme);
    } catch (error) {
      console.error('Unable to start the theme transition.', error);
      root.style.removeProperty('--theme-wipe-start');
      root.style.removeProperty('--theme-wipe-end');
      themeTransitionRunning = false;
      applyTheme();
      return;
    }

    transition.finished.then(
      () => {
        root.style.removeProperty('--theme-wipe-start');
        root.style.removeProperty('--theme-wipe-end');
        themeTransitionRunning = false;
      },
      (error) => {
        console.error('The theme transition was interrupted.', error);
        root.style.removeProperty('--theme-wipe-start');
        root.style.removeProperty('--theme-wipe-end');
        themeTransitionRunning = false;
      }
    );
  };

  if (themeToggle) {
    updateTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
    themeToggle.addEventListener('click', switchTheme);
  }

  // Split the name into individual characters for the entrance animation.
  document.querySelectorAll('[data-split]').forEach((element) => {
    if (element.dataset.splitReady === 'true') return;

    const originalText = element.textContent.trim();

    element.dataset.splitReady = 'true';
    element.setAttribute('aria-label', originalText);
    element.textContent = '';

    [...originalText].forEach((character, index) => {
      const span = document.createElement('span');

      span.className = 'char';
      span.style.setProperty('--i', index);
      span.setAttribute('aria-hidden', 'true');
      span.textContent = character === ' ' ? '\u00a0' : character;

      element.appendChild(span);
    });
  });

  // Wait for fonts before starting the entrance animation.
  const ready = () => {
    requestAnimationFrame(() => {
      body.classList.add('is-ready');
    });
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ready).catch(ready);
  } else {
    window.addEventListener('load', ready, { once: true });
  }

  if (reducedMotion) {
    body.classList.add('is-ready');
  }

  // Reveal the rest of the hero after the name entrance.
  const revealIntro = () => {
    if (
      introRevealed ||
      !body.classList.contains('intro-open')
    ) {
      return;
    }

    introRevealed = true;
    body.classList.add('name-revealed');

    // Unlock normal page scrolling when the intro blackout has finished fading.
    const blackout = document.getElementById('introBlackout');
    if (reducedMotion || !blackout) {
      enterSite(null, false);
    } else {
      const finishTransition = (event) => {
        if (event.target !== blackout || event.propertyName !== 'opacity') return;
        blackout.removeEventListener('transitionend', finishTransition);
        enterSite(null, false);
      };
      blackout.addEventListener('transitionend', finishTransition);
    }
  };

  const beginIntro = () => {
    if (reducedMotion) {
      revealIntro();
      return;
    }

    introTimer = window.setTimeout(revealIntro, 1850);
  };

  // Close the responsive navigation menu.
  const closeMenu = () => {
    if (!nav || !navToggle) return;

    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
  };

  // Enter the portfolio and optionally scroll to a section.
  const enterSite = (target = '#work', move = true) => {
    if (!entered) {
      entered = true;

      body.classList.remove('intro-open');
      body.classList.add('entered');

      if (archive) {
        archive.hidden = false;
      }

      const intro = document.getElementById('home');

      if (intro) {
        intro.setAttribute(
          'aria-label',
          'Portfolio introduction'
        );
      }

      if (introTimer) {
        window.clearTimeout(introTimer);
      }
    }

    closeMenu();

    if (!move || !target) return;

    const destination = document.querySelector(target);

    if (!destination) return;

    destination.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  beginIntro();

  // Main hero CTA.
  const enterLink = document.getElementById('enterWork');

  if (enterLink) {
    enterLink.addEventListener('click', (event) => {
      event.preventDefault();
      enterSite(enterLink.getAttribute('href'), true);
    });
  }

  // Navigation and internal links.
  document
    .querySelectorAll(
      '.nav-link, .wordmark, .quiet-link, ' +
      '.text-link[href^="#"], .back-top, .skip-link'
    )
    .forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');

        if (!href || !href.startsWith('#')) return;

        if (body.classList.contains('intro-open')) {
          event.preventDefault();

          enterSite(href, href !== '#home');

          return;
        }

        closeMenu();
      });
    });

  // Mobile navigation toggle.
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen =
        navToggle.getAttribute('aria-expanded') === 'true';

      navToggle.setAttribute(
        'aria-expanded',
        String(!isOpen)
      );

      navToggle.setAttribute(
        'aria-label',
        isOpen ? 'Open navigation' : 'Close navigation'
      );

      nav.classList.toggle('is-open', !isOpen);
    });
  }

  // Keyboard interactions.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }

    if (
      body.classList.contains('intro-open') &&
      ['ArrowDown', 'PageDown', ' '].includes(event.key)
    ) {
      // Unlock the page and preserve the browser's normal key scrolling.
      enterSite(null, false);
    }
  });

  // Scrolling past the opening enters the portfolio.
  let touchStartY = 0;

  window.addEventListener(
    'touchstart',
    (event) => {
      if (
        body.classList.contains('intro-open') &&
        event.touches.length
      ) {
        touchStartY = event.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    (event) => {
      if (
        !body.classList.contains('intro-open') ||
        !event.touches.length
      ) {
        return;
      }

      const currentY = event.touches[0].clientY;

      if (touchStartY - currentY > 12) {
        enterSite(null, false);
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'wheel',
    (event) => {
      if (
        body.classList.contains('intro-open') &&
        event.deltaY > 8
      ) {
        enterSite(null, false);
      }
    },
    { passive: true }
  );

  // Scroll reveal animations.
  const revealItems = [
    ...document.querySelectorAll('[data-reveal]')
  ];

  revealItems.forEach((item, index) => {
    if (item.classList.contains('project')) {
      item.style.setProperty(
        '--reveal-delay',
        `${(index % 4) * 70}ms`
      );
    }
  });

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -35px 0px'
      }
    );

    revealItems.forEach((item) => {
      revealObserver.observe(item);
    });

    // Highlight the active navigation section.
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.id;

          navLinks.forEach((link) => {
            link.classList.toggle(
              'is-current',
              link.getAttribute('href') === `#${id}`
            );
          });
        });
      },
      {
        rootMargin: '-25% 0px -60% 0px',
        threshold: 0
      }
    );

    ['home', 'about', 'work', 'certificates', 'contact']
      .forEach((id) => {
        const section = document.getElementById(id);

        if (section) {
          sectionObserver.observe(section);
        }
      });
  } else {
    // Fallback for browsers without IntersectionObserver.
    revealItems.forEach((item) => {
      item.classList.add('in-view');
    });
  }

  // Scroll progress indicator.
  const updateMeter = () => {
    if (!meter) return;

    const maxScroll =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress =
      maxScroll > 0
        ? (window.scrollY / maxScroll) * 100
        : 0;

    meter.style.width =
      `${Math.max(0, Math.min(100, progress))}%`;
  };

  window.addEventListener(
    'scroll',
    updateMeter,
    { passive: true }
  );

  window.addEventListener(
    'resize',
    updateMeter,
    { passive: true }
  );

  updateMeter();

  // Subtle project-image parallax on desktop.
  const canParallax =
    window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    ).matches && !reducedMotion;

  if (canParallax) {
    document
      .querySelectorAll('.project-visual img')
      .forEach((image) => {
        const visual = image.closest('.project-visual');

        if (!visual) return;

        visual.addEventListener(
          'pointermove',
          (event) => {
            const rect = visual.getBoundingClientRect();

            const x =
              (event.clientX - rect.left) /
              rect.width - 0.5;

            const y =
              (event.clientY - rect.top) /
              rect.height - 0.5;

            image.style.transform =
              `translate(${x * 8}px, ${y * 8}px) scale(1.025)`;
          }
        );

        visual.addEventListener(
          'pointerleave',
          () => {
            image.style.transform = '';
          }
        );
      });
  }
})();
