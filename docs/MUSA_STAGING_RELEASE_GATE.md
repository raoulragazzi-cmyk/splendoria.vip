# Musa Intervistatrice — release gate D1/staging

Status: NOT APPROVED FOR PRODUCTION. The SQLite regressions pass in GitHub CI, but are not a substitute for D1 staging tests.

## Preconditions
- Use the isolated Cloudflare staging Worker and `splendoria-v2-test` database only.
- Back up staging before applying the additive migrations 0006, 0007 and 0008.
- Verify the migration history to ensure no migration is applied twice; do not run any migration against production.
- Keep `MUSA_INTERVIEW_API_ENABLED` off until all staging tests are green.
- Create two synthetic users and two synthetic books; never use real client stories for verification.

## Database and API edge-pass
1. Apply migrations using the explicit staging environment and confirm all three schema changes exist.
2. Check every request without a valid `spl_session`, with an expired session, and with an unrelated book ID returns a denial without revealing another author's data.
3. Create an interview, read it back, save one response, close and reopen the browser, then compare the exact response bytes.
4. Retry the same `expectedVersion` after the first request has committed: the stale request must fail without inserting another turn.
5. Send two concurrent writes with the same version; exactly one should commit, and the other must fail without incrementing the version.
6. Pause the interview: subsequent writes must fail. Resume with the new version and verify writing succeeds.
7. Test consent unset, granted and revoked; model must not receive author content in either unset or revoked states.
8. Test malformed JSON, oversize input, missing Origin on POST, cross-site attempts and expired sessions.
9. Simulate network loss after a successful commit and recover state with a GET instead of blindly retrying the write.
10. Verify deleting a book removes related interview/consent records as intended; inspect D1 foreign key behavior before relying on cascade.

## Known release blockers
- The staging API currently returns a save conflict for stale requests rather than an idempotent prior result. The client must re-read session state before any retry.
- Server-side rate limiting and a user-facing live consent flow need a complete implementation.
- The client UI has not yet been connected to real session persistence and cannot claim end-to-end readiness.
- AI output validation is heuristic and does not prove the factual accuracy or suitability of generated questions.
- A production deployment is forbidden until the above are fixed and an independent real D1 test is recorded.

## Rollback
- Disable `MUSA_INTERVIEW_API_ENABLED`; preserve production as-is.
- Keep the classic interview workflow available and independent.
- Roll back Worker staging deployment separately; database migrations remain additive and should not be destructively reversed without explicit data review.

## Cloudflare authorization gate — 2026-10-12
Read-only verification: staging D1 `splendoria-v2-test` is bound to Worker `splendoria-v2-staging`; the Musa tables are absent. A write attempt through the connected Cloudflare API returned error 7500 (insufficient permission). **No migration was applied**.

Do not work around this restriction with alternate credentials or production resources. An authorized operator should review the connected Cloudflare token permissions (D1 Edit on the intended account), and perform migrations 0006–0009 on the explicitly selected staging database only. Capture post-migration schema validation and CI evidence. Keep `MUSA_INTERVIEW_API_ENABLED` disabled until the Worker candidate is deployed to staging and owner-isolation, consent, concurrent-write and retry tests pass.
