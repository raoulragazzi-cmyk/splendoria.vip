# Splendoria — Release Checklist

## Before implementation
- [ ] Requirement translated into observable acceptance criteria.
- [ ] Risk classified: UI / auth / data / AI / PDF / admin / migration / destructive action.
- [ ] Production database impact identified.

## Before pull request
- [ ] Work is on a dedicated branch.
- [ ] No secrets or production credentials are committed.
- [ ] `npm test` passes.
- [ ] `npm run check` passes.
- [ ] Migration reviewed if present.
- [ ] Mobile and desktop behavior checked for UI changes.

## Staging verification
- [ ] Staging/preview is isolated from production D1.
- [ ] Registration/login works with test credentials.
- [ ] Customer Studio core path works.
- [ ] Muse action returns and persists the expected result.
- [ ] PDF preview/final flow works where affected.
- [ ] Admin flow works where affected.
- [ ] Destructive actions require confirmation and correct authorization.

## Production promotion
- [ ] Last-known-good Git commit recorded.
- [ ] Cloudflare current production version/deployment recorded.
- [ ] Database recovery point/export available for risky releases.
- [ ] PR reviewed and merged.
- [ ] Production deploy initiated from the approved source.

## After deploy
- [ ] Health endpoint / homepage responds.
- [ ] Authentication smoke test passes.
- [ ] One affected end-to-end user journey passes.
- [ ] Cloudflare logs show no new critical errors.
- [ ] Release/commit recorded as current production baseline.

## Rollback trigger
Rollback instead of stacking fixes if the release causes a regression in authentication, authorization, data integrity, privacy, payment/commercial state, book generation, PDF delivery or destructive operations.