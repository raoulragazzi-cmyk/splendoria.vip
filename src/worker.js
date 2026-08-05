import { styles } from "./styles.js";

const SESSION_DAYS = 30;
const RESET_MINUTES = 30;
const FREE_AI_LIMIT = 3;
const AUTH_WINDOW_MINUTES = 15;
const AUTH_MAX_ATTEMPTS = 8;
const PLAN_LABELS = { free: "Primo capitolo gratuito", digital: "Splendoria Digital", complete: "Splendoria Premium", assisted: "Splendoria Signature" };
const PLANS = {
  digital: { label: "Splendoria Digital", price: 1000, description: "Fino a 100 pagine · percorso interamente digitale guidato dalle Muse, con supervisione umana." },
  complete: { label: "Splendoria Premium", price: 1500, description: "Fino a 250 pagine · percorso digitale più ampio e approfondito, con supervisione umana." },
  assisted: { label: "Splendoria Signature", price: 2500, description: "Da 250 pagine in su · progetto biografico digitale su misura, con 10 copie cartacee comprese." }
};

export default {
  async fetch(request, env) {
    try {
      await ensureSchema(env.DB);
      return await route(request, env);
    } catch (error) {
      console.error(error);
      return page("Errore", `<div class="formbox center"><h1>Qualcosa non ha funzionato</h1><p class="muted">Il problema è stato registrato. Riprova tra poco.</p><a class="button" href="/">Torna alla home</a></div>`, null, 500);
    }
  }
};

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  const method = request.method.toUpperCase();
  const user = await currentUser(request, env);

  if (method === "GET" && path === "/assets/studio.js") return studioScript();
  if (method === "GET" && path === "/") return home(user, url);
  if (method === "GET" && path === "/registrati") return authPage("register", user);
  if (method === "POST" && path === "/registrati") return register(request, env);
  if (method === "GET" && path === "/accedi") return authPage("login", user, url.searchParams.get("e"));
  if (method === "POST" && path === "/accedi") return login(request, env);
  if (method === "POST" && path === "/esci") return logout(request, env);
  if (method === "GET" && path === "/password-dimenticata") return forgotPage();
  if (method === "POST" && path === "/password-dimenticata") return forgot(request, env);
  if (method === "GET" && path === "/reimposta-password") return resetPage(url.searchParams.get("token"));
  if (method === "POST" && path === "/reimposta-password") return resetPassword(request, env);
  if (method === "POST" && path === "/contatti") return contact(request, env);
  if (method === "GET" && path === "/studio") return studio(user, env);
  if (method === "POST" && path === "/nuovo-libro") return newBook(request, user, env);
  if (method === "GET" && /^\/libro\/[^/]+$/.test(path)) return bookEditor(path.split("/")[2], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/salva$/.test(path)) return saveBook(request, path.split("/")[2], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/struttura$/.test(path)) return generateOutline(path.split("/")[2], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/intervista$/.test(path)) return generateInterview(path.split("/")[2], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/risposte$/.test(path)) return saveInterview(request, path.split("/")[2], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/capitolo\/[^/]+\/genera$/.test(path)) return generateChapter(path.split("/")[2], path.split("/")[4], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/capitolo\/[^/]+\/rifinisci$/.test(path)) return refineChapter(request, path.split("/")[2], path.split("/")[4], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/capitolo\/[^/]+\/salva$/.test(path)) return saveChapter(request, path.split("/")[2], path.split("/")[4], user, env);
  if (method === "GET" && /^\/libro\/[^/]+\/anteprima$/.test(path)) return previewBook(path.split("/")[2], user, env);
  if (method === "POST" && /^\/libro\/[^/]+\/acquista$/.test(path)) return purchase(request, path.split("/")[2], user, env);
  if (method === "GET" && path === "/admin") return adminDashboard(user, env, url);
  if (method === "GET" && /^\/admin\/progetto\/[^/]+$/.test(path)) return adminProject(path.split("/")[3], user, env);
  if (method === "POST" && /^\/admin\/progetto\/[^/]+$/.test(path)) return updateAdminProject(request, path.split("/")[3], user, env);
  if (method === "GET" && /^\/admin\/progetto\/[^/]+\/anteprima$/.test(path)) return adminPreviewBook(path.split("/")[3], user, env);
  if (method === "GET" && path === "/admin/esporta.csv") return exportCsv(user, env);
  return page("Pagina non trovata", `<div class="formbox center"><h1>Pagina non trovata</h1><p class="muted">La pagina richiesta non esiste.</p><a class="button" href="/">Torna alla home</a></div>`, user, 404);
}

