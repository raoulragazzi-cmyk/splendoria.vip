import baseWorker from "./worker.js";

const STUDIO_CSS = `
/* Splendoria Studio patch — handwritten QA notes 2026-08-27 */
.studio-editor-page .studio > .wrap{width:min(1780px,calc(100vw - 32px));max-width:none}
.studio-editor-page .writing-shell{grid-template-columns:minmax(0,1fr)!important}
.studio-editor-page .muse-horizontal{width:100%!important}
.studio-editor-page .writing-main{min-width:0;width:100%}
.studio-editor-page .wow-panel,.studio-editor-page .chapter-card{width:100%}
.studio-editor-page .studio :where(h1,h2,h3,h4,h5){font-family:var(--font-editorial)!important;letter-spacing:-.015em}
.studio-editor-page .studio h1{font-size:clamp(42px,4.3vw,66px)!important;line-height:1.02}
.studio-editor-page .studio h2{font-size:clamp(31px,3vw,44px)!important;line-height:1.08}
.studio-editor-page .studio h3{font-size:clamp(25px,2.35vw,34px)!important;line-height:1.12}
.studio-editor-page .studio h4{font-size:clamp(21px,1.8vw,26px)!important;line-height:1.2}
.studio-editor-page .studio :where(p,li,label,input,select,textarea,button){font-family:var(--font-ui)}
.studio-editor-page .live-page-copy p{white-space:pre-line}
.studio-editor-page .spl-story-ideas{display:flex;flex-wrap:wrap;gap:8px;margin:-6px 0 18px;padding:14px 16px;border:1px solid #d8e7e1;border-radius:16px;background:#f7fbf9}
.studio-editor-page .spl-story-ideas strong{width:100%;font-size:15px;color:#355c53}
.studio-editor-page .spl-story-idea{display:inline-flex;align-items:center;min-height:34px;padding:6px 11px;border:1px solid #bfd7cf;border-radius:999px;background:#fff;color:#24564e;font-size:14px;font-weight:750}
.studio-editor-page .spl-muse-readiness{margin:12px 0 18px;padding:15px 17px;border:1px solid #c7ded6;border-left:5px solid #0b746b;border-radius:14px;background:#f3faf7;color:#355c53;font-size:15px;line-height:1.5}
.studio-editor-page .spl-muse-readiness strong{color:#075d56}
.studio-editor-page .spl-sectioned-editor{grid-column:1;display:grid;gap:16px;margin:0 0 18px}
.studio-editor-page .spl-section-card{border:1px solid #cddfd9;border-radius:18px;padding:18px;background:#fbfdfc;box-shadow:0 8px 24px rgba(16,45,41,.045)}
.studio-editor-page .spl-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:10px}
.studio-editor-page .spl-section-title{margin:0!important;font-size:23px!important;color:#153f37}
.studio-editor-page .spl-section-meta{flex:0 0 auto;color:#60766f;font-size:14px;font-weight:750;text-align:right}
.studio-editor-page .spl-section-card textarea{width:100%;min-height:260px;resize:vertical;padding:18px 20px;border:1px solid #bfd4cd;border-radius:14px;background:#fff;color:var(--ink);font:400 var(--studio-type-reading)/1.7 var(--font-editorial)!important}
.studio-editor-page .spl-section-card.is-over-limit{border-color:#c8913a;background:#fffaf0}
.studio-editor-page .spl-section-card.is-over-limit .spl-section-meta{color:#8a6226}
.studio-editor-page .spl-original-chapter-field{display:none!important}
.studio-editor-page .spl-delete-at-bottom{margin-top:34px!important}
.studio-editor-page .spl-action-message{position:fixed;right:22px;bottom:22px;z-index:80;max-width:min(430px,calc(100vw - 44px));padding:14px 17px;border:1px solid #c8ded6;border-radius:14px;background:#fff;color:#153f37;box-shadow:0 18px 50px rgba(16,45,41,.18);font-size:15px;font-weight:700}
.studio-editor-page .spl-action-message.is-error{border-color:#e1b8b0;color:#8a3027}
@media(max-width:900px){
  .studio-editor-page .studio > .wrap{width:calc(100vw - 20px)}
  .studio-editor-page .spl-section-head{display:block}
  .studio-editor-page .spl-section-meta{margin-top:5px;text-align:left}
  .studio-editor-page .spl-section-card textarea{min-height:220px}
}
`;

