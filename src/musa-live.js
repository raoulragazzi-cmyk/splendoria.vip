const EMBED_ORIGIN = 'https://embed.liveavatar.com';
const STAGING_ORIGIN = 'https://splendoria-v2-staging.raoulragazzi.workers.dev';
const DEFAULT_POLICY = 'camera=(), geolocation=(), microphone=(self), payment=(), usb=()';

export function musaLiveEnabled(env) {
  return env?.ENVIRONMENT === 'staging' && env?.APP_URL === STAGING_ORIGIN && env?.MUSA_LIVE_ENABLED === 'true';
}

export function validMusaEmbed(value) {
  try {
    const url = new URL(value);
    if (url.origin !== EMBED_ORIGIN || url.username || url.password || url.hash) return '';
    if (!/^\/v1\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(url.pathname)) return '';
    if ([...url.searchParams].some(([k, v]) => k !== 'orientation' || v !== 'horizontal')) return '';
    return url.href;
  } catch { return ''; }
}

export function musaLivePolicy(response, url) {
  return response.status === 200 && url.pathname.replace(/\/$/, '') === '/admin/musa-live' &&
    response.headers.get('content-security-policy')?.includes(`frame-src ${EMBED_ORIGIN};`)
    ? `camera=(), geolocation=(), microphone=(self "${EMBED_ORIGIN}"), payment=(), usb=()`
    : DEFAULT_POLICY;
}

export function musaLivePage(env, user, page) {
  if (!musaLiveEnabled(env)) return page('Pagina non disponibile', '<div class="formbox"><h1>Pagina non disponibile</h1></div>', user, 404);
  const url = validMusaEmbed(env.MUSA_LIVE_EMBED_URL);
  const controls = url ? `<label class="legal-check"><input type="checkbox" id="musa-consent"><span>Voglio avviare la prova vocale con LiveAvatar.</span></label>
    <div class="actions"><button class="button" id="musa-start" disabled>Inizia la prova con la Musa</button><button class="button secondary" id="musa-stop" hidden>Chiudi la prova</button></div>
    <p id="musa-status" role="status" aria-live="polite">La Musa è pronta quando lo sei tu.</p>
    <div id="musa-video" data-embed="${url.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></div>
    <p class="small muted" id="musa-help" hidden>Consenti il microfono nel browser e segui il pulsante di avvio nel riquadro. Se il riquadro resta vuoto o la connessione cade, chiudi la prova e riprova. La pagina non può verificare lo stato della conversazione dentro LiveAvatar.</p>
    <noscript><p>Attiva JavaScript per avviare la Musa.</p></noscript>` : '<p role="status">Il collegamento della Musa non è ancora configurato. La prova sarà disponibile dopo la configurazione.</p>';
  const response = page('La Musa in video', `<section class="studio alt"><div class="wrap" style="max-width:1000px"><a href="/admin">← Dashboard</a><p class="eyebrow">Splendoria · Prova riservata</p><h1>La tua storia, a voce.</h1><p class="lead">Incontra la Musa</p><article class="card"><h2>Una domanda alla volta, con il tuo ritmo.</h2><p>Alessandra è l’avatar AI della Musa: ti ascolta e ti aiuta a raccontare un ricordo, in italiano.</p><p><strong>Prova fino a 2 minuti.</strong> Audio e risposte vengono gestiti da LiveAvatar. Questa prova non salva la trascrizione in Splendoria e non aggiorna il tuo libro.</p>${controls}</article></div></section>
    <style>#musa-video:empty{display:none}#musa-video{margin-top:24px}#musa-video iframe{display:block;width:100%;aspect-ratio:16/9;min-height:360px;border:0;border-radius:18px;background:#102d29}#musa-stop[hidden],#musa-help[hidden]{display:none}@media(max-width:600px){#musa-video iframe{min-height:440px}.studio h1{font-size:38px}}</style>
    ${url ? `<script>
    (() => {
      const consent = document.getElementById('musa-consent');
      const start = document.getElementById('musa-start');
      const stop = document.getElementById('musa-stop');
      const video = document.getElementById('musa-video');
      const status = document.getElementById('musa-status');
      const help = document.getElementById('musa-help');
      let timer;
      function close(message) {
        clearTimeout(timer);
        video.replaceChildren();
        stop.hidden = true;
        help.hidden = true;
        consent.disabled = false;
        start.disabled = !consent.checked;
        status.textContent = message;
      }
      consent.addEventListener('change', () => { start.disabled = !consent.checked; });
      start.addEventListener('click', () => {
        if (!consent.checked || video.childElementCount) return;
        start.disabled = true;
        consent.disabled = true;
        const frame = document.createElement('iframe');
        frame.title = 'La Musa di Splendoria — prova vocale';
        frame.allow = 'microphone';
        frame.referrerPolicy = 'no-referrer';
        frame.src = video.dataset.embed;
        video.append(frame);
        stop.hidden = false;
        help.hidden = false;
        status.textContent = 'Riquadro aperto. Avvia la conversazione al suo interno. La finestra si chiude dopo 3 minuti; la conversazione dura al massimo 2 minuti.';
        timer = setTimeout(() => close('La finestra di prova è stata chiusa. Puoi avviare una nuova prova.'), 180000);
        stop.focus();
      });
      stop.addEventListener('click', () => { close('Prova chiusa. Puoi ricominciare quando vuoi.'); start.focus(); });
      window.addEventListener('pagehide', () => close('Prova chiusa.'));
    })();
    </script>` : ''}`, user);
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'private, no-store');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('content-security-policy', `frame-src ${EMBED_ORIGIN}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`);
  return new Response(response.body, { status: response.status, headers });
}
