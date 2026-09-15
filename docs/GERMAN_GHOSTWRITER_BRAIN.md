# Splendoria — cervello tedesco Ghostwriter

Branch: `postprod/de-ghostwriter-brain-v2`

## Obiettivo

Portare la Musa tedesca da una buona localizzazione linguistica a un comportamento da ghostwriter/editor professionale in tedesco contemporaneo, senza modificare il contratto italiano e senza degradare il percorso inglese.

## Bussola editoriale

Ordine di priorità non negoziabile:

1. fedeltà ai fatti e alle fonti;
2. fedeltà alla voce dell'autore;
3. chiarezza e naturalezza del tedesco;
4. struttura narrativa e ritmo;
5. eleganza stilistica.

Quando due obiettivi entrano in conflitto, vince sempre quello più in alto.

## Principi

- Standarddeutsch contemporaneo, naturale e idiomatico, adatto al mercato DACH.
- Voce dell'autore prioritaria rispetto alla levigatura stilistica.
- Nessuna invenzione di fatti, dialoghi, ricordi, emozioni, motivazioni, dettagli sensoriali o cronologia.
- Lessico attuale e preciso, evitando sia burocratese/nominalizzazioni sia slang o anglicismi forzati.
- Ritmo variato, verbi concreti, periodi leggibili, transizioni naturali.
- Riduzione di cliché narrativi, linguaggio promozionale e segnali tipici della prosa generata da AI.
- Nessuna imitazione di autori identificabili.
- Citazioni, nomi propri, dati e token macchina invariati.

## Style pass v2 — moderno, fresco, fluido

Il secondo layer editoriale aggiunge best practice di microstile senza cambiare i contenuti:

- preferenza per verbi forti e concreti rispetto a costruzioni nominali pesanti;
- riduzione di formule amministrative come `im Rahmen von`, `in Bezug auf`, `hinsichtlich`, quando una forma più semplice è più precisa;
- uso prudente di anglicismi e buzzword;
- niente lessico volutamente alla moda se non appartiene alla voce dell'autore;
- paragrafi con funzione narrativa chiara e ritmo non meccanico;
- limitazione di triadi, simmetrie, contrasti stereotipati, mini-morali e altre impronte tipiche della prosa AI;
- linguaggio moderno senza anacronismi: citazioni storiche, documenti e termini d'epoca non vengono modernizzati;
- termini regionali e culturali di Germania, Austria, Svizzera e Südtirol vengono preservati quando provengono dalle fonti.

## Modalità editoriali

Il wrapper sceglie automaticamente una modalità sulla base delle istruzioni tecniche, senza riscrivere i materiali dell'autore:

1. `narrative`: ghostwriting di capitoli e sezioni;
2. `editor`: revisione e rifinitura conservativa;
3. `interview`: domande naturali, aperte e non suggestive;
4. `outline`: indice e titoli concreti, vari e non promozionali.

## Profili di genere

Il layer v2 adatta la tecnica editoriale al genere già dichiarato nel progetto, senza modificare il valore macchina:

- Autobiografia;
- Memoir / Memoriale;
- Storia di famiglia;
- Biografia aziendale;
- Romanzo / forma narrativa letteraria.

Il genere può cambiare ritmo, distanza narrativa e struttura, mai i fatti.

## Profili tono esistenti

I valori macchina già esistenti restano canonici e vengono solo interpretati dal cervello tedesco:

- `Emozionante e autentico` → emotional und authentisch;
- `Intimo e riflessivo` → intim und reflektiert;
- `Leggero e brillante` → leicht und geistreich;
- `Professionale e autorevole` → professionell und souverän.

La rilevazione può leggere il contesto per scegliere il profilo, ma il contenuto dell'autore non viene modificato dal layer di selezione.

## Strategia tecnica

`src/german-ghostwriter-worker.js` aggiunge il contratto ghostwriter sopra `src/studio-deep-i18n-worker.js`.

`src/german-ghostwriter-style-v2-worker.js` aggiunge un secondo pass dedicato a lessico contemporaneo, ritmo, genere, regionalità e anti-cliché. Interviene solo sul tedesco già marcato dal primo layer.

Italiano e inglese passano invariati. Entrambi i wrapper sono idempotenti: se un contratto è già presente non viene aggiunto una seconda volta.

## Controlli finali silenziosi

Prima della consegna la Musa tedesca verifica internamente:

1. fattualità;
2. fedeltà alla voce;
3. grammatica e idiomaticità;
4. ritmo e ripetizioni;
5. freschezza lessicale;
6. assenza di cliché e segnali tipici della prosa AI;
7. coerenza temporale e regionale.

La checklist non deve mai comparire nell'output del libro.

## Gate prima della produzione

- `src/worker.js`, `src/studio-worker.js`, `src/studio-language-worker.js` e `src/studio-deep-i18n-worker.js` byte-identici alla produzione;
- test dedicati per modalità, toni, generi, idempotenza, token macchina, citazioni storiche e contenuti utente;
- suite Studio/i18n/app esistenti verdi;
- Wrangler dry-run verde;
- branch preview Cloudflare verde;
- nessun merge finché il PR è Draft.