const STUDIO_JS_PATCH = String.raw`
;(() => {
  if (!document.body || !document.body.classList.contains('studio-editor-page')) return;
  if (document.documentElement.dataset.splNotesPatch === '1') return;
  document.documentElement.dataset.splNotesPatch = '1';

  const wordCount = value => (String(value || '').trim().match(/\S+/g) || []).length;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const canonicalMatch = window.location.pathname.match(/^\/libro\/([^/]+)/);
  const bookId = canonicalMatch ? canonicalMatch[1] : '';

  const flash = (text, isError) => {
    let box = document.querySelector('.spl-action-message');
    if (!box) {
      box = document.createElement('div');
      box.className = 'spl-action-message';
      box.setAttribute('role', 'status');
      document.body.append(box);
    }
    box.classList.toggle('is-error', Boolean(isError));
    box.textContent = text;
    window.clearTimeout(flash._timer);
    flash._timer = window.setTimeout(() => box.remove(), isError ? 6500 : 2200);
  };

  const writingShell = document.querySelector('.writing-shell');
  const muse = writingShell && writingShell.querySelector('.muse');
  if (writingShell && muse) {
    muse.classList.add('muse-horizontal');
    if (writingShell.firstElementChild !== muse) writingShell.prepend(muse);
  }

  const projectForm = document.querySelector('form.wow-panel[action$="/salva"]');
  if (projectForm) {
    const story = projectForm.querySelector('textarea[name="story"]');
    const sourcePanel = projectForm.querySelector('.source-material-panel');
    const storyLabel = story && story.closest('label.field');
    const storyTools = storyLabel && storyLabel.nextElementSibling && storyLabel.nextElementSibling.classList.contains('field-tools') ? storyLabel.nextElementSibling : null;
    if (storyLabel && sourcePanel && sourcePanel.parentElement === projectForm) {
      projectForm.insertBefore(storyLabel, sourcePanel);
      if (storyTools) projectForm.insertBefore(storyTools, sourcePanel);
    }

    if (storyLabel && !projectForm.querySelector('.spl-story-ideas')) {
      const ideas = document.createElement('div');
      ideas.className = 'spl-story-ideas';
      ideas.innerHTML = '<strong>Se non sai da dove partire, puoi raccontare:</strong>' +
        ['Infanzia','Famiglia','Scuola','Primo amore','Amicizie','Lavoro','Incontri decisivi','Viaggi','Svolte','Perdite','Conquiste','Persone che ti hanno cambiato'].map(item => '<span class="spl-story-idea">' + item + '</span>').join('');
      storyLabel.insertAdjacentElement('afterend', ideas);
    }
  }

  const deletePanel = document.querySelector('.book-delete-panel, [data-book-delete], form[action$="/elimina"]')?.closest('.book-delete-panel, .card, section, div');
  const studioWrap = document.querySelector('.studio > .wrap');
  if (deletePanel && studioWrap && !deletePanel.classList.contains('spl-delete-at-bottom')) {
    deletePanel.classList.add('spl-delete-at-bottom');
    studioWrap.append(deletePanel);
  }

  const balancedSplit = raw => {
    const text = String(raw || '').replace(/\r/g, '').trim();
    if (!text) return ['', '', ''];
    let units = text.split(/\n{2,}/).map(v => v.trim()).filter(Boolean);
    if (units.length < 3) {
      const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
      if (sentences && sentences.length >= 3) units = sentences.map(v => v.trim()).filter(Boolean);
    }
    if (units.length < 3) {
      const words = text.split(/\s+/);
      const one = Math.max(1, Math.ceil(words.length / 3));
      return [words.slice(0, one).join(' '), words.slice(one, one * 2).join(' '), words.slice(one * 2).join(' ')];
    }
    const total = units.reduce((sum, unit) => sum + wordCount(unit), 0);
    const target = Math.max(1, total / 3);
    const groups = [[], [], []];
    let group = 0;
    let used = 0;
    units.forEach((unit, index) => {
      const remainingUnits = units.length - index;
      const remainingGroups = 3 - group;
      if (group < 2 && groups[group].length && used >= target && remainingUnits >= remainingGroups) {
        group += 1;
        used = 0;
      }
      groups[group].push(unit);
      used += wordCount(unit);
    });
    return groups.map(groupUnits => groupUnits.join('\n\n'));
  };

  document.querySelectorAll('form.chapter-compose-form[data-live-chapter]').forEach((form, formIndex) => {
    if (form.dataset.splSectioned === '1') return;
    const original = form.querySelector('textarea[name="content"]');
    const originalLabel = original && original.closest('.chapter-writing-field');
    if (!original || !originalLabel) return;
    form.dataset.splSectioned = '1';
    originalLabel.classList.add('spl-original-chapter-field');

    const targetLine = form.closest('.chapter-card')?.querySelector('.chapter-head .small.muted')?.textContent || '';
    const targetMatch = targetLine.match(/([\d.\s]+)\s*parole/i);
    const chapterTarget = targetMatch ? Number(targetMatch[1].replace(/\D/g, '')) : 1800;
    const sectionTarget = Math.max(100, Math.round(chapterTarget / 3));
    const requiredMuseWords = clamp(Math.round(chapterTarget * .24), 260, 460);
    const parts = balancedSplit(original.value);

    const readiness = document.createElement('p');
    readiness.className = 'spl-muse-readiness';
    readiness.innerHTML = '<strong>Prima di usare la Musa:</strong> per un capitolo completo servono circa <b>' + requiredMuseWords + '</b> parole di ricordi concreti e vari nel progetto/intervista (date, luoghi, persone, azioni e conseguenze). Scrivere 20 parole nel capitolo non basta ancora: questo limite evita che l’IA inventi dettagli.';
    originalLabel.insertAdjacentElement('beforebegin', readiness);

    const editor = document.createElement('div');
    editor.className = 'spl-sectioned-editor';
    const labels = [
      ['1. Introduzione', 'Apri la scena: dove siamo, chi c’è, che cosa sta per accadere.'],
      ['2. Svolgimento', 'Racconta fatti, azioni, dialoghi, svolte e conseguenze.'],
      ['3. Chiusura', 'Chiudi il movimento narrativo: cosa cambia, cosa resta, dove porta.']
    ];
    const sectionAreas = [];
    labels.forEach((entry, index) => {
      const card = document.createElement('section');
      card.className = 'spl-section-card';
      const headingId = 'spl-section-' + formIndex + '-' + index;
      card.innerHTML = '<div class="spl-section-head"><div><h4 class="spl-section-title" id="' + headingId + '">' + entry[0] + '</h4><p class="small muted">' + entry[1] + '</p></div><span class="spl-section-meta" data-spl-section-count></span></div>';
      const area = document.createElement('textarea');
      area.id = headingId + '-text';
      area.setAttribute('aria-labelledby', headingId);
      area.value = parts[index] || '';
      area.placeholder = index === 0 ? 'Inizia dalla scena o dal ricordo che apre il capitolo…' : index === 1 ? 'Sviluppa ciò che accade e ciò che cambia…' : 'Porta il capitolo a una conclusione naturale…';
      card.append(area);
      editor.append(card);
      sectionAreas.push(area);
    });
    readiness.insertAdjacentElement('afterend', editor);

    let syncing = false;
    const updateCounters = () => {
      sectionAreas.forEach(area => {
        const count = wordCount(area.value);
        const card = area.closest('.spl-section-card');
        const meta = card.querySelector('[data-spl-section-count]');
        meta.textContent = count + ' / circa ' + sectionTarget + ' parole';
        card.classList.toggle('is-over-limit', count > Math.round(sectionTarget * 1.12));
      });
    };
    const syncOriginal = () => {
      syncing = true;
      original.value = sectionAreas.map(area => area.value.trim()).filter(Boolean).join('\n\n');
      original.dispatchEvent(new Event('input', { bubbles: true }));
      syncing = false;
      updateCounters();
    };
    sectionAreas.forEach(area => area.addEventListener('input', syncOriginal));
    original.addEventListener('input', () => {
      if (syncing) return;
      const nextParts = balancedSplit(original.value);
      sectionAreas.forEach((area, index) => { area.value = nextParts[index] || ''; });
      updateCounters();
    });
    updateCounters();

    const voiceButton = form.querySelector('[data-voice-target]');
    sectionAreas.forEach(area => area.addEventListener('focus', () => {
      if (voiceButton) voiceButton.dataset.voiceTarget = area.id;
    }));
  });

  const bypass = new WeakSet();
  const projectAutosaveUrl = bookId ? '/libro/' + bookId + '/autosalva-progetto' : '';
  const interviewForm = document.querySelector('form.interview[action$="/risposte"]');
  const safeFetch = async (url, form) => {
    if (!url || !form) return;
    const response = await fetch(url, { method: 'POST', body: new FormData(form), credentials: 'same-origin', headers: { 'X-Splendoria-Preflight': '1' } });
    if (!response.ok) throw new Error('save_failed');
  };

  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (bypass.has(form)) { bypass.delete(form); return; }
    const submitter = event.submitter;
    const action = (submitter && submitter.formAction) || form.action || '';
    const pathname = (() => { try { return new URL(action, location.href).pathname; } catch { return ''; } })();
    const isProjectAi = /\/libro\/[^/]+\/(?:migliora|affidati)$/.test(pathname);
    const isInterviewAi = /\/libro\/[^/]+\/risposte\/(?:migliora|affidati)$/.test(pathname);
    const isQuestionRefresh = /\/libro\/[^/]+\/intervista$/.test(pathname);
    const isOutline = /\/libro\/[^/]+\/struttura$/.test(pathname);
    const isChapterAi = /\/libro\/[^/]+\/capitolo\/[^/]+\/(?:genera|rifinisci)$/.test(pathname);
    if (!isProjectAi && !isInterviewAi && !isQuestionRefresh && !isOutline && !isChapterAi) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (submitter) submitter.disabled = true;
    flash('Metto al sicuro le tue parole…');
    try {
      if (projectForm && (isProjectAi || isQuestionRefresh || isOutline)) await safeFetch(projectAutosaveUrl, projectForm);
      if (interviewForm && (isInterviewAi || isQuestionRefresh || isOutline)) await safeFetch(interviewForm.action, interviewForm);
      if (isChapterAi) await safeFetch(form.action, form);
      bypass.add(form);
      if (submitter) submitter.disabled = false;
      form.requestSubmit(submitter || undefined);
    } catch (error) {
      if (submitter) submitter.disabled = false;
      flash('Non sono riuscita a salvare in sicurezza ciò che hai scritto. Le tue parole restano qui: riprova tra un momento.', true);
    }
  }, true);
})();
`;

