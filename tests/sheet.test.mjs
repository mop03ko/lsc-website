import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

function load() {
  const rows = [['Огноо', 'Нэр', 'Утас', 'Барилгын төрөл', 'Нэмэлт мэдээлэл', '']];
  const props = { LSC_SECRET: 'x'.repeat(40) };
  const sheet = {
    getSheetId: () => 0,
    getName: () => 'Sheet1',
    getLastRow: () => rows.length,
    appendRow: (r) => rows.push(r),
    getRange: (r, c, n = 1) => ({
      getValue: () => rows[r - 1][c - 1],
      setValue: (v) => (rows[r - 1][c - 1] = v),
      createTextFinder: (s) => ({
        matchEntireCell: () => ({
          findNext: () => rows.slice(r - 1, r - 1 + n).some((x) => x[c - 1] === s),
        }),
      }),
    }),
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [sheet] }), flush() {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => props[k] ?? null,
        setProperty: (k, v) => (props[k] = v),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: (s) => ({ setMimeType: () => JSON.parse(s) }),
    },
    Utilities: {
      computeHmacSha256Signature: (m, k) =>
        [...crypto.createHmac('sha256', k).update(m).digest()].map((b) => (b > 127 ? b - 256 : b)),
      formatDate: (d) => d.toISOString(),
    },
    Logger: { log() {} },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync('integrations/apps-script.gs', 'utf8'), ctx);
  return { ctx, rows, props };
}

test('Sheets row matches the existing LSC sheet layout', () => {
  const { ctx } = load();
  const quote = {
    area: 140,
    profile: '140',
    payment: 'loan',
    borrower: 'person',
    term: 60,
    total: 38220000,
    monthly: 1236547,
  };
  const row = ctx.lscRow(
    {
      id: 'LSC-0123456789ABCDEF',
      created_at: 1777000000,
      data: { name: 'Бат', phone: '99112233', type: 'house', message: 'Гаражтай', quote },
    },
    () => '2026.10.30 17:00:00',
  );
  assert.deepEqual([...row], [
    '2026.10.30 17:00:00',
    'Бат',
    '99112233',
    'АОС, Зуслан',
    'Тооцоолуур: 140мм профиль, 140 м², нийт үнэ ₮38,220,000. Төлбөрийн хэлбэр: Зээл — Иргэн, 60 сар, сарын төлөлт ₮1,236,547. Гаражтай',
    'LSC-0123456789ABCDEF',
  ]);
  assert.equal(
    ctx.lscRow(
      { id: 'x', created_at: 0, data: { name: '=HYPERLINK()', type: 'zzz' } },
      () => '',
    )[1],
    "'=HYPERLINK()",
  );
});

test('signed POST appends once and rejects bad signatures', () => {
  const { ctx, rows, props } = load();
  const payload = JSON.stringify({
    id: 'LSC-0123456789ABCDEF',
    created_at: Math.floor(Date.now() / 1000),
    data: { name: 'A', phone: '1', type: 'mobile', message: 'hi', quote: null },
  });
  const ts = Math.floor(Date.now() / 1000);
  const sig = crypto
    .createHmac('sha256', props.LSC_SECRET)
    .update(ts + '.' + payload)
    .digest('hex');
  const post = (signature) =>
    ctx.doPost({ postData: { contents: JSON.stringify({ timestamp: ts, payload, signature }) } });
  assert.equal(post('0'.repeat(64)).success, false);
  assert.equal(post(sig).success, true);
  assert.equal(post(sig).success, true);
  assert.equal(rows.length, 2);
  assert.equal(rows[1][3], 'Зөөврийн сууц');
  assert.equal(rows[1][4], 'hi');
});
