# Deployment and operations

## Requirements and boundaries

Deploy the built `dist/` artifact to Apache 2.4 with PHP 8.3 or newer and PDO SQLite, mbstring and curl. Enable `mod_rewrite`, `mod_headers`, `mod_deflate`, `mod_filter` and `AllowOverride All` (or move the reviewed directives into the virtual host). Set `display_errors=Off` in production and send PHP errors to a restricted log. Use a supported PHP/OS version according to your hosting provider.

The local audit found live Apache, not Netlify. No production deployment is automated in this repository because host credentials and the authoritative deployment path are not available. SSH to the existing host timed out during this work. GitHub push/CI and live deployment are separate operations.

## Automated FTP upload (GitHub Actions)

`.github/workflows/deploy.yml` builds and verifies the site, then uploads `dist/` over FTP using repository secrets `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.

- **Staging (automatic):** every push to `main` or `lsc-3.0-redesign` uploads to `<FTP_BASE>new/`, e.g. `https://lsc.mn/new/`.
- **Production (manual only):** Actions → *Deploy (FTP)* → *Run workflow* → `target=production`, `confirm=lsc.mn`. Do this only after the server environment below is in place and the current document root is backed up.
- Optional repository variables: `FTP_BASE` (default empty = the FTP account's home; use `public_html/` if the account starts above the web root), `FTP_PROTOCOL` (`ftps` default, `ftp` if the host has no TLS), `FTP_PORT` (21).
- The action only uploads changed files and never removes files outside its own sync state; private lead data must live outside the web root (`LSC_DATA_DIR`).

## cPanel quick setup (shared hosting)

1. cPanel → MultiPHP Manager: set lsc.mn to PHP 8.3+; confirm pdo_sqlite, mbstring, curl.
2. After the first staging upload, open cPanel → Terminal and run `php ~/public_html/new/server/install.php` (or the production path). It creates `~/lsc-private/` (0700) with `data/` and `env.php` (0600, random `LSC_IP_HASH_KEY`) and prints the cron command. Without Terminal, add the same command once as a cron job and remove it afterwards.
3. Edit `~/lsc-private/env.php` in File Manager: SMTP (cPanel mail account, usually `mail.lsc.mn`, 465/ssl), `LSC_MAIL_TO`, `LSC_SHEET_URL`, `LSC_SHEET_SECRET`. Server environment variables, if set, override this file.
4. cPanel → Cron Jobs: every minute, `php ~/public_html/server/worker.php` (use the printed PHP path).
5. Test on staging, then run the production workflow.

## Prepare before switching traffic

1. Back up the current document root and existing form integration configuration. Record its release/commit. Do not overwrite the only recoverable copy.
2. Build from a clean checkout: `npm ci`, `composer install --no-dev --prefer-dist`, `npm run verify`. CI provides the same artifact. Upload to a new release directory, **not over the active release**.
3. Create `LSC_DATA_DIR` outside every public document root, owned by the PHP/worker account (0700 directory, 0600 files; set service umask 0077). Place durable storage outside release directories so rollback does not remove leads. SQLite needs a local filesystem that supports locking; do not use a network share.
4. Set the environment listed in `deploy/environment.example`. Generate independent random 32+ character secrets for the IP hash and Sheets signature. Share these environment values with the PHP service and CLI worker; do not publish them or commit an actual environment file.
5. Set SMTP credentials for an authorized sender. Confirm SPF/DKIM/DMARC and delivery to the intended mailbox using the provider's own tools. SMTP acceptance alone does not prove inbox arrival. Recipients default only through your configuration; the API itself never sends mail synchronously.
6. Google Sheets: open the lead spreadsheet (columns Огноо, Нэр, Утас, Барилгын төрөл, Нэмэлт мэдээлэл), choose Extensions → Apps Script, paste `integrations/apps-script.gs`, run `setup()` once and authorize it. It stores a random `LSC_SECRET`, adds an `ID` header in column F and logs the secret. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone). Put the Web App URL in `LSC_SHEET_URL` and the logged secret in `LSC_SHEET_SECRET` on the server. Rows are appended to the first tab (`LSC_SHEET_GID` script property selects another tab) with Ulaanbaatar time and the calculator summary in column E; column F (lead ID) prevents duplicates on retry. Retire any previous unsigned receiver after the first test row arrives. Pushing this repository does not change the Apps Script deployment.
7. Run a staging request against test SMTP/Sheet destinations. Verify its `LSC-...` ID in SQLite, then in delivery logs and the Sheet. Retry the same request ID and confirm only one Sheet row.
8. Schedule `php /path/to/release/server/worker.php` every minute under the configured account. It holds a process lock, retries failed channels and never marks an unacknowledged Sheet delivery as sent. SMTP retries are at-least-once; a stable Message-ID reduces duplicate presentation but does not promise exactly-once email.

