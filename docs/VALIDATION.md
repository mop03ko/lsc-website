# Validation — 2026-10-28

## Automated checks

- `npm run verify`: JavaScript syntax check, build of 10 public pages, **15 passing tests**.
- Tests cover phone normalization, calculator boundaries/payment arithmetic, server-side repricing, durable lead storage, retry IDs/conflicts, API validation/status codes, rate limit, queued integration failures, lead workflow, backup integrity, metadata/internal links and form labels.
- PHP syntax checks passed for the API and CLI files.
- `npm audit --audit-level=high` and `composer audit`: no known vulnerabilities reported at verification time.
- `git diff --check`: passed.

## Browser checks

Chromium, local build:

- MN successful submission saved a real **local test** lead; no external notification worker was run.
- `+976 9908 0126` normalized correctly. Quote CTA preserved the user's existing notes.
- EN quote summary was English. An intercepted/aborted API request showed the localized error and preserved input for retry; nothing was sent externally.
- Mobile menu Escape closed the menu, updated `aria-expanded` and returned focus to the trigger.
- Widths 320, 360, 390, 768, 1024 and 1440: no document or checked main-container horizontal overflow.
- JavaScript-disabled context: about/contact remained visible; the interactive calculator was hidden with an explanatory contact fallback.
- Product detail and MN/EN route navigation checked. No-JS fallback is intentionally a normal POST, never a GET carrying personal information.

## Local Apache and Lighthouse

Apache 2.4.66 served the release configuration locally. Verified 308 canonical redirect using the production Host header, 403 for internal server files, immutable cache on hashed assets, HTML revalidation and security headers. PHP integration tests used the PHP development server separately; the Apache static test host did not execute PHP.

Final Lighthouse 13.6.0 mobile simulation against the **local Apache build**:

| Metric | Result |
|---|---:|
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| LCP | 0.8 s |
| Total transfer | 593 KiB |

The earlier live-site audit measured 74/83/96/100 and LCP 11.0 s with a 9,665 KiB payload. These measurements were taken in different serving environments and are not a guarantee of the production improvement. Automated accessibility 100 also does not substitute for real assistive-technology testing.

## Not verified

Production deployment, SMTP inbox delivery, Apps Script/Sheet acknowledgement, provider DNS, real iOS/Android devices, off-host restore, business pricing/certificates, portfolio rights and live analytics are pending external setup/owner inputs. The implementation matrix documents each dependency. No live customer requests or external messages were sent during validation.
