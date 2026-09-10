(() => {
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
