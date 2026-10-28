export function normalizePhone(value) {
  if (!/^[+\d\s()-]*$/.test(value)) return null;
  let digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('976')) digits = digits.slice(3);
  return /^\d{8}$/.test(digits) ? digits : null;
}
export function calculate(config, state) {
  const area = Number(state.area);
  if (
    String(state.area).trim() === '' ||
    !Number.isInteger(area) ||
    area < config.minArea ||
    area > config.maxArea ||
    !Object.hasOwn(config.rates, state.profile)
  )
    return null;
  const frame = area * config.rates[state.profile];
  const extras = Object.fromEntries(Object.entries(config.extras).map(([k, v]) => [k, area * v]));
  const total = frame + Object.values(extras).reduce((a, b) => a + b, 0);
  const borrower = config.loan.borrowers.find((b) => b.id === state.borrower);
  if (
    !borrower ||
    ![12, 24, 36, 48, 60].includes(state.term) ||
    !['cash', 'loan', 'barter'].includes(state.payment)
  )
    return null;
  const amount = Math.min(total, borrower.maxAmount),
    down = total - amount,
    r = config.loan.monthlyRate / 100;
  const monthly = r === 0 ? amount / state.term : (amount * r) / (1 - Math.pow(1 + r, -state.term));
  const fee = Math.min((amount * config.loan.feePercent) / 100, borrower.feeCap ?? Infinity);
  return {
    area,
    frame,
    ...extras,
    total,
    amount,
    down,
    monthly,
    fee,
    repayment: monthly * state.term + fee + down,
    barterCash: (total * config.barterCashPercent) / 100,
    barterGoods: (total * (100 - config.barterCashPercent)) / 100,
  };
}
