import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const php = process.env.PHP_BIN || 'php';

test('installer creates private settings outside public_html and env() reads them', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'lsc-home-'));
  const release = path.join(home, 'public_html', 'new');
  fs.mkdirSync(path.join(release, 'server'), { recursive: true });
  fs.cpSync('server', path.join(release, 'server'), { recursive: true });
  fs.cpSync('config', path.join(release, 'config'), { recursive: true });
  const env = { ...process.env, LSC_DATA_DIR: '', LSC_ORIGIN: '' };
  delete env.LSC_DATA_DIR;
  delete env.LSC_ORIGIN;
  const out = execFileSync(php, [path.join(release, 'server', 'install.php')], {
    env,
    encoding: 'utf8',
  });
  const file = path.join(home, 'lsc-private', 'env.php');
  assert.match(out, /Created .*lsc-private\/env\.php/);
  assert.equal((fs.statSync(file).mode & 0o777).toString(8), '600');
  const again = execFileSync(php, [path.join(release, 'server', 'install.php')], {
    env,
    encoding: 'utf8',
  });
  assert.match(again, /Kept existing/);
  const probe = `require '${path.join(release, 'server', 'bootstrap.php')}'; echo env('LSC_ORIGIN'), '|', env('LSC_DATA_DIR'), '|', strlen(env('LSC_IP_HASH_KEY'));`;
  const res = execFileSync(php, ['-r', probe], { env, encoding: 'utf8' });
  assert.equal(res, `https://lsc.mn|${path.join(home, 'lsc-private', 'data')}|64`);
  fs.rmSync(home, { recursive: true, force: true });
});
