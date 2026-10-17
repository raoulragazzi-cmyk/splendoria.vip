# Splendoria — Architecture & UX deep pass

Data audit: 2026-09-16
Baseline produzione analizzata: `7983ee4996eeb0f731d2999ea39a7883c1750797`

## Scopo

Questo documento fotografa l'architettura corrente e definisce una sequenza di miglioramento conservativa. La priorità è mantenere intatti i flussi che già funzionano, ridurre il rischio di regressioni e diminuire progressivamente l'attrito per l'utente.

Principio operativo: **nessun big-bang refactor**. Ogni intervento deve avere blast radius piccolo, regressioni dedicate, staging quando il comportamento runtime cambia e rollback chiaro.

## Invarianti da non rompere

1. I contenuti scritti dall'autore non devono essere tradotti, riscritti o persi per effetto dei layer UI/i18n.
2. Autosalvataggio e salvataggio preventivo prima delle azioni della Musa restano guardrail fondamentali.
3. Il primo capitolo gratuito e i blocchi commerciali dei capitoli successivi devono restare coerenti lato UI e lato server.
4. Italiano, tedesco e inglese devono mantenere separati: lingua UI, lingua libro, lingua output Musa e lingua dettatura.
5. Admin, cliente e sessioni devono restare separati; nessuna semplificazione UX deve indebolire autorizzazione o 2FA amministratore.
6. PDF/anteprima A5, dati D1 e migrazioni non si modificano durante interventi puramente UX o di manutenzione.
7. Token macchina e contratti di controllo della Musa (`APPROVATO`, `RIFIUTATO`, `[FONTI_INSUFFICIENTI]`) devono restare invariati.
8. Nessuna modifica di produzione senza test sullo stesso SHA candidato e, per modifiche sensibili, verifica in staging.

## Mappa architetturale corrente

### Runtime e infrastruttura

- Cloudflare Worker: `splendoria-v2`.
- Entry point produzione: `src/german-editorial-room-worker.js`.
- Assets statici: `public/`.
- Database: D1 `splendoria-db`; staging usa un D1 separato.
- Workers AI binding: `AI`.
- Email bindings dedicati a contatti/notifiche.
- Cron produzione ogni 5 minuti; cron staging disabilitato.

### Catena applicativa

La produzione è oggi composta da una serie di wrapper. In alto si trova la redazione tedesca, che delega allo Studio deep-i18n; quest'ultimo delega alla catena i18n/email/editor e infine al core storico.

Schema concettuale semplificato:

`german-editorial-room-worker`
→ `studio-deep-i18n-worker`
→ `studio-language-worker` / catena i18n
→ `i18n-email-worker`
→ ulteriori wrapper editor/client/auth/legal/not-found/session
→ core applicativo (`worker.js` / Studio)

La stratificazione ha consentito cambi incrementali con blast radius ridotto, ma oggi rende l'ordine dei wrapper parte implicita del comportamento. Una modifica apparentemente locale può quindi avere effetti laterali se cambia ordine, forma della Response, path canonico o testo sorgente atteso da un layer successivo.

### Core e dimensioni

`src/worker.js` è un file molto grande e contiene gran parte del comportamento applicativo e del markup. Sono presenti inoltre `styles.js`, `studio-worker.js`, layer dedicati a lingua/Studio e numerosi moduli `i18n-*`.

Questa forma non va rifattorizzata in un singolo passaggio. Prima bisogna rendere espliciti i contratti e aumentare la copertura sulle superfici sensibili.

## Debito tecnico osservato

### 1. Composition root non neutro

Il `main` di Wrangler punta al wrapper editoriale tedesco. Non è di per sé un bug, perché il wrapper delega agli altri flussi e applica il contratto tedesco solo quando richiesto, ma rende meno leggibile il punto di ingresso globale.

**Direzione futura:** introdurre, solo dopo regressioni sufficienti, un `app-worker.js` neutro che componga esplicitamente i middleware. Non farlo ora: cambierebbe una superficie troppo ampia.

### 2. Wrapper proliferation

La catena `i18n-*` contiene diversi moduli che seguono lo stesso schema:

