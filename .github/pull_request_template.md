## Obiettivo
Descrivere il risultato utente/prodotto, non solo il codice modificato.

## Classe di cambiamento
- [ ] UI / copy
- [ ] Funzionalità
- [ ] Reliability / bug fix
- [ ] AI / prompt / agent
- [ ] Database / migrazione
- [ ] Auth / privacy / sicurezza
- [ ] Infrastruttura / deploy
- [ ] Documentazione

## Rischio
- [ ] Basso — reversibile, nessun dato/auth
- [ ] Medio — flusso utente o API
- [ ] Alto — dati, auth, pagamenti, agenti, operazioni distruttive

## Verifica eseguita
- [ ] CI verde
- [ ] Smoke test pertinenti
- [ ] Wrangler dry-run
- [ ] Mobile/desktop verificati se UI
- [ ] Staging verificato se necessario

## Dati e migrazioni
Nessuna / descrivere schema, migrazione, compatibilità e backup richiesto.

## Rollback
Indicare commit/versione last-known-good e procedura di ritorno.

## Impatto cliente
Descrivere cosa vedrà o farà diversamente il cliente. Se nessuno, scrivere “nessuno”.

## Note per il deploy
Indicare variabili/segreti/binding richiesti senza inserire valori segreti.
