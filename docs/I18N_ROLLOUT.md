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

Stato: in lavorazione sul branch i18n. La produzione italiana resta invariata.

### Fase 1B — Pagine pubbliche informative

- `/guida`
- `/privacy-policy`
- `/cookie-policy`
- `/termini-condizioni`
- `/note-legali`
- `/trasparenza-ai`

Per DE/EN verranno usate route prefissate equivalenti. Le pagine legali richiedono traduzione semanticamente fedele; nessuna parafrasi che modifichi obblighi, basi giuridiche, responsabilità o diritti.

### Fase 2 — Onboarding e accesso cliente

- registrazione
- area clienti / login
- verifica email
- password dimenticata
- reimpostazione password
- account cliente
- messaggi di errore / successo / sessione scaduta

L'accesso amministratore e la verifica amministratore restano solo in italiano e fuori dal routing localizzato.

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

### Fase 4 — AI e contenuti generati

La locale UI non deve decidere automaticamente la lingua del libro. Vanno mantenuti distinti almeno:

- `uiLocale`: `it`, `de`, `en`
- `bookLanguage`: lingua dell'opera
- `dictationLanguage`: lingua del riconoscimento vocale
- `museOutputLanguage`: normalmente allineata al libro, non all'interfaccia

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
8. viene eseguito uno smoke test finale sulla build destinata al deploy.
