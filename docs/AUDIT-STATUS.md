# Audit implementation status — 2026-10-28

Status distinguishes implemented source from external operations. Nothing in this file asserts production deployment or actual email/Sheets delivery.

| ID | Implemented in repository | Remaining external verification |
|---|---|---|
| BE-01 | Durable SQLite transaction, saved request ID, independent outbox/retry | Configure storage/worker and prove live persistence/delivery |
| SEC-01 | Apache canonical HTTPS/www redirects | Install/reload on live host; verify TLS/proxy topology |
| SEC-02 | PHPMailer SMTP, fixed sender, no raw user headers, scalar/length validation | Authorized sender and provider delivery |
| BE-02 | Atomic SQLite rate limiter, 429, idempotency/conflict detection | Production traffic tuning |
| SEC-03 | Signed POST receiver, request-ID deduplication, no PII in URL | Deploy Apps Script; restrict Sheet; retire old endpoint |
| SEC-04 | CSP, framing, nosniff, referrer/permissions policy, HTTPS HSTS | Production response checks |
| FE-01 | Responsive WebP, dimensions, lazy loading, eager priority hero, no external font dependency | Live/mobile-device measurement |
| FE-02 | Content-hashed assets, cache/revalidation policy | Hosting/CDN header confirmation |
| FE-03 | Shared pure calculator, strict integer bounds, synchronized slider/input | Completed in source and local tests |
| UX-01 | Material vs full unit price, inclusions disclaimer, one shared pricing file | Owner must approve prices/taxes/finance terms |
| UX-02 | +976/space/hyphen normalization without truncation | Completed in source and browser tests |
| UX-03 | Separate quote object/summary, notes preserved, server repricing | Completed in source and browser tests |
| FE-04 | Static `/en/`, localized dynamic/errors, stable building enums | Final business translation review |
| A11Y-01 | Labels, names, hints, main/heading hierarchy, live form status | Real screen-reader/device checks |
| A11Y-02 | Higher contrast text/buttons and visible focus | Local automated check plus real-device review |
| A11Y-03 | 44px menu target, expanded state, Escape, focus return, responsive closure | Completed locally; device check pending |
| UI-01 | Messenger moved into contact actions; no floating price obstruction | Completed locally |
| FE-05 | Content visible without JS, safe POST fallback, reduced motion | Completed in source; no-JS browser check |
| BE-03 | Validation/status codes, timeout, preserved unknown submissions, size limits | Operational log/alert integration |
| CONTENT-01 | Removed absolute seismic/fire/corrosion/lifetime promises; clarified capacity and experience text | Engineering/business approval of final claims |
| UX-04 | Product routes, process steps, explicit inquiry path | User research with actual customers |
| UX-05 | Six localized product pages, specification-request path, functioning application cards | Actual certified specs and technical PDF assets |
| UX-06 | No invented project cases or testimonials | Genuine 3–6 case studies/photos/permissions needed |
| UX-07 | Clickable phone/email, Maps search, arrange-visit explanation | Exact map pin, hours and response-time commitments |
| UI-02 | Typography, spacing/states, accessible FAQ details, readable mobile timeline | Owner visual review |
| SEO-01 | Sitemap/robots/favicon/canonical/OG/social image and real 404 | Search Console/social crawler refresh |
| SEO-02 | Crawlable EN pages, reciprocal hreflang and Organization JSON-LD | Search indexing and verified business profile |
| DATA-01 | Privacy page, PII-free event fields, private storage, operational access/deletion guidance | Approved retention policy and external-copy access review |
| ANALYTICS-01 | First-party aggregate events/UTM allowlist, accepted count from database, DNT/GPC respected | Live funnel monitoring and owner dashboard needs |
| OPS-01 | Meaningful unit/API/build tests, lint and CI release artifact | Staging/live integration and real-device gates |
| OPS-02 | Apache release/runbook/rollback/version file, worker/health | Production deployment, external alerts and assigned owner |
| OPS-03 | SQLite consistent backup CLI and restore integrity test | Scheduled encrypted off-host backups and delivery/recovery drill |
| FE-06 | Modules, shared pricing model, deterministic static locales, hashed build | Completed in source |
| UX-08 | Durable lead IDs, CLI status/owner/follow-up and aggregate metrics | Connect actual team CRM/workflow; no invented credentials |

The product/engineering/portfolio tasks and production operations cannot truthfully be called complete from a GitHub push alone. Deployment and integration instructions are in `DEPLOYMENT.md`.
