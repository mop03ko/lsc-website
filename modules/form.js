import { normalizePhone } from './model.js';
import { t, lang } from '../i18n.js';
import { source } from './analytics.js';
export function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const phone = document.getElementById('phoneInput'),
    hint = document.getElementById('phoneHint'),
    result = document.getElementById('formSuccess'),
    btn = form.querySelector('[type=submit]');
  let quote = null,
    attempt = null,
    busy = false;
  document.addEventListener('lsc:quote-selected', (e) => {
    quote = e.detail;
  });
  function validatePhone() {
    const valid = normalizePhone(phone.value);
    phone.setCustomValidity(
      valid
        ? ''
        : t(
            '8 оронтой утасны дугаар оруулна уу. +976 ашиглаж болно.',
            'Enter an 8-digit Mongolian phone number; +976 is accepted.',
          ),
    );
    phone.setAttribute('aria-invalid', String(phone.value !== '' && !valid));
    hint.textContent = valid
      ? t('✓ Дугаар зөв', '✓ Valid number')
      : t(
          '8 оронтой дугаар эсвэл +976 дугаараа оруулна уу.',
          'Enter 8 digits, optionally with +976.',
        );
    return valid;
  }
  phone.addEventListener('input', validatePhone);
  phone.addEventListener('blur', () => {
    const valid = validatePhone();
    if (valid) phone.value = valid;
  });
  const messages = {
    rate_limited: () =>
      t(
        'Олон хүсэлт илгээгдсэн байна. 10 минутын дараа дахин оролдоно уу.',
        'Too many requests. Please retry in 10 minutes.',
      ),
    request_conflict: () =>
      t(
        'Хүсэлтийн мэдээлэл өөрчлөгдсөн байна. Дахин илгээнэ үү.',
        'The request changed. Please submit again.',
      ),
    invalid_phone: () => t('Утасны дугаараа шалгана уу.', 'Please check your phone number.'),
    invalid_quote: () => t('Тооцооллоо дахин сонгоно уу.', 'Please select your estimate again.'),
  };
  function show(message, ok) {
    result.hidden = false;
    result.style.display = 'block';
    result.className = 'form-success ' + (ok ? 'form-success-ok' : 'form-success-err');
    result.textContent = message;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const normalized = validatePhone();
    if (!form.reportValidity() || !normalized) return;
    const data = Object.fromEntries(new FormData(form));
    data.phone = normalized;
    data.language = lang;
    data.source = source;
    if (quote) data.quote = quote;
    const fingerprint = JSON.stringify(data);
    if (!attempt || attempt.fingerprint !== fingerprint)
      attempt = { fingerprint, id: crypto.randomUUID() };
    data.request_id = attempt.id;
    busy = true;
    const controls = [...form.querySelectorAll('input,select,textarea,button')];
    controls.forEach((el) => (el.disabled = true));
    form.setAttribute('aria-busy', 'true');
    result.hidden = true;
    result.style.display = 'none';
    btn.textContent = t('Илгээж байна…', 'Sending…');
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/send.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const res = await response.json();
      if (!response.ok || res.success !== true || !/^LSC-[A-F0-9]{16}$/.test(res.id || '')) {
        if (res.code === 'request_conflict') attempt = null;
        throw new Error(
          messages[res.code]?.() ||
            t(
              'Хүсэлтийг хадгалж чадсангүй. Мэдээллээ шалгаад дахин оролдоно уу.',
              'Could not save the request. Please check your details and retry.',
            ),
        );
      }
      show(
        t(
          `Хүсэлт бүртгэгдлээ. Дугаар: ${res.id}. Бид тантай холбогдоно.`,
          `Request saved. Reference: ${res.id}. We will contact you.`,
        ),
        true,
      );
      form.reset();
      quote = null;
      attempt = null;
      document.getElementById('quoteSummary').hidden = true;
      phone.setCustomValidity('');
      phone.removeAttribute('aria-invalid');
      hint.textContent = t(
        '8 оронтой дугаар эсвэл +976 дугаараа оруулна уу.',
        'Enter 8 digits, optionally with +976.',
      );
    } catch (error) {
      show(
        error.name === 'AbortError' || error instanceof TypeError || error instanceof SyntaxError
          ? t(
              'Холболт тасарлаа. Мэдээлэл хадгалагдсан эсэх тодорхойгүй. Дахин илгээхэд давхар бүртгэхгүй. Утас: 9908 0126.',
              'Connection interrupted. Submission status is unknown. Retry safely, or call +976 9908 0126.',
            )
          : error.message,
        false,
      );
    } finally {
      clearTimeout(timer);
      busy = false;
      controls.forEach((el) => (el.disabled = false));
      form.removeAttribute('aria-busy');
      btn.textContent = t('Илгээх', 'Send');
    }
  });
}
