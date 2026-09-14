# Splendoria — rollout multilingua IT / DE / EN

Branch di lavoro: `i18n/public-de-en-phase1`

## Principi non negoziabili

1. La versione italiana è la fonte canonica e non viene modificata dal lavoro di traduzione.
2. Le lingue pubbliche usano URL distinti: `/` (IT), `/de/` (DE), `/en/` (EN).
3. Nessun redirect automatico basato sulla lingua del browser: la scelta resta all'utente.
4. Ogni pagina indicizzabile deve avere `lang`, canonical e `hreflang` coerenti, incluso `x-default`.
5. I nomi prodotto restano invariati: Splendoria, Digital, Premium, Signature, Musa/Muse, Scuola Holden.
6. I valori semantici di form, API e database non vengono tradotti. Si traduce l'interfaccia, non i contratti macchina-macchina.
7. La lingua dell'interfaccia è separata dalla lingua del libro: un utente DE può scrivere un libro IT, EN o in un'altra lingua supportata.
8. Nessuna area amministrativa viene tradotta o esposta tramite route localizzate.
9. Nessuna traduzione globale deve poter modificare testo scritto dall'utente, nomi, titoli, capitoli o dati persistiti.
10. Ogni fase viene testata prima di essere collegata alla produzione.

## Stato verificato — 14 settembre 2026

Il deep-pass automatico del branch copre attualmente e con CI verde:

- vetrina IT/DE/EN e selettore lingua;
- Guida e pagine legali/pubbliche;
- SEO, sitemap, robots, HEAD, canonical e hreflang;
- registrazione, login cliente, recupero/reset password;
- verifica email cliente e reinvio del collegamento nelle route DE/EN;
- email transazionali cliente di verifica indirizzo e reset password in DE/EN, con link che mantengono la lingua scelta;
- Account, Studio, nuovo libro e logout;
- editor libro e anteprima;
- scelta Digital/Premium/Signature e bonifico;
- stati commerciali: prova gratuita attiva, prova scaduta, formula scelta, bonifico in attesa, pagato, gratuito e rimborsato;
- salvataggio capitolo e autosalvataggio;
- Affidati alla Musa, Migliora e Correggi grammatica;
- ripristino ultima versione ed eliminazione libro;
- redirect dopo POST e messaggi operativi localizzati;
- sessione scaduta, libro non appartenente all'utente, capitolo bloccato e POST non valido;
- pagine 404 DE/EN e relativi percorsi di rientro;
- scansione automatica delle stringhe italiane visibili su un insieme rappresentativo di pagine pubbliche, autenticazione, Studio, account, editor, anteprima e 404;
- sicurezza responsive per etichette DE/EN lunghe: wrapping di navigazione, CTA e footer, contenimento tabelle e azioni editor su mobile;
- integrità dei contenuti scritti dall'autore anche quando contengono parole uguali alle stringhe UI;
- esclusione completa dell'area amministrativa dal routing localizzato.

La versione italiana `src/worker.js` / `src/studio-worker.js` resta protetta da un gate CI che fallisce in caso di modifica rispetto al ramo di produzione.

Le email amministrative e le notifiche interne non vengono tradotte intenzionalmente: il layer i18n interviene soltanto sulle email rivolte al cliente e riconosciute come verifica indirizzo o recupero password.

## Inventario pagine e fasi

### Fase 1A — Vetrina principale

- `/`
- `/de/`
- `/en/`
- navigazione IT / DE / EN
- Hero e sezioni editoriali
- Digital / Premium / Signature
- confronto metodo
- esempio narrativo con slider
- famiglia / impresa
- governance editoriale
- Assessment Editoriale
- FAQ
- banner privacy
- footer
- SEO, canonical, hreflang, social metadata
- stati dinamici dell'Assessment e messaggi di validazione

Stato: deep-pass automatico completato sul branch i18n; non ancora pubblicato in produzione.

### Fase 1B — Pagine pubbliche informative

- `/guida`
- `/privacy-policy`
- `/cookie-policy`
- `/termini-condizioni`
- `/note-legali`
- `/trasparenza-ai`

Le route DE/EN prefissate equivalenti sono coperte dai test. Le pagine legali mantengono il significato dell'italiano senza parafrasi che modifichino obblighi, basi giuridiche, responsabilità o diritti.

Stato: deep-pass automatico completato; resta il controllo visuale finale prima del rilascio.

### Fase 2 — Onboarding e accesso cliente

