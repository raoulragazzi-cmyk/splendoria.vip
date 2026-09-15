# Splendoria — cervello tedesco Ghostwriter

Branch: `postprod/de-ghostwriter-brain-v2`

## Obiettivo

Portare la Musa tedesca da una buona localizzazione linguistica a un comportamento da ghostwriter/editor professionale in tedesco contemporaneo, senza modificare il contratto italiano e senza degradare il percorso inglese.

## Principi

- Standarddeutsch contemporaneo, naturale e idiomatico, adatto al mercato DACH.
- Voce dell'autore prioritaria rispetto alla levigatura stilistica.
- Nessuna invenzione di fatti, dialoghi, ricordi, emozioni, motivazioni, dettagli sensoriali o cronologia.
- Lessico attuale e preciso, evitando sia burocratese/nominalizzazioni sia slang o anglicismi forzati.
- Ritmo variato, verbi concreti, periodi leggibili, transizioni naturali.
- Riduzione di cliché narrativi, marketing language e segnali tipici della prosa generata da AI.
- Nessuna imitazione di autori identificabili.
- Citazioni, nomi propri, dati e token macchina invariati.

## Modalità editoriali

Il wrapper sceglie automaticamente una modalità sulla base delle istruzioni tecniche, senza riscrivere i materiali dell'autore:

1. `narrative`: ghostwriting di capitoli e sezioni;
2. `editor`: revisione e rifinitura conservativa;
3. `interview`: domande naturali, aperte e non suggestive;
4. `outline`: indice e titoli concreti, vari e non promozionali.

## Profili tono esistenti

I valori macchina già esistenti restano canonici e vengono solo interpretati dal cervello tedesco:

- `Emozionante e autentico` → emotional und authentisch;
- `Intimo e riflessivo` → intim und reflektiert;
- `Leggero e brillante` → leicht und geistreich;
- `Professionale e autorevole` → professionell und souverän.

La rilevazione può leggere il contesto per scegliere il profilo, ma il contenuto dell'autore non viene modificato dal layer di selezione.

## Strategia tecnica

Il nuovo `src/german-ghostwriter-worker.js` è un wrapper additivo sopra `src/studio-deep-i18n-worker.js`.

Interviene soltanto quando le opzioni inviate al binding AI contengono il marcatore tedesco già inserito dal layer multilingue. Italiano e inglese passano invariati. Il wrapper è idempotente: se il contratto ghostwriter è già presente non viene aggiunto una seconda volta.

## Gate prima della produzione

- `src/worker.js`, `src/studio-worker.js`, `src/studio-language-worker.js` e `src/studio-deep-i18n-worker.js` byte-identici alla produzione;
- test dedicati per modalità, toni, idempotenza, token macchina e contenuti utente;
- suite Studio/i18n/app esistenti verdi;
- Wrangler dry-run verde;
- branch preview Cloudflare verde;
- nessun merge finché il PR è Draft.
