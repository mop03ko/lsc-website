import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
const php = process.env.PHP_BIN || 'php';
test('backend storage, validation, retries, concurrency, outbox and recovery', async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lsc-test-'));
  const port = 19000 + Math.floor(Math.random() * 1000),
    origin = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    LSC_DATA_DIR: dir,
    LSC_IP_HASH_KEY: 'local-test-key-32-characters-long-only',
    LSC_ORIGIN: origin,
    LSC_SMTP_HOST: '',
    LSC_SHEET_URL: '',
  };
  const proc = spawn(php, ['-S', `127.0.0.1:${port}`], { env, stdio: 'ignore', windowsHide: true });
  t.after(async () => {
    proc.kill();
    await new Promise((r) => proc.once('exit', r));
    await fs.rm(dir, { recursive: true, force: true });
  });
  for (let n = 0; n < 50; n++) {
    try {
      await fetch(origin + '/send.php');
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const payload = () => ({
    name: 'Local Test',
    phone: '+976 9908 0126',
    type: 'house',
    message: 'Local integration test',
    language: 'en',
    request_id: randomUUID(),
    quote: { area: 81, profile: '89', payment: 'loan', borrower: 'person', term: 12, total: 1 },
  });
  const post = (data, headers = {}) =>
    fetch(origin + '/send.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin, ...headers },
      body: JSON.stringify(data),
    });
  const cli = (args) =>
    spawnSync(php, ['server/manage.php', ...args], { env, encoding: 'utf8', windowsHide: true });
  await t.test('GET is 405 and cross-origin submission is rejected', async () => {
    assert.equal((await fetch(origin + '/send.php')).status, 405);
    assert.equal((await post(payload(), { Origin: 'https://example.org' })).status, 403);
  });
  await t.test(
    'reject arrays, header injection, invalid phone/enum/quote, oversized input',
    async () => {
      for (const changes of [
        { name: ['x'] },
        { name: 'A\r\nB' },
        { phone: '123' },
        { type: 'invalid' },
        { quote: { area: 4000 } },
        { message: 'x'.repeat(3001) },
      ])
        assert.equal((await post({ ...payload(), ...changes })).status, 422);
      assert.equal((await post({ ...payload(), message: 'x'.repeat(17000) })).status, 413);
    },
  );
  let id,
    data = payload();
  await t.test('acknowledges only durable storage and recomputes client prices', async () => {
    const response = await post(data);
    assert.equal(response.status, 201);
    id = (await response.json()).id;
    assert.match(id, /^LSC-[A-F0-9]{16}$/);
    const stored = JSON.parse(cli(['show', id]).stdout);
    const p = JSON.parse(stored.payload);
    assert.equal(p.phone, '99080126');
    assert.equal(p.quote.total, 22113000);
  });
  await t.test('same key concurrent retries return one ID; changed payload conflicts', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => post(data).then((r) => r.json())),
    );
    assert.ok(results.every((r) => r.id === id));
    assert.equal((await post({ ...data, message: 'Changed' })).status, 409);
    assert.equal(JSON.parse(cli(['list']).stdout).length, 1);
  });
  await t.test('unconfigured integrations stay queued and report failure', async () => {
    const worker = spawnSync(php, ['server/worker.php'], {
      env,
      encoding: 'utf8',
      windowsHide: true,
    });
    assert.equal(worker.status, 1);
    assert.equal(JSON.parse(cli(['health']).stdout).pending, 2);
  });
  await t.test('lead workflow, metrics and recoverable backup', async () => {
    assert.equal(cli(['update', id, 'assigned', 'sales', '2026-10-29']).status, 0);
    assert.equal(JSON.parse(cli(['show', id]).stdout).status, 'assigned');
    assert.equal(JSON.parse(cli(['metrics']).stdout).accepted_leads, 1);
    const backup = path.join(dir, 'backup.sqlite');
    assert.equal(cli(['backup', backup]).status, 0);
    const result = spawnSync(
      php,
      [
        '-r',
        "$d=new PDO('sqlite:'.getenv('BACKUP_PATH'));echo $d->query('PRAGMA integrity_check')->fetchColumn().' '.$d->query('SELECT count(*) FROM leads')->fetchColumn();",
      ],
      { env: { ...env, BACKUP_PATH: backup }, encoding: 'utf8', windowsHide: true },
    );
    assert.equal(result.stdout, 'ok 1');
  });
  await t.test('rate limiting returns 429 without persisting extra requests', async () => {
    for (let n = 0; n < 4; n++) assert.equal((await post(payload())).status, 201);
    assert.equal((await post(payload())).status, 429);
    assert.equal(JSON.parse(cli(['list']).stdout).length, 5);
  });
  await t.test('storage errors never return success', async () => {
    const broken = spawn(php, ['-S', `127.0.0.1:${port + 1000}`], {
      env: {
        ...env,
        LSC_DATA_DIR: path.join(dir, 'missing'),
        LSC_ORIGIN: `http://127.0.0.1:${port + 1000}`,
      },
      stdio: 'ignore',
      windowsHide: true,
    });
    try {
      for (let n = 0; n < 50; n++) {
        try {
          await fetch(`http://127.0.0.1:${port + 1000}/send.php`);
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      const response = await fetch(`http://127.0.0.1:${port + 1000}/send.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      assert.equal(response.status, 503);
      assert.equal((await response.json()).success, false);
    } finally {
      broken.kill();
      await new Promise((r) => broken.once('exit', r));
    }
  });
});
