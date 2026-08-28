// ═══════════════════════════════════════
//   LIGHT STEEL CONSTRUCTION — main.js
// ═══════════════════════════════════════

// ── Form load time (spam timing check) ──
const _formLoadTime = Date.now();

// ── i18n helper: динамик текстийг идэвхтэй хэлээр буцаана ──
const t = (mn, en) => (window.LSC_LANG === 'en' ? en : mn);

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
        phoneHint.textContent = t('8 оронтой тоо оруулна уу', 'Enter an 8-digit number');
        phoneHint.className = 'form-hint';
      } else if (len < 8) {
        phoneHint.textContent = t(`${len}/8 орон оруулсан`, `${len}/8 digits entered`);
        phoneHint.className = 'form-hint form-hint-warn';
      } else {
        phoneHint.textContent = t('✓ Зөв', '✓ Valid');
        phoneHint.className = 'form-hint form-hint-ok';
      }
    }
  });

  phoneInput.addEventListener('blur', () => {
    if (phoneInput.value.length > 0 && phoneInput.value.length < 8 && phoneHint) {
      phoneHint.textContent = t('❌ 8 оронтой байх ёстой', '❌ Must be 8 digits');
      phoneHint.className = 'form-hint form-hint-err';
    }
  });

  phoneInput.addEventListener('focus', () => {
    if (phoneHint && phoneHint.className.includes('form-hint-err')) {
      const len = phoneInput.value.length;
      phoneHint.textContent = t(`${len}/8 орон оруулсан`, `${len}/8 digits entered`);
      phoneHint.className = 'form-hint form-hint-warn';
    }
  });
}

// ── Price Calculator ──
// Үнийн тохиргоо — бодит үнэ, нөхцөлөө энд шинэчилнэ
const CALC_CONFIG = {
  rates: {
    '89': 220000,   // 89мм стандарт профиль (₮/м²)
    '140': 220000   // 140мм хүчитгэсэн профиль (₮/м²)
  },
  extras: {
    screw: 3000,     // Шуруп, бэхэлгээ (₮/м²)
    design: 5000,    // Зураг төсөл (₮/м²)
    assembly: 45000  // Угсралтын ажлын хөлс (₮/м²)
  },
  payment: {
    barterCashPercent: 60, // Бартерын мөнгөөр төлөх хувь
    loan: {
      monthlyRate: 2.5,    // Сарын хүү % (тэнцүү/аннуитет төлөлтөөр)
      feePercent: 1,       // Зээл олголтын шимтгэл %
      borrowers: [
        { name: 'Иргэн', maxAmount: 50000000, feeCap: Infinity },
        { name: 'Аж ахуйн нэгж', maxAmount: 300000000, feeCap: 1500000 }
      ]
    }
  }
};

const calcSlider = document.getElementById('calcSlider');
const calcAreaInput = document.getElementById('calcAreaInput');