## Cutover and live checks

- Run Apache configuration validation before reload. Enable HTTPS with a valid certificate for both hostnames. The supplied redirects assume TLS terminates on Apache; for a trusted reverse proxy, configure the HTTPS indicator at the virtual-host layer. Do not trust arbitrary forwarded headers from clients.
- Switch the active release atomically (hosting-supported release pointer/symlink) and retain the previous release.
- Verify HTTP → `https://lsc.mn/`, www → canonical, and no redirect loop. `.htaccess` is required; omitting this hidden file disables key protections.
- Confirm `/server/`, `/config/`, `/vendor/` and dotfiles cannot be downloaded; `/send.php` accepts POST only. Check CSP, nosniff, frame protection, cache headers and HSTS on HTTPS responses. Hashed assets may be cached for one year; HTML revalidates.
- Verify MN/EN home, three product routes per language, privacy routes, sitemap, favicon and a real 404.
- Submit one controlled staging/live test with an agreed destination, observe its saved ID and downstream delivery, then remove test records through the controlled data process. Do not use an arbitrary real person's phone number.
- Check cold mobile load, iOS Safari/Android Chrome, keyboard navigation, and social preview. Local Lighthouse scores do not prove production performance.

## Monitor and operate

CLI tools must run outside public HTTP access and with the same environment:

```sh
php server/manage.php health
php server/manage.php list
php server/manage.php show LSC-REFERENCE
php server/manage.php update LSC-REFERENCE assigned sales-owner 2026-11-01
php server/manage.php metrics
php server/manage.php backup /secure-backups/lsc-YYYYMMDD.sqlite
```

`list` omits PII. `show` returns PII for an authorized operator; do not paste its output into public logs. `health` reports queue age and configuration presence, and fails if a notification has been pending for more than 15 minutes. Configure an external monitor to alert the responsible operator on that failure, HTTP 5xx, uptime loss, or storage exhaustion. Persisted leads remain available even when SMTP/Sheets is down.

The SQL status workflow is `new → assigned → quoted → closed`. Owner and follow-up date are available via the CLI. There is no exposed admin login or public CRM endpoint. Connect the team's existing CRM only after identifying its authentication and authoritative record IDs.

## Backup, restoration and privacy

Take scheduled encrypted backups using SQLite `VACUUM INTO` through the CLI, not a raw copy of the database while WAL writes may be in flight. Store copies outside the website with restricted access and a separately controlled encryption key. Keep the original notification integration credentials in the organization's secret store.

Restore drill: stop API writes and the worker, preserve the current data directory, place the verified backup in a separate private directory as `leads.sqlite`, run `PRAGMA integrity_check`, compare known lead IDs/counts and health, then point the service at the restored directory. Do not restore into an active SQLite file. A restored backup may replay notifications; Sheet IDs deduplicate, but email may be delivered again. Reconcile notifications before restarting the worker.

The automated local test opens a backup and checks integrity and the saved lead count. It does not test your production backup service, credentials or off-host recovery.

Before launch, the owner must set a retention period and assign access/deletion responsibilities. Deleting a request must cover SQLite, Sheet copies, email copies and the backup retention policy. No speculative retention deadline or automatic destructive purge is enabled. Request access/correction/deletion through the contact listed in the public privacy page.

## Rollback

Switch the web release pointer back, keep the private lead database and outbox intact, and stop incompatible workers before switching versions. The legacy `send.php` did not use the new database: reverting to it loses the durable intake guarantee, so prefer a maintenance/contact notice over resuming the old unchecked-success endpoint. Verify all requests accepted by the new version remain accessible before rollback is considered complete.

## Remaining owner inputs

Confirm actual product thickness/grade/coating certifications, the shared 89/140 rate, VAT/inclusions, finance provider/terms, response times, operating hours and genuine completed-project photos with publication rights. The site avoids inventing these. The audit's case-study, technical-PDF and contractual verification tasks remain content-dependent.
