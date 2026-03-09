// ═══════════════════════════════════════
//   LIGHT STEEL CONSTRUCTION — main.js
// ═══════════════════════════════════════

// ── NAV scroll effect ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});
nav.classList.toggle('scrolled', window.scrollY > 60);

// ── Mobile menu ──
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mm-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
});

// Close mobile menu on outside click
document.addEventListener('click', (e) => {
  if (!burger.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
});

// ── Scroll reveal ──
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => observer.observe(el));

// ── Active nav link on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) {
      current = sec.getAttribute('id');
    }
  });
  navLinks.forEach(a => {
    a.style.color = '';
    if (a.getAttribute('href') === `#${current}`) {
      a.style.color = 'var(--orange-light)';
    }
  });
});

// ── Contact form → send.php ──
const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Илгээж байна...';
    formSuccess.style.display = 'none';
    formSuccess.className = 'form-success';

    fetch('send.php', { method: 'POST', body: new FormData(form) })
      .then(r => r.json())
      .then(res => {
        formSuccess.style.display = 'block';
        if (res.success) {
          formSuccess.textContent = '✅ ' + res.message;
          formSuccess.classList.add('form-success-ok');
          form.reset();
        } else {
          formSuccess.textContent = '❌ ' + res.message;
          formSuccess.classList.add('form-success-err');
        }
        btn.disabled = false;
        btn.textContent = 'Илгээх';
      })
      .catch(() => {
        formSuccess.style.display = 'block';
        formSuccess.textContent = '❌ Холболт алдаа. Утсаар холбогдоно уу: +976 9908 0126';
        formSuccess.classList.add('form-success-err');
        btn.disabled = false;
        btn.textContent = 'Илгээх';
      });
  });
}

// ── Smooth anchor scroll with nav offset ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