if (calcSlider && calcAreaInput) {
  const format = n => '₮' + Math.round(n).toLocaleString('en-US');
  const $ = id => document.getElementById(id);

  let currentType = '89';
  let payMethod = 'cash';   // cash | loan | barter
  let loanIndex = 0;
  let loanTerm = 12;
  let currentTotal = 0;

  const downPct = CALC_CONFIG.payment.barterCashPercent;
  const loanPct = 100 - downPct;

  // Бартерын хувийн тоог HTML дээрх бүх газарт тавих
  document.querySelectorAll('[data-pct="down"]').forEach(el => el.textContent = downPct);
  document.querySelectorAll('[data-pct="loan"]').forEach(el => el.textContent = loanPct);

  const updatePayments = () => {
    // Бэлэн
    $('cashTotal').textContent = format(currentTotal);

    // Зээл — тэнцүү (аннуитет) төлөлт
    const cfg = CALC_CONFIG.payment.loan;
    const borrower = cfg.borrowers[loanIndex];
    const loanAmt = Math.min(currentTotal, borrower.maxAmount);
    const loanDown = currentTotal - loanAmt;
    const r = cfg.monthlyRate / 100;
    const monthly = loanAmt * r / (1 - Math.pow(1 + r, -loanTerm));
    const fee = Math.min(loanAmt * cfg.feePercent / 100, borrower.feeCap);
    const totalPay = monthly * loanTerm + fee + loanDown;

    $('loanMonthly').textContent = format(monthly);
    $('loanMeta').textContent = t(
      `${cfg.monthlyRate}% сарын хүү · ${loanTerm} сар · тэнцүү төлөлт`,
      `${cfg.monthlyRate}% monthly interest · ${loanTerm} mo · annuity`
    );
    $('loanDownRow').style.display = loanDown > 0 ? '' : 'none';
    $('loanDown').textContent = format(loanDown);
    $('loanAmt').textContent = format(loanAmt);
    $('loanFee').textContent = format(fee);
    $('loanTotal').textContent = format(totalPay);

    // Бартер
    $('barterCash').textContent = format(currentTotal * downPct / 100);
    $('barterGoods').textContent = format(currentTotal * loanPct / 100);
  };

  const update = () => {
    const area = Math.min(400, Math.max(10, parseInt(calcAreaInput.value, 10) || 10));
    const rate = CALC_CONFIG.rates[currentType];
    const frame = area * rate;
    const screw = area * CALC_CONFIG.extras.screw;
    const design = area * CALC_CONFIG.extras.design;
    const assembly = area * CALC_CONFIG.extras.assembly;
    currentTotal = frame + screw + design + assembly;

    $('calcUnitPrice').textContent = format(rate);
    $('calcFrame').textContent = format(frame);
    $('calcScrew').textContent = format(screw);
    $('calcDesign').textContent = format(design);
    $('calcAssembly').textContent = format(assembly);
    $('calcTotal').textContent = format(currentTotal);

    updatePayments();
  };

  calcSlider.addEventListener('input', () => {
    calcAreaInput.value = calcSlider.value;
    update();
  });
  calcAreaInput.addEventListener('input', () => {
    const v = parseInt(calcAreaInput.value, 10);
    if (!isNaN(v)) calcSlider.value = Math.min(400, Math.max(10, v));
    update();
  });
  calcAreaInput.addEventListener('blur', () => {
    calcAreaInput.value = Math.min(400, Math.max(10, parseInt(calcAreaInput.value, 10) || 10));
    update();
  });

  document.querySelectorAll('.calc-type').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.calc-type').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      update();
    });
  });

  // Төлбөрийн хэлбэр сонгох
  const panels = { cash: $('payCash'), loan: $('payLoan'), barter: $('payBarter') };
  document.querySelectorAll('.pay-method').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      payMethod = btn.dataset.pay;
      Object.entries(panels).forEach(([key, panel]) => {
        panel.classList.toggle('active', key === payMethod);
      });
      updatePayments();
    });
  });

  // Зээлдэгчийн төрөл сонгох
  document.querySelectorAll('.loan-type').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.loan-type').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loanIndex = parseInt(btn.dataset.loan, 10);
      updatePayments();
    });
  });

  // Хугацаа сонгох
  document.querySelectorAll('.term-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.term-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loanTerm = parseInt(btn.dataset.term, 10);
      updatePayments();
    });
  });

  // CTA дархад тооцооллыг холбоо барих формд автоматаар бөглөнө
  const calcCta = $('calcCta');
  if (calcCta) {
    calcCta.addEventListener('click', () => {
      const msg = document.querySelector('#contactForm textarea[name="message"]');
      if (!msg) return;
      const area = calcAreaInput.value;
      let payText = 'Бэлэн төлөх';
      if (payMethod === 'loan') {
        const borrower = CALC_CONFIG.payment.loan.borrowers[loanIndex];
        payText = `Зээл — ${borrower.name}, ${loanTerm} сар, сарын төлөлт ${$('loanMonthly').textContent}`;
      } else if (payMethod === 'barter') {
        payText = `Бартер — ${downPct}% мөнгө (${$('barterCash').textContent}) + ${loanPct}% бараа/үйлчилгээ (${$('barterGoods').textContent})`;
      }
      msg.value = `Тооцоолуур: ${currentType}мм профиль, ${area} м², нийт үнэ ${$('calcTotal').textContent}. Төлбөрийн хэлбэр: ${payText}. Дэлгэрэнгүй үнийн санал авахыг хүсэж байна.`;
    });
  }

  // Хэл солигдоход бартерын хувь болон динамик текстүүдийг сэргээнэ
  document.addEventListener('lsc:lang', () => {
    document.querySelectorAll('[data-pct="down"]').forEach(el => el.textContent = downPct);
    document.querySelectorAll('[data-pct="loan"]').forEach(el => el.textContent = loanPct);
    update();
  });

  update();
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
      formSuccess.textContent = t('❌ Утасны дугаар 8 оронтой байх ёстой.', '❌ Phone number must be 8 digits.');
      formSuccess.classList.add('form-success-err');
      return;
    }

    // ── 2. Honeypot check ──
    const hpField = form.querySelector('[name=website]');
    if (hpField && hpField.value !== '') {
      // Bot detected — silently succeed
      formSuccess.style.display = 'block';
      formSuccess.textContent = t('✅ Таны мэдээлэл хүлээн авлаа. Удахгүй холбогдоно!', '✅ Your request has been received. We will contact you soon!');
      formSuccess.classList.add('form-success-ok');
      form.reset();
      return;
    }

    // ── 3. Timing check (< 2 сек = bot) ──
    if (Date.now() - _formLoadTime < 2000) {
      formSuccess.style.display = 'block';
      formSuccess.textContent = t('❌ Хэт хурдан илгээгдлээ. Дахин оролдоно уу.', '❌ Submitted too quickly. Please try again.');
      formSuccess.classList.add('form-success-err');
      return;
    }

    btn.disabled = true;
    btn.textContent = t('Илгээж байна...', 'Sending...');

    fetch('send.php', { method: 'POST', body: new FormData(form) })
      .then(r => r.json())
      .then(res => {
        formSuccess.style.display = 'block';
        if (res.success) {
          formSuccess.textContent = t('✅ ' + res.message, '✅ Your request has been received. We will contact you soon!');
          formSuccess.classList.add('form-success-ok');
          form.reset();
          if (phoneHint) {
            phoneHint.textContent = t('8 оронтой тоо оруулна уу', 'Enter an 8-digit number');
            phoneHint.className = 'form-hint';
          }
        } else {
          formSuccess.textContent = '❌ ' + res.message;
          formSuccess.classList.add('form-success-err');
        }
        btn.disabled = false;
        btn.textContent = t('Илгээх', 'Send');
      })
      .catch(() => {
        formSuccess.style.display = 'block';
        formSuccess.textContent = t('❌ Холболт алдаа. Утсаар холбогдоно уу: +976 9908 0126', '❌ Connection error. Please call us: +976 9908 0126');
        formSuccess.classList.add('form-success-err');
        btn.disabled = false;
        btn.textContent = t('Илгээх', 'Send');
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
