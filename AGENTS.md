# AGENTS.md — Splendoria

These instructions apply to AI coding agents and automated contributors.

## Source and environments

- GitHub is the source of truth for code.
- Production currently follows the historical `splendoria.vip` branch until the controlled switch to `main` is completed.
- `main` exists as a prepared normalization branch but is not yet the repository default.
- Production Worker: `splendoria-v2`.
- Production D1: `splendoria-db`.
- Staging D1: `splendoria-v2-test`.
- Never bind staging/preview work to the production database.

## Protected areas

Treat these as high risk:
- registration, login, sessions, password reset and administrator access;
- user/manuscript/book ownership and destructive actions;
- Muse/agentic book generation state and retries;
- D1 schema/migrations;
- email verification/notification/reset flows;
- PDF generation and final print output;
- privacy/export/anonymization/deletion flows.

## Workflow

1. Understand the request and classify risk.
2. Use a dedicated branch and PR for non-trivial changes.
3. Preserve a rollback target.
4. Run the Pull Request Quality Gate.
5. Require production dependency audit, smoke suite and both Wrangler dry-runs where applicable.
6. Validate risky functionality on staging with synthetic data before production.
7. Back up D1 before risky production migrations.
8. After deploy, run `scripts/postdeploy-check.sh` and relevant functional acceptance.

## Database rules

- Schema changes must be versioned migrations, not ad-hoc production edits.
- Do not copy customer manuscripts/accounts to staging by default.
- Do not perform destructive production D1 operations without explicit scope and recovery plan.
- Application rollback and database rollback are separate decisions.

## Staging email rule

Staging email bindings may exist for configuration parity but must not have real authorized recipients until an intentional staging-email test plan is approved.

## Release blockers

Stop rather than bypass when:
- one user can access another user's book/content;
- admin/customer roles cross unexpectedly;
- a migration risks data loss without backup/recovery;
- staging points at production D1;
- secrets/customer exports are about to be committed;
- the Muse state machine can duplicate or silently lose content;
- destructive actions lack ownership checks/confirmation;
- CI or required staging acceptance is red.

## Testing principle

Do not weaken a failing test merely to obtain a green CI. First determine whether the product intentionally changed or whether a regression exists. When behavior intentionally changes, update the test to the new explicit specification.

## Read first

Before high-risk changes, read:
- `GOVERNANCE.md`
- `RELEASE_CHECKLIST.md`
- `SECURITY.md`

Keep changes focused. Avoid unrelated refactors during bug fixes or production incidents.