- ricavare la locale dal path;
- delegare a un worker sottostante;
- verificare status/content-type/path;
- trasformare HTML, email o route;
- ricostruire la Response.

**Rischio:** ordine implicito, duplicazione, manutenzione costosa, regressioni da copy change.

**Direzione futura:** estrarre helper condivisi solo quando due o più layer possono essere sostituiti senza cambiare output byte/logica. Un helper per volta, con snapshot/regression test prima e dopo.

### 3. Localizzazione basata su string replacement

Molte traduzioni DE/EN dipendono da stringhe italiane esatte o regex sul markup. Sono presenti protezioni importanti per non alterare contenuto authored, ma il meccanismo resta fragile quando cambia il copy italiano.

**Direzione futura:** migrare progressivamente verso chiavi semantiche/dizionari di traduzione alla sorgente. Non convertire tutto insieme. Iniziare dalle superfici pubbliche e di autenticazione, poi Studio, lasciando per ultimo il contenuto editoriale sensibile.

### 4. Core monolitico

`worker.js` concentra routing, auth, admin, commerciale, Musa, generazione markup e altri domini.

**Direzione futura:** estrazione per domini solo dopo avere test di contratto per ciascuna famiglia di route. Ordine suggerito: rendering pubblico → auth/session → commerciale → admin → Studio/Musa. Studio/Musa per ultimi perché hanno maggiore rischio dati/editoriale.

### 5. Workflow storici e one-off

La cartella `.github/workflows` contiene workflow di release/guard ancora utili insieme a workflow storici legati a patch specifiche. Prima di cancellarli serve classificazione in:

- gate permanente;
- runbook/manual release;
- one-off completato;
- file morto/non eseguibile.

Nel presente audit viene rimosso soltanto un file sicuramente morto: `splendoria-writing-hardening-20260907.yml.`. Il nome termina con un punto dopo `.yml` e il workflow stesso ascolta un path diverso (`...yml`), quindi non è una protezione operativa affidabile.

## UX: principi di zero attrito

L'obiettivo non è aggiungere funzioni, ma ridurre decisioni inutili e rendere sempre evidente il prossimo passo.

### Percorso ideale del nuovo utente

1. Comprende in pochi secondi che Splendoria lo aiuta a trasformare i propri ricordi in un libro.
2. Clicca una sola CTA primaria.
3. Crea l'account con il minimo necessario.
4. Arriva direttamente nello Studio, con stato chiaro di verifica email senza bloccare attività innocue.
5. Crea il primo progetto con poche scelte comprensibili.
6. Vede una sola azione primaria per volta: racconta → salva → usa Musa → rivedi.
7. Non deve conoscere il modello dati, gli stati interni o la struttura tecnica.
8. Non perde mai testo e capisce sempre se il contenuto è salvato.
9. Quando incontra un blocco commerciale, capisce cosa è disponibile, perché e quale azione può fare.

## Attriti UX individuati

### A. `/accedi` chiede al cliente di scegliere tra cliente e amministratore

La pagina pubblica di accesso mostra sia `Area clienti` sia `Area amministratore`. Per quasi tutti gli utenti questa è una scelta non necessaria e introduce un concetto interno nel percorso cliente.

**Proposta:** mantenere `/area-amministratore` raggiungibile direttamente e protetto, ma rendere `/accedi` client-first (idealmente redirect o pagina cliente unica). Prima della modifica servono test di redirect, sessione admin già attiva, reset password e route localizzate.

### B. Guida completa utile ma troppo distante dal contesto

La guida è approfondita e corretta, ma un nuovo utente non dovrebbe doverla leggere per capire il passo successivo.

**Proposta:** mantenere la guida come reference e portare micro-help contestuale nello Studio: una frase, un esempio e una CTA per volta. Nessun tour invasivo.

### C. Troppe responsabilità tecniche visibili attraverso il copy

Ogni volta che l'utente vede termini come stato interno, nome route, meccanismi AI o logica commerciale tecnica, si crea attrito cognitivo.

**Proposta:** mantenere la precisione nell'admin e nei log, ma nel cliente usare linguaggio orientato al compito: “continua a scrivere”, “salvato”, “mancano informazioni”, “capitolo disponibile con il libro completo”.