function home(user, url) {
  const entry = user ? (user.isAdmin ? "/admin" : "/studio") : "/registrati";
  const requestedPlan = url?.searchParams?.get("formula") || "";
  const selectedPlan = Object.hasOwn(PLANS, requestedPlan) ? requestedPlan : "";
  const planOptions = Object.entries(PLANS).map(([key, plan]) => `<option value="${key}"${selectedPlan === key ? " selected" : ""}>${esc(plan.label)}</option>`).join("");
  return page("La tua vita in un romanzo", `
    <header class="showcase-hero"><div class="showcase-narrow"><p class="showcase-label light">Ogni vita merita un romanzo</p><h1>Splendoria</h1><p class="showcase-subtitle">La tua vita in un romanzo.</p><p class="showcase-intro">Il servizio di ghostwriting che trasforma la tua storia — o quella di chi ami — in un libro vero, scritto da professionisti.</p><div class="showcase-actions"><a class="button" href="${entry}">Scrivi il primo capitolo gratis</a><a class="showcase-link" href="#come-funziona">Scopri come funziona ›</a></div></div></header>
    <section class="showcase-section showcase-paper" id="storia"><div class="showcase-reading"><p class="showcase-label">La storia</p><h2>Storie che è un peccato dimenticare.</h2><p>In un angolo di un bar, in un incontro destinato a cambiare il corso delle cose, tre menti creative — ognuna con il proprio stile e mestiere — condividevano storie e ispirazioni. Alzarono i bicchieri per brindare a una nuova alleanza: spiriti affini, uniti da un amore comune per la scrittura. Da quel brindisi è nata Splendoria.</p><p>Hai mai pensato che la tua storia potrebbe essere raccontata in un libro, o diventare la trama di un film? Con Splendoria è possibile: sia in forma pubblica che anonima, la tua biografia — o una parte romanzata di essa — diventa un libro vero, da consegnare ad amici, figli e nipoti. <b>Per rimanere, a futura memoria, vivi per sempre.</b></p></div></section>
    <section class="showcase-section" id="come-funziona"><div class="wrap"><p class="showcase-label">Come funziona</p><h2 class="showcase-title">Quattro passi. Un libro vero.</h2><div class="showcase-grid four"><article class="showcase-card"><span>1</span><h3>Registrati</h3><p>Crea il tuo account gratuito: ricevi subito le tue credenziali e uno Studio di scrittura tutto tuo.</p></article><article class="showcase-card"><span>2</span><h3>Scrivi il primo capitolo</h3><p>Racconta l'inizio della tua storia: il primo capitolo, fino a sei pagine, è in omaggio. Senza impegno.</p></article><article class="showcase-card"><span>3</span><h3>Scegli il percorso</h3><p>Digital, Premium o Signature: le Muse guidano il lavoro e un professore di una scuola di scrittura supervisiona ogni opera.</p></article><article class="showcase-card"><span>4</span><h3>Ricevi il tuo libro</h3><p>Ricevi la versione digitale revisionata e depositata. Le copie stampate si possono aggiungere; nella formula Signature, 10 sono già comprese.</p></article></div><p class="showcase-note"><b>Scegli il genere.</b> Autobiografia, memoriale, ritratto, giallo, thriller o romanzo.</p></div></section>
    <section class="showcase-section showcase-paper showcase-pricing" id="formule" aria-labelledby="pricing-title">
      <div class="wrap">
        <p class="showcase-label">Listino</p>
        <h2 class="showcase-title" id="pricing-title">Scegli il percorso per raccontare la tua storia</h2>
        <p class="pricing-kicker">La tecnologia incontra la sensibilità umana</p>
        <p class="pricing-intro">Ogni libro Splendoria nasce attraverso un percorso interamente digitale, guidato dalle nostre Muse e supervisionato da un professore di una scuola di scrittura. Un metodo innovativo che unisce ascolto, intelligenza artificiale e competenza narrativa.</p>

        <div class="showcase-grid three pricing-grid">
          <article class="showcase-price" aria-labelledby="digital-title">
            <span class="price-icon" aria-hidden="true">✦</span>
            <h3 id="digital-title">Splendoria Digital</h3>
            <p class="price-tagline muted">Il modo più semplice per trasformare i tuoi ricordi in un libro</p>
            <p class="showcase-amount">1.000 €</p>
            <p class="price-pages muted">Fino a 100 pagine</p>
            <ul>
              <li>Opera e percorso interamente digitali</li>
              <li>Percorso guidato dalle Muse di Splendoria</li>
              <li>Intervista iniziale online</li>
              <li>Raccolta guidata di ricordi, fotografie e documenti</li>
              <li>Scrittura e organizzazione narrativa realizzate con il supporto delle nostre Muse</li>
              <li>Supervisione umana affidata a un professore di una scuola di scrittura</li>
              <li>Revisione grammaticale e stilistica</li>
              <li>Impaginazione digitale</li>
              <li>Copertina personalizzata</li>
              <li>Consegna del libro in formato PDF</li>
              <li>Marcatura temporale e deposito digitale dell’opera</li>
              <li>Revisione professionale prima della consegna definitiva</li>
              <li>Possibilità di acquistare separatamente copie stampate</li>
            </ul>
            <a class="button" data-plan-choice="digital" href="/?formula=digital#contatti">Inizia il tuo libro</a>
          </article>

          <article class="showcase-price featured" aria-labelledby="premium-title">
            <span class="price-badge">Più scelta</span>
            <span class="price-icon" aria-hidden="true">◆</span>
            <h3 id="premium-title">Splendoria Premium</h3>
            <p class="price-tagline">Un racconto più ampio, profondo e ricco di dettagli</p>
            <p class="showcase-amount">1.500 €</p>
            <p class="price-pages">Fino a 250 pagine</p>
            <ul>
              <li>Opera e percorso interamente digitali</li>
              <li>Percorso guidato dalle Muse di Splendoria</li>
              <li>Intervista iniziale online di approfondimento</li>
              <li>Più sessioni online dedicate alle diverse fasi della vita</li>
              <li>Raccolta e organizzazione di fotografie, lettere e documenti</li>
              <li>Scrittura e costruzione narrativa realizzate con il supporto delle nostre Muse</li>
              <li>Supervisione umana affidata a un professore di una scuola di scrittura</li>
              <li>Revisione approfondita dei contenuti</li>
              <li>Revisione grammaticale, narrativa e stilistica</li>
              <li>Impaginazione editoriale</li>
              <li>Copertina personalizzata</li>
              <li>Consegna del libro in formato PDF pronto per la stampa</li>
              <li>Marcatura temporale e deposito digitale dell’opera</li>
              <li>Revisione professionale prima della consegna definitiva</li>
              <li>Possibilità di acquistare separatamente copie stampate</li>
            </ul>
            <a class="button" data-plan-choice="complete" href="/?formula=complete#contatti">Scegli Premium</a>
          </article>

          <article class="showcase-price signature" aria-labelledby="signature-title">
            <span class="price-icon" aria-hidden="true">✧</span>
            <h3 id="signature-title">Splendoria Signature</h3>
            <p class="price-tagline muted">Un’opera biografica completa, costruita su misura</p>
            <p class="showcase-amount">2.500 €</p>
            <p class="price-pages muted">Da 250 pagine in su, secondo il progetto</p>
            <p class="signature-included"><strong>10 copie cartacee comprese nel prezzo</strong></p>
            <ul>
              <li>Opera e percorso interamente digitali</li>
              <li>Percorso personalizzato guidato dalle Muse di Splendoria</li>
              <li>Interviste online di approfondimento, senza una struttura rigida</li>
              <li>Progetto narrativo dedicato a persone, famiglie, professionisti e imprese</li>
              <li>Ricerca, selezione e organizzazione di fotografie, lettere, documenti e materiali d’archivio</li>
              <li>Scrittura e costruzione narrativa realizzate con il supporto delle nostre Muse</li>
              <li>Supervisione umana affidata a un professore di una scuola di scrittura</li>
              <li>Possibilità di un accompagnamento editoriale più approfondito da parte della <strong>Scuola Holden</strong></li>
              <li>Revisione narrativa, grammaticale e stilistica completa</li>
              <li>Impaginazione editoriale realizzata su misura</li>
              <li>Copertina personalizzata</li>
              <li>Inserimento di fotografie, documenti, lettere e materiali d’archivio</li>
              <li>Consegna della versione digitale completa</li>
              <li><strong>10 copie cartacee comprese nel prezzo</strong></li>
              <li>Marcatura temporale e deposito digitale dell’opera</li>
              <li>Assistenza personale fino all’approvazione definitiva</li>
              <li>Revisione professionale prima della consegna dell’opera</li>
            </ul>
            <a class="button" data-plan-choice="assisted" href="/?formula=assisted#contatti">Richiedi il progetto Signature</a>
          </article>
        </div>

        <div class="pricing-method">
          <span class="method-mark" aria-hidden="true">✦</span>
          <div>
            <h3>Le Muse ti accompagnano. La competenza umana garantisce il risultato.</h3>
            <p>Le Muse di Splendoria accompagnano ogni persona nella raccolta dei ricordi, nelle interviste e nella costruzione del racconto. La tecnologia facilita il percorso, organizza i materiali e aiuta a trasformare la memoria in una narrazione coerente.</p>
            <p>Ogni libro viene successivamente sottoposto alla supervisione umana di un professore di una scuola di scrittura e a una revisione professionale prima della consegna definitiva.</p>
            <p><strong>La tecnologia non sostituisce la sensibilità umana: la rende accessibile, continua e presente durante tutto il percorso.</strong></p>
          </div>
        </div>

        <div class="pricing-notes" aria-label="Precisazioni sul listino">
          <p>Il numero di pagine è indicativo e può variare in base all’impaginazione, alla quantità di fotografie e alla struttura narrativa dell’opera.</p>
          <p>Eventuali servizi aggiuntivi, ulteriori copie stampate, traduzioni, lavorazioni grafiche o richieste speciali saranno quotati separatamente.</p>
          <p>L’eventuale coinvolgimento della Scuola Holden è previsto esclusivamente nella formula Splendoria Signature e deve essere concordato in base alle caratteristiche del progetto.</p>
        </div>
      </div>
    </section>
    <section class="showcase-section" id="servizi"><div class="wrap"><p class="showcase-label">Sempre incluso</p><h2 class="showcase-title">Un percorso digitale, seguito con cura.</h2><div class="showcase-grid three"><article class="showcase-card"><h3>Guida delle Muse</h3><p>Le Muse ti accompagnano passo dopo passo, aiutandoti a far emergere ricordi, persone, luoghi e momenti decisivi.</p></article><article class="showcase-card"><h3>Intervista online</h3><p>Un dialogo guidato e riservato raccoglie la tua voce e i materiali necessari per dare profondità alla storia.</p></article><article class="showcase-card"><h3>Costruzione narrativa</h3><p>La tecnologia organizza i contenuti e sostiene la scrittura, mantenendo intatti il tuo tono e la tua sensibilità.</p></article><article class="showcase-card"><h3>Supervisione umana</h3><p>Un professore di una scuola di scrittura supervisiona l’opera e una revisione professionale ne garantisce la qualità.</p></article><article class="showcase-card"><h3>Cura editoriale</h3><p>Revisione, impaginazione e copertina personalizzata trasformano il racconto in un libro armonioso e autorevole.</p></article><article class="showcase-card"><h3>Versione digitale e tutela</h3><p>Ricevi il libro in formato digitale, con marcatura temporale e deposito dell’opera. Le copie stampate seguono la formula scelta.</p></article></div></div></section>
    <aside class="showcase-holden"><p>Nella formula Splendoria Signature può essere concordato un accompagnamento editoriale più approfondito da parte della Scuola Holden.</p><span>L’eventuale coinvolgimento è riservato ai progetti Signature e viene definito su misura, in base alle caratteristiche dell’opera.</span></aside>
    <section class="showcase-section" id="voci"><div class="wrap"><p class="showcase-label">Dicono di noi</p><h2 class="showcase-title">Vite diventate libri.</h2><div class="showcase-grid three"><article class="showcase-quote"><blockquote>“Ho sempre desiderato scrivere un libro, ma mi intimoriva il foglio bianco. Le indicazioni online sono intuitive, i tempi sono stati rispettati e la qualità del libro è eccellente.”</blockquote><p><b>Tatiana</b> · Insegnante</p></article><article class="showcase-quote"><blockquote>“Eccellente il percorso di accompagnamento che mi ha portato a realizzare il mio sogno. Raccontare la mia vita a dei professionisti della scrittura è un'esperienza che consiglio vivamente.”</blockquote><p><b>Ettore</b> · Commerciante</p></article><article class="showcase-quote"><blockquote>“Ho trovato un team di persone serie e motivate, con la mia stessa passione. Il libro che mi hanno consegnato è stato addirittura migliore di quanto mi aspettassi.”</blockquote><p><b>Giorgia</b> · Manager d'azienda</p></article></div></div></section>
    <section class="showcase-section showcase-paper showcase-cta"><h2>La tua storia comincia qui.</h2><p>Crea il tuo account gratuito, scrivi il primo capitolo della tua vita e scopri com'è vederla diventare un libro. Al resto pensiamo noi.</p><a class="button" href="${entry}">Inizia gratis</a></section>
    <section id="contatti" class="showcase-section showcase-contact"><div class="wrap showcase-contact-grid"><div><p class="showcase-label left">Splendoria</p><h2>Contattaci</h2><p class="muted">Raccontaci brevemente come possiamo aiutarti.</p><p><b>Indirizzo</b><br><span class="muted">Via J. W. von Goethe 42<br>39012 Merano (BZ), Italia</span></p></div><form method="post" action="/contatti"><p class="small muted">Tutti i campi sono obbligatori.</p><label class="field">Formula di interesse<select name="plan" data-plan-select required><option value=""${selectedPlan ? "" : " selected"} disabled>Seleziona una formula</option>${planOptions}</select></label><div class="grid three"><label class="field">Nome e cognome<input name="fullName" required maxlength="100"></label><label class="field">Telefono<input name="phone" required maxlength="40"></label><label class="field">Email<input name="email" type="email" required maxlength="160"></label></div><label class="field">Oggetto<input name="subject" required maxlength="160"></label><label class="field">Messaggio<textarea name="message" required maxlength="3000"></textarea></label><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px"><button class="button">Invia richiesta</button></form></div></section>`, user);
}

