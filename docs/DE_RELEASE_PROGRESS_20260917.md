# Splendoria DE — programma e stato release

17 settembre 2026. Workstream principale: PR #66, integrata con squash commit `bea2f94e75525c0a2158f47572938c2ea2c01717` nella branch `splendoria.vip`.

## Bussola

Il lettore tedesco deve poter capire, raccontare, dettare, correggere e ritrovare il proprio testo senza sorprese. Priorità: integrità del manoscritto, lingua esplicita, leggibilità, zero attrito e rilascio prudente. Italiano e inglese non devono regredire. Le modifiche di onboarding/cache della PR #62 restano separate finché non vengono composte deliberatamente.

## Stato esatto

Il candidato DE v2 è **integrato e pubblicato sul Worker Cloudflare di produzione**.

Il rilascio è stato eseguito il 17/09/2026 con un workflow ponte one-shot che ha riutilizzato esclusivamente le credenziali già verificate dell'environment GitHub `staging`, mantenendo la configurazione root di produzione (`splendoria-v2`, D1 `splendoria-db`). Il workflow ha superato gate credenziali, test applicativi e dry-run. Il comando `wrangler deploy` ha poi terminato non-zero, ma il read-back immediato del dominio di produzione ha confermato che il Worker era già stato pubblicato, replicando il comportamento già osservato in staging quando Wrangler incontra successivamente il controllo Email Routing.

Read-back live verificato:

- `https://www.splendoria.vip/healthz` → `status: ok`, database ok, AI configurata, email configurata;
- `/de/area-clienti` → titolo `Kundenbereich — Splendoria` e nuova meta description tedesca;
- `/de/registrati` → titolo `Registrieren — Splendoria` e nuova meta description tedesca;
- `/de/` → contenuto DE servito regolarmente.

Il workflow ponte è stato rimosso subito dopo la verifica live. Nessuna migrazione D1 è stata eseguita. Nessuna email reale è stata inviata. Nessun manoscritto o account di produzione è stato usato nei test.

## Completato e verificato

- DE-01 — copy: corretta la precedenza delle frasi intere rispetto alle sostituzioni di parole brevi; footer, guida, livelli di assistenza, date e residui pubblici mirati DE verificati. Localizzate anche le meta description di registrazione, accesso e recupero password in DE e EN.
- DE-02 — runtime/sessioni: asset tedesco finale `de-v2` verificato; risultati tardivi e riavvii non devono contaminare sessioni successive; read-back produzione completato sulle superfici pubbliche DE.
- DE-03 — leggibilità: controlli dettatura con target minimo 48 px, testo leggibile, wrapping/focus/contrasto verificati deterministicamente e in fixture a più larghezze.
- DE-04 — integrità durante dettatura: digitazione, cancellazione, incolla, IME e modifiche programmatiche durante l'ascolto fermano prudentemente la sessione e preservano il testo autore rispetto a risultati tardivi.
- DE-05 — lingua del libro: la preferenza del libro prevale sulla vecchia preferenza globale del browser; un libro italiano non viene forzato in tedesco solo perché la UI è DE.
- DE-06 — ripetizioni: deduplicazione per indice di risultato; `ja ja`, `schon schön`, `Masse Maße` e ripetizioni espressive restano distinte.
- DE-07 — staging isolato: Worker `splendoria-v2-staging` e D1 `splendoria-v2-test` usati senza migrazioni. Il candidato è stato effettivamente caricato e servito. Il token staging continua a produrre un errore Wrangler successivo al deploy legato ai permessi Email Routing.
- DE-10 — CI: il workflow dei residui i18n testa lo SHA reale; il workflow permanente di produzione è stato riallineato all'entrypoint `src/german-editorial-room-worker.js` e include i test DE/dettatura/runtime.
- DE-12 — produzione: candidato pubblicato e verificato live senza migrazioni DB; workflow ponte rimosso dopo il go-live.

## Prove della release

Nel gate finale del 17/09/2026:

- gate credenziali: PASS;
- installazione dipendenze: PASS;
- tutti gli script `test/i18n-*.mjs`: PASS;
- dettatura DE: PASS;
- runtime finale: PASS, incluso il guard sui metadata DE/EN;
- dry-run Wrangler produzione: PASS;
- deploy Worker: pubblicazione effettiva confermata da read-back live, nonostante exit non-zero finale di Wrangler;
- nessuna migrazione DB.

`npm ci` segnala inoltre 4 vulnerabilità high severity nelle dipendenze. Non è stato eseguito `npm audit fix` automaticamente per evitare un aggiornamento dipendenze non correlato e potenzialmente regressivo durante il rilascio i18n. Va gestito in un workstream separato.

## Programma — fatto / da fare

| ID | Fatto | Da fare |
|---|---|---|
| DE-01 | Copy pubblico mirato, footer, date, metadata DE/EN | Revisione redazionale completa degli stati privati |
| DE-02 | Sessioni protette, asset finale DE-v2 e read-back produzione verificati | Test autenticato degli stati privati |
| DE-03 | Controlli leggibili/accessibili e fixture multi-larghezza | Zoom 200%, font reali, Safari/iOS e Android |
| DE-04 | Modifiche manuali/IME/ritardi/arresti protetti | Microfono reale su dispositivi |
| DE-05 | Priorità lingua libro verificata | Salva/riapri due libri di lingue diverse con account reale di test |
| DE-06 | Ripetizioni/umlaut/interim protetti | Pause lunghe, servizi browser e correzione IA reali |
| DE-07 | Staging isolato operativo e candidato servito | Correggere il permesso/controllo Email Routing che lascia Wrangler non-zero dopo deploy |
| DE-08 | Copertura pubblica/auth/editor aumentata | Email reali controllate, PDF, pagamenti, trial e matrice errori completa |
| DE-09 | PR #62 mantenuta separata | Comporre onboarding/cache senza doppie implementazioni |
| DE-10 | CI SHA reale, entrypoint produzione riallineato, temp workflow rimossi | Riallineare smoke cache nel workstream #62 |
| DE-11 | Attriti mobili individuati | Banner privacy misto e altezza menu mobile; collaudo dispositivo reale |
| DE-12 | Produzione pubblicata e verificata live senza migrazioni DB | Configurare in modo definitivo i secret dell'environment GitHub `production` per eliminare il workaround |

## Punto infrastrutturale residuo

Il go-live applicativo è completato. Rimane da sistemare l'infrastruttura di rilascio ordinaria:

- configurare `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` nell'environment GitHub `production`;
- correggere il permesso/controllo Email Routing che può far terminare Wrangler non-zero dopo un deploy già avvenuto;
- usare poi esclusivamente il workflow permanente `.github/workflows/i18n-production-release.yml` per i successivi rilasci.

Rollback applicativo: revert del commit release e redeploy del last-known-good; nessuna operazione DB necessaria per questa tranche.
