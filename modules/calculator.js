import config from '../config/pricing.json';
import { calculate } from './model.js';
import { t, money } from '../i18n.js';
import { track } from './analytics.js';
export function initCalculator() {
  const $ = (id) => document.getElementById(id),
    input = $('calcAreaInput'),
    slider = $('calcSlider');
  if (!input || !slider) return;
  const state = { area: input.value, profile: '89', payment: 'cash', borrower: 'person', term: 12 };
  let quote = null;
  const set = (id, value) => {
    if ($(id)) $(id).textContent = value;
  };
  const select = (selector, active) =>
    document.querySelectorAll(selector).forEach((b) => {
      const on = b === active;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  function render() {
    const result = calculate(config, state);
    quote = result ? { ...state, area: result.area, version: config.version } : null;
    input.setAttribute('aria-invalid', String(!result));
    input.setCustomValidity(
      result
        ? ''
        : t('10–400 хооронд бүхэл м² оруулна уу.', 'Enter a whole number between 10 and 400 m².'),
    );
    set('calcError', result ? '' : input.validationMessage);
    $('calcCta').setAttribute('aria-disabled', String(!result));
    const outputs = [
      'calcFrame',
      'calcScrew',
      'calcDesign',
      'calcAssembly',
      'calcTotal',
      'cashTotal',
      'loanMonthly',
      'loanDown',
      'loanAmt',
      'loanFee',
      'loanTotal',
      'barterCash',
      'barterGoods',
    ];
    if (!result) {
      outputs.forEach((id) => set(id, '—'));
      slider.disabled = true;
      return;
    }
    slider.disabled = false;
    slider.value = String(result.area);
    set('calcUnitPrice', money(config.rates[state.profile]));
    set(
      'calcAllUnit',
      money(config.rates[state.profile] + Object.values(config.extras).reduce((a, b) => a + b, 0)),
    );
    const values = [
      result.frame,
      result.screw,
      result.design,
      result.assembly,
      result.total,
      result.total,
      result.monthly,
      result.down,
      result.amount,
      result.fee,
      result.repayment,
      result.barterCash,
      result.barterGoods,
    ];
    outputs.forEach((id, i) => set(id, money(values[i])));
    $('loanDownRow').hidden = result.down === 0;
    set(
      'loanMeta',
      t(
        `${config.loan.monthlyRate}% сарын хүү · ${state.term} сар · тэнцүү төлөлт`,
        `${config.loan.monthlyRate}% monthly interest · ${state.term} months · annuity`,
      ),
    );
    document.dispatchEvent(new CustomEvent('lsc:quote-change', { detail: quote }));
  }
  input.addEventListener('input', () => {
    state.area = input.value;
    render();
    track('calculator_use');
  });
  // Keep the slider available to recover from an invalid typed value.
  input.addEventListener('blur', () => {
    slider.disabled = false;
  });
  slider.addEventListener('input', () => {
    state.area = slider.value;
    input.value = slider.value;
    render();
    track('calculator_use');
  });
  document.querySelectorAll('.calc-type').forEach((b) =>
    b.addEventListener('click', () => {
      state.profile = b.dataset.type;
      select('.calc-type', b);
      render();
    }),
  );
  document.querySelectorAll('.pay-method').forEach((b) =>
    b.addEventListener('click', () => {
      state.payment = b.dataset.pay;
      select('.pay-method', b);
      for (const [key, id] of Object.entries({
        cash: 'payCash',
        loan: 'payLoan',
        barter: 'payBarter',
      })) {
        $(id).classList.toggle('active', key === state.payment);
        $(id).hidden = key !== state.payment;
      }
      render();
    }),
  );
  document.querySelectorAll('.loan-type').forEach((b) =>
    b.addEventListener('click', () => {
      state.borrower = Number(b.dataset.loan) === 1 ? 'business' : 'person';
      select('.loan-type', b);
      render();
    }),
  );
  document.querySelectorAll('.term-chip').forEach((b) =>
    b.addEventListener('click', () => {
      state.term = Number(b.dataset.term);
      select('.term-chip', b);
      render();
    }),
  );
  $('calcCta').addEventListener('click', (e) => {
    if (!quote) {
      e.preventDefault();
      input.reportValidity();
      input.focus();
      return;
    }
    const result = calculate(config, state);
    $('quoteSummary').hidden = false;
    $('quoteSummary').textContent =
      t(
        `Таны сонголт: ${state.profile}мм · ${state.area} м² · ${money(result.total)}. Төлбөр: `,
        `Your selection: ${state.profile}mm · ${state.area} m² · ${money(result.total)}. Payment: `,
      ) +
      {
        cash: t('Бэлэн', 'Cash'),
        loan: t(`Зээл, ${state.term} сар`, `Loan, ${state.term} months`),
        barter: t('Бартер', 'Barter'),
      }[state.payment];
    document.dispatchEvent(new CustomEvent('lsc:quote-selected', { detail: { ...quote } }));
    track('quote_click');
  });
  render();
}
