# Splendoria DE — programma e verifica del candidato v2

17 settembre 2026. PR di lavoro: **#66**, branch `ux/de-dictation-safety-audit-20260917`.
Baseline canonica: `d0ad61ddbc73e708f73fd20c238875cf6e17cff2`.
Punto di ripartenza: `9222466f77df3dee753907e14d6974918c84148e`; snapshot riproducibile `20d11406dfda2b4ca3c3d18634c14822e5495b6f`.

**Stato: candidato DRAFT, non una release. Nessuna promozione di produzione, modifica a D1 remoto, migrazione, account creato, email inviata o registrazione audio reale.**

## Bussola

Il lettore tedesco deve poter capire, raccontare, dettare, correggere e ritrovare il proprio testo senza sorprese. Priorità: integrità del manoscritto, scelte linguistiche esplicite, interfaccia leggibile, percorso completo verificato. Italiano e inglese non devono regredire. Nessuna percentuale di completamento senza inventario integrale degli stati.

## Parte realizzata in questa continuazione

### Testo e dettatura

- DE-04: se l'autore digita, incolla, cancella o avvia una composizione IME durante l'ascolto, la dettatura viene fermata e il testo manuale diventa intoccabile per i risultati tardivi. Il microfono resta segnalato in arresto fino all'evento `onend`; non viene dichiarato spento in anticipo.
- Gestiti anche cambi programmatici senza `input`, arresto richiesto prima di `onstart`, eccezioni di `stop`, doppio clic e riavvio dopo una modifica. Listener rimossi a fine sessione e in caso di errore sincrono.
- L'avvio seguito da silenzio conserva spazi e ritorni a capo esatti e non genera un falso evento di modifica. I risultati intermedi ritirati dal browser non lasciano residui.
- Correzione asincrona: protetti modifica e successivo annullamento; risposte non stringa/vuote ignorate; nessun furto di focus da un altro controllo. Restano le protezioni della prima tranche fra campo A/B e riavvio sullo stesso campo.
- DE-05: il selettore appartenente alle impostazioni del libro (`name=dictationLanguage`, `form=spl-book-settings`) prevale sulla vecchia preferenza globale del browser. La scelta manuale resta disponibile. Interfaccia DE non significa forzare DE su un libro italiano. Nessun nuovo campo DB o modifica alla persistenza.
- DE-06: duplicati riconosciuti tramite gli indici degli eventi, non per somiglianza delle parole. `ja ja`, `schon schön`, `Masse Maße` e ripetizioni espressive restano distinti. La lista cumulativa di risultati e il passaggio provvisorio/definitivo non raddoppiano il testo.
- Contratti di sostituzione atomica mantenuti: asset DE `x-spl-dictation-ux: de-v2`; `baseline` blocca l'accettazione. Nessun secondo riconoscitore o secondo Worker.

### Lingua e pulizia

- DE-01: corretta la precedenza delle frasi complete rispetto alle parole brevi nei cataloghi pubblici tedeschi. Le traduzioni disponibili non vengono più spezzate da sostituzioni parziali.
- Footer `Studio-Leitfaden`, assistenza `Stufe 1/2/3`, frase intera dell'aiuto salvataggio, FAQ sui materiali e label accessibile del footer verificati nel rendering finale.
- Pagine di registrazione/accesso/recupero: solo copia DE del footer, nessun cambiamento ad autenticazione, azioni del form, password o sessioni.
- Date pubblicate nelle pagine informative: stessa data, formato tedesco (`29. August 2026` o `12. August 2026`). Non aggiornate le date sostanziali e non riscritte clausole legali.
- Valori macchina dell'assistenza rimasti canonici in italiano. Cataloghi condivisi non mutati dall'ordinamento; ramo inglese mantiene l'ordine precedente.
- Harness di test estratto in `test/helpers/dictation-harness.mjs` e condiviso con le prove del vero entrypoint, senza duplicare il controller applicativo.

### CI — stato effettivo dopo la pubblicazione

Commit applicativo pubblicato: `2a111f60dbc4864e1d5cce56b25a58b1c5e3f292`.
Run remoto `35204241555`, job `105146024808`: **success**, con 69 test mirati PASS, gli altri script censiti PASS, FAIL smoke identico prima/dopo, guard dei file esclusi PASS, `npm run check:staging` PASS. Il dry-run ha verificato il binding `splendoria-v2-test` e si è concluso senza pubblicazione.

**DE-10 resta APERTO.** La modifica del workflow permanente per verificare il vero `pull_request.head.sha` è preparata localmente ma NON pubblicata. Il tentativo conclusivo di aggiornamento dei workflow è stato bloccato dal controllo di sicurezza dello strumento. Il vecchio `i18n-visible-residuals.yml` continua quindi a eseguire checkout della branch storica: il suo verde NON valida il candidato corrente.

Il workflow temporaneo `.github/workflows/de-continuation-snapshot-20260917.yml` è stato riutilizzato per applicare e verificare i 12 file in un unico commit, con push non forzato e controllo degli SHA. **Il file temporaneo non è stato rimosso** a causa dello stesso blocco. È limitato a un push che modifica quel preciso file sulla branch candidata; non ha cron né deploy, ma conserva `contents: write` e deve essere eliminato prima del merge. Non dichiarare conclusa questa pulizia.

Da completare dopo sblocco: rimuovere il workflow temporaneo, pubblicare il checkout esatto e le regressioni nel workflow permanente, eliminare il trigger storico duplicato e confermare il run sul nuovo SHA. Nessun tentativo alternativo di aggirare il blocco è stato eseguito.

