# Splendoria.vip

Applicazione Cloudflare Worker nativa per Splendoria. Mantiene compatibilità con il database D1 esistente e aggiunge:

- registrazione, accesso e sessioni persistenti;
- recupero password tramite collegamento temporaneo;
- Studio personale per la scrittura;
- area amministrativa con utenti, libri, avanzamento, ordini e stati;
- percorso self-service per impostare, generare e modificare un libro completo;
- generazione assistita tramite Cloudflare Workers AI;
- anteprima stampabile, utilizzabile anche per il salvataggio in PDF;
- modulo contatti e interfaccia responsive.

## Prima pubblicazione

1. Il binding `DB` è configurato sul database D1 esistente `splendoria-db` (`1a46b8b0-2e6f-44cf-a22f-4950259f9434`).
2. Applicare `schema.sql` al database D1 esistente.
3. Verificare il binding Email Routing `CONTACT_EMAIL` e il mittente `contatti@splendoria.vip`.
4. Eseguire `npm install`, `npm run check` e soltanto dopo `npm run deploy`.
5. Collegare i domini personalizzati al nuovo Worker solo dopo i test.

Non inserire token, password o file `.env` nel repository.

La migrazione è esclusivamente additiva: crea nuove tabelle con `CREATE TABLE IF NOT EXISTS` e non elimina né rinomina le tabelle esistenti.

### Comandi di controllo

```bash
npm test
npm run db:migrate:local
npm run check
```

Il comando `db:migrate:remote` deve essere eseguito soltanto dopo aver verificato il backup e l'ID del database di produzione.

<!-- cloudflare-build: 2026-08-05 -->
