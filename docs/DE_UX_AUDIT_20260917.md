# Splendoria — audit tedesco, dettatura e riduzione dell’attrito

Data: 17 settembre 2026. Repository: `raoulragazzi-cmyk/splendoria.vip`.
Baseline: `d0ad61ddbc73e708f73fd20c238875cf6e17cff2`, branch canonica `splendoria.vip`.
Candidato indipendente: `ux/de-dictation-safety-audit-20260917`.
Stato: **DRAFT. Nessun merge/deploy, nessuna modifica a D1 remoto, account o manoscritti.**

## Esito e copertura effettiva

La piattaforma serve pagine tedesche e i principali pulsanti di accesso sono tradotti, ma la localizzazione non è completa. Sono stati confermati residui misti IT/DE in superfici pubbliche e riprodotti problemi del controller vocale. Non è una certificazione end-to-end dell’intera piattaforma.

| Superficie | Verifica | Limite |
|---|---|---|
| Home DE, navigazione, valutazione editoriale, FAQ | Browser pubblico e successive estrazioni mirate delle stringhe | Nessun invio del modulo |
| Registrazione, accesso, password dimenticata | Form pubblici e link canonici | Nessun account creato, login o invio email |
| Guida, privacy, cookie, termini, note legali, trasparenza IA | Percorso pubblico e controlli mirati | Non revisione legale né approvazione di tutti i paragrafi |
| Studio, libro e lingue | Routing, preferenze, controller e trasformazioni nel codice | Nessuna sessione cliente autenticata |
| Dettatura | Test deterministici con riconoscimento e rete simulati | Non misura riconoscimento acustico o dispositivi reali |
| Mobile | Componente candidato isolato in Chromium a 320/390/768/1280 px | Non la piattaforma autenticata completa; il browser remoto non ha collaudato il viewport mobile |
| Email, acquisto, export/PDF, account e amministrazione | Perimetro identificato nel routing e nei moduli | Non collaudati end-to-end |

Nessuna percentuale di completamento: manca l’inventario completo per stringa, stato e percorso.

## Evidenze pubbliche confermate

- `/de/registrati`: pulsante **Kostenlos registrieren**; link reale al login presente.
- `/de/area-clienti`: pulsante **Mein Studio öffnen**.
- `/de/password-dimenticata`: pulsante **Link senden**.
- Footer: **Leitfaden allo Studio**; attributi accessibili del footer ancora italiani nell’HTML estratto.
- Opzioni di assistenza della home: **Livello 1 · Geführte Unterstützung**, **Livello 2 · Redaktionelle Kohärenz**, **Livello 3 · Menschliche Aufsicht**, ma **Stufe 4 · Persönliche Begleitung**.
- Guida, errore di salvataggio: **Verifica la connessione e premi “Speichern le mie modifiche”. Non chiudere la pagina finché non compare la conferma.**
- FAQ materiali: risposta con residuo **Konto, progetti, ...** e parte finale in italiano.
- Privacy: **Zuletzt aktualisiert: 29 agosto 2026**.

Il riepilogo iniziale del browser conteneva falsi positivi: `/de/accesso` e `/de/recupero-password` non sono le route canoniche. Non aprire bug di login basandosi su questi URL. Le route corrette sopra rispondono. Il consenso pubblico e diverse FAQ indicati inizialmente come italiani sono invece tradotti e sono stati esclusi dai finding. Nomi propri, ragione sociale e indirizzi non vanno tradotti automaticamente.

## Rischio vocale riprodotto

Il controller originario conserva `baseText` in una variabile condivisa. Alla fine del dettato attende una correzione grammaticale; un secondo dettato può nel frattempo aggiornare quella variabile.

Riproduzione isolata con dati sintetici:
1. Campo A: `Vorgeschichte A.`; dettato `erster text`.
2. Arresto del dettato A; correzione ancora in attesa.
3. Avvio del campo B, contenente `Vorgeschichte B.`.
4. Arrivo della prima correzione: il controller originario produce nel campo A `Vorgeschichte B. Erster Text.`.

Non è stata osservata una perdita reale nei libri: è una regressione eseguibile sul blocco del controller estratto dalla baseline. Il codice leggeva inoltre la lingua corrente al termine anziché quella dell’ascolto; una risposta tardiva poteva riportare il focus sul campo precedente.

## Correzione candidata implementata

Nuovo helper `src/studio-dictation-de-ux.js`, collegato tramite il già esistente `src/i18n-ui-runtime-worker.js`. Non è un secondo wrapper Worker o riconoscitore vocale.

- Snapshot di testo iniziale, lingua ed errore; identificatore per sessione e WeakMap per il campo.
- Una risposta precedente non sovrascrive un campo su cui è iniziato un nuovo dettato, anche quando il testo è ancora identico.
- Il completamento precedente non ruba il focus o disattiva il nuovo dettato; il vecchio campo riceve comunque il suo stato conclusivo.
- Eccezione sincrona di avvio gestita senza lasciare il controllo bloccato.
- **Diktat starten / Diktat beenden**, indicazione testuale del microfono attivo, `aria-pressed`, `aria-controls`, `aria-describedby`, `aria-live=polite`.
- Tedesco coerente con il `du` e alternativa esplicita quando il browser non offre la dettatura.
- Pulsanti minimi 48 px, testo 18 px, messaggi 16 px, wrapping e larghezza mobile; contrasto del testo verificato rispetto a 4,5:1.
- Nessun messaggio dichiara il salvataggio soltanto perché il dettato è terminato.

