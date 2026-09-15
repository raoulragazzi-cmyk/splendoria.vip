# Splendoria Studio — button/action deep-pass

Questo documento accompagna PR #45 e registra il contratto funzionale dei controlli Studio verificati automaticamente da `test/studio-button-contract-smoke.mjs`.

## Principio

Le etichette possono essere tradotte; route, metodi HTTP, valori macchina e token di conferma non devono cambiare. I controlli JavaScript che non devono inviare un form devono avere `type="button"` esplicito.

## Operazioni di progetto

- crea libro → `POST /nuovo-libro`;
- salva dati libro → `POST /libro/:id/salva`;
- Migliora campo → `POST /libro/:id/migliora`;
- Affidati alla Musa sul campo → `POST /libro/:id/affidati`;
- genera intervista → `POST /libro/:id/intervista`;
- salva risposte → `POST /libro/:id/risposte`;
- migliora risposta → `POST /libro/:id/risposte/migliora`;
- Musa sulla risposta → `POST /libro/:id/risposte/affidati`;
- crea struttura → `POST /libro/:id/struttura`;
- ripristina libro → `POST /libro/:id/ripristina`;
- elimina libro → `POST /libro/:id/elimina`, protetto da password e token canonico `ELIMINA`.

## Operazioni capitolo

- salva → `POST /libro/:id/capitolo/:chapterId/salva`;
- genera / nuova versione → `POST /libro/:id/capitolo/:chapterId/genera`;
- rifinisci → `POST /libro/:id/capitolo/:chapterId/rifinisci`.

Valori macchina di rifinitura verificati: `improve`, `grammar`, `clarity`, `emotional`, `vivid`, `elegant`, `short`.

I pulsanti Musa/Migliora che lavorano su una porzione del testo usano `formnovalidate` intenzionalmente, in modo che campi obbligatori non pertinenti non blocchino l'azione.

## Controlli che non devono inviare form

Sono verificati come `type="button"` o equivalente JavaScript esplicito:

- dettatura;
- precedente/successiva nella preview del capitolo;
- precedente/successivo nel navigatore capitoli;
- stampa guida e stampa/PDF;
- generazione/stampa Assessment lato browser;
- chiusura/accettazione privacy;
- back-to-top.

## Localizzazione

Il layer editor DE/EN riscrive in modo coerente `href`, `action`, `formaction` e `data-book-path`, mantenendo le route canoniche interne. Il selettore IT/DE/EN conserva path e query string.

Le etichette principali sono verificate in tedesco e inglese; i valori macchina restano quelli italiani/canonici. L'admin non viene aggiunto alle route localizzate.

## Azioni distruttive

- eliminazione libro: token canonico `ELIMINA` + password corrente;
- eliminazione account: token canonico `CANCELLA`.

Questi token non vanno tradotti perché fanno parte del contratto macchina e delle protezioni anti-errore.

## Gate

Il test deve passare insieme a Studio trilingue, deep i18n, Muse DE/EN, smoke applicativo e Wrangler dry-run prima di promuovere PR #45.
