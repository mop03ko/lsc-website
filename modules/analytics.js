import { lang } from '../i18n.js';
export const source = (() => {
  const s = (new URLSearchParams(location.search).get('utm_source') || '').toLowerCase();
  return ['facebook', 'google', 'instagram', 'viber', 'direct'].includes(s) ? s : s ? 'other' : '';
})();
const sent = new Set();
export function track(event) {
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl || sent.has(event)) return;
  sent.add(event);
  fetch('/events.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, source, language: lang }),
    keepalive: true,
  }).catch(() => {});
}
export function initAnalytics() {
  document
    .querySelectorAll('a[href^="tel:"]')
    .forEach((a) => a.addEventListener('click', () => track('phone_click')));
  document
    .querySelectorAll('a[href*="m.me/"]')
    .forEach((a) => a.addEventListener('click', () => track('messenger_click')));
}