Applicazione limitata all’asset DE. IT/EN restituiti inalterati dalla nuova trasformazione. Merge dei segmenti, preferenze persistenti, endpoint, modelli, salvataggi e regole commerciali invariati.

Contratti di sostituzione univoca: in caso di deriva del controller si restituisce l’asset originale completo, mai una patch parziale. L’header DE `x-spl-dictation-ux` vale `de-v1` se applicata, `baseline` altrimenti. Un fallback `baseline` blocca l’accettazione: non equivale a una correzione riuscita.

## Verifiche

**20 test deterministici superati** con `node --test test/studio-dictation-de-ux.test.mjs` nell’ambiente locale, su un estratto verificato del controller. Nel repository il test estrae direttamente il blocco da `src/worker.js`; non è stata committata una seconda implementazione del controller.

Copertura: contaminazione A/B prima/dopo; riavvio sullo stesso campo; cambio lingua durante arresto; modifica manuale mentre la correzione attende; errori HTTP/rete/permessi/avvio; nessun parlato; supporto mancante; riconoscitore unico; lingua UI indipendente; IT/EN invariati; idempotenza; fallback per deriva; semantica e CSS.

Fixture in Chromium: **320, 390, 768, 1280 px**, nessun overflow orizzontale; altezza pulsante circa 52,3 px; etichette di avvio/arresto corrette. Shell minima, non CSS completo della piattaforma; riconoscimento simulato.

**Non eseguiti:** suite completa del repository, bundle Worker finale, QA autenticata, PDF reale, recapito email, dettatura acustica, accettazione Safari/iOS/Android. Non dichiararli superati sulla base dei test isolati.

## TODO e rischi residui

| ID | Priorità | Stato / gate |
|---|---|---|
| DE-01 | Alta | Aperto: footer, opzioni assistenza, aiuto salvataggio, FAQ e date. Tradurre etichette, non valori macchina o testi autore |
| DE-02 | Alta | Candidato isolato: validare isolamento delle sessioni anche nell’asset finale dopo tutta la catena i18n |
| DE-03 | Alta | Candidato isolato: ricontrollare controlli, CSS reale, preferenze di lettura e zoom 200% |
| DE-04 | Alta | Aperto: modifica manuale DURANTE l’ascolto; `onresult` e commit finale riscrivono il campo. Diverso dalla modifica durante la correzione asincrona, già protetta |
| DE-05 | Alta | Decisione + test: priorità tra lingua salvata del libro e `splendoria-voice-language` del browser. Non forzare DE sui libri italiani |
| DE-06 | Alta | Aperto: ripetizioni volute, umlaut/ß, frammenti cumulativi e pause; verificare la deduplicazione prima di cambiarla |
| DE-07 | Alta | Staging applicativo + sessione di test; matrice permessi, rete, pause, doppio clic, cambio campo |
| DE-08 | Media | Inventario completo: pulsanti, tooltip, placeholder, aria-label, errori server, email, PDF e stati commerciali |
| DE-09 | Media | Coordinare #62: lingua/genere visibili, struttura opzionale, una CTA Musa, accesso client-first; non integrare due volte PR già assorbite |
| DE-10 | Alta | Verificare che CI collaudi lo SHA candidato e non una branch i18n storica |

Il workflow `.github/workflows/i18n-visible-residuals.yml` esaminato fissa il checkout a `i18n/public-de-en-phase1`: il suo verde non dimostra la qualità della PR corrente. Nessun workflow aggiunto o avviato manualmente da questo audit.

## Staging e conseguenze

#62 è draft e non merged, head `440b1d53ff31511b87b0f33df20ac17cf71420b3`. Documenta un blocco della credenziale Cloudflare staging. Il controllo live non ha mostrato l’app Splendoria: il browser ha visto un segnaposto Cloudflare e un successivo fetch ha restituito 404. Non è uno staging applicativo pronto al collaudo.

Nessuna modifica a produzione, D1/migrazioni, contenuti, autenticazione, pagamenti, trial, modelli, PDF o cron. Nessun upload audio o invio email. Nessun intervento sulle branch degli altri workstream.

Prima del rilascio: staging utilizzabile; composizione deliberata con #62 e la sua policy cache; controllo header/asset sullo SHA candidato; suite completa e matrice autenticata. DE-04/05/06 restano aperti: non presentare il candidato come esperienza vocale completata. Rollback del Worker e del collegamento al helper, senza interventi sul database.

## Riferimenti

- Pagine live: `https://www.splendoria.vip/de/` e route canoniche sopra.
- Integrazione: `https://github.com/raoulragazzi-cmyk/splendoria.vip/pull/62`.
- MDN: `https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition`.
- W3C: `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html`.
- W3C: `https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html`.

SpeechRecognition non è disponibile uniformemente fra browser e può appoggiarsi al servizio del fornitore: non promettere elaborazione esclusivamente locale o offline. I 48 px sono un obiettivo del candidato, non il minimo WCAG AA, che è 24 px con le relative eccezioni.
