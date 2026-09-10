(() => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const mobilePanel = document.querySelector('.mobile-panel');
  const stickyCta = document.querySelector('.sticky-cta');

  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
    if (stickyCta) stickyCta.classList.toggle('is-visible', window.scrollY > Math.min(520, window.innerHeight * .58));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
