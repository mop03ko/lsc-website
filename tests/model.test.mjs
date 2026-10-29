import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculate, normalizePhone } from '../modules/model.js';
const c = JSON.parse(fs.readFileSync(new URL('../config/pricing.json', import.meta.url)));
const base = { area: 80, profile: '89', payment: 'cash', borrower: 'person', term: 12 };
test('phone formats normalize without truncating the actual number', () => {
  for (const phone of ['99080126', '+976 9908 0126', '97699080126', '9908-0126'])
    assert.equal(normalizePhone(phone), '99080126');
  for (const phone of ['9769908', '990801267', 'abcd99080126', '+976'])
    assert.equal(normalizePhone(phone), null);
});
test('area is a whole number within bounds; blank does not become an estimate', () => {
  for (const area of ['', 0, 9, 401, 80.5, 'not a number'])
    assert.equal(calculate(c, { ...base, area }), null);
  assert.equal(calculate(c, { ...base, area: 81 }).total, 22113000);
  assert.equal(calculate(c, { ...base, area: 10 }).total, 2730000);
  assert.equal(calculate(c, { ...base, area: 400 }).total, 109200000);
});
test('estimate and payment arithmetic preserve totals', () => {
  for (const area of [10, 80, 81, 200, 400])
    for (const profile of ['89', '140'])
      for (const term of [12, 24, 36, 48, 60])
        for (const borrower of ['person', 'business']) {
          const r = calculate(c, { ...base, area, profile, term, borrower });
          assert.equal(r.frame + r.screw + r.design + r.assembly, r.total);
          assert.equal(r.amount + r.down, r.total);
          assert.equal(r.barterCash + r.barterGoods, r.total);
          assert.ok(r.repayment >= r.total);
          assert.ok(r.amount <= (borrower === 'person' ? 50000000 : 300000000));
        }
});
test('zero interest and business fee cap remain supported', () => {
  const config = structuredClone(c);
  config.loan.monthlyRate = 0;
  assert.equal(calculate(config, base).monthly, 21840000 / 12);
  config.rates['89'] = 1000000;
  assert.equal(calculate(config, { ...base, area: 400, borrower: 'business' }).fee, 1500000);
});