- registrazione
- area clienti / login
- verifica email
- reinvio verifica email
- password dimenticata
- reimpostazione password
- account cliente
- messaggi di errore / successo / sessione scaduta
- email cliente di verifica indirizzo
- email cliente di reset password

L'accesso amministratore e la verifica amministratore restano solo in italiano e fuori dal routing localizzato.

Stato: deep-pass automatico completato per i flussi web cliente e per le due email transazionali cliente critiche. Prima del rilascio definitivo resta da verificare la consegna reale tramite il provider email in ambiente di staging/preview, inclusi i link ricevuti in una casella reale.

### Fase 3 — Studio

- dashboard Studio
- nuovo libro
- editor progetto
- materiali sorgente
- intervista Musa
- struttura / indice
- capitoli
- Migliora
- Affidati alla Musa
- dettatura
- autosalvataggio e salvataggio manuale
- ripristino
- anteprima
- PDF
- acquisto / richiesta sblocco

Stato: editor, anteprima, salvataggi, azioni Musa, ripristino, cancellazione e flussi commerciali sono coperti dal deep-pass automatico. Il controllo statico delle regole responsive e delle etichette DE/EN lunghe è verde. Prima del deploy restano il controllo visuale su browser reali e la verifica della stampa/PDF con dati di staging.

### Fase 4 — AI e contenuti generati

La locale UI non deve decidere automaticamente la lingua del libro. Vanno mantenuti distinti almeno:

- `uiLocale`: `it`, `de`, `en`
- `bookLanguage`: lingua dell'opera
- `dictationLanguage`: lingua del riconoscimento vocale
- `museOutputLanguage`: normalmente allineata al libro, non all'interfaccia

Stato: il deep-pass attuale verifica che la lingua UI non alteri i contenuti dell'autore e che la lingua dei messaggi UI non venga presa dalla lingua della dettatura. La separazione esplicita e persistita di `bookLanguage` / `museOutputLanguage` resta una fase architetturale successiva e non deve essere introdotta implicitamente durante il deploy della sola UI multilingua.

## Edge case da verificare in ogni fase

- query string (`?formula=...`, stati di contatto, token)
- slash canonico (`/de` -> `/de/`)
- refresh e back/forward
- sessione autenticata e non autenticata
- URL assoluti e relativi
- redirect dopo POST
- errori 4xx/5xx
- testi lunghi tedeschi su desktop e mobile
- `ä`, `ö`, `ü`, `ß`, apostrofi tipografici, virgolette e caratteri Unicode
- screen reader, `aria-label`, `alt`, `title`, placeholder
- focus da tastiera
- stampa e PDF
- cache degli asset localizzati
- link da una lingua all'altra
- contenuti utente che contengono parole coincidenti con stringhe dell'interfaccia
- valori hidden/select/radio che devono restare canonici
- date, numeri e formattazione locale
- e-mail transazionali e link contenuti nelle e-mail
- SEO: canonical, hreflang, sitemap, robots e noindex delle aree private

## Gate di rilascio

Una fase può essere collegata alla produzione solo se:

1. i test di sintassi passano;
2. `worker.js` e `studio-worker.js` non risultano modificati rispetto al ramo italiano di produzione;
3. il test dedicato i18n passa per IT, DE ed EN;
4. il dry-run Wrangler passa;
5. non restano stringhe italiane visibili nelle pagine DE/EN della fase;
6. i valori semantici dei form restano invariati;
7. non esistono route localizzate per l'area amministrativa;
8. viene eseguito uno smoke test finale sulla build destinata al deploy;
9. viene completato un controllo visuale manuale almeno su desktop e mobile per IT/DE/EN;
10. vengono verificati stampa/PDF, sessione reale, cookie, invio email reale e flussi critici con dati di staging;
11. il PR di rilascio non è in conflitto con il ramo di produzione e la CI è verde sull'HEAD da distribuire.

## Decisione deploy

Non effettuare il deploy direttamente dal branch di sviluppo. Prima del rilascio:

1. mantenere il PR in Draft durante il deep-pass;
2. eseguire il controllo visuale e i test reali su ambiente non produttivo o preview;
3. verificare la consegna reale delle email transazionali DE/EN e i relativi link;
4. verificare stampa/PDF e comportamento responsive su browser reali;
5. congelare l'HEAD candidato al rilascio;
6. rieseguire l'intera pipeline CI sul commit candidato;
7. solo a quel punto rendere il PR pronto, fare merge controllato e deploy con smoke test immediato e piano di rollback.
