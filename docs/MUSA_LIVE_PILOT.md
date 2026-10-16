# Musa LiveAvatar — prima integrazione

Pagina riservata: `/admin/musa-live`, raggiungibile anche dal pulsante nella dashboard amministratore.

Attiva esclusivamente con `ENVIRONMENT=staging`, URL canonico di staging e `MUSA_LIVE_ENABLED=true`. Configurare `MUSA_LIVE_EMBED_URL` come secret del solo Worker staging, usando il collegamento ottenuto da LiveAvatar → Alessandra Sitting → Embed → Musa di Splendoria — Italiano v0.1, orizzontale, limite 2 minuti. Il collegamento non viene committato: consente di utilizzare i crediti dell'account e va tenuto riservato. Nessuna API key nel browser.

L'amministratore conferma l'avvio prima di caricare il servizio esterno. Il riquadro conserva il pulsante di avvio originale LiveAvatar. Chiusura e abbandono pagina rimuovono l'iframe; chiusura automatica della finestra dopo 3 minuti, limite della conversazione imposto a 2 minuti da LiveAvatar. Non si inferisce lo stato della sessione dall'evento iframe load. Nessuna promessa di terminazione server o restituzione crediti.

Non vengono trasmessi libri o dati di altri progetti. Audio e conversazione sono gestiti dal fornitore; trascrizione, memoria persistente, pausa/ripresa e sessioni di due ore non sono implementate. L'embed va sostituito con sessioni API autenticate prima di un'apertura ai clienti: il controllo admin protegge la pagina Splendoria, non rende privato il link LiveAvatar dopo che è stato consegnato al browser.

Verifiche: `node test/musa-live-smoke.mjs`, `npm run check:staging`. Prova umana da completare: login amministratore staging, apertura pagina, autorizzazione microfono, risposta italiana, stop, nuovo avvio, mobile. Non usare ricordi reali per la prima verifica tecnica.

Rollback: disattivare `MUSA_LIVE_ENABLED`, oppure ripristinare la versione staging precedente. Nessuna migrazione D1.