function page(title, body, user, status = 200, extra = "") {
  const account = user ? `${user.isAdmin ? `<a href="/admin">Area amministratore</a>` : `<a href="/studio">Area cliente</a>`}<form method="post" action="/esci" style="display:inline"><button class="button secondary" style="padding:8px 15px">Esci</button></form>` : `<a href="/accedi">Accedi</a><a class="pill" href="/registrati">Inizia gratis</a>`;
  return new Response(`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Splendoria</title><meta name="description" content="Il servizio di ghostwriting che trasforma la tua storia in un libro vero, scritto da professionisti. Scrivi gratis il tuo primo capitolo."><style>${styles}${extra}</style><script src="/assets/studio.js" defer></script></head><body><nav class="nav"><div class="wrap navin"><a class="brand" href="/">Splendoria</a><div class="navlinks"><a class="hide-mobile" href="/#come-funziona">Come funziona</a><a class="hide-mobile" href="/#formule">Listino</a><a class="hide-mobile" href="/#contatti">Contattaci</a>${account}</div></div></nav><main>${body}</main><footer class="footer"><div class="wrap"><b>Splendoria</b><p class="small">La tua vita in un romanzo · Merano, Italia</p></div></footer></body></html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "x-content-type-options": "nosniff", "referrer-policy": "strict-origin-when-cross-origin", "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" } });
}

function studioScript() {
  const source = `(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const languageSelect = document.querySelector('[data-voice-language]');
    const languageMessages = {
      'it-IT': {
        ready: 'Premi e inizia a parlare',
        unavailable: 'Dettatura non disponibile in questo browser',
        listening: 'Sto ascoltando… parla liberamente',
        denied: 'Consenti l’uso del microfono nel browser',
        interrupted: 'Dettatura interrotta: riprova',
        finished: 'Dettatura terminata'
      },
      'de-DE': {
        ready: 'Drücken und zu sprechen beginnen',
        unavailable: 'Diktierfunktion in diesem Browser nicht verfügbar',
        listening: 'Ich höre zu… erzählen Sie frei',
        denied: 'Bitte erlauben Sie den Mikrofonzugriff im Browser',
        interrupted: 'Diktat unterbrochen: Bitte erneut versuchen',
        finished: 'Diktat beendet'
      },
      'en-GB': {
        ready: 'Press and start speaking',
        unavailable: 'Dictation is not available in this browser',
        listening: 'I’m listening… speak freely',
        denied: 'Allow microphone access in your browser',
        interrupted: 'Dictation stopped: please try again',
        finished: 'Dictation finished'
      }
    };
    const selectedLanguage = () => languageSelect?.value || 'it-IT';
    const message = key => (languageMessages[selectedLanguage()] || languageMessages['it-IT'])[key];
    let active = null;
    const setStatus = (button, text, live = false) => {
      button.classList.toggle('listening', live);
      button.setAttribute('aria-pressed', live ? 'true' : 'false');
      const status = button.parentElement.querySelector('[data-voice-status]');
      if (status) status.textContent = text;
    };
    if (languageSelect) {
      try {
        const savedLanguage = localStorage.getItem('splendoria-voice-language');
        if (savedLanguage && languageSelect.querySelector('option[value="' + savedLanguage + '"]')) languageSelect.value = savedLanguage;
      } catch {}
      languageSelect.addEventListener('change', () => {
        try { localStorage.setItem('splendoria-voice-language', languageSelect.value); } catch {}
        if (active) active.stop();
        document.querySelectorAll('[data-voice-target]').forEach(button => setStatus(button, SpeechRecognition ? message('ready') : message('unavailable')));
      });
    }
    document.querySelectorAll('[data-voice-target]').forEach(button => {
      if (!SpeechRecognition) {
        button.disabled = true;
        setStatus(button, message('unavailable'));
        return;
      }
      setStatus(button, message('ready'));
      button.addEventListener('click', () => {
        const target = document.getElementById(button.dataset.voiceTarget);
        if (!target) return;
        if (active) { active.stop(); active = null; return; }
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        const original = target.value.trim();
        let finalText = '';
        let endedWithError = false;
        recognition.onstart = () => { active = recognition; setStatus(button, message('listening'), true); };
        recognition.onresult = event => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalText += text + ' '; else interim += text;
          }
          target.value = [original, finalText.trim(), interim.trim()].filter(Boolean).join(' ');
          target.dispatchEvent(new Event('input', { bubbles: true }));
        };
        recognition.onerror = event => {
          endedWithError = true;
          setStatus(button, event.error === 'not-allowed' ? message('denied') : message('interrupted'));
        };
        recognition.onend = () => { active = null; if (!endedWithError) setStatus(button, message('finished')); target.focus(); };
        recognition.start();
      });
    });
    document.querySelectorAll('textarea[data-word-count]').forEach(area => {
      const output = document.querySelector('[data-count-for="' + area.id + '"]');
      const update = () => { if (output) output.textContent = (area.value.trim().match(/\\S+/g) || []).length + ' parole'; };
      area.addEventListener('input', update); update();
    });
    const planSelect = document.querySelector('[data-plan-select]');
    if (planSelect) {
      document.querySelectorAll('[data-plan-choice]').forEach(link => {
        link.addEventListener('click', event => {
          const choice = link.dataset.planChoice;
          if (!choice || !planSelect.querySelector('option[value="' + choice + '"]')) return;
          event.preventDefault();
          planSelect.value = choice;
          planSelect.dispatchEvent(new Event('change', { bubbles: true }));
          history.replaceState(null, '', '/?formula=' + encodeURIComponent(choice) + '#contatti');
          document.getElementById('contatti')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.setTimeout(() => planSelect.focus({ preventScroll: true }), 450);
        });
      });
    }
  })();`;
  return new Response(source, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
}

function authPage(mode, user, error) {
  if (user) return redirect(user.isAdmin ? "/admin" : "/studio");
  const register = mode === "register";
  return page(register ? "Registrati" : "Accedi", `<div class="formbox"><p class="eyebrow center">Splendoria</p><h1 class="center">${register ? "Crea il tuo Studio" : "Accedi"}</h1><p class="muted center">${register ? "Inizia gratuitamente e trasforma la tua storia in un libro." : "Continua a creare il tuo libro."}</p>${error ? `<p class="error">${esc(error)}</p>` : ""}<form method="post"><label class="field">Email<input name="email" type="email" required autocomplete="email"></label>${register ? `<label class="field">Nome<input name="nome" required autocomplete="name"></label>` : ""}<label class="field">Password<input name="password" type="password" minlength="10" required autocomplete="${register ? "new-password" : "current-password"}"></label><button class="button" style="width:100%">${register ? "Registrati gratis" : "Accedi"}</button></form>${register ? `<p class="center">Hai già un account? <a href="/accedi">Accedi</a></p>` : `<p class="center"><a href="/password-dimenticata">Password dimenticata?</a></p><p class="center">Non hai un account? <a href="/registrati">Registrati gratis</a></p>`}</div>`, null);
}

function forgotPage(sent = false) {
  return page("Password dimenticata", `<div class="formbox"><p class="eyebrow center">Recupero accesso</p><h1 class="center">Password dimenticata?</h1>${sent ? `<p class="success">Se l'indirizzo è registrato, riceverai un collegamento valido per 30 minuti.</p>` : `<p class="muted center">Inserisci l'email usata per Splendoria.</p><form method="post"><label class="field">Email<input name="email" type="email" required autocomplete="email"></label><button class="button" style="width:100%">Invia il collegamento</button></form>`}</div>`, null);
}

function resetPage(token, message = "") {
  return page("Scegli una nuova password", `<div class="formbox"><p class="eyebrow center">Nuova password</p><h1 class="center">Reimposta l'accesso</h1>${message ? `<p class="error">${esc(message)}</p>` : ""}<form method="post"><input type="hidden" name="token" value="${esc(token || "")}"><label class="field">Nuova password<input name="password" type="password" minlength="10" required autocomplete="new-password"></label><button class="button" style="width:100%">Salva la nuova password</button></form></div>`, null);
}

async function register(request, env) {
  const f = await form(request), email = normalizeEmail(f.email), nome = clean(f.nome, 100), password = String(f.password || "");
  if (!validEmail(email) || nome.length < 2 || password.length < 10) return authPage("register", null, "Controlla i dati: la password deve avere almeno 10 caratteri.");
  const rateKey = await authRateKey(request, "register", email);
  if (await authRateLimited(rateKey, env)) return authPage("register", null, "Troppi tentativi. Attendi 15 minuti e riprova.");
  if (await env.DB.prepare('SELECT id FROM "User" WHERE email=?').bind(email).first()) { await recordAuthFailure(rateKey, env); return authPage("register", null, "Esiste già un account con questa email."); }
  const id = crypto.randomUUID(), hash = await hashPassword(password), now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO "User" (id,email,passwordHash,nome,createdAt) VALUES (?,?,?,?,?)').bind(id, email, hash, nome, now).run();
  await clearAuthFailures(rateKey, env);
  return createSessionResponse(id, env, "/studio");
}

async function login(request, env) {
  const f = await form(request), email = normalizeEmail(f.email), password = String(f.password || "");
  const rateKey = await authRateKey(request, "login", email);
  if (await authRateLimited(rateKey, env)) return authPage("login", null, "Troppi tentativi. Attendi 15 minuti e riprova.");
  const user = await env.DB.prepare('SELECT * FROM "User" WHERE email=?').bind(email).first();
  if (!user) { await recordAuthFailure(rateKey, env); return authPage("login", null, "Email o password non corretti."); }
  if (String(user.passwordHash).startsWith("$2")) return authPage("login", null, "Per il nuovo Splendoria devi reimpostare la password una sola volta usando “Password dimenticata?”.");
  if (!(await verifyPassword(password, user.passwordHash))) { await recordAuthFailure(rateKey, env); return authPage("login", null, "Email o password non corretti."); }
  await clearAuthFailures(rateKey, env);
  return createSessionResponse(user.id, env, normalizeEmail(user.email) === normalizeEmail(env.ADMIN_EMAIL) ? "/admin" : "/studio");
}

