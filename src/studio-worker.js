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
.studio-editor-page .spl-section-actions{display:flex;justify-content:flex-end;margin-top:12px} /* spl-section-muse-v1 */
.studio-editor-page .spl-section-muse{min-height:42px;padding:10px 16px;font-size:14px!important}
@media(max-width:700px){.studio-editor-page .spl-section-actions{justify-content:stretch}.studio-editor-page .spl-section-muse{width:100%}}
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
    const sectionTarget = 350;
    const requiredMuseWords = 20;
    const parts = balancedSplit(original.value);

    const readiness = document.createElement('p');
    readiness.className = 'spl-muse-readiness';
    readiness.innerHTML = '<strong>Prima di usare la Musa:</strong> per un capitolo di circa 1.000 parole servono almeno <b>20</b> parole di spunto. Se sono di più è meglio: la Musa userà i dettagli disponibili per scrivere circa 350 parole per ciascuna delle tre sezioni.';
    originalLabel.insertAdjacentElement('beforebegin', readiness);

    const editor = document.createElement('div');
    editor.className = 'spl-sectioned-editor';
    const labels = [
      ['1. Introduzione', 'Apri la scena: dove siamo, chi c’è, che cosa sta per accadere.'],
      ['2. Svolgimento', 'Racconta fatti, azioni, dialoghi, svolte e conseguenze.'],
      ['3. Chiusura', 'Chiudi il movimento narrativo: cosa cambia, cosa resta, dove porta.']
    ];
    const sectionAreas = [];
    const sectionHiddenInputs = [];
    const chapterMuseButton = form.querySelector('.muse-draft-button[formaction*="/genera"]');
    const chapterMuseAction = chapterMuseButton ? chapterMuseButton.formAction : form.action.replace(/\/salva$/, '/genera');
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
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'museSection' + index;
      hidden.value = area.value;
      form.append(hidden);
      sectionHiddenInputs.push(hidden);
      area.addEventListener('input', () => { hidden.value = area.value; });
      const sectionActions = document.createElement('div');
      sectionActions.className = 'spl-section-actions';
      const sectionMuse = document.createElement('button');
      sectionMuse.type = 'submit';
      sectionMuse.className = 'button secondary muse-draft-button spl-section-muse';
      sectionMuse.name = 'museSection';
      sectionMuse.value = String(index);
      sectionMuse.formAction = chapterMuseAction;
      sectionMuse.formNoValidate = true;
      sectionMuse.textContent = 'Affidati alla Musa per questa sezione';
      sectionActions.append(sectionMuse);
      card.append(sectionActions);
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
      sectionAreas.forEach((area, index) => { area.value = nextParts[index] || ''; if (sectionHiddenInputs[index]) sectionHiddenInputs[index].value = area.value; });
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
      if (isChapterAi) {
  const autosaveUrl = pathname.replace(/\/(?:genera|rifinisci)$/, '/autosalva');
  const title = form.querySelector('[name="title"]')?.value || '';
  const content = form.querySelector('[name="content"]')?.value || '';
  const saveResponse = await fetch(autosaveUrl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Splendoria-Preflight': '1' },
    body: JSON.stringify({ title, content })
  });
  if (!saveResponse.ok) throw new Error('save_failed');
}
      bypass.add(form);
      if (submitter) submitter.disabled = false;
      form.requestSubmit(submitter || undefined);
    } catch (error) {
      if (submitter) submitter.disabled = false;
      flash('Non sono riuscita a salvare in sicurezza ciò che hai scritto. Le tue parole restano qui: riprova tra un momento.', true);
    }


  }, true);

  const SPL_CLIENT_DRAFT_TTL_MS = 365 * 24 * 60 * 60 * 1000;
  const SPL_CLIENT_DRAFT_PREFIX = 'splendoria:client-draft:v1:';
  const SPL_CLIENT_DRAFT_KEY = SPL_CLIENT_DRAFT_PREFIX + window.location.pathname;
  const SPL_CLIENT_DRAFT_SCOPE = '.studio-editor-page';
  const splDraftRoot = document.querySelector('.studio');

  const splFieldAllowed = field => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return false;
    if (!splDraftRoot || !splDraftRoot.contains(field)) return false;
    const type = String(field.type || '').toLowerCase();
    const name = String(field.name || '').toLowerCase();
    const autocomplete = String(field.autocomplete || '').toLowerCase();
    if (['password', 'file', 'hidden', 'submit', 'button', 'reset'].includes(type)) return false;
    if (/(?:pass|password|token|session|csrf|secret|otp|one.?time)/i.test(name + ' ' + autocomplete)) return false;
    if (type === 'email' || name === 'email') return false;
    return Boolean(field.name || field.id);
  };

  const splFieldKey = field => {
    const form = field.form;
    let formPath = window.location.pathname;
    if (form && form.action) {
      try { formPath = new URL(form.action, window.location.href).pathname; } catch {}
    }
    return formPath + '::' + (field.name ? 'name:' + field.name : 'id:' + field.id);
  };

  const splFieldValue = field => {
    if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) return Boolean(field.checked);
    return String(field.value ?? '');
  };

  const splApplyFieldValue = (field, value) => {
    if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) field.checked = Boolean(value);
    else field.value = String(value ?? '');
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const splReadDraft = () => {
    try {
      const raw = localStorage.getItem(SPL_CLIENT_DRAFT_KEY);
      if (!raw) return { version: 1, expiresAt: Date.now() + SPL_CLIENT_DRAFT_TTL_MS, fields: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.fields || Number(parsed.expiresAt || 0) <= Date.now()) {
        localStorage.removeItem(SPL_CLIENT_DRAFT_KEY);
        return { version: 1, expiresAt: Date.now() + SPL_CLIENT_DRAFT_TTL_MS, fields: {} };
      }
      return parsed;
    } catch {
      return { version: 1, expiresAt: Date.now() + SPL_CLIENT_DRAFT_TTL_MS, fields: {} };
    }
  };

  let splDraft = splReadDraft();
  const splInitial = new Map();
  const splFields = () => [...document.querySelectorAll('input,textarea,select')].filter(splFieldAllowed);

  splFields().forEach(field => {
    const key = splFieldKey(field);
    const serverValue = splFieldValue(field);
    splInitial.set(key, serverValue);
    const saved = splDraft.fields[key];
    if (!saved) return;
    if (serverValue === saved.value) {
      saved.base = serverValue;
      return;
    }
    if (serverValue === saved.base) splApplyFieldValue(field, saved.value);
  });

  let splDraftTimer = 0;
  const splSaveDraft = field => {
    if (!splFieldAllowed(field)) return;
    const key = splFieldKey(field);
    const current = splFieldValue(field);
    const previous = splDraft.fields[key];
    const base = previous ? previous.base : (splInitial.has(key) ? splInitial.get(key) : current);
    splDraft.fields[key] = { value: current, base, savedAt: Date.now() };
    splDraft.expiresAt = Date.now() + SPL_CLIENT_DRAFT_TTL_MS;
    splDraft.updatedAt = Date.now();
    window.clearTimeout(splDraftTimer);
    splDraftTimer = window.setTimeout(() => {
      try { localStorage.setItem(SPL_CLIENT_DRAFT_KEY, JSON.stringify(splDraft)); } catch {}
    }, 220);
  };

  if (splDraftRoot) {
    splDraftRoot.addEventListener('input', event => splSaveDraft(event.target), { passive: true });
    splDraftRoot.addEventListener('change', event => splSaveDraft(event.target), { passive: true });
    window.addEventListener('pagehide', () => {
      window.clearTimeout(splDraftTimer);
      try { localStorage.setItem(SPL_CLIENT_DRAFT_KEY, JSON.stringify(splDraft)); } catch {}
    });
    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      navigator.storage.persist().catch(() => {});
    }
  }
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


