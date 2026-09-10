(() => {
  // Tipografia mais próxima do modelo de referência:
  // serifada editorial nos títulos + sans neutra no restante da interface.
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(fontLink);

  const typography = document.createElement('style');
  typography.textContent = `
    body, button, input, textarea, select {
      font-family: 'Inter', Arial, sans-serif;
    }
    .desktop-nav a,
    .mobile-panel a,
    .btn,
    .eyebrow,
    .hero-kicker,
    .hero-copy p,
    .hero-notes,
    .section-heading p,
    .split-heading p,
    .trust-card,
    .guideline-card,
    .step-card,
    .timeline-card,
    .safety-card,
    .tracking-card p,
    .commitment-list,
    .faq-list,
    .page-title p,
    .form-card,
    .lookup-card,
    .result-card,
    .footer {
      font-family: 'Inter', Arial, sans-serif;
    }
    .hero-copy h1,
    .section-heading h2,
    .split-heading h2,
    .commitment-copy h2,
    .tracking-card h2,
    .cta-band h2,
    .page-title h1 {
      font-family: 'DM Serif Display', Georgia, serif;
      font-weight: 400;
      letter-spacing: -.025em;
    }
    .accent-word {
      font-family: 'DM Serif Display', Georgia, serif;
      font-style: italic;
      font-weight: 400;
      letter-spacing: -.02em;
    }
    .trust-card h3,
    .guideline-card h3,
    .guideline-item strong,
    .step-card h3,
    .timeline-step h3,
    .safety-card h3,
    .commitment-list h3,
    .faq-question,
    .tracking-badges,
    .btn {
      font-family: 'Inter', Arial, sans-serif;
    }
  `;
  document.head.appendChild(typography);

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobilePanel = document.querySelector('.mobile-panel');
  const stickyCta = document.querySelector('.sticky-cta');
  const progressBar = document.querySelector('.scroll-progress span');
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];

  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (stickyCta) stickyCta.classList.toggle('is-visible', y > Math.min(560, window.innerHeight * .62));

    if (progressBar) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressBar.style.transform = `scaleX(${Math.min(1, y / max)})`;
    }

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      parallaxItems.forEach(el => {
        const factor = Number(el.dataset.parallax || 0);
        const rect = el.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        const translate = Math.max(-22, Math.min(22, -centerOffset * factor));
        el.style.transform = `translate3d(0, ${translate}px, 0)`;
      });
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach(el => observer.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('is-visible'));
  }

  if (menuToggle && mobilePanel) {
    menuToggle.addEventListener('click', () => {
      const open = mobilePanel.classList.toggle('is-open');
      document.body.classList.toggle('menu-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    mobilePanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      mobilePanel.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const willOpen = !item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-answer').style.maxHeight = null;
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
      answer.style.maxHeight = willOpen ? `${answer.scrollHeight}px` : null;
    });
  });
})();
