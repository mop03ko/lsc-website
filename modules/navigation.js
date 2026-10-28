export function initNavigation() {
  const nav = document.getElementById('nav'),
    burger = document.getElementById('burger'),
    menu = document.getElementById('mobileMenu');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', scrollY > 40);
  update();
  window.addEventListener('scroll', update, { passive: true });
  function close(focus = false) {
    if (!menu) return;
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    if (focus) burger.focus();
  }
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close(true);
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menu.contains(e.target)) close();
    });
    document.addEventListener('focusin', (e) => {
      if (!nav.contains(e.target) && !menu.contains(e.target)) close();
    });
    matchMedia('(min-width:1121px)').addEventListener('change', () => close());
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => close()));
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', () => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) {
        target.tabIndex = -1;
        requestAnimationFrame(() => target.focus({ preventScroll: true }));
      }
    }),
  );
  const sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            document.querySelectorAll('.nav-links a').forEach((a) => {
              if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'location');
              else a.removeAttribute('aria-current');
            });
        }),
      { rootMargin: '-72px 0px -65% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
  }
}