function patchStudioScript(source) {
  const oldGuard = "if (/^\\\\/libro\\\\/[^/]+$/.test(window.location.pathname)) document.body.classList.add('studio-editor-page');";
  const newGuard = "const _splStudioPath = window.location.pathname; const _splActionMatch = _splStudioPath.match(/^\\/libro\\/([^/]+)\\/(?:migliora|affidati|struttura|intervista|risposte(?:\\/[^/]+)?|capitolo\\/[^/]+\\/(?:genera|rifinisci))$/); if (_splActionMatch) { try { history.replaceState(history.state, '', '/libro/' + _splActionMatch[1]); } catch {} } if (/^\\/libro\\/[^/]+$/.test(window.location.pathname)) document.body.classList.add('studio-editor-page');";
  let patched = source;
  if (patched.includes(oldGuard)) patched = patched.replace(oldGuard, newGuard);
  else {
    patched = patched.replace("document.documentElement.classList.add('js');", "document.documentElement.classList.add('js'); const _splActionMatch = window.location.pathname.match(/^\\/libro\\/([^/]+)\\/(?:migliora|affidati|struttura|intervista|risposte(?:\\/[^/]+)?|capitolo\\/[^/]+\\/(?:genera|rifinisci))$/); if (_splActionMatch) { try { history.replaceState(history.state, '', '/libro/' + _splActionMatch[1]); } catch {} }");
  }
  return patched + "\n" + STUDIO_JS_PATCH;
}

function injectStudioCss(html) {
  if (html.includes('data-splendoria-notes-css')) return html;
  const tag = `<style data-splendoria-notes-css>${STUDIO_CSS}</style>`;
  return html.replace(/<\/head>/i, tag + '</head>');
}

async function patchedFetch(request, env, ctx) {
  const url = new URL(request.url);
  const response = await baseWorker.fetch(request, env, ctx);
  const contentType = response.headers.get('content-type') || '';

  if (url.pathname === '/assets/studio.js' && contentType.includes('javascript')) {
    const source = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'no-store');
    return new Response(patchStudioScript(source), { status: response.status, statusText: response.statusText, headers });
  }

  if (/^\/libro\/[^/]+(?:\/.*)?$/.test(url.pathname) && contentType.includes('text/html')) {
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(injectStudioCss(html), { status: response.status, statusText: response.statusText, headers });
  }

  return response;
}

export default {
  fetch: patchedFetch,
  email(message, env, ctx) {
    return baseWorker.email(message, env, ctx);
  },
  scheduled(controller, env, ctx) {
    return baseWorker.scheduled(controller, env, ctx);
  }
};
