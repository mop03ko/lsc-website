# Light Steel Construction

Static bilingual site and a PHP lead API with durable SQLite storage and an outbox.

## Build and check

Requires Node 24, PHP 8.3+ (PDO SQLite, mbstring, curl), Composer and npm.

```sh
npm ci
composer install --no-dev
npm run verify
```

`PHP_BIN` may point to a PHP executable when it is not on PATH. Tests use temporary local storage and do not send email or call Google.

Upload **the contents of `dist/`**, including `.htaccess`, to an Apache PHP host. Never upload the repository root. The old Netlify configuration was removed because Netlify's static hosting cannot run this PHP API. GitHub Actions produces a deployable artifact; pushing a commit alone does not prove a production deployment.

## Preview

Build, configure local environment (see `deploy/environment.example`), create a private writable data directory outside `dist/`, then:

```sh
php -S 127.0.0.1:8086 -t dist scripts/router.php
```

Use `LSC_ORIGIN=http://127.0.0.1:8086` for local preview. Do not run the notification worker with production credentials when using test leads.

## Source organization

- `index.html`: Mongolian source template. `content/translations.json` and explicit English strings in the build generate crawlable English pages at `/en/`.
- `modules/`: calculator, validation, navigation, request submission, anonymous first-party event counts, and the 3D model section (`models.js`; the three.js viewer `viewer3d.js` is built as a separate lazily loaded asset).
- `models/`: web-ready GLB models (car and site props removed). `images/models/`: model thumbnails. `fonts/`: self-hosted IBM Plex (LSC 3.0).
- Visual system: LSC 3.0 (limestone canvas, graphite ink, terracotta actions, IBM Plex Sans/Mono, 4/8/16 px radii).
- `config/pricing.json`: shared pricing source, bundled for browsers and read independently by PHP. Client totals are never authoritative.
- `scripts/build.mjs`: 10 static pages, responsive WebP assets, hashed JS/CSS, sitemap, social preview and favicon.
- `send.php`: validation, atomic rate limit, idempotency, lead persistence and notification enqueue in one transaction.
- `server/worker.php`: CLI-only SMTP/Apps Script notification retry.
- `server/manage.php`: CLI-only lead status, health, metrics and backup commands.
- `integrations/apps-script.gs`: signed, idempotent Sheets receiver; deploy separately with Script Properties.

See [deployment runbook](docs/DEPLOYMENT.md) and [audit completion matrix](docs/AUDIT-STATUS.md). Product rates, certified specifications, delivery promises, genuine completed-project media and retention rules require owner confirmation; no fabricated certificates or projects are published.