const SPL_PRIVACY_CENTER_PAGES = {
  '/privacy-policy': `<section class="legal-page"><header class="legal-hero"><div class="legal-reading"><p class="eyebrow">Protezione dei dati personali</p><h1>Privacy Policy</h1><p>Informativa ai sensi degli articoli 12 e 13 del Regolamento (UE) 2016/679. Abbiamo scelto di raccontare in modo semplice che cosa trattiamo, perché e per quanto tempo.</p><p class="legal-updated">Ultimo aggiornamento: 29 agosto 2026</p></div></header><div class="legal-content"><div class="legal-reading">
<section><h2>1. Titolare del trattamento</h2><p>Il Titolare è <strong>AI Arena di Raoul Ragazzi</strong>, Partita IVA 02950290219, Via Goethe 42, Merano e Via Settala 1, Milano. Per privacy, esercizio dei diritti o segnalazioni: <a href="mailto:contatti@splendoria.vip">contatti@splendoria.vip</a>.</p></section>
<section><h2>2. Quali dati trattiamo</h2><ul><li>dati di account, contatto, autenticazione e sicurezza;</li><li>richieste commerciali, ordini e dati amministrativi;</li><li>ricordi, interviste, capitoli, materiali e preferenze editoriali inseriti dall’utente;</li><li>dati tecnici necessari a proteggere il servizio;</li><li>copie locali delle bozze salvate nel browser, sul dispositivo dell’utente, per proteggerle da perdite accidentali.</li></ul><p>Splendoria non vende dati personali e non li usa per pubblicità comportamentale o profilazione commerciale.</p></section>
<section><h2>3. Finalità e basi giuridiche</h2><div class="legal-table-wrap"><table><thead><tr><th>Finalità</th><th>Base giuridica</th></tr></thead><tbody><tr><td>Account, Studio, scrittura, assistenza e consegna del servizio</td><td>Contratto o misure precontrattuali, art. 6.1.b GDPR</td></tr><tr><td>Contatti, preventivi e richieste</td><td>Misure precontrattuali e legittimo interesse a rispondere, artt. 6.1.b e 6.1.f</td></tr><tr><td>Fatturazione e obblighi amministrativi</td><td>Contratto e obblighi di legge, artt. 6.1.b e 6.1.c</td></tr><tr><td>Sicurezza, prevenzione abusi e tutela dei diritti</td><td>Legittimo interesse, art. 6.1.f</td></tr><tr><td>Funzioni della Musa e strumenti IA richiesti dall’utente</td><td>Esecuzione del servizio, art. 6.1.b; consenso esplicito quando siano necessari dati particolari dell’utente, art. 9.2.a</td></tr></tbody></table></div></section>
<section><h2>4. Ricordi sensibili e dati di altre persone</h2><p>Una storia personale può contenere dati particolari, ad esempio salute, convinzioni religiose o politiche, origine etnica, vita o orientamento sessuale. L’utente decide che cosa raccontare e deve limitarsi a ciò che è pertinente. Quando inserisce informazioni, fotografie o documenti riguardanti terzi, deve poterli utilizzare lecitamente e rispettarne dignità, riservatezza e diritti.</p></section>
<section><h2>5. Intelligenza artificiale e controllo umano</h2><p>Le funzioni chiamate “Musa” usano sistemi di intelligenza artificiale per formulare domande, organizzare materiale, generare bozze e proporre revisioni. L’utente viene informato dell’interazione con l’IA, può modificare o rifiutare ogni output e mantiene il controllo dell’opera. Non vengono adottate decisioni esclusivamente automatizzate con effetti giuridici o analogamente significativi sulla persona. Maggiori dettagli sono disponibili nella <a href="/trasparenza-ai">pagina Trasparenza IA</a>.</p></section>
<section><h2>6. Copia di sicurezza nel browser</h2><p>Nello Studio, testi e campi editoriali possono essere conservati anche nel <strong>local storage del dispositivo fino a 365 giorni dall’ultima modifica</strong>. Questa copia è tecnica, resta sul browser e non viene inviata automaticamente a Splendoria. Password, token, sessioni, email e file non vengono inclusi. Il browser o l’utente possono cancellarla in qualsiasi momento.</p></section>
<section><h2>7. Destinatari e trasferimenti</h2><p>I dati possono essere trattati, nei limiti necessari, da fornitori di infrastruttura cloud, database, sicurezza, email e IA, da professionisti autorizzati per revisione e lavorazione editoriale, da consulenti e dalle autorità quando previsto dalla legge. Quando un trattamento comporta trasferimenti fuori dallo Spazio Economico Europeo, sono utilizzati gli strumenti previsti dal Capo V GDPR, come decisioni di adeguatezza o clausole contrattuali standard.</p></section>
<section><h2>8. Conservazione</h2><p>Account e progetti sono conservati per la durata del rapporto e, quando necessario, per i successivi termini di legge o di tutela dei diritti. Le sessioni durano al massimo 30 giorni; i link di recupero password 30 minuti; eventi tecnici di sicurezza e audit fino a 365 giorni. La copia locale delle bozze ha una durata applicativa massima di 365 giorni dall’ultima modifica, salvo cancellazione anticipata dal browser.</p></section>
<section><h2>9. Sicurezza</h2><p>Splendoria applica misure tecniche e organizzative proporzionate: connessioni cifrate, password derivate crittograficamente, cookie di sessione HttpOnly e Secure, separazione degli accessi, limitazione dei tentativi e registrazione degli eventi critici. I contenuti editoriali sono trattati secondo principi di minimizzazione e riservatezza.</p></section>
<section><h2>10. Diritti</h2><p>L’interessato può chiedere accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e revoca del consenso quando applicabili, scrivendo a <a href="mailto:contatti@splendoria.vip">contatti@splendoria.vip</a>. La risposta avviene senza ingiustificato ritardo e di regola entro un mese. È sempre possibile proporre reclamo al <strong>Garante per la protezione dei dati personali</strong>.</p></section>
<section><h2>11. Minori e aggiornamenti</h2><p>Il servizio è destinato a persone maggiorenni. I dati riguardanti minori devono essere inseriti solo quando l’utente ne sia legittimato e nella misura strettamente necessaria. Questa informativa viene aggiornata quando cambiano il servizio, i fornitori o la normativa applicabile.</p></section>
</div></div></section>`,
  '/cookie-policy': `<section class="legal-page"><header class="legal-hero"><div class="legal-reading"><p class="eyebrow">Cookie e tecnologie locali</p><h1>Cookie Policy</h1><p>Splendoria usa soltanto strumenti tecnici necessari al servizio. Niente advertising, niente profilazione, niente tracker sociali.</p><p class="legal-updated">Ultimo aggiornamento: 29 agosto 2026</p></div></header><div class="legal-content"><div class="legal-reading">
<section><h2>1. In breve</h2><p>I cookie sono piccoli identificatori conservati dal browser. Tecnologie analoghe, come il local storage, possono ricordare preferenze o bozze direttamente sul dispositivo. Gli strumenti tecnici necessari possono essere usati senza consenso preventivo; per eventuali strumenti non tecnici Splendoria chiederà prima un consenso libero, specifico e revocabile.</p></section>
<section><h2>2. Strumenti utilizzati</h2><div class="legal-table-wrap"><table><thead><tr><th>Nome</th><th>Tipo e finalità</th><th>Durata</th></tr></thead><tbody><tr><td><code>spl_session</code></td><td>Cookie tecnico di prima parte. Mantiene l’accesso all’account e protegge la sessione; HttpOnly, Secure e SameSite=Lax.</td><td>Massimo 30 giorni; eliminato al logout</td></tr><tr><td><code>splendoria-voice-language</code></td><td>Local storage tecnico. Ricorda la lingua scelta per la dettatura.</td><td>Fino a modifica o cancellazione dal browser</td></tr><tr><td><code>splendoria-cookie-notice-v2</code></td><td>Local storage tecnico. Ricorda che l’informativa breve è stata chiusa.</td><td>Fino alla prossima versione sostanziale o cancellazione dal browser</td></tr><tr><td><code>splendoria:client-draft:v1:&lt;pagina&gt;</code></td><td>Local storage tecnico. Copia di sicurezza locale dei campi editoriali dello Studio. Non include password, token, sessioni, email o file e non viene inviata automaticamente al server.</td><td>Fino a 365 giorni dall’ultima modifica</td></tr></tbody></table></div></section>
<section><h2>3. Perché non chiediamo “Accetta tutto”</h2><p>Nella configurazione attuale non esistono cookie pubblicitari, di profilazione o analytics di terze parti. Chiedere un consenso per tracker inesistenti sarebbe inutile e poco trasparente. Il piccolo banner serve quindi solo a informare. Se in futuro verranno introdotti strumenti non tecnici, resteranno disattivati fino a una scelta preventiva dell’utente, con possibilità equivalente di rifiutare o accettare.</p></section>
<section><h2>4. Copie locali delle bozze</h2><p>Per ridurre il rischio di perdita accidentale, lo Studio può mantenere sul dispositivo una copia locale dei testi e dei campi editoriali fino a 12 mesi. Splendoria chiede al browser, quando disponibile, di trattare questo spazio come persistente; il browser mantiene comunque il controllo e può eliminarlo per impostazioni dell’utente, modalità privata o necessità di spazio.</p></section>
<section><h2>5. Come gestire cookie e dati locali</h2><p>Dal browser è possibile eliminare cookie e local storage in qualsiasi momento. La cancellazione di <code>spl_session</code> comporta la disconnessione; la cancellazione delle bozze locali non elimina la versione eventualmente già salvata sui server Splendoria. Le autorizzazioni del microfono e della dettatura si gestiscono separatamente nelle impostazioni del browser.</p></section>
<section><h2>6. Nessun tracciamento incrociato</h2><p>Splendoria non usa gli strumenti sopra indicati per creare profili pubblicitari, seguire l’utente su siti diversi o incrociare la navigazione tra dispositivi a fini commerciali.</p></section>
<section><h2>7. Titolare e diritti</h2><p>Titolare: AI Arena di Raoul Ragazzi, Partita IVA 02950290219, Via Goethe 42, Merano e Via Settala 1, Milano. Contatto: <a href="mailto:contatti@splendoria.vip">contatti@splendoria.vip</a>. Per finalità, basi giuridiche, destinatari e diritti si rinvia alla <a href="/privacy-policy">Privacy Policy</a>.</p></section>
</div></div></section>`
};