### D. Admin deve restare fuori dal viaggio cliente

L'amministrazione è una superficie operativa separata. Nasconderla dalla navigazione cliente non è sicurezza per oscurità: la sicurezza resta server-side. È semplicemente una riduzione di rumore e di errori di percorso.

## Edge cases da coprire prima dei prossimi cambi UX

### Accesso e sessione

- utente anonimo su `/accedi`;
- cliente già autenticato;
- admin già autenticato;
- admin che apre `/area-clienti`;
- cliente che apre `/area-amministratore`;
- sessione scaduta durante POST;
- verifica email ancora pendente;
- reset password da lingua IT/DE/EN;
- link email scaduto o già usato.

### Studio e salvataggio

- cambio capitolo con autosave pendente;
- errore rete/D1 durante autosave;
- click Musa subito dopo digitazione;
- doppio click su azione AI;
- refresh durante generazione;
- sezione vuota / fonti insufficienti;
- dettatura che cambia target;
- ripristino backup dopo una modifica recente;
- contenuti molto lunghi o con caratteri speciali.

### i18n

- UI DE/EN con libro italiano;
- UI italiana con libro DE/EN;
- output Musa diverso dalla lingua UI;
- stringhe authored uguali a una label UI;
- route localizzata con query/hash;
- token macchina non tradotti;
- email con link che mantiene locale.

### Commerciale

- prova attiva/scaduta;
- primo capitolo disponibile, successivi bloccati;
- passaggio a pagato/gratuito;
- stato rimborsato;
- tentativo POST diretto su capitolo bloccato;
- cambio formula senza perdere contenuti.

### PDF

- titolo lungo;
- capitolo vuoto;
- caratteri tipografici/Unicode;
- cambio lingua;
- contenuto al limite pagina;
- anteprima e output finale coerenti.

## Piano incrementale

### Passo 0 — fotografia e pulizia certa (questo PR)

- documentare architettura e invarianti;
- rimuovere soltanto file operativi certamente morti;
- nessuna modifica runtime.

### Passo 1 — UX accesso, blast radius minimo

- aggiungere regression test del comportamento desiderato per `/accedi`;
- togliere la scelta admin dal percorso pubblico;
- mantenere `/area-amministratore` diretto e invariato;
- verificare IT/DE/EN e sessioni già attive.

### Passo 2 — inventario duplicazioni senza refactor

- mappare helper duplicati (`localeFromPath`, Response rewriting, path canonicalization, copy maps);
- scegliere un solo cluster a rischio basso;
- aggiungere test di equivalenza prima dell'estrazione.

### Passo 3 — consolidamento i18n progressivo

- iniziare da auth/pubblico;
- introdurre dizionari semantici per nuove modifiche;
- non migrare Studio/Musa finché il layer pubblico non è stabile.

### Passo 4 — composition root

- introdurre un entrypoint neutro soltanto quando la catena corrente è completamente descritta e coperta;
- verificare fetch/email/scheduled e tutti i binding;
- staging + rollback obbligatori.

### Passo 5 — decomposizione core

- estrarre moduli per dominio senza modificare output e schema;
- una famiglia di route per PR;
- Studio/Musa per ultimi.

## Governance e sicurezza da risolvere separatamente

Sono aperti temi non UX ma importanti:

- branch di produzione non protetto;
- repository attualmente pubblico pur contenendo codice proprietario;
- normalizzazione futura del branch a `main`;
- formalizzazione completa dello staging;
- aggiornamento controllato del toolchain Wrangler/dev.

Questi punti non vanno “risolti al volo” dentro un pass UX. Richiedono verifica dell'integrazione Cloudflare/GitHub e una release procedure dedicata.

## Regola per i prossimi PR

Ogni PR derivato da questo audit deve dichiarare:

- superficie toccata;
- cosa è esplicitamente fuori scope;
- dati/migrazioni coinvolti: sì/no;
- edge cases coperti;
- test aggiunti/eseguiti;
- rollback;
- impatto UX atteso;
- rischio residuo.

La metrica guida è semplice: **meno decisioni inutili per l'utente, senza perdere sicurezza, contenuti o reversibilità tecnica**.