## Verifiche eseguite localmente

1. **69 test deterministici PASS**: 46 sul controller estratto da `src/worker.js`, 23 sul rendering/asset del vero entrypoint `src/german-editorial-room-worker.js` configurato in Wrangler. Rete, DB e riconoscimento simulati.
2. Tutti gli script test eseguibili censiti: **28 PASS, 1 FAIL**. L'unico FAIL è `test/smoke.mjs:98`: si aspetta il vecchio `studio.js?v=20260812-3`. Riprodotto prima delle modifiche (allora 27 PASS/1 FAIL), log identico prima/dopo. **Non nascosto, non corretto abbassando il test, non chiamato suite completa verde.** La suite si arresta lì: le sue verifiche successive restano da riallineare e rieseguire con il workstream cache/onboarding #62.
3. Confronto byte-per-byte: **20 pagine IT/EN** (10 percorsi per lingua) e i due asset finali Studio IT/EN identici alla baseline. Dieci pagine pubbliche DE controllate sui residui mirati. Non prova di traduzione completa di ogni stato privato.
4. Chromium locale a **320, 390, 768, 1280 px**: HTML/CSS reale dell'editor reso con DB sintetico, controller estratto dall'asset finale, microfono simulato. Nessun overflow orizzontale nella fixture, controlli circa **52,3 px** e font **18 px**, modifica manuale conservata, nessun errore JS osservato.

Limite del punto 4: la navigazione del browser locale è bloccata dall'ambiente. Verifica eseguita con `set_content`, non una sessione autenticata, non l'intero bootstrap dinamico, non audio/dispositivi reali. Font esterni non caricati. Zoom reale al 200%, preferenze di lettura, Safari/iOS e Android ancora da accettare. Il dry-run Wrangler è stato eseguito con successo nel run remoto sopra indicato, non localmente.

Comandi ripetibili:

```sh
node --test test/studio-dictation-de-ux.test.mjs test/de-release-runtime.test.mjs
node test/i18n-visible-residuals-smoke.mjs
npm run check:staging
```

## Programma: completato nel candidato / ancora da fare

| ID | Completato nel candidato | Da fare prima del rilascio |
|---|---|---|
| DE-01 | Residui pubblici mirati e data, prove sul rendering finale | Revisione redazionale completa e residui nei percorsi privati |
| DE-02 | Protezioni sessioni e asset finale DE-v2 verificati | Conferma asset/header dello SHA candidato in staging isolato |
| DE-03 | Pulsanti, stati, fixture HTML/CSS a quattro larghezze | Bootstrap completo, zoom 200%, font reali e preferenze lettura |
| DE-04 | Protezione edit/IME, ritardi, stop/riavvio e prove | Collaudo operativo sui dispositivi con microfono reale |
| DE-05 | Priorità impostazione libro rispetto al browser; IT preservato | Salva/riapri due libri di lingue diverse in staging |
| DE-06 | Deduplicazione per indice e regressioni umlaut/ripetizioni | Pause lunghe, servizi/browser reali e correzione IA reale |
| DE-07 | Isolamento e gate documentati | Staging funzionante, account sintetico autorizzato, matrice rete/permessi |
| DE-08 | Esteso il controllo di footer/aria/errori mirati | Inventario di stati privati, tooltip, email, PDF, pagamenti e trial |
| DE-09 | #62 tenuta separata; nessuna doppia integrazione | Allineare deliberate dipendenze/cache e conflitti di integrazione |
| DE-10 | Run temporaneo con prove effettive e dry-run PASS; correzione CI preparata localmente | Blocco strumento: pubblicare CI sullo SHA esatto e rimuovere workflow temporaneo; riallineare FAIL smoke |
| DE-11 | Nuovi attriti documentati durante la fixture | Banner privacy dell'editor ancora misto IT/DE; menu mobile molto alto |

### Nuovi finding, non silenziosamente ampliati in questa tranche

Nella fixture dell'editor DE, il banner privacy mostra ancora il paragrafo italiano `Usiamo solo strumenti tecnici necessari...`, mentre titolo e pulsanti sono tradotti. A 390 px il menu superiore occupa molto spazio verticale; il banner riduce ulteriormente l'area utile. Questi rilievi non equivalgono a una misura della sessione reale: il bootstrap completo non era attivo. Occorre una correzione mirata nel workstream layout/consenso, con verifica dei testi autore protetti e senza modificare scelte privacy o durata del consenso.

## Staging, integrazione e rollback

#62 resta draft e il suo resoconto indica il blocco credenziale staging. Verificare lo stato reale del secret dedicato prima di tentare il deploy; non riutilizzare il vecchio token invalido. Le anteprime automatiche del bot associate a `splendoria-v2` non dimostrano un database isolato: non usarle per prove con account/manoscritti.

Non modificati: `src/worker.js`, `src/studio-worker.js`, configurazione Wrangler, migrazioni, modelli, prezzi, trial, PDF, cron, semantica di salvataggio o API. Non toccate le branch #62 e canonica. Le modifiche copy nel wrapper auth non sono modifiche al sistema auth.

Rollback: annullare il commit candidato/il collegamento helper e ripristinare il Worker precedente quando si procederà al rilascio; nessuna operazione DB necessaria. Prima di promuovere: comporre deliberatamente #62 e #66, suite completa realmente verde, accettazione staging e dispositivi, poi decisione esplicita di rilascio.

Riferimento tecnico per DE-06: MDN, `SpeechRecognitionEvent.results` e `resultIndex`: i risultati finali restano nella lista; i provvisori possono essere sostituiti o rimossi. https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionEvent/results
