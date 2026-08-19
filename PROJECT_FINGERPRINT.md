# PROJECT FINGERPRINT — Splendoria

> Read this file before any write, migration or deploy. If live infrastructure disagrees with this file, STOP and re-verify read-only.

## Identity
- Project: **Splendoria**
- Repository: `raoulragazzi-cmyk/splendoria.vip`
- Current production/default branch: `splendoria.vip`
- Prepared canonical branch: `main`
- Governance branch: `governance/software-house-setup`

## Cloudflare fingerprint
- Account ID: `9ea664e4c34f649045f64024e0db52e1`
- Production Worker: `splendoria-v2`
- Production domain: `https://www.splendoria.vip`
- Production D1: `splendoria-db`
- Production D1 ID: `1a46b8b0-2e6f-44cf-a22f-4950259f9434`
- Staging D1: `splendoria-v2-test`
- Staging D1 ID: `8bf872f6-3f9e-471f-95bc-a99a94f0d97c`
- Intended staging Worker: `splendoria-v2-staging`
- Health endpoint: `/healthz`

## Protected areas
- authentication, sessions and password reset;
- customer/admin role separation;
- book/manuscript ownership;
- Muse/agentic generation state, retries and duplicate prevention;
- destructive actions such as book deletion;
- D1 migrations;
- email flows;
- PDF/final print output and user content privacy.

## Deploy gate
Do NOT deploy production unless repository, Worker, production domain and D1 ID all match this fingerprint, CI is green, rollback is known and required staging acceptance has passed.

Production and staging D1 must never be interchangeable.
