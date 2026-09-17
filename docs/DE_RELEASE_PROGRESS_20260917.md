# Splendoria DE — programma e stato release

17 settembre 2026. Workstream principale: PR #66, integrata con squash commit `bea2f94e75525c0a2158f47572938c2ea2c01717` nella branch `splendoria.vip`.

## Bussola

Il lettore tedesco deve poter capire, raccontare, dettare, correggere e ritrovare il proprio testo senza sorprese. Priorità: integrità del manoscritto, lingua esplicita, leggibilità, zero attrito e rilascio prudente. Italiano e inglese non devono regredire. Le modifiche di onboarding/cache della PR #62 restano separate finché non vengono composte deliberatamente.

## Stato esatto

Il candidato DE v2 è **integrato nella branch di produzione ma non ancora pubblicato sul Worker Cloudflare di produzione**.

La promozione applicativa è stata verificata in staging isolato. I due tentativi di deploy produzione del 17/09/2026 sono stati fermati prima del comando `wrangler deploy` perché `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` non sono configurati né come repository secrets né nell'environment GitHub `production`. Il gate ha quindi evitato qualsiasi modifica accidentale a Cloudflare produzione.

Nessuna migrazione D1 è stata eseguita. Nessuna email reale è stata inviata. Nessun manoscritto o account di produzione è stato usato nei test.

## Completato e verificato

- DE-01 — copy: corretta la precedenza delle frasi intere rispetto alle sostituzioni di parole brevi; footer, guida, livelli di assistenza, date e residui pubblici mirati DE verificati. Localizzate anche le meta description di registrazione, accesso e recupero password in DE e EN.
- DE-02 — runtime/sessioni: asset tedesco finale `de-v2` verificato; risultati tardivi e riavvii non devono contaminare sessioni successive.
- DE-03 — leggibilità: controlli dettatura con target minimo 48 px, testo leggibile, wrapping/focus/contrasto verificati deterministicamente e in fixture a più larghezze.
- DE-04 — integrità durante dettatura: digitazione, cancellazione, incolla, IME e modifiche programmatiche durante l'ascolto fermano prudentemente la sessione e preservano il testo autore rispetto a risultati tardivi.
- DE-05 — lingua del libro: la preferenza del libro prevale sulla vecchia preferenza globale del browser; un libro italiano non viene forzato in tedesco solo perché la UI è DE.
- DE-06 — ripetizioni: deduplicazione per indice di risultato; `ja ja`, `schon schön`, `Masse Maße` e ripetizioni espressive restano distinte.
- DE-07 — staging isolato: Worker `splendoria-v2-staging` e D1 `splendoria-v2-test` usati senza migrazioni. Il candidato è stato effettivamente caricato e servito. Il token staging non possiede il permesso di lettura Email Routing e Wrangler termina non-zero dopo aver completato il deploy: issue infrastrutturale da correggere.
- DE-10 — CI: il workflow dei residui i18n ora testa lo SHA reale, non la vecchia branch; i workflow temporanei di staging/continuazione sono stati rimossi. PR #66 mergeata con squash.

## Prove dell'ultima release candidate

Nel gate eseguito sulla branch di produzione il 17/09/2026, prima del blocco credenziali Cloudflare:

- `npm run check`: PASS;
- tutti gli script `test/i18n-*.mjs`: PASS;
- dettatura DE: **46/46 PASS**;
- runtime finale: **24/24 PASS**, incluso il guard sui metadata DE/EN;
- scanner dei residui visibili: PASS su superfici pubbliche, auth, client, editor, preview e 404 rappresentative;
- dry-run Wrangler: PASS;
- nessuna migrazione DB.

`npm ci` segnala inoltre 4 vulnerabilità high severity nelle dipendenze. Non è stato eseguito `npm audit fix` automaticamente per evitare un aggiornamento dipendenze non correlato e potenzialmente regressivo durante il rilascio i18n. Va gestito in un workstream separato.

## Programma — fatto / da fare

| ID | Fatto | Da fare |
|---|---|---|
| DE-01 | Copy pubblico mirato, footer, date, metadata DE/EN | Revisione redazionale completa degli stati privati |
| DE-02 | Sessioni protette e asset finale DE-v2 verificato | Read-back del nuovo asset sul dominio produzione dopo deploy |
| DE-03 | Controlli leggibili/accessibili e fixture multi-larghezza | Zoom 200%, font reali, Safari/iOS e Android |
| DE-04 | Modifiche manuali/IME/ritardi/arresti protetti | Microfono reale su dispositivi |
| DE-05 | Priorità lingua libro verificata | Salva/riapri due libri di lingue diverse con account reale di test |
| DE-06 | Ripetizioni/umlaut/interim protetti | Pause lunghe, servizi browser e correzione IA reali |
| DE-07 | Staging isolato operativo e candidato servito | Correggere permesso Email Routing del token staging |
| DE-08 | Copertura pubblica/auth/editor aumentata | Email reali controllate, PDF, pagamenti, trial e matrice errori completa |
| DE-09 | PR #62 mantenuta separata | Comporre onboarding/cache senza doppie implementazioni |
| DE-10 | CI SHA reale, temp workflow rimossi, PR #66 integrata | Riallineare smoke cache nel workstream #62 |
| DE-11 | Attriti mobili individuati | Banner privacy misto e altezza menu mobile; collaudo dispositivo reale |
| DE-12 | Gate produzione completo fino alle credenziali, nessuna modifica Cloudflare accidentale | Configurare `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` nel corretto scope GitHub e rilanciare il workflow permanente `Splendoria i18n production release` |

## Blocco attuale per il go-live

Per pubblicare il candidato già integrato occorrono le credenziali Cloudflare di produzione nello scope dell'environment GitHub `production`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Il workflow permanente `.github/workflows/i18n-production-release.yml` usa già `environment: production`, richiede SHA esatto, conferma esplicita e smoke test post-deploy. Dopo il ripristino delle credenziali, usare quel workflow anziché ricreare un workflow temporaneo.

Rollback applicativo: revert del commit release e redeploy del last-known-good; nessuna operazione DB necessaria per questa tranche.