async function logout(request, env) {
  const token = cookie(request, "spl_session");
  if (token) await env.DB.prepare('DELETE FROM "Session" WHERE tokenHash=?').bind(await sha256(token)).run();
  return redirect("/", "spl_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
}

async function forgot(request, env) {
  const f = await form(request), email = normalizeEmail(f.email), user = await env.DB.prepare('SELECT id,email,nome FROM "User" WHERE email=?').bind(email).first();
  if (user) {
    const token = randomToken(), tokenHash = await sha256(token), expires = new Date(Date.now() + RESET_MINUTES * 60000).toISOString();
    await env.DB.prepare('DELETE FROM "PasswordReset" WHERE userId=? OR expiresAt<?').bind(user.id, new Date().toISOString()).run();
    await env.DB.prepare('INSERT INTO "PasswordReset" (id,userId,tokenHash,expiresAt,createdAt) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(), user.id, tokenHash, expires, new Date().toISOString()).run();
    await sendResetEmail(env, user, token).catch(console.error);
  }
  return forgotPage(true);
}

async function resetPassword(request, env) {
  const f = await form(request), token = String(f.token || ""), password = String(f.password || "");
  if (token.length < 20 || password.length < 10) return resetPage(token, "Il collegamento o la password non sono validi.");
  const row = await env.DB.prepare('SELECT * FROM "PasswordReset" WHERE tokenHash=? AND usedAt IS NULL AND expiresAt>?').bind(await sha256(token), new Date().toISOString()).first();
  if (!row) return resetPage("", "Il collegamento è scaduto o è già stato utilizzato.");
  const hash = await hashPassword(password), now = new Date().toISOString();
  await env.DB.batch([env.DB.prepare('UPDATE "User" SET passwordHash=? WHERE id=?').bind(hash, row.userId), env.DB.prepare('UPDATE "PasswordReset" SET usedAt=? WHERE id=?').bind(now, row.id), env.DB.prepare('DELETE FROM "Session" WHERE userId=?').bind(row.userId)]);
  return redirect("/accedi?e=" + encodeURIComponent("Password aggiornata. Ora puoi accedere."));
}

async function studio(user, env) {
  if (!user) return redirect("/accedi");
  if (user.isAdmin) return redirect("/admin");
  const projects = await env.DB.prepare(`SELECT p.*,a.statoCommerciale,COUNT(c.id) chapters,SUM(CASE WHEN length(c.content)>200 THEN 1 ELSE 0 END) completed FROM "BookProject" p LEFT JOIN "BookChapter" c ON c.projectId=p.id LEFT JOIN "BookProjectAdmin" a ON a.projectId=p.id WHERE p.userId=? GROUP BY p.id ORDER BY p.updatedAt DESC`).bind(user.id).all();
  const cards = projects.results.map(p => { const pct = p.chapters ? Math.round((Number(p.completed || 0) / Number(p.chapters)) * 100) : 10, unlocked = p.plan === "free" || p.statoCommerciale === "pagato"; return `<article class="card"><p class="kicker">${esc(PLAN_LABELS[p.plan] || p.plan)}</p><h3>${esc(p.title || "Libro senza titolo")}</h3><p class="muted">${esc(p.genre)} · ${p.targetPages} pagine</p><div class="meter"><span style="width:${pct}%"></span></div><p class="small">${pct}% completato · ${p.completed || 0}/${p.chapters || 0} capitoli</p>${unlocked ? `<a class="button" href="/libro/${p.id}">Continua il libro</a>` : `<span class="badge">Pagamento in attesa</span><p class="small muted">Il contenuto sarà accessibile appena il pagamento sarà confermato.</p>`}</article>`; }).join("");
  return page("Il tuo Studio", `<section class="studio alt"><div class="wrap"><div class="studiohead"><div><p class="eyebrow">Il tuo Studio</p><h1>Ciao, ${esc(user.nome || "autore")}</h1><p class="muted">Qui puoi creare, modificare e completare i tuoi libri in autonomia.</p></div></div><div class="grid three">${cards || `<article class="card"><h3>La tua storia comincia qui</h3><p>Imposta il libro in meno di due minuti. Potrai cambiare tutto in seguito.</p></article>`}</div><div class="card" style="margin-top:24px"><h3>Crea un nuovo libro</h3><form method="post" action="/nuovo-libro"><div class="grid three"><label class="field">Titolo provvisorio<input name="title" placeholder="La mia storia" required></label><label class="field">Genere<select name="genre"><option>Autobiografia</option><option>Memoriale</option><option>Romanzo</option><option>Storia di famiglia</option><option>Biografia aziendale</option></select></label><label class="field">Lunghezza<select name="targetPages"><option value="50">Breve · circa 50 pagine</option><option value="80" selected>Standard · circa 80 pagine</option><option value="120">Ampio · circa 120 pagine</option></select></label></div><button class="button">Crea il progetto gratuito</button></form></div></div></section>`, user);
}

async function newBook(request, user, env) {
  if (!user) return redirect("/accedi");
  const f = await form(request), id = crypto.randomUUID(), now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO "BookProject" (id,userId,title,genre,targetPages,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)').bind(id, user.id, clean(f.title, 160), clean(f.genre, 60), [50,80,120].includes(Number(f.targetPages)) ? Number(f.targetPages) : 80, now, now).run();
  return redirect(`/libro/${id}`);
}

async function bookEditor(id, user, env, notice = "") {
  if (!user) return redirect("/accedi");
  const project = await ownProject(id, user, env); if (!project) return redirect("/studio");
  const chapters = await env.DB.prepare('SELECT * FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(id).all();
  const interview = await env.DB.prepare('SELECT * FROM "BookInterview" WHERE projectId=?').bind(id).first();
  const questions = interview?.questions ? interview.questions.split("\n").filter(Boolean).map(q=>q.replace(/^\d+[.)-]?\s*/,"")) : [];
  const savedAnswers = parseInterviewAnswers(interview?.answers, questions.length);
  const questionHtml = questions.map((q,i)=>{const target=`interview-${i}`;return `<article class="interview-step"><p class="interview-number">Domanda ${i+1} di ${questions.length}</p><h4>${esc(q)}</h4><label class="field"><span class="sr-only">La tua risposta</span><textarea id="${target}" data-word-count name="answer_${i}" placeholder="Racconta come se fossimo seduti davanti a un caffè…">${esc(savedAnswers[i]||"")}</textarea></label>${dictationControl(target)}<span class="wordcount" data-count-for="${target}">0 parole</span></article>`}).join("");
  const chapterHtml = chapters.results.map(c => {const target=`chapter-${c.id}`;return `<article class="card chapter-card"><div class="chapter-head"><div style="display:flex;align-items:center;gap:12px"><div><p class="kicker">Capitolo ${c.position}</p><h3>${esc(c.title)}</h3></div><span class="wordcount" data-count-for="${target}">${wordCount(c.content)} parole</span></div></div><div class="chapter-body"><form method="post" action="/libro/${id}/capitolo/${c.id}/salva"><label class="field">La tua pagina<textarea id="${target}" data-word-count name="content" placeholder="Qui prenderà forma il capitolo…">${esc(c.content)}</textarea></label>${dictationControl(target,"Detta il capitolo")}${c.content ? `<p class="small muted"><b>Revisore Musa AI</b> · lavora sul testo visibile e conserva la tua voce:</p><div class="magic-tools"><button name="action" value="grammar" formaction="/libro/${id}/capitolo/${c.id}/rifinisci">✓ Correggi grammatica</button><button name="action" value="clarity" formaction="/libro/${id}/capitolo/${c.id}/rifinisci">◇ Più chiaro e scorrevole</button><button name="action" value="emotional" formaction="/libro/${id}/capitolo/${c.id}/rifinisci">✦ Più emozionante</button><button name="action" value="vivid" formaction="/libro/${id}/capitolo/${c.id}/rifinisci">◉ Più vivido</button><button name="action" value="elegant" formaction="/libro/${id}/capitolo/${c.id}/rifinisci">✎ Più elegante</button><button name="action" value="short" formaction="/libro/${id}/capitolo/${c.id}/rifinisci">↘ Più essenziale</button></div>` : ""}<div class="actions"><button class="button">Salva le mie modifiche</button><button class="button secondary" formaction="/libro/${id}/capitolo/${c.id}/genera">${c.content ? "Crea una nuova versione" : "Scrivi questo capitolo con me"}</button></div></form></div></article>`}).join("");
  const stage = chapters.results.length ? (chapters.results.some(c=>c.content)?2:1) : project.story ? 1 : 0;
  return page(project.title, `<section class="studio alt"><div class="wrap"><a href="/studio">← Tutti i libri</a><div class="studiohead"><div><p class="eyebrow">Il tuo viaggio di scrittura</p><h1>${esc(project.title)}</h1><p class="muted">La tua voce guida il libro. La Musa AI ti aiuta a trovare struttura, ritmo e parole.</p></div><a class="button secondary" href="/libro/${id}/anteprima">Sfoglia l'anteprima</a></div><div class="journey"><div class="journey-step done">La scintilla</div><i class="journey-line"></i><div class="journey-step ${stage>=1?"done":""}">La trama</div><i class="journey-line"></i><div class="journey-step ${stage>=2?"done":""}">I capitoli</div><i class="journey-line"></i><div class="journey-step">Il libro</div></div>${notice ? `<p class="success">${esc(notice)}</p>` : ""}<div class="writing-shell"><div class="writing-main"><form class="wow-panel" method="post" action="/libro/${id}/salva"><p class="eyebrow">L'anima del libro</p><h2>Prima delle parole, ci sono i ricordi.</h2><div class="grid three"><label class="field">Titolo<input name="title" value="${esc(project.title)}" required></label><label class="field">Tono<select name="tone">${options(["Emozionante e autentico","Intimo e riflessivo","Leggero e brillante","Professionale e autorevole"], project.tone)}</select></label><label class="field">Per chi è scritto?<input name="audience" value="${esc(project.audience)}"></label></div><label class="field">Racconta liberamente la storia<textarea id="story-${id}" data-word-count name="story" placeholder="Scrivi come parleresti a una persona cara. Non preoccuparti dello stile: a quello penseremo insieme.">${esc(project.story)}</textarea></label>${dictationControl(`story-${id}`,"Racconta a voce")}<div class="grid three"><div><label class="field">I protagonisti<textarea id="people-${id}" name="people" placeholder="Chi non può mancare?">${esc(project.people)}</textarea></label>${dictationControl(`people-${id}`)}</div><div><label class="field">I momenti decisivi<textarea id="events-${id}" name="events" placeholder="Gli incontri, le svolte, le partenze…">${esc(project.events)}</textarea></label>${dictationControl(`events-${id}`)}</div><div><label class="field">Ciò che vuoi lasciare<textarea id="message-${id}" name="message" placeholder="Che cosa vorresti restasse nel cuore?">${esc(project.message)}</textarea></label>${dictationControl(`message-${id}`)}</div></div><button class="button">Custodisci questi ricordi</button></form>${questionHtml ? `<form class="card interview" method="post" action="/libro/${id}/risposte" style="margin-top:24px"><p class="eyebrow">Intervista narrativa</p><h3>La Musa diventa la tua giornalista personale</h3><p class="muted">Rispondi una domanda alla volta, scrivendo o parlando. Non servono frasi perfette: la Musa trasformerà i tuoi ricordi in materiale narrativo.</p>${questionHtml}<button class="button">Affida queste risposte alla Musa</button></form>` : ""}<div class="actions"><form method="post" action="/libro/${id}/struttura"><button class="button">${chapters.results.length ? "Reimmagina l'indice" : "Disegna la trama del mio libro"}</button></form></div><div class="grid" style="margin-top:24px">${chapterHtml || `<article class="card center"><p class="eyebrow">Il prossimo incanto</p><h3>La tua storia sta per trovare una forma.</h3><p>Salva i ricordi, chiedi alla Musa le domande giuste e lascia che Splendoria disegni l'indice.</p></article>`}</div>${chapters.results.length ? purchaseBox(id, project.plan) : ""}</div><aside class="muse" aria-labelledby="muse-title"><div class="muse-head"><span class="muse-mark" aria-hidden="true">✦</span><div><p class="eyebrow">La tua Musa</p><p class="muse-role">Guida digitale, sensibilità umana</p></div></div><h3 id="muse-title">Racconta con la tua voce.</h3><p>La Musa ti ascolta, fa emergere i dettagli importanti e organizza i ricordi senza cambiare il tuo modo di raccontare.</p><ul class="muse-list"><li><span aria-hidden="true">01</span>Ti guida con domande delicate e precise</li><li><span aria-hidden="true">02</span>Trasforma ricordi e materiali in una trama coerente</li><li><span aria-hidden="true">03</span>Lascia ogni testo nelle tue mani, sempre modificabile</li></ul><div class="muse-voice"><label for="voice-language-${id}">Lingua della dettatura</label><select id="voice-language-${id}" data-voice-language><option value="it-IT">Italiano</option><option value="de-DE">Deutsch</option><option value="en-GB">English</option></select><p class="small">La scelta vale per tutti i pulsanti del microfono e viene ricordata su questo dispositivo.</p></div><form method="post" action="/libro/${id}/intervista"><button class="button">✦ Lasciati guidare in una nuova intervista</button></form><p class="muse-human small"><strong>Supervisione umana</strong><br>La tecnologia accompagna il percorso; la revisione professionale garantisce il risultato.</p></aside></div></div></section>`, user);
}

async function generateInterview(id,user,env){if(!user)return redirect("/accedi");const p=await ownProject(id,user,env);if(!p)return redirect("/studio");if(!p.story.trim())return bookEditor(id,user,env,"Racconta prima qualche riga della storia e salva.");let questions;try{const ai=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast",{prompt:`Sei un intervistatore biografico empatico. Sulla base di questa storia: ${p.story}. Persone: ${p.people}. Eventi: ${p.events}. Formula 6 domande sorprendenti, delicate e specifiche che facciano emergere scene, emozioni, dialoghi, dettagli sensoriali e significato. Italiano. Solo domande, una per riga.`,max_tokens:700});questions=String(ai.response||"").trim()}catch{questions="Qual è la prima immagine che ti torna alla mente pensando a quel periodo?\nQuale persona ha cambiato il corso della storia senza saperlo?\nC'è un profumo, un suono o un luogo che rende vivo quel ricordo?\nQuale scelta sembrava piccola ma si è rivelata decisiva?\nChe cosa non hai mai raccontato di quel momento?\nChe cosa vorresti che il lettore comprendesse davvero?"}await env.DB.prepare(`INSERT INTO "BookInterview" (projectId,questions,answers,updatedAt) VALUES (?,?,?,?) ON CONFLICT(projectId) DO UPDATE SET questions=excluded.questions,updatedAt=excluded.updatedAt`).bind(id,questions,"",new Date().toISOString()).run();return redirect(`/libro/${id}`)}
async function saveInterview(request,id,user,env){if(!user)return redirect("/accedi");const p=await ownProject(id,user,env);if(!p)return redirect("/studio");const f=await form(request),interview=await env.DB.prepare('SELECT questions FROM "BookInterview" WHERE projectId=?').bind(id).first(),questions=String(interview?.questions||"").split("\n").filter(Boolean).map(q=>q.replace(/^\d+[.)-]?\s*/,"")),answers=questions.map((q,i)=>({question:q,answer:clean(f[`answer_${i}`],4000)})).filter(x=>x.answer).map((x,i)=>`Domanda ${i+1}: ${x.question}\nRisposta: ${x.answer}`).join("\n\n");await env.DB.prepare('UPDATE "BookInterview" SET answers=?,updatedAt=? WHERE projectId=?').bind(clean(answers,24000),new Date().toISOString(),id).run();return redirect(`/libro/${id}`)}

async function saveBook(request, id, user, env) {
  if (!user) return redirect("/accedi"); const p = await ownProject(id, user, env); if (!p) return redirect("/studio"); const f = await form(request);
  await env.DB.prepare('UPDATE "BookProject" SET title=?,tone=?,audience=?,story=?,people=?,events=?,message=?,updatedAt=? WHERE id=?').bind(clean(f.title,160),clean(f.tone,80),clean(f.audience,160),clean(f.story,7000),clean(f.people,4000),clean(f.events,4000),clean(f.message,3000),new Date().toISOString(),id).run();
  return redirect(`/libro/${id}`);
}

async function generateOutline(id, user, env) {
  if (!user) return redirect("/accedi"); const p = await ownProject(id, user, env); if (!p) return redirect("/studio");
  if (!p.story.trim()) return bookEditor(id, user, env, "Prima racconta brevemente la storia e salva le informazioni.");
  const count = p.targetPages <= 50 ? 7 : p.targetPages >= 120 ? 14 : 10;
  let titles;
  try {
    const prompt = `Crea un indice di ${count} capitoli per un libro in italiano. Titolo: ${p.title}. Genere: ${p.genre}. Tono: ${p.tone}. Pubblico: ${p.audience}. Storia: ${p.story}. Persone: ${p.people}. Eventi: ${p.events}. Messaggio: ${p.message}. Rispondi solo con i titoli, uno per riga, senza numerazione.`;
    const ai = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", { prompt, max_tokens: 500 });
    titles = String(ai.response || "").split(/\n/).map(x => x.replace(/^\s*\d+[.)-]?\s*/, "").trim()).filter(Boolean).slice(0, count);
  } catch { titles = fallbackTitles(count); }
  if (titles.length < 4) titles = fallbackTitles(count);
  const statements = [env.DB.prepare('DELETE FROM "BookChapter" WHERE projectId=?').bind(id)];
  titles.forEach((title, i) => statements.push(env.DB.prepare('INSERT INTO "BookChapter" (id,projectId,position,title,content,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,i+1,clean(title,180),"","da_generare",new Date().toISOString(),new Date().toISOString())));
  statements.push(env.DB.prepare('UPDATE "BookProject" SET status=?,updatedAt=? WHERE id=?').bind("struttura_creata",new Date().toISOString(),id));
  await env.DB.batch(statements); return redirect(`/libro/${id}`);
}

async function generateChapter(projectId, chapterId, user, env) {
  if (!user) return redirect("/accedi"); const p = await ownProject(projectId, user, env); if (!p) return redirect("/studio");
  const c = await env.DB.prepare('SELECT * FROM "BookChapter" WHERE id=? AND projectId=?').bind(chapterId, projectId).first(); if (!c) return redirect(`/libro/${projectId}`);
  if (p.plan === "free") { const used = await todayUsage(user.id, env); if (used >= FREE_AI_LIMIT) return bookEditor(projectId, user, env, "Hai usato le generazioni gratuite. Scegli una formula per continuare."); }
  const outline = await env.DB.prepare('SELECT position,title FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(projectId).all();
  const interview=await env.DB.prepare('SELECT answers FROM "BookInterview" WHERE projectId=?').bind(projectId).first();
  const prompt = `Scrivi il capitolo ${c.position}, intitolato "${c.title}", del libro "${p.title}". Genere ${p.genre}, tono ${p.tone}, pubblico ${p.audience}. Storia: ${p.story}. Persone: ${p.people}. Eventi: ${p.events}. Messaggio: ${p.message}. Ulteriori ricordi dell'autore: ${interview?.answers||""}. Indice: ${outline.results.map(x=>x.position+". "+x.title).join("; ")}. Scrivi 900-1300 parole in italiano, stile naturale, personale e coinvolgente. Conserva la voce dell'autore, crea scene usando solo dettagli forniti, non inventare fatti precisi; quando manca un dettaglio usa una formulazione prudente. Restituisci solo il testo del capitolo.`;
  let content;
  try { const ai = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", { prompt, max_tokens: 3000 }); content = String(ai.response || "").trim(); } catch { content = "La generazione non è disponibile in questo momento. Riprova tra poco."; }
  await env.DB.batch([env.DB.prepare('UPDATE "BookChapter" SET content=?,status=?,updatedAt=? WHERE id=?').bind(content,"generato",new Date().toISOString(),chapterId), env.DB.prepare(`INSERT INTO "AiUsage" (userId,date,requests,updatedAt) VALUES (?,?,1,?) ON CONFLICT(userId,date) DO UPDATE SET requests=requests+1,updatedAt=excluded.updatedAt`).bind(user.id,new Date().toISOString().slice(0,10),new Date().toISOString())]);
  return redirect(`/libro/${projectId}`);
}

async function refineChapter(request,projectId,chapterId,user,env){if(!user)return redirect("/accedi");const p=await ownProject(projectId,user,env);if(!p)return redirect("/studio");const c=await env.DB.prepare('SELECT * FROM "BookChapter" WHERE id=? AND projectId=?').bind(chapterId,projectId).first();if(!c)return redirect(`/libro/${projectId}`);const f=await form(request),action=instructionsAction(f.action),source=clean(f.content,60000)||c.content;if(!source)return redirect(`/libro/${projectId}`);const instructions={grammar:"Correggi esclusivamente ortografia, grammatica, punteggiatura, concordanze e refusi. Non abbellire, non riassumere e non cambiare lessico, ritmo o voce dell'autore.",clarity:"Migliora chiarezza e scorrevolezza, sciogliendo frasi ambigue e ripetizioni, senza cambiare tono, fatti o personalità dell'autore.",emotional:"Rendi il testo più emozionante ma mai melodrammatico; valorizza sentimenti già presenti.",vivid:"Rendi le scene più vive e sensoriali usando soltanto dettagli presenti o formulazioni non fattuali.",elegant:"Rendi lo stile più elegante, fluido e letterario senza alterare i fatti o la voce dell'autore.",short:"Riduci il testo del 25%, elimina ripetizioni e mantieni i passaggi essenziali."};let content=source;try{const words=wordCount(source),maxTokens=Math.min(1600,Math.max(96,Math.ceil(words*(action==="short"?1.4:2.2)))),ai=await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast",{messages:[{role:"system",content:`Sei un editor italiano rigoroso. ${instructions[action]} Mantieni nomi, fatti, significato e punto di vista. Non inventare informazioni. Restituisci soltanto il testo revisionato, senza premesse, commenti, titoli o virgolette.`},{role:"user",content:source}],temperature:0.1,max_tokens:maxTokens}),candidate=String(ai.response||"").trim();if(validRevision(source,candidate,action))content=candidate}catch{content=source}const status=content===source?"revisione_non_applicata":`revisionato_${action}`;await env.DB.prepare('UPDATE "BookChapter" SET content=?,status=?,updatedAt=? WHERE id=?').bind(content,status,new Date().toISOString(),chapterId).run();return redirect(`/libro/${projectId}`)}

async function saveChapter(request, projectId, chapterId, user, env) {
  if (!user) return redirect("/accedi"); const p = await ownProject(projectId,user,env); if (!p) return redirect("/studio"); const f = await form(request);
  await env.DB.prepare('UPDATE "BookChapter" SET content=?,status=?,updatedAt=? WHERE id=? AND projectId=?').bind(clean(f.content,60000),"modificato",new Date().toISOString(),chapterId,projectId).run(); return redirect(`/libro/${projectId}`);
}

async function previewBook(id, user, env) {
  if (!user) return redirect("/accedi"); const p = await ownProject(id,user,env); if (!p) return redirect("/studio"); const chapters = await env.DB.prepare('SELECT * FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(id).all();
  return renderBookPreview(p, chapters.results, user.nome, user);
}

async function adminPreviewBook(id,user,env){
  if(!user?.isAdmin)return redirect("/accedi");
  const p=await env.DB.prepare(`SELECT p.*,u.nome authorName FROM "BookProject" p JOIN "User" u ON u.id=p.userId WHERE p.id=?`).bind(id).first();
  if(!p)return redirect("/admin");
  const chapters=await env.DB.prepare('SELECT * FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(id).all();
  return renderBookPreview(p,chapters.results,p.authorName,user,"/admin/progetto/"+id);
}

function renderBookPreview(p,chapters,authorName,user,back="/studio"){
  return page(p.title, `<article class="wrap" style="max-width:760px;padding:55px 20px"><p><a href="${esc(back)}">← Torna indietro</a></p><div class="center" style="padding:90px 0"><p class="eyebrow">Splendoria</p><h1 style="font-size:58px">${esc(p.title)}</h1><p class="lead">di ${esc(authorName)}</p><button class="button" onclick="window.print()">Stampa o salva in PDF</button></div><h2>Indice</h2><ol>${chapters.map(c=>`<li>${esc(c.title)}</li>`).join("")}</ol>${chapters.map(c=>`<section style="break-before:page;padding:40px 0"><p class="kicker">Capitolo ${c.position}</p><h2>${esc(c.title)}</h2>${paragraphs(c.content || "Capitolo ancora da generare.")}</section>`).join("")}</article>`, user, 200, `@media print{.nav,.footer,.button{display:none!important}body{font-family:Georgia,serif}.wrap{max-width:none}.section{break-before:page}}`);
}

function purchaseBox(id, plan) { if (plan !== "free") return `<div class="card"><h3>Formula attiva: ${esc(PLAN_LABELS[plan])}</h3><p>Puoi completare il libro e preparare l'anteprima digitale.</p></div>`; return `<section class="card" style="margin-top:30px"><p class="eyebrow">Completa il libro</p><h3>Sblocca tutte le generazioni</h3><form method="post" action="/libro/${id}/acquista"><div class="grid three">${Object.entries(PLANS).map(([k,p])=>`<label class="card"><input type="radio" name="plan" value="${k}" ${k==="digital"?"checked":""}> <b>${esc(p.label)} · ${p.price} €</b><p class="small">${esc(p.description)}</p></label>`).join("")}</div><button class="button">Continua con la formula scelta</button></form></section>`; }

async function purchase(request,id,user,env){ if(!user)return redirect("/accedi");const p=await ownedProject(id,user,env);if(!p)return redirect("/studio");const f=await form(request),plan=PLANS[f.plan]?f.plan:"digital",info=PLANS[plan],now=new Date().toISOString();await env.DB.batch([env.DB.prepare('INSERT INTO "Ordine" (id,userId,projectId,formula,prezzo,stato,createdAt) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),user.id,id,plan,info.price,"da_pagare",now),env.DB.prepare('UPDATE "BookProject" SET plan=?,status=?,updatedAt=? WHERE id=? AND userId=?').bind(plan,"attesa_pagamento",now,id,user.id),env.DB.prepare(`INSERT INTO "BookProjectAdmin" (projectId,userId,statoEditoriale,statoCommerciale,updatedAt) VALUES (?,?,?,?,?) ON CONFLICT(projectId) DO UPDATE SET statoCommerciale=excluded.statoCommerciale,updatedAt=excluded.updatedAt`).bind(id,user.id,p.status,"da_pagare",now)]);return redirect("/studio");}

async function adminDashboard(user, env, url) {
  if (!user?.isAdmin) return redirect("/accedi"); const q = clean(url.searchParams.get("q"),100), status=clean(url.searchParams.get("stato"),50); let where="WHERE 1=1",args=[]; if(q){where+=' AND (u.email LIKE ? OR u.nome LIKE ? OR p.title LIKE ?)';args.push(`%${q}%`,`%${q}%`,`%${q}%`)} if(status){where+=' AND COALESCE(a.statoEditoriale,p.status)=?';args.push(status)}
  const rows=await env.DB.prepare(`SELECT p.id,p.title,p.genre,p.status,p.plan,p.updatedAt,u.nome,u.email,COUNT(c.id) chapters,SUM(CASE WHEN length(c.content)>200 THEN 1 ELSE 0 END) completed,COALESCE(a.statoEditoriale,p.status) statoEditoriale,COALESCE(a.statoCommerciale,CASE WHEN p.plan='free' THEN 'gratuito' ELSE 'formula_scelta' END) statoCommerciale FROM "BookProject" p JOIN "User" u ON u.id=p.userId LEFT JOIN "BookChapter" c ON c.projectId=p.id LEFT JOIN "BookProjectAdmin" a ON a.projectId=p.id ${where} GROUP BY p.id ORDER BY p.updatedAt DESC`).bind(...args).all(); const counts=await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM "User" WHERE email<>?) users,(SELECT COUNT(*) FROM "BookProject") books,(SELECT COUNT(*) FROM "BookProject" WHERE status='completato') completed,(SELECT COUNT(*) FROM "Ordine") orders`).bind(env.ADMIN_EMAIL).first();
  const clients=await env.DB.prepare(`SELECT u.id,u.nome,u.email,u.createdAt,COUNT(DISTINCT p.id) books,COUNT(DISTINCT o.id) orders FROM "User" u LEFT JOIN "BookProject" p ON p.userId=u.id LEFT JOIN "Ordine" o ON o.userId=u.id WHERE u.email<>? GROUP BY u.id ORDER BY u.createdAt DESC`).bind(env.ADMIN_EMAIL).all();
  const table=rows.results.map(r=>{const pct=r.chapters?Math.round(Number(r.completed||0)/Number(r.chapters)*100):0;return `<tr><td><b>${esc(r.title)}</b><br><span class="small muted">${esc(r.genre)}</span></td><td>${esc(r.nome)}<br><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td><td><div class="meter"><span style="width:${pct}%"></span></div><span class="small">${pct}% · ${r.completed||0}/${r.chapters||0}</span></td><td><span class="badge">${esc(r.statoEditoriale)}</span></td><td>${esc(r.statoCommerciale)}</td><td>${new Date(r.updatedAt).toLocaleDateString("it-IT")}</td><td><a class="button secondary" href="/admin/progetto/${r.id}">Apri</a></td></tr>`}).join("");
  const clientTable=clients.results.map(c=>`<tr><td><b>${esc(c.nome||"Senza nome")}</b></td><td><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></td><td>${c.books}</td><td>${c.orders}</td><td>${new Date(c.createdAt).toLocaleDateString("it-IT")}</td></tr>`).join("");
  return page("Amministrazione",`<section class="studio alt"><div class="wrap"><div class="studiohead"><div><p class="eyebrow">Area amministratore</p><h1>Controllo completo</h1><p class="muted">Clienti, libri, avanzamento, ordini e stato dei pagamenti.</p></div><a class="button secondary" href="/admin/esporta.csv">Esporta CSV</a></div><div class="stats"><div class="stat"><span>Clienti</span><b>${counts.users}</b></div><div class="stat"><span>Libri iniziati</span><b>${counts.books}</b></div><div class="stat"><span>Completati</span><b>${counts.completed}</b></div><div class="stat"><span>Ordini</span><b>${counts.orders}</b></div></div><h2>Progetti</h2><form class="filters"><input class="input" name="q" value="${esc(q)}" placeholder="Cerca nome, email o libro"><select class="input" name="stato"><option value="">Tutti gli stati</option>${options(["bozza","struttura_creata","in_lavorazione","in_revisione","approvato","completato"],status)}</select><button class="button">Filtra</button></form><div class="tablebox"><table class="table"><thead><tr><th>Libro</th><th>Cliente</th><th>Avanzamento</th><th>Stato editoriale</th><th>Stato commerciale</th><th>Aggiornato</th><th></th></tr></thead><tbody>${table||`<tr><td colspan="7">Nessun progetto trovato.</td></tr>`}</tbody></table></div><h2 style="margin-top:42px">Clienti</h2><div class="tablebox"><table class="table"><thead><tr><th>Nome</th><th>Email</th><th>Libri</th><th>Ordini</th><th>Registrato</th></tr></thead><tbody>${clientTable||`<tr><td colspan="5">Nessun cliente.</td></tr>`}</tbody></table></div></div></section>`,user);
}

async function adminProject(id,user,env,message=""){if(!user?.isAdmin)return redirect("/accedi");const p=await env.DB.prepare(`SELECT p.*,u.nome,u.email,a.statoEditoriale,a.statoCommerciale,a.tutor,a.note FROM "BookProject" p JOIN "User" u ON u.id=p.userId LEFT JOIN "BookProjectAdmin" a ON a.projectId=p.id WHERE p.id=?`).bind(id).first();if(!p)return redirect("/admin");const chapters=await env.DB.prepare('SELECT position,title,length(content) chars,status FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(id).all();const orders=await env.DB.prepare('SELECT * FROM "Ordine" WHERE projectId=? ORDER BY createdAt DESC').bind(id).all();return page("Gestione progetto",`<section class="studio alt"><div class="wrap"><a href="/admin">← Dashboard</a><h1>${esc(p.title)}</h1><p>${esc(p.nome)} · <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>${message?`<p class="success">${esc(message)}</p>`:""}<div class="grid three"><article class="card"><h3>Libro</h3><p>${esc(p.genre)} · ${p.targetPages} pagine</p><p>Piano: ${esc(PLAN_LABELS[p.plan]||p.plan)}</p><a href="/admin/progetto/${p.id}/anteprima" class="button secondary">Anteprima amministratore</a></article><article class="card"><h3>Capitoli</h3><ol>${chapters.results.map(c=>`<li>${esc(c.title)} <span class="muted">(${c.chars} caratteri)</span></li>`).join("")||"<li>Nessun capitolo</li>"}</ol></article><article class="card"><h3>Ordini del libro</h3>${orders.results.map(o=>`<p>${esc(o.formula)} · ${o.prezzo} € · ${esc(o.stato)}</p>`).join("")||"<p>Nessun ordine</p>"}</article></div><form class="card" method="post"><h3>Gestione interna</h3><div class="adminform"><label class="field">Stato editoriale<select name="statoEditoriale">${options(["iniziato","in_lavorazione","in_revisione","approvato","completato","consegnato"],p.statoEditoriale||p.status)}</select></label><label class="field">Stato commerciale<select name="statoCommerciale">${options(["gratuito","formula_scelta","da_pagare","pagato","rimborsato"],p.statoCommerciale||"gratuito")}</select></label><label class="field">Tutor<input name="tutor" value="${esc(p.tutor||"")}"></label><label class="field full">Note interne<textarea name="note">${esc(p.note||"")}</textarea></label></div><button class="button">Salva la gestione</button></form></div></section>`,user);}

async function updateAdminProject(request,id,user,env){if(!user?.isAdmin)return redirect("/accedi");const p=await env.DB.prepare('SELECT userId FROM "BookProject" WHERE id=?').bind(id).first();if(!p)return redirect("/admin");const f=await form(request),commerciale=clean(f.statoCommerciale,50),now=new Date().toISOString();await env.DB.batch([env.DB.prepare(`INSERT INTO "BookProjectAdmin" (projectId,userId,statoEditoriale,statoCommerciale,tutor,note,updatedAt) VALUES (?,?,?,?,?,?,?) ON CONFLICT(projectId) DO UPDATE SET statoEditoriale=excluded.statoEditoriale,statoCommerciale=excluded.statoCommerciale,tutor=excluded.tutor,note=excluded.note,updatedAt=excluded.updatedAt`).bind(id,p.userId,clean(f.statoEditoriale,50),commerciale,clean(f.tutor,100),clean(f.note,5000),now),env.DB.prepare('UPDATE "Ordine" SET stato=? WHERE projectId=?').bind(commerciale,id)]);return adminProject(id,user,env,"Gestione aggiornata.");}

async function exportCsv(user,env){if(!user?.isAdmin)return redirect("/accedi");const rows=await env.DB.prepare(`SELECT u.nome,u.email,p.title,p.genre,p.status,p.plan,p.createdAt,p.updatedAt FROM "BookProject" p JOIN "User" u ON u.id=p.userId ORDER BY p.updatedAt DESC`).all();const csv=["Nome,Email,Titolo,Genere,Stato,Piano,Creato,Aggiornato",...rows.results.map(r=>[r.nome,r.email,r.title,r.genre,r.status,r.plan,r.createdAt,r.updatedAt].map(csvCell).join(","))].join("\r\n");return new Response("\ufeff"+csv,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":"attachment; filename=splendoria-progetti.csv"}});}

async function contact(request,env){const f=await form(request);if(f.website)return redirect("/");const plan=PLANS[clean(f.plan,30)]?.label||"",rawSubject=clean(f.subject,160),rawMessage=clean(f.message,3000),subject=(plan?`[${plan}] ${rawSubject}`:rawSubject).slice(0,160),message=(plan?`Formula scelta: ${plan}\n\n${rawMessage}`:rawMessage).slice(0,3000),id=crypto.randomUUID(),now=new Date().toISOString();await env.DB.prepare('INSERT INTO "ContactMessage" (id,fullName,phone,email,subject,message,lang,ipHash,deliveryStatus,deliveryError,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id,clean(f.fullName,100),clean(f.phone,40),normalizeEmail(f.email),subject,message,"it",await sha256(request.headers.get("cf-connecting-ip")||"unknown"),"pending","",now).run();return redirect("/?contatto=inviato#contatti");}

async function currentUser(request,env){const token=cookie(request,"spl_session");if(!token)return null;const row=await env.DB.prepare(`SELECT u.* FROM "Session" s JOIN "User" u ON u.id=s.userId WHERE s.tokenHash=? AND s.expiresAt>?`).bind(await sha256(token),new Date().toISOString()).first();if(!row)return null;return{...row,isAdmin:normalizeEmail(row.email)===normalizeEmail(env.ADMIN_EMAIL)}}
async function createSessionResponse(userId,env,path){const token=randomToken(),hash=await sha256(token),expires=new Date(Date.now()+SESSION_DAYS*86400000);await env.DB.prepare('INSERT INTO "Session" (id,userId,tokenHash,expiresAt,createdAt) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),userId,hash,expires.toISOString(),new Date().toISOString()).run();return redirect(path,`spl_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS*86400}`)}
async function ownedProject(id,user,env){if(!user||user.isAdmin)return null;return env.DB.prepare('SELECT * FROM "BookProject" WHERE id=? AND userId=?').bind(id,user.id).first()}
async function ownProject(id,user,env){if(!user||user.isAdmin)return null;return env.DB.prepare(`SELECT p.* FROM "BookProject" p LEFT JOIN "BookProjectAdmin" a ON a.projectId=p.id WHERE p.id=? AND p.userId=? AND (p.plan='free' OR a.statoCommerciale='pagato')`).bind(id,user.id).first()}
async function todayUsage(userId,env){const r=await env.DB.prepare('SELECT requests FROM "AiUsage" WHERE userId=? AND date=?').bind(userId,new Date().toISOString().slice(0,10)).first();return Number(r?.requests||0)}

async function sendResetEmail(env,user,token){if(!env.CONTACT_EMAIL)return;const { EmailMessage }=await import("cloudflare:email");const link=`${env.APP_URL}/reimposta-password?token=${encodeURIComponent(token)}`;const raw=`From: Splendoria <${env.EMAIL_FROM}>\r\nTo: ${user.email}\r\nSubject: Reimposta la password di Splendoria\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\nCiao ${user.nome||""},\r\n\r\napri questo collegamento entro ${RESET_MINUTES} minuti per scegliere una nuova password:\r\n${link}\r\n\r\nSe non hai richiesto tu il recupero, ignora questo messaggio.\r\n`;await env.CONTACT_EMAIL.send(new EmailMessage(env.EMAIL_FROM,user.email,raw))}

async function ensureSchema(db){const sql=[`CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY,email TEXT NOT NULL,passwordHash TEXT NOT NULL,nome TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"(email)`,`CREATE TABLE IF NOT EXISTS "Capitolo" (id TEXT PRIMARY KEY,userId TEXT NOT NULL,titolo TEXT NOT NULL DEFAULT '',genere TEXT NOT NULL DEFAULT 'Autobiografia',testo TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "Ordine" (id TEXT PRIMARY KEY,userId TEXT NOT NULL,projectId TEXT,formula TEXT NOT NULL,prezzo INTEGER NOT NULL,stato TEXT NOT NULL DEFAULT 'richiesta',createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "AiUsage" (userId TEXT NOT NULL,date TEXT NOT NULL,requests INTEGER NOT NULL DEFAULT 0,updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(userId,date))`,`CREATE TABLE IF NOT EXISTS "ContactMessage" (id TEXT PRIMARY KEY,fullName TEXT NOT NULL,phone TEXT NOT NULL,email TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,lang TEXT NOT NULL,ipHash TEXT NOT NULL,deliveryStatus TEXT NOT NULL DEFAULT 'pending',deliveryError TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "Session" (id TEXT PRIMARY KEY,userId TEXT NOT NULL,tokenHash TEXT NOT NULL UNIQUE,expiresAt TEXT NOT NULL,createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "PasswordReset" (id TEXT PRIMARY KEY,userId TEXT NOT NULL,tokenHash TEXT NOT NULL UNIQUE,expiresAt TEXT NOT NULL,usedAt TEXT,createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "AuthThrottle" (key TEXT PRIMARY KEY,attempts INTEGER NOT NULL DEFAULT 0,windowStart TEXT NOT NULL,blockedUntil TEXT,updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "ProjectAdmin" (userId TEXT PRIMARY KEY,statoEditoriale TEXT NOT NULL DEFAULT 'iniziato',statoCommerciale TEXT NOT NULL DEFAULT 'gratuito',tutor TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "BookProject" (id TEXT PRIMARY KEY,userId TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',genre TEXT NOT NULL DEFAULT 'Autobiografia',tone TEXT NOT NULL DEFAULT 'Emozionante e autentico',audience TEXT NOT NULL DEFAULT 'Famiglia e amici',targetPages INTEGER NOT NULL DEFAULT 80,story TEXT NOT NULL DEFAULT '',people TEXT NOT NULL DEFAULT '',events TEXT NOT NULL DEFAULT '',message TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'bozza',plan TEXT NOT NULL DEFAULT 'free',createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE TABLE IF NOT EXISTS "BookProjectAdmin" (projectId TEXT PRIMARY KEY,userId TEXT NOT NULL,statoEditoriale TEXT NOT NULL DEFAULT 'iniziato',statoCommerciale TEXT NOT NULL DEFAULT 'gratuito',tutor TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT '',updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,`CREATE INDEX IF NOT EXISTS "BookProjectAdmin_userId_idx" ON "BookProjectAdmin"(userId)`,`CREATE TABLE IF NOT EXISTS "BookChapter" (id TEXT PRIMARY KEY,projectId TEXT NOT NULL,position INTEGER NOT NULL,title TEXT NOT NULL DEFAULT '',content TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'da_generare',createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(projectId,position))`,`CREATE TABLE IF NOT EXISTS "BookInterview" (projectId TEXT PRIMARY KEY,questions TEXT NOT NULL DEFAULT '',answers TEXT NOT NULL DEFAULT '',updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`];for(const q of sql)await db.prepare(q).run();await ensureColumn(db,"Ordine","projectId","TEXT")}
async function ensureColumn(db,table,column,type){const info=await db.prepare(`PRAGMA table_info("${table}")`).all();if(!(info.results||[]).some(r=>r.name===column))await db.prepare(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`).run()}

function redirect(path,setCookie){const h={location:path};if(setCookie)h["set-cookie"]=setCookie;return new Response(null,{status:303,headers:h})}
async function form(request){const type=request.headers.get("content-type")||"";if(type.includes("application/json"))return request.json();return Object.fromEntries(await request.formData())}
function cookie(request,name){const c=request.headers.get("cookie")||"";const m=c.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));return m?m[1]:""}
function clean(value,max=1000){return String(value||"").replace(/\0/g,"").trim().slice(0,max)}
function normalizeEmail(v){return clean(v,160).toLowerCase()}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function options(list,current){return list.map(x=>`<option value="${esc(x)}" ${x===current?"selected":""}>${esc(x.replaceAll("_"," "))}</option>`).join("")}
function dictationControl(target,label="Rispondi a voce"){return `<div class="voice-control"><button class="voice-button" type="button" data-voice-target="${esc(target)}" aria-pressed="false">● ${esc(label)}</button><span class="small muted" data-voice-status role="status" aria-live="polite">Premi e inizia a parlare</span></div>`}
function parseInterviewAnswers(value,count){const answers=Array(count).fill(""),text=String(value||"");const matches=[...text.matchAll(/Domanda\s+\d+:.*?\nRisposta:\s*([\s\S]*?)(?=\n\nDomanda\s+\d+:|$)/g)];if(matches.length)matches.slice(0,count).forEach((m,i)=>answers[i]=m[1].trim());else if(text.trim())answers[0]=text.trim();return answers}
function paragraphs(v){return String(v).split(/\n{2,}/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("")}
function fallbackTitles(n){const base=["Le radici","Il mondo di allora","Gli incontri che cambiano","La prima svolta","Strade inattese","Le prove","Ciò che resta","Una nuova stagione","La consapevolezza","Verso il futuro","L'eredità","Epilogo"];return base.slice(0,n)}
function randomToken(){const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
async function sha256(v){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("")}
async function authRateKey(request,action,email){return sha256(`${action}|${request.headers.get("cf-connecting-ip")||"unknown"}|${email}`)}
async function authRateLimited(key,env){const row=await env.DB.prepare('SELECT * FROM "AuthThrottle" WHERE key=?').bind(key).first();if(!row)return false;const now=Date.now();if(row.blockedUntil&&Date.parse(row.blockedUntil)>now)return true;if(now-Date.parse(row.windowStart)>AUTH_WINDOW_MINUTES*60000){await clearAuthFailures(key,env);return false}return Number(row.attempts)>=AUTH_MAX_ATTEMPTS}
async function recordAuthFailure(key,env){const now=new Date(),row=await env.DB.prepare('SELECT attempts,windowStart FROM "AuthThrottle" WHERE key=?').bind(key).first();if(!row||now-Date.parse(row.windowStart)>AUTH_WINDOW_MINUTES*60000){await env.DB.prepare('INSERT INTO "AuthThrottle" (key,attempts,windowStart,blockedUntil,updatedAt) VALUES (?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,windowStart=excluded.windowStart,blockedUntil=excluded.blockedUntil,updatedAt=excluded.updatedAt').bind(key,1,now.toISOString(),null,now.toISOString()).run();return}const attempts=Number(row.attempts)+1,blockedUntil=attempts>=AUTH_MAX_ATTEMPTS?new Date(now.getTime()+AUTH_WINDOW_MINUTES*60000).toISOString():null;await env.DB.prepare('UPDATE "AuthThrottle" SET attempts=?,blockedUntil=?,updatedAt=? WHERE key=?').bind(attempts,blockedUntil,now.toISOString(),key).run()}
async function clearAuthFailures(key,env){await env.DB.prepare('DELETE FROM "AuthThrottle" WHERE key=?').bind(key).run()}
function csvCell(v){return `"${String(v??"").replaceAll('"','""')}"`}
function wordCount(v){return String(v||"").trim()?String(v).trim().split(/\s+/).length:0}
function instructionsAction(v){return ["grammar","clarity","emotional","vivid","elegant","short"].includes(v)?v:"grammar"}
function validRevision(source,candidate,action){if(!candidate||candidate.length>60000)return false;const before=wordCount(source),after=wordCount(candidate);if(!before||!after)return false;const limits=action==="grammar"?[0.72,1.28]:action==="short"?[0.45,0.95]:[0.55,1.8];return after>=Math.floor(before*limits[0])&&after<=Math.ceil(before*limits[1])}
async function hashPassword(password){const iterations=60000,salt=randomToken().slice(0,32),key=await pbkdf2(password,salt,iterations);return `pbkdf2$${iterations}$${salt}$${key}`}
async function verifyPassword(password,stored){const [kind,it,salt,expected]=String(stored||"").split("$");if(kind!=="pbkdf2"||!it||!salt||!expected)return false;const actual=await pbkdf2(password,salt,Number(it));return timingSafe(actual,expected)}
async function pbkdf2(password,salt,iterations){const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(salt),iterations},material,256);return Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,"0")).join("")}
function timingSafe(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
