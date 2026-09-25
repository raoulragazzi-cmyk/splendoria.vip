# Riparazione accesso amministratore — staging

Il log Cloudflare del 25/09/2026, 12:37:06 UTC, per POST /area-amministratore segnala HTTP 500: `D1_ERROR: no such table: AdminLoginChallenge: SQLITE_ERROR`. Versione Worker invariata: `4842ad1d-2964-4ec8-b120-075d4d03b05d`.

Il database `splendoria-v2-test` (`8bf872f6-3f9e-471f-95bc-a99a94f0d97c`) aveva una baseline incompleta. Dopo verifica del binding, export D1 completato e controllo delle precondizioni, è stato applicato `ops/staging-admin-repair-20260925.sql`: tre tabelle con i relativi indici e quattro colonne mancanti di PasswordReset. Definizioni derivate dalle migrazioni canoniche 0001, 0002 e 0004. Non sono stati modificati utenti, password, sessioni o libri. Nessuna operazione sul database di produzione; nessun nuovo deploy.

Punto di ripristino precedente alla modifica: `00000054-00000000-000050f1-5951418663e9adf6a715d763bb8e01d0`. Export completato verificato, corrispondente allo stesso bookmark Time Travel. Non pubblicare l'export: contiene dati di autenticazione. Il rollback integrale non va eseguito dopo nuovi accessi senza valutare le scritture successive.

Verifica remota: le quattro query di autenticazione/dashboard sulle strutture riparate sono ora eseguibili senza errori (LIMIT 0, senza esposizione dati).

Verifica locale: `node test/musa-admin-schema-smoke.mjs`, con SQLite reale e soli dati sintetici, riproduce il 500 sulla vecchia struttura e dopo la correzione completa password → invio OTP simulato → verifica OTP → sessione → dashboard → Musa. Codice errato e riuso del codice non creano sessioni. Nessuna email inviata dal test.

Limite: consegna effettiva dell'OTP e accesso dal browser dell'utente devono essere confermati al prossimo login. Questa correzione non risolve il distinto errore di permessi email della pipeline Wrangler e non qualifica il resto dello Studio su questa baseline D1. La correzione SQL è operativa e manuale: le ALTER non vanno rieseguite se le colonne esistono già.