function splPatchPrivacyCenterPage(html, pathname) {
  const body = SPL_PRIVACY_CENTER_PAGES[pathname];
  if (!body) return html;
  return html.replace(/<main id="main-content" tabindex="-1">[\s\S]*?<\/main>/i, `<main id="main-content" tabindex="-1">${body}</main>`);
}

async function patchedFetch(request, env, ctx) {
  const url = new URL(request.url);
  const response = await baseWorker.fetch(request, env, ctx);
  const contentType = response.headers.get('content-type') || '';


  if ((url.pathname === '/privacy-policy' || url.pathname === '/cookie-policy') && contentType.includes('text/html')) {
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'no-cache');
    return new Response(splPatchPrivacyCenterPage(html, url.pathname), { status: response.status, statusText: response.statusText, headers });
  }


  const isLongLivedAsset = request.method === 'GET' && (
    /^\/assets\/(?:gentium-book-plus|eb-garamond)-.+\.woff2$/i.test(url.pathname) ||
    url.pathname === '/favicon.svg' || url.pathname === '/favicon.ico'
  );
  const isImageAsset = request.method === 'GET' && /^\/assets\/.+\.(?:webp|png|jpe?g|svg)$/i.test(url.pathname);
  if ((isLongLivedAsset || isImageAsset) && response.ok) {
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    if (isLongLivedAsset) {
      headers.set('cache-control', 'public, max-age=31536000, immutable');
      headers.set('cdn-cache-control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('cache-control', 'public, max-age=2592000, stale-while-revalidate=604800');
      headers.set('cdn-cache-control', 'public, max-age=2592000, stale-while-revalidate=604800');
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }


  if (url.pathname === '/' && contentType.includes('text/html')) {
    const html = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1" data-spl-mobile-viewport-patch>';
    const patched = /<meta\s+name=["']viewport["']/i.test(html) ? html : html.replace(/<head([^>]*)>/i, '<head$1>' + viewport);
    return new Response(patched, { status: response.status, statusText: response.statusText, headers });
  }

  if (url.pathname === '/assets/studio.js' && contentType.includes('javascript')) {
    const source = await response.text();
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('cdn-cache-control', 'public, max-age=31536000, immutable');
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
