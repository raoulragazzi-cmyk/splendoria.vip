# Splendoria IT/DE/EN — release runbook

Questo runbook riguarda esclusivamente il rollout multilingua del branch `i18n/public-de-en-phase1` verso il ramo di produzione `splendoria.vip`.

## Regole di sicurezza

- Nessun deploy di produzione parte direttamente dal branch di sviluppo.
- `src/worker.js` e `src/studio-worker.js` devono restare byte-identici al ramo di produzione durante il lavoro i18n.
- L'area amministrativa resta fuori dal routing DE/EN.
- Nessuna migrazione D1 di produzione fa parte del rollout i18n.
- I valori macchina, gli enum DB, le chiavi dei piani e i token di conferma restano canonici.
- I contenuti dell'autore non vengono tradotti o sostituiti dal layer i18n.
- Ogni deploy deve essere riferito a uno SHA esatto e verificabile.

## Baseline e rollback

Baseline di produzione verificata durante la preparazione del 14 settembre 2026:

`baefd22a667cb5ef2cf08eed6ff455f2d7ecf2b5`

Questa baseline resta il last-known-good finché il ramo `splendoria.vip` non cambia. Se produzione cambia prima del merge, il candidato i18n deve essere riallineato e la baseline aggiornata: non utilizzare uno SHA storico senza prima verificare che sia ancora il corretto punto di rollback.

Il rollback applicativo non richiede modifiche al database per questo rilascio: il workflow dedicato ridistribuisce uno SHA precedente appartenente alla storia del ramo di produzione e rifiuta commit non antenati della produzione corrente.

## Ambiente staging isolato

`wrangler.jsonc` definisce un ambiente `staging` separato:

- Worker: `splendoria-v2-staging`;
- D1: `splendoria-v2-test`, separato da `splendoria-db` di produzione;
- cron disabilitato;
- `APP_URL` distinto dalla produzione;
- binding AI esplicito;
- email reali bloccate nella configurazione committata.

Il workflow `.github/workflows/i18n-staging-acceptance.yml` è solo manuale (`workflow_dispatch`). Per impostazione predefinita esegue validazione e dry-run senza deploy. Quando `deploy_staging=true`, richiede credenziali Cloudflare, usa esclusivamente `--env staging`, controlla che il branch non sia indietro rispetto alla produzione e può autorizzare temporaneamente un solo destinatario email indicato esplicitamente per il test reale. La modifica del destinatario avviene soltanto nel workspace effimero del job e non viene committata.

Prima del primo deploy staging il valore `staging_base_url` deve essere verificato contro l'account Cloudflare. Il workflow rifiuta esplicitamente gli URL di produzione.

## Gate staging obbligatorio

Prima di rendere il PR pronto al merge devono risultare completati sullo staging reale:

1. deploy del Worker staging senza migrazioni non necessarie;
2. `/healthz`, home DE/EN, Guida DE/EN e ingressi Area clienti DE/EN raggiungibili;
3. controllo visuale desktop e mobile IT/DE/EN, con particolare attenzione alle stringhe tedesche lunghe;
4. registrazione/login/sessione/cookie con dati sintetici;
5. verifica email e reset password DE/EN con un unico indirizzo di test autorizzato e controllo dei link ricevuti;
6. creazione progetto, Studio, editor, salvataggio/autosalvataggio, Musa, Migliora, ripristino ed eliminazione;
7. prova dei principali stati commerciali senza effettuare transazioni reali;
8. anteprima e PDF/stampa con dati sintetici;
9. conferma che `/de/admin`, `/en/admin` e le equivalenti route amministrative non espongano un'area admin localizzata;
10. registrazione dello SHA che ha superato l'accettazione.

## Freeze del release candidate

Dopo l'accettazione staging:

1. confrontare nuovamente `splendoria.vip...i18n/public-de-en-phase1` e richiedere `behind_by = 0`;
2. non introdurre più modifiche funzionali;
3. registrare lo SHA HEAD del branch candidato;
4. rieseguire la pipeline completa i18n su quello stesso SHA;
5. verificare che anche `Guard Splendoria i18n release workflows` sia verde;
6. solo allora togliere il PR dallo stato Draft.

Qualsiasi commit successivo invalida il freeze e richiede un nuovo giro dei gate automatici; modifiche funzionali o di configurazione rilevanti richiedono anche la ripetizione dei controlli staging interessati.

## Merge controllato

Il PR deve essere mergeabile, senza review thread aperti e con base di produzione invariata rispetto all'ultima verifica. Dopo il merge, annotare:

- SHA del commit di produzione appena creato;
- SHA last-known-good precedente;
- ora del merge;
- esito dei check GitHub.

Non affidarsi a un deploy implicito. Il deploy è una fase distinta dal merge.

## Deploy produzione

Usare `.github/workflows/i18n-production-release.yml` dal ramo `splendoria.vip` dopo il merge.

Il workflow richiede:

- `expected_sha`: deve coincidere esattamente con HEAD di `splendoria.vip`;
- `deploy_production=true` per effettuare realmente il deploy;
- frase di conferma esatta `DEPLOY SPLENDORIA I18N`;
- credenziali Cloudflare disponibili.

Prima del deploy vengono rieseguiti i test i18n, il controllo del codice italiano, lo smoke storico e il Wrangler dry-run. Non vengono applicate migrazioni D1. Subito dopo il deploy il workflow controlla `/healthz`, home IT/DE/EN, Guida DE/EN e gli ingressi Area clienti IT/DE/EN.

Se lo smoke post-deploy fallisce, non eseguire altri cambiamenti sulla stessa release: usare il rollback controllato.

## Rollback produzione

Usare `.github/workflows/i18n-production-rollback.yml` indicando il last-known-good SHA registrato prima del deploy e la frase `ROLLBACK SPLENDORIA`.

Il workflow:

- verifica che lo SHA esista;
- verifica che sia un antenato del ramo di produzione corrente;
- fa checkout detached dello SHA esatto;
- esegue syntax check e Wrangler dry-run;
- ridistribuisce quel Worker;
- controlla `/healthz`, home e Area clienti.

Il rollback riguarda il codice Worker. Poiché questo rilascio i18n non prevede migrazioni di produzione, non esiste un rollback DB associato.

## Verifica finale dopo il rilascio

Dopo un deploy verde, eseguire comunque un controllo umano rapido su:

- homepage IT/DE/EN e cambio lingua;
- legal/Guida e canonical/hreflang;
- login cliente;
- Studio e un progetto esistente;
- un'azione Musa non distruttiva;
- anteprima/PDF;
- verifica che l'admin continui a essere soltanto italiano;
- una email transazionale cliente, se il test può essere eseguito senza disturbare utenti reali.

Solo dopo questi controlli il rollout può essere considerato concluso e il last-known-good può essere aggiornato al nuovo SHA di produzione.
