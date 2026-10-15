# Musa Intervistatrice — contratto di prodotto e piano di implementazione

Stato: proposta tecnica isolata; non ancora implementata e non rilasciata.
Data: 2026-10-12. Ambito: Studio Splendoria IT/DE/EN.

## Obiettivo
La Musa conduce una conversazione narrativa con il cliente, una domanda alla volta, ascoltando le risposte, formulando approfondimenti pertinenti e componendo gradualmente una memoria **verificabile** destinata all'opera. Il cliente non deve predisporre prompt o compilare questionari lunghi.

## Stato di partenza verificato
Sono già presenti i contratti `POST /libro/:id/intervista` (genera domande), `POST /libro/:id/risposte` (salva risposte), `POST /libro/:id/risposte/migliora` e `POST /libro/:id/risposte/affidati`; l'interfaccia di Studio supporta dettatura del browser e salvataggio. Preservare tali route e i contratti IT/DE/EN; nessun intervento sulla produzione in questo cambiamento.

## Esperienza utente proposta
1. Pulsante **Inizia l'intervista con Musa** nello Studio. Offrire in alternativa **Continua una conversazione** e **Torna all'intervista classica**.
2. L'autore sceglie il filone: **Una vita**, **Storia di famiglia**, **Impresa / fondatore**, **Una stagione decisiva**. I filoni guidano soltanto la selezione delle domande: non autorizzano invenzioni.
3. La Musa chiarisce il suo ruolo di IA, chiede il consenso al trattamento di eventuali contenuti personali e comunica che ogni risposta può essere modificata o saltata.
4. Una sola domanda aperta per turno. L'autore risponde per iscritto o con dettatura manualmente avviata. Pulsanti: **Invia**, **Salta**, **Non voglio parlarne**, **Correggi la risposta**, **Pausa**.
5. Un turno di approfondimento solo quando serve: chi/cosa/dove/quando, contesto, scelta, conseguenza, significato. Evitare domande suggestive, interrogatori e dettagli già acquisiti.
6. Dopo 5-8 scambi, proporre una sintesi **da confermare** (fatti accertati, citazioni testuali, incertezze, punti da approfondire); non trasformarla automaticamente in un capitolo.
7. Ripresa dal punto esatto, con cronologia recuperabile. L'autore decide quali materiali includere nel progetto editoriale.
8. L'azione **Prepara il capitolo** resta esplicita, e usa solo materiale salvato e approvato.

## Contratto conversazionale del modello
- Non inventare nomi, citazioni, date, dialoghi, azioni, legami di parentela o sentimenti.
- Non trasformare una domanda in un'asserzione fattuale. Separare sempre `provided_fact`, `author_confirmed`, `inferred_hypothesis`, `unresolved`.
- Non dedurre emozioni, intenzioni o valutazioni morali dal tono. Chiederle all'autore.
- Al massimo una domanda principale; seguire il filo della risposta, senza saltare al prossimo capitolo predefinito.
- Formulare domande non giudicanti e non pressanti su lutti, malattie, traumi e persone terze. Consentire sempre il rifiuto e il cambio argomento.
- Non imitare una psicoterapeuta, non offrire diagnosi, evitare promesse di riservatezza assoluta.
- Evitare raccolta superflua di dati personali di terzi; consentire anonimizzazione e correzione.
- Rispondere nella lingua scelta dall'autore (IT/DE/EN), senza tradurre nomi, dati, API o identificativi macchina.
- Se il materiale è insufficiente per la scrittura, spiegare esattamente quali elementi mancano, senza riempitivi inventati.

## Persistenza minima proposta
Nuova migrazione D1 (additiva, non distruttiva):
- `muse_interview_sessions`: `id`, `book_id`, `user_id`, `language`, `track`, `status`, `created_at`, `updated_at`, `version`.
- `muse_interview_turns`: `id`, `session_id`, `ordinal`, `role`, `content`, `created_at`, `author_approved`, `source_turn_id`.
- `muse_interview_claims`: `id`, `session_id`, `source_turn_id`, `claim_text`, `evidence_status`, `author_confirmed_at`.

Richiedere sempre auth e controllo ownership libro/sessione; indici per `(book_id,user_id)` e `(session_id,ordinal)`; limite di lunghezza e rate-limit lato server. Nessuna sessione accessibile a un altro tenant; cancellazione coerente con le funzioni privacy e di eliminazione progetto.

## Endpoint proposti, separati dal contratto esistente
- `POST /libro/:id/musa-intervista/sessioni`: avvio o ripresa idempotente.
- `GET /libro/:id/musa-intervista/sessioni/:sid`: recupero cronologia e stato.
- `POST /libro/:id/musa-intervista/sessioni/:sid/turni`: salva risposta, genera una domanda successiva; idempotency key e optimistic version.
- `POST /libro/:id/musa-intervista/sessioni/:sid/conferma`: approva/ritratta fatti estratti.
- `POST /libro/:id/musa-intervista/sessioni/:sid/pausa`: sospensione senza perdita di contenuti.

Non esporre output grezzi del modello come HTML. Validazione del payload e budget token/timeout lato server, fallback a una domanda neutra sicura quando l'AI non risponde. La risposta va salvata prima di invocare il modello; retry non deve duplicare turni.

## Edge cases obbligatori
- doppio clic su Invia; retry su timeout; disconnessione; ritorno dopo chiusura del browser;
- risposta vuota, estremamente lunga, off-topic, plurilingue o parzialmente dettata;
- domanda già posta, contraddizione cronologica, omonimi, date incerte;
- revoca del consenso, eliminazione libro/account, stampa ed export dati;
- utente non autenticato, id manipolato, sessione di altro autore, contesto XSS/prompt injection;
- risposte delicate su terzi, minorenni o eventi traumatici;
- nessuna autorizzazione tacita a generare pagine a pagamento o a sbloccare capitoli;
- accessibilità da tastiera, lettori schermo, mobile, riduzione del movimento, IT/DE/EN.

## Gate di qualità / rilascio
Fase A: baseline, test esistenti, migrazione D1 isolata e UI dietro feature flag OFF.
Fase B: test unitari di selezione domande, fact provenance e consenso; contract test endpoint, auth, CSRF e rate limit.
Fase C: test E2E con una biografia, una memoria familiare e una storia d'impresa, in IT/DE/EN; verificare ripresa sessione e assenza di fatti inventati.
Fase D: staging Cloudflare isolato, QA accessibilità e regressione editor/anteprima/autosalvataggio/password/prezzi.
Fase E: solo dopo controlli verdi, pilot opt-in e rilascio graduale con rollback. Nessun deploy automatico in produzione.

## KPI iniziali, da misurare e non assumere raggiunti
Tasso avvio intervista; completamento prima sessione; media turni utili; percentuale risposte riviste; tasso sessioni riprese; errori di salvataggio; fatti non confermati; soddisfazione autore; conversione dal primo capitolo.

## Prima implementazione consigliata
Conservare l'intervista classica esistente, introdurre un layer di conversazione persistente **in parallelo** (non sostitutivo) e fare riuso soltanto delle componenti di autenticazione, verifica accessi e salvataggio già testate. Prima di scrivere backend verificare schema D1 attuale, worker routing e suite CI. La documentazione, da sola, non costituisce funzionalità consegnata.
