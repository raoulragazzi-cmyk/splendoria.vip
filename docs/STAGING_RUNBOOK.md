# Splendoria staging runbook

## Invarianti

- Worker: `splendoria-v2-staging`
- URL: `https://splendoria-v2-staging.raoulragazzi.workers.dev`
- D1: `splendoria-v2-test`
- cron: disabilitato
- nessuna route/custom domain di produzione
- nessuna migrazione D1 automatica nel workflow di deploy staging
- binding email dichiarati esplicitamente in `env.staging`

## Credenziale Cloudflare dedicata

Il workflow `.github/workflows/staging-deploy.yml` usa esclusivamente il secret GitHub environment `staging` denominato:

`CLOUDFLARE_STAGING_API_TOKEN`

Non riutilizzare il secret generico `CLOUDFLARE_API_TOKEN` diagnosticato il 16/09/2026 con errori Cloudflare `9106` e `6111`.

Salvare nel secret solo il valore grezzo dell'API token. Non aggiungere il prefisso `Bearer` e non usare una Global API Key come `CLOUDFLARE_API_TOKEN`.

### Permessi minimi

Per un Worker staging già esistente: Workers `Editor` sul solo Worker `splendoria-v2-staging`, oppure `Editor` a livello prodotto Workers.

Se il Worker staging non esiste ancora, crearlo una sola volta e poi usare Workers `Editor` sul solo Worker. Evitare di mantenere token Admin permanenti.

Il solo deploy del Worker con un binding D1 non richiede permessi D1 separati. Aggiungere permessi D1 soltanto se una pipeline futura dovrà interrogare o modificare direttamente `splendoria-v2-test`.

Conservare inoltre `CLOUDFLARE_ACCOUNT_ID` nel GitHub environment `staging`.

## Procedura GitHub

1. Aprire repository Settings → Environments → `staging`.
2. Creare/sostituire `CLOUDFLARE_STAGING_API_TOKEN` con il token Cloudflare dedicato.
3. Verificare che `CLOUDFLARE_ACCOUNT_ID` sia presente.
4. Non inserire token in file `.env`, `wrangler.jsonc`, issue, PR o log.
5. Aprire Actions → `Splendoria staging deploy`.
6. Impostare `candidate_ref` sulla branch candidata da testare.
7. Avviare manualmente il workflow.

## Gate automatici prima del deploy

La pipeline rifiuta il deploy se:

- l'URL staging coincide con produzione;
- il Worker non è `splendoria-v2-staging`;
- il D1 non è `splendoria-v2-test`;
- il test di isolamento staging fallisce;
- Wrangler dry-run fallisce;
- una delle regressioni presenti sulla branch candidata fallisce;
- manca il token staging dedicato o l'Account ID.

## Acceptance HTTP dopo il deploy

Dopo il deploy devono rispondere correttamente almeno:

- `/healthz`
- `/`
- `/registrati`
- `/area-clienti`
- `/area-amministratore`
- `/accedi` con redirect verso `/area-clienti`
- `/de/`
- `/en/`
- `/de/area-clienti`
- `/en/area-clienti`

Il workflow non promuove automaticamente nulla in produzione.
