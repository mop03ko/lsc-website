// ═══════════════════════════════════════
//   LIGHT STEEL CONSTRUCTION — main.js
// ═══════════════════════════════════════

// ── Form load time (spam timing check) ──
const _formLoadTime = Date.now();

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

// ── Phone input: зөвхөн тоо, 8 орон ──
const phoneInput = document.getElementById('phoneInput');
const phoneHint  = document.getElementById('phoneHint');

if (phoneInput) {
  phoneInput.addEventListener('input', () => {
    // Strip non-digits
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 8);
    const len = phoneInput.value.length;
    if (phoneHint) {
      if (len === 0) {
        phoneHint.textContent = '8 оронтой тоо оруулна уу';
        phoneHint.className = 'form-hint';
      } else if (len < 8) {
        phoneHint.textContent = `${len}/8 орон оруулсан`;
        phoneHint.className = 'form-hint form-hint-warn';
      } else {
        phoneHint.textContent = '✓ Зөв';
        phoneHint.className = 'form-hint form-hint-ok';
      }
    }
  });

  phoneInput.addEventListener('blur', () => {
    if (phoneInput.value.length > 0 && phoneInput.value.length < 8 && phoneHint) {
      phoneHint.textContent = '❌ 8 оронтой байх ёстой';
      phoneHint.className = 'form-hint form-hint-err';
    }
  });

  phoneInput.addEventListener('focus', () => {
    if (phoneHint && phoneHint.className.includes('form-hint-err')) {
      const len = phoneInput.value.length;
      phoneHint.textContent = `${len}/8 орон оруулсан`;
      phoneHint.className = 'form-hint form-hint-warn';
    }
  });
}

// ── Contact form → send.php ──
const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    formSuccess.style.display = 'none';
    formSuccess.className = 'form-success';

    // ── 1. Phone validation ──
    const phoneVal = (form.querySelector('[name=phone]').value || '').replace(/\D/g, '');
    if (phoneVal.length !== 8) {
      formSuccess.style.display = 'block';
      formSuccess.textContent = '❌ Утасны дугаар 8 оронтой байх ёстой.';
      formSuccess.classList.add('form-success-err');
      return;
    }

    // ── 2. Honeypot check ──
    const hpField = form.querySelector('[name=website]');
    if (hpField && hpField.value !== '') {
      // Bot detected — silently succeed
      formSuccess.style.display = 'block';
      formSuccess.textContent = '✅ Таны мэдээлэл хүлээн авлаа. Удахгүй холбогдоно!';
      formSuccess.classList.add('form-success-ok');
      form.reset();
      return;
    }

    // ── 3. Timing check (< 2 сек = bot) ──
    if (Date.now() - _formLoadTime < 2000) {
      formSuccess.style.display = 'block';
      formSuccess.textContent = '❌ Хэт хурдан илгээгдлээ. Дахин оролдоно уу.';
      formSuccess.classList.add('form-success-err');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Илгээж байна...';

    fetch('send.php', { method: 'POST', body: new FormData(form) })
      .then(r => r.json())
      .then(res => {
        formSuccess.style.display = 'block';
        if (res.success) {
          formSuccess.textContent = '✅ ' + res.message;
          formSuccess.classList.add('form-success-ok');
          form.reset();
          if (phoneHint) {
            phoneHint.textContent = '8 оронтой тоо оруулна уу';
            phoneHint.className = 'form-hint';
          }
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
