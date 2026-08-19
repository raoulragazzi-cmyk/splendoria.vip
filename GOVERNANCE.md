# Splendoria — Engineering Governance

_Last updated: 2026-08-19_

## 1. Source of truth

The GitHub production branch is the authoritative source for application code, migrations, tests and deployment configuration. Chat conversations are working context, not the production record.

## 2. Roles

- Product/market owner: Raoul Ragazzi — priorities, customer experience, commercial constraints and final product acceptance.
- Engineering lead: ChatGPT — technical analysis, architecture, implementation plan, code changes, testing, maintenance and release verification.
- Production infrastructure: Cloudflare Workers, D1 and related bindings.

## 3. Change flow

All non-emergency changes follow:

`request -> analysis -> issue/branch -> implementation -> tests -> PR -> review -> staging verification -> production promotion -> health check -> functional acceptance`

No production change should exist only in the Cloudflare editor. Any emergency hotfix must be back-ported immediately to GitHub.

## 4. Branch model

- Production branch: current `splendoria.vip` branch until repository normalization is completed.
- `feature/<short-name>`: product features.
- `fix/<short-name>`: defects.
- `hotfix/<short-name>`: urgent production defects.
- `governance/<short-name>`: DevOps, documentation and process changes.
- `release/<version>`: optional release stabilization when needed.

Direct feature development on the production branch is prohibited once branch protection is enabled.

## 5. Environments

### Production
- Worker: `splendoria-v2`
- D1: `splendoria-db`
- Public domain: `https://www.splendoria.vip`

### Staging / preview
- D1 preview database: `splendoria-v2-test`
- Staging must never write to the production D1 database.
- Secrets and email destinations used in staging must be isolated where possible.

## 6. Required release gates

Before production promotion:

1. `npm test` passes.
2. Wrangler dry-run/check passes.
3. Database migrations are reviewed separately from application changes.
4. Login and registration smoke test passes.
5. Studio save/edit flow passes.
6. Muse generation flow passes for a test project.
7. PDF preview/final generation passes.
8. Admin access passes.
9. No destructive action is introduced without explicit confirmation and authorization checks.
10. Staging uses non-production data.

## 7. Database policy

- Schema changes are migration-only.
- Never edit the production schema manually when a migration can represent the change.
- Migrations must be forward-only and idempotent where feasible.
- Before a risky migration, capture a D1 recovery point/export according to the backup procedure.
- Production data must never be copied into staging unless sanitized and explicitly required.

## 8. Backup and recovery

Three layers are required:

1. **Code:** GitHub history and release tags.
2. **Database:** Cloudflare D1 Time Travel plus periodic SQL exports for disaster recovery.
3. **User assets:** inventory and backup policy for any persistent object storage used by the product.

For every production release, record the last-known-good Git commit and Cloudflare deployment/version identifier.

## 9. Rollback

Rollback is preferred over stacking emergency fixes when authentication, authorization, data integrity, billing, privacy or book-generation workflows regress.

A rollback must restore the last-known-good application version. Database rollback requires explicit analysis because application rollback and schema rollback are not always equivalent.

## 10. Production safety

Never store secrets in GitHub source. Never use production credentials in test fixtures. Never delete user content or database rows during automated smoke tests. Never deploy an unreviewed migration together with an unrelated visual change.

## 11. Definition of done

A change is complete only when implementation, tests, staging verification, production verification and source-of-truth synchronization are all complete.