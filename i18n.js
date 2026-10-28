export const lang = document.documentElement.lang === 'en' ? 'en' : 'mn';
export const t = (mn, en) => (lang === 'en' ? en : mn);
export const money = (n) => '₮' + Math.round(n).toLocaleString('en-US');
