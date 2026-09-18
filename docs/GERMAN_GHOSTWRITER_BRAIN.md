# Splendoria — Musa tedesca e redazione DACH

Branch candidata: `ai/de-muse-dual-model-20260917` — PR #67.

## Obiettivo

Migliorare la Musa tedesca e l'esperienza Studio DE senza creare una seconda regia dei modelli, senza modificare il core italiano e senza aggiungere chiamate AI obbligatorie.

## Bussola editoriale

Ordine di priorità non negoziabile:

1. fedeltà ai fatti e alle fonti;
2. fedeltà alla voce dell'autore;
3. chiarezza e naturalezza del tedesco;
4. struttura narrativa e ritmo;
5. eleganza stilistica.

Quando due obiettivi entrano in conflitto, vince quello più in alto.

## Redazione tedesca

`src/german-editorial-room-worker.js` assegna un contratto editoriale alla chiamata AI che Splendoria sta già eseguendo. Non aggiunge una cascata obbligatoria di modelli.

### Ghostwriter

Generazione capitolo, Affidati alla Musa, struttura e intervista mantengono il **modello scelto dal core canonico**. Il wrapper tedesco migliora istruzioni e disciplina editoriale senza sostituire la politica di routing già esistente.

### Lektor

Per `grammar` viene usato `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Corregge lingua e sintassi in modo conservativo. Citazioni dirette, grafia e segni di citazione devono restare byte-identici.

### Stilredaktion

Per `improve`, `clarity`, `emotional`, `vivid`, `elegant` e `short` viene usato Llama 3.3 70B Fast. Deve migliorare il testo senza diventare autore: niente fatti, emozioni, causalità o interpretazioni non sostenuti dalle fonti. Le valutazioni non documentate vanno eliminate, non rese più eleganti.

### Faktenkontrolle

I controlli macchina `APPROVATO/RIFIUTATO` e `[FONTI_INSUFFICIENTI]` ricevono il contratto Faktenkontrolle ma **mantengono il modello scelto dal core**. Nel benchmark a verdetto puro Qwen e Llama hanno entrambi ottenuto 6/6; non esiste quindi evidenza sufficiente per imporre un override del modello.

## Evidenza qualitativa

I benchmark sono stati eseguiti tramite Worker AI isolato, senza D1, email o route applicative, e rimossi dopo l'esecuzione.

### Otto casi narrativi difficili

Copertura: Südtirol/DACH, voce anziana, biografia aziendale, memoria frammentaria, fonti scarse, contraddizioni, citazioni e testo già buono.

Dopo aver allineato Qwen alla configurazione Workers AI usata dal prodotto (`chat_template_kwargs.enable_thinking=false`):
- 0 draft vuoti;
- 0 violazioni fattuali rilevate;
- buona disciplina di non-intervento sui testi già riusciti;
- contraddizioni e incertezze mantenute;
- citazioni protette con guardrail byte-identico.

### Casi editoriali avversariali

Sono stati provati grammatica difettosa, burocratese, retorica AI non supportata, emozioni plausibili ma non documentate, causalità inventata e citazioni.

Il risultato ha escluso una soluzione semplicistica “un modello fa tutto”: Llama è adatto a Lektor/Stilredaktion, ma non viene promosso a giudice universale dei fatti; Qwen può essere molto disciplinato ma in alcuni casi editoriali diventa eccessivamente conservativo.

## Interfaccia Studio DE/EN

`src/studio-deep-i18n-worker.js` copre anche il copy dinamico introdotto nel core dopo il primo rollout i18n. Sono protetti con test, tra gli altri:

- progressi della Musa;
- “Weitere Überarbeitungen”;
- “Automatisches Speichern aktiv”;
- navigazione capitoli;
- stati di autosalvataggio;
- messaggi password;
- placeholder dell'editor;
- Assessment/editorial project sheet.

Il test `test/studio-dynamic-residuals-smoke.mjs` scansiona sia il patch Studio sia il vero `studioScript()` in `src/worker.js`, così nuove stringhe italiane dinamiche non passano inosservate.

## Sicurezza del perimetro

- `src/worker.js`, `src/studio-worker.js` e `src/studio-language-worker.js` restano invariati rispetto alla produzione.
- Il layer `src/studio-deep-i18n-worker.js` è modificabile soltanto perché è parte esplicita di questa release DE/EN ed è protetto dai test dedicati.
- Nessuna migrazione D1.
- Nessuna modifica ai dati degli utenti.
- Italiano e inglese mantengono i percorsi canonici; l'inglese riceve soltanto le equivalenti coperture runtime delle stringhe dinamiche.
- Nessun file o Worker di benchmark deve restare nella PR finale.

## Gate prima del merge

1. German ghostwriter brain verde.
2. Studio deep i18n/Muse verde.
3. Studio trilingue verde.
4. suite i18n/app esistenti verdi.
5. Wrangler dry-run verde.
6. staging isolato e read-back delle risorse DE/EN.
7. residual scan sul JavaScript servito da staging.
8. PR fuori da Draft solo dopo questi controlli.

La produzione viene aggiornata soltanto dopo staging e verifica esplicita del candidato.
