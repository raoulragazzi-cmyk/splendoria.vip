from pathlib import Path

worker_path = Path('src/worker.js')
studio_path = Path('src/studio-worker.js')
worker = worker_path.read_text(encoding='utf-8')
studio = studio_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------------
# 1) Server-side editorial safety: exact section state + previous book version
# ---------------------------------------------------------------------------
outline_anchor = 'async function generateOutline(id, user, env) {'
helpers = r'''let editorialSafetyTablesReady = false;
async function ensureEditorialSafetyTables(env) {
  if (editorialSafetyTablesReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS "BookChapterSection" (chapterId TEXT PRIMARY KEY, projectId TEXT NOT NULL, section0 TEXT NOT NULL DEFAULT '', section1 TEXT NOT NULL DEFAULT '', section2 TEXT NOT NULL DEFAULT '', updatedAt TEXT NOT NULL)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS "BookChapterSection_project_idx" ON "BookChapterSection" (projectId)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS "BookProjectBackup" (id TEXT PRIMARY KEY, projectId TEXT NOT NULL, userId TEXT NOT NULL, snapshotJson TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS "BookProjectBackup_project_idx" ON "BookProjectBackup" (projectId, createdAt DESC)`)
  ]);
  editorialSafetyTablesReady = true;
}
function chapterSectionsFromPayload(data) {
  const hasSections = [0, 1, 2].some((index) => Object.prototype.hasOwnProperty.call(data || {}, `section${index}`));
  if (!hasSections) return null;
  return [0, 1, 2].map((index) => clean(data?.[`section${index}`], 2e4));
}
async function saveChapterSectionState(projectId, chapterId, sections, env) {
  if (!sections) return;
  await ensureEditorialSafetyTables(env);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare(`INSERT INTO "BookChapterSection" (chapterId,projectId,section0,section1,section2,updatedAt) VALUES (?,?,?,?,?,?) ON CONFLICT(chapterId) DO UPDATE SET projectId=excluded.projectId,section0=excluded.section0,section1=excluded.section1,section2=excluded.section2,updatedAt=excluded.updatedAt`).bind(chapterId, projectId, sections[0] || "", sections[1] || "", sections[2] || "", now).run();
}
async function readBookSnapshot(projectId, userId, env) {
  await ensureEditorialSafetyTables(env);
  const project = await env.DB.prepare('SELECT id,userId,title,genre,tone,audience,targetPages,sourceMaterial,story,people,events,message,status,specialDataConsentAt,updatedAt FROM "BookProject" WHERE id=? AND userId=?').bind(projectId, userId).first();
  if (!project) return null;
  const [chapters, interview, sections] = await Promise.all([
    env.DB.prepare('SELECT id,projectId,position,title,content,status,createdAt,updatedAt FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(projectId).all(),
    env.DB.prepare('SELECT projectId,questions,answers,updatedAt FROM "BookInterview" WHERE projectId=?').bind(projectId).first(),
    env.DB.prepare('SELECT chapterId,projectId,section0,section1,section2,updatedAt FROM "BookChapterSection" WHERE projectId=?').bind(projectId).all()
  ]);
  return JSON.stringify({ project, interview: interview || null, chapters: chapters.results || [], sections: sections.results || [] });
}
async function captureBookBackup(projectId, userId, env, { force = false, reason = "autosave" } = {}) {
  await ensureEditorialSafetyTables(env);
  if (!force) {
    const latest = await env.DB.prepare('SELECT createdAt FROM "BookProjectBackup" WHERE projectId=? AND userId=? ORDER BY createdAt DESC LIMIT 1').bind(projectId, userId).first();
    if (latest?.createdAt && Date.now() - Date.parse(latest.createdAt) < 5 * 60 * 1000) return;
  }
  const snapshotJson = await readBookSnapshot(projectId, userId, env);
  if (!snapshotJson) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO "BookProjectBackup" (id,projectId,userId,snapshotJson,reason,createdAt) VALUES (?,?,?,?,?,?)').bind(id, projectId, userId, snapshotJson, clean(reason, 80), now),
    env.DB.prepare('DELETE FROM "BookProjectBackup" WHERE projectId=? AND userId=? AND id NOT IN (SELECT id FROM "BookProjectBackup" WHERE projectId=? AND userId=? ORDER BY createdAt DESC LIMIT 5)').bind(projectId, userId, projectId, userId)
  ]);
}
async function applyBookSnapshot(snapshotJson, projectId, userId, env) {
  const snapshot = JSON.parse(snapshotJson || '{}');
  if (!snapshot?.project || snapshot.project.id !== projectId || snapshot.project.userId !== userId) throw new Error('Snapshot non valido');
  const project = snapshot.project;
  const statements = [
    env.DB.prepare('UPDATE "BookProject" SET title=?,genre=?,tone=?,audience=?,targetPages=?,sourceMaterial=?,story=?,people=?,events=?,message=?,status=?,specialDataConsentAt=?,updatedAt=? WHERE id=? AND userId=?').bind(project.title, project.genre, project.tone, project.audience, project.targetPages, project.sourceMaterial, project.story, project.people, project.events, project.message, project.status, project.specialDataConsentAt, project.updatedAt, projectId, userId),
    env.DB.prepare('DELETE FROM "BookChapterSection" WHERE projectId=?').bind(projectId),
    env.DB.prepare('DELETE FROM "BookChapter" WHERE projectId=?').bind(projectId),
    env.DB.prepare('DELETE FROM "BookInterview" WHERE projectId=?').bind(projectId)
  ];
  for (const chapter of snapshot.chapters || []) statements.push(env.DB.prepare('INSERT INTO "BookChapter" (id,projectId,position,title,content,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)').bind(chapter.id, projectId, chapter.position, chapter.title, chapter.content, chapter.status, chapter.createdAt, chapter.updatedAt));
  if (snapshot.interview) statements.push(env.DB.prepare('INSERT INTO "BookInterview" (projectId,questions,answers,updatedAt) VALUES (?,?,?,?)').bind(projectId, snapshot.interview.questions || '', snapshot.interview.answers || '', snapshot.interview.updatedAt || (/* @__PURE__ */ new Date()).toISOString()));
  for (const section of snapshot.sections || []) statements.push(env.DB.prepare('INSERT INTO "BookChapterSection" (chapterId,projectId,section0,section1,section2,updatedAt) VALUES (?,?,?,?,?,?)').bind(section.chapterId, projectId, section.section0 || '', section.section1 || '', section.section2 || '', section.updatedAt || (/* @__PURE__ */ new Date()).toISOString()));
  await env.DB.batch(statements);
}
async function restoreLastBookVersion(projectId, user, env) {
  if (!user) return redirect('/area-clienti');
  const project = await ownProject(projectId, user, env);
  if (!project) return redirect('/studio');
  await ensureEditorialSafetyTables(env);
  const target = await env.DB.prepare('SELECT id,snapshotJson FROM "BookProjectBackup" WHERE projectId=? AND userId=? ORDER BY createdAt DESC LIMIT 1').bind(projectId, user.id).first();
  if (!target) return redirect(`/libro/${projectId}?e=${encodeURIComponent('Non c’è ancora una versione precedente da ripristinare.')}`);
  const currentSnapshot = await readBookSnapshot(projectId, user.id, env);
  await applyBookSnapshot(target.snapshotJson, projectId, user.id, env);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM "BookProjectBackup" WHERE id=?').bind(target.id),
    env.DB.prepare('INSERT INTO "BookProjectBackup" (id,projectId,userId,snapshotJson,reason,createdAt) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(), projectId, user.id, currentSnapshot, 'pre_restore', now)
  ]);
  return redirect(`/libro/${projectId}?e=${encodeURIComponent('Ultima versione del libro ripristinata. Puoi ripristinare di nuovo per tornare allo stato precedente.')}`);
}
'''
worker = replace_once(worker, outline_anchor, helpers + '\n' + outline_anchor, 'editorial safety helpers')

# ---------------------------------------------------------------------------
# 2) Outline: create once, never delete already-written chapters
# ---------------------------------------------------------------------------
outline_start = '''async function generateOutline(id, user, env) {
  if (!user) return redirect("/area-clienti");
  const p = await ownProject(id, user, env);
  if (!p) return redirect("/studio");
  if (wordCount(museSourceMaterial(p)) < 5) return bookEditor(id, user, env, "Prima inserisci alcuni dati, fatti o ricordi reali e salva le informazioni.");'''
outline_safe = '''async function generateOutline(id, user, env) {
  if (!user) return redirect("/area-clienti");
  const p = await ownProject(id, user, env);
  if (!p) return redirect("/studio");
  await ensureEditorialSafetyTables(env);
  const existing = await env.DB.prepare('SELECT COUNT(*) AS total FROM "BookChapter" WHERE projectId=?').bind(id).first();
  if (Number(existing?.total || 0) > 0) return bookEditor(id, user, env, "L’indice esistente è protetto perché contiene già il tuo lavoro. I capitoli non vengono cancellati o rigenerati automaticamente.");
  if (wordCount(museSourceMaterial(p)) < 5) return bookEditor(id, user, env, "Prima inserisci alcuni dati, fatti o ricordi reali e salva le informazioni.");'''
worker = replace_once(worker, outline_start, outline_safe, 'protect existing outline')
worker = replace_once(worker, "  const statements = [env.DB.prepare('DELETE FROM \"BookChapter\" WHERE projectId=?').bind(id)];", '  const statements = [];', 'remove destructive outline delete')

# ---------------------------------------------------------------------------
# 3) Capture snapshots + persist exact sections on save/autosave
# ---------------------------------------------------------------------------
save_chapter_old = '''  const f = await form(request);
  const title = clean(f.title, 180);
  if (!title) return bookEditor(projectId, user, env, "Inserisci un titolo per il capitolo.", chapterId);
  await env.DB.prepare('UPDATE "BookChapter" SET title=?,content=?,status=?,updatedAt=? WHERE id=? AND projectId=?').bind(title, clean(f.content, 6e4), "modificato", (/* @__PURE__ */ new Date()).toISOString(), chapterId, projectId).run();
  return redirect(`/libro/${projectId}#chapter-card-${chapterId}`);'''
save_chapter_new = '''  const f = await form(request);
  const title = clean(f.title, 180);
  if (!title) return bookEditor(projectId, user, env, "Inserisci un titolo per il capitolo.", chapterId);
  const sections = chapterSectionsFromPayload(f);
  await captureBookBackup(projectId, user.id, env, { force: true, reason: "manual_chapter_save" });
  await env.DB.prepare('UPDATE "BookChapter" SET title=?,content=?,status=?,updatedAt=? WHERE id=? AND projectId=?').bind(title, clean(f.content, 6e4), "modificato", (/* @__PURE__ */ new Date()).toISOString(), chapterId, projectId).run();
  await saveChapterSectionState(projectId, chapterId, sections, env);
  return redirect(`/libro/${projectId}#chapter-card-${chapterId}`);'''
worker = replace_once(worker, save_chapter_old, save_chapter_new, 'save chapter with sections')

autosave_old = '''  const title = clean(data?.title, 180) || chapter.title;
  const content = clean(data?.content, 6e4);
  const savedAt = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare('UPDATE "BookChapter" SET title=?,content=?,status=?,updatedAt=? WHERE id=? AND projectId=?').bind(title, content, "modificato", savedAt, chapterId, projectId).run();
  return jsonResponse({ ok: true, savedAt, words: wordCount(content) });'''
autosave_new = '''  const title = clean(data?.title, 180) || chapter.title;
  const content = clean(data?.content, 6e4);
  const sections = chapterSectionsFromPayload(data);
  const savedAt = (/* @__PURE__ */ new Date()).toISOString();
  await captureBookBackup(projectId, user.id, env, { force: false, reason: "autosave_chapter" });
  await env.DB.prepare('UPDATE "BookChapter" SET title=?,content=?,status=?,updatedAt=? WHERE id=? AND projectId=?').bind(title, content, "modificato", savedAt, chapterId, projectId).run();
  await saveChapterSectionState(projectId, chapterId, sections, env);
  return jsonResponse({ ok: true, savedAt, words: wordCount(content), sectionsSaved: Boolean(sections) });'''
worker = replace_once(worker, autosave_old, autosave_new, 'autosave chapter sections')

save_book_update = '''  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.prepare('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?,sourceMaterial=?,story=?,people=?,events=?,message=?,specialDataConsentAt=COALESCE(specialDataConsentAt,?),updatedAt=? WHERE id=?').bind'''
save_book_repl = '''  const now = (/* @__PURE__ */ new Date()).toISOString();
  await captureBookBackup(id, user.id, env, { force: true, reason: "manual_project_save" });
  await env.DB.prepare('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?,sourceMaterial=?,story=?,people=?,events=?,message=?,specialDataConsentAt=COALESCE(specialDataConsentAt,?),updatedAt=? WHERE id=?').bind'''
worker = replace_once(worker, save_book_update, save_book_repl, 'backup project manual save')

autosave_book_update = '''  const now = (/* @__PURE__ */ new Date()).toISOString(), consentAt = consent ? now : null;
  await env.DB.prepare('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?,sourceMaterial=?,story=?,people=?,events=?,message=?,specialDataConsentAt=COALESCE(specialDataConsentAt,?),updatedAt=? WHERE id=? AND userId=?').bind'''
autosave_book_repl = '''  const now = (/* @__PURE__ */ new Date()).toISOString(), consentAt = consent ? now : null;
  await captureBookBackup(id, user.id, env, { force: false, reason: "autosave_project" });
  await env.DB.prepare('UPDATE "BookProject" SET title=?,tone=?,audience=?,targetPages=?,sourceMaterial=?,story=?,people=?,events=?,message=?,specialDataConsentAt=COALESCE(specialDataConsentAt,?),updatedAt=? WHERE id=? AND userId=?').bind'''
worker = replace_once(worker, autosave_book_update, autosave_book_repl, 'backup project autosave')

# ---------------------------------------------------------------------------
# 4) Musa: explicit 50-word chapter threshold; no prior chapter prose leakage
# ---------------------------------------------------------------------------
gen_prelude_old = '''  const submittedContent = collapseAccidentalRepetitions(clean(submitted.content, 6e4), 6e4);
  const requestedSection = Number.parseInt(String(submitted.museSection ?? ""), 10);
  const sectionMode = Number.isInteger(requestedSection) && requestedSection >= 0 && requestedSection < 3;
  const submittedSections = [0, 1, 2].map((index) => collapseAccidentalRepetitions(clean(submitted[`museSection${index}`], 2e4), 2e4));
  const sourceForCount = museSourceMaterial(project, [], [interview?.answers, submittedContent, sectionMode ? submittedSections[requestedSection] : ""].filter(Boolean).join("\n\n"));
  const sourceWords = wordCount(sourceForCount);
  if (sourceWords < 20) return bookEditor(projectId, user, env, `Per scrivere un capitolo di circa 1.000 parole servono almeno 20 parole di spunto; al momento ne riconosco ${sourceWords}. Aggiungi qualche dettaglio e riprova.`, chapterId);

  const relatedChapters = chapters.results
    .filter((item) => item.id !== chapterId && wordCount(item.content))
    .map((item) => ({ ...item, content: clean(item.content, 1800) }));
  const approvedRelatedChapters = relatedChapters.filter((item) => item.status === "modificato" || item.status === "generato");
  const sourceContext = museContext(project, approvedRelatedChapters, [interview?.answers, submittedContent].filter(Boolean).join("\n\n"));'''
gen_prelude_new = '''  const submittedContent = collapseAccidentalRepetitions(clean(submitted.content, 6e4), 6e4);
  const requestedSection = Number.parseInt(String(submitted.museSection ?? ""), 10);
  const sectionMode = Number.isInteger(requestedSection) && requestedSection >= 0 && requestedSection < 3;
  const submittedSections = [0, 1, 2].map((index) => collapseAccidentalRepetitions(clean(submitted[`section${index}`] ?? submitted[`museSection${index}`], 2e4), 2e4));
  const sourceWords = wordCount(submittedContent);
  if (sourceWords < 50) return bookEditor(projectId, user, env, `Per attivare la Musa in questo capitolo servono almeno 50 parole di spunto complessive nelle tre sezioni; al momento ne hai ${sourceWords}. Non devi scriverne 350: circa 350 è la lunghezza indicativa che la Musa può sviluppare per una singola sezione.`, chapterId);

  // I capitoli precedenti servono per l'indice e la continuità dei titoli, non come prosa da ricopiare.
  const sourceContext = museContext(project, [], [interview?.answers, submittedContent].filter(Boolean).join("\n\n"));'''
worker = replace_once(worker, gen_prelude_old, gen_prelude_new, 'chapter threshold and source isolation')

content_old = '''  const content = collapseAccidentalRepetitions(sectionMode ? submittedSections.map((part, index) => index === requestedSection ? generatedSections[0] : part).join("\n\n") : generatedSections.join("\n\n"), 6e4);
  if (!content.trim()) return bookEditor(projectId, user, env, "La Musa non ha completato la scrittura. Il testo esistente è rimasto intatto: riprova tra un momento.", chapterId);

  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.batch(['''
content_new = '''  const finalSections = sectionMode ? submittedSections.map((part, index) => index === requestedSection ? generatedSections[0] : part) : generatedSections;
  const content = collapseAccidentalRepetitions(finalSections.join("\n\n"), 6e4);
  if (!content.trim()) return bookEditor(projectId, user, env, "La Musa non ha completato la scrittura. Il testo esistente è rimasto intatto: riprova tra un momento.", chapterId);

  await captureBookBackup(projectId, user.id, env, { force: true, reason: sectionMode ? "muse_section" : "muse_chapter" });
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.DB.batch(['''
worker = replace_once(worker, content_old, content_new, 'backup Musa generation')
worker = replace_once(worker, '''  ]);
  await recordAuditEvent(env, { actorId: user.id, actorRole: "client", action: "muse.chapter_generated", targetType: "chapter", targetId: chapterId,''', '''  ]);
  await saveChapterSectionState(projectId, chapterId, finalSections, env);
  await recordAuditEvent(env, { actorId: user.id, actorRole: "client", action: "muse.chapter_generated", targetType: "chapter", targetId: chapterId,''', 'persist generated section state')

# Backup before full revision; clear exact boundaries because whole-text revision may redistribute prose.
revision_update = '''  const status = content === source ? "revisione_non_applicata" : `revisionato_${action}`;
  await env.DB.prepare('UPDATE "BookChapter" SET title=?,content=?,status=?,updatedAt=? WHERE id=?').bind(title, content, status, (/* @__PURE__ */ new Date()).toISOString(), chapterId).run();'''
revision_repl = '''  const status = content === source ? "revisione_non_applicata" : `revisionato_${action}`;
  await captureBookBackup(projectId, user.id, env, { force: true, reason: `muse_revision_${action}` });
  await ensureEditorialSafetyTables(env);
  await env.DB.batch([
    env.DB.prepare('UPDATE "BookChapter" SET title=?,content=?,status=?,updatedAt=? WHERE id=?').bind(title, content, status, (/* @__PURE__ */ new Date()).toISOString(), chapterId),
    env.DB.prepare('DELETE FROM "BookChapterSection" WHERE chapterId=? AND projectId=?').bind(chapterId, projectId)
  ]);'''
worker = replace_once(worker, revision_update, revision_repl, 'backup revision')

# ---------------------------------------------------------------------------
# 5) Book editor: load exact section state, expose restore, make renaming obvious
# ---------------------------------------------------------------------------
book_editor_project = '''  const project = await ownProject(id, user, env);
  if (!project) return redirect("/studio");
  const structure = bookStructure(project.targetPages);'''
book_editor_project_new = '''  const project = await ownProject(id, user, env);
  if (!project) return redirect("/studio");
  await ensureEditorialSafetyTables(env);
  const structure = bookStructure(project.targetPages);'''
# Only bookEditor has this exact sequence after helper insertion; protect count.
worker = replace_once(worker, book_editor_project, book_editor_project_new, 'book editor safety init')

book_queries = '''  const chapters = await env.DB.prepare('SELECT * FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(id).all();
  const interview = await env.DB.prepare('SELECT * FROM "BookInterview" WHERE projectId=?').bind(id).first();
  const metrics = bookMetrics(project, chapters.results);'''
book_queries_new = '''  const chapters = await env.DB.prepare('SELECT * FROM "BookChapter" WHERE projectId=? ORDER BY position').bind(id).all();
  const interview = await env.DB.prepare('SELECT * FROM "BookInterview" WHERE projectId=?').bind(id).first();
  const sectionRows = await env.DB.prepare('SELECT chapterId,section0,section1,section2,updatedAt FROM "BookChapterSection" WHERE projectId=?').bind(id).all();
  const sectionMap = new Map((sectionRows.results || []).map((row) => [row.chapterId, row]));
  const latestBackup = await env.DB.prepare('SELECT createdAt FROM "BookProjectBackup" WHERE projectId=? AND userId=? ORDER BY createdAt DESC LIMIT 1').bind(id, user.id).first();
  const metrics = bookMetrics(project, chapters.results);'''
worker = replace_once(worker, book_queries, book_queries_new, 'load chapter section state and backup')

chapter_map_anchor = '''  const chapterHtml = chapters.results.map((c) => {
    const chapterNotice = notice && noticeChapterId === c.id ?'''
chapter_map_repl = '''  const chapterHtml = chapters.results.map((c) => {
    const sectionState = sectionMap.get(c.id) || null;
    const sectionSources = sectionState ? [0, 1, 2].map((index) => `<textarea hidden data-chapter-section-source="${index}" aria-hidden="true">${esc(sectionState[`section${index}`] || "")}</textarea>`).join("") : "";
    const chapterNotice = notice && noticeChapterId === c.id ?'''
worker = replace_once(worker, chapter_map_anchor, chapter_map_repl, 'chapter section sources')

form_anchor = '''<form class="chapter-compose-form" method="post" action="/libro/${id}/capitolo/${c.id}/salva" data-live-chapter data-keep-writing-position data-book-path="/libro/${id}"><label class="field chapter-title-field">Titolo del capitolo<input name="title"'''
form_repl = '''<form class="chapter-compose-form" method="post" action="/libro/${id}/capitolo/${c.id}/salva" data-live-chapter data-keep-writing-position data-book-path="/libro/${id}" data-spl-section-state="${sectionState ? "1" : "0"}">${sectionSources}<label class="field chapter-title-field">Titolo del capitolo <span class="small muted">· puoi rinominarlo in qualsiasi momento</span><input name="title"'''
worker = replace_once(worker, form_anchor, form_repl, 'rename chapter affordance and section sources')

# Show restore button only if there is a real previous version.
progress_anchor = '''  const progress = `${globalNotice}${onboarding}<section class="book-progress-card"'''
progress_repl = '''  const restoreControl = latestBackup ? `<form class="spl-restore-book" method="post" action="/libro/${id}/ripristina" data-restore-book-form><button class="button secondary" type="submit">↶ Ripristina ultima versione libro</button><span class="small muted">Backup del ${new Date(latestBackup.createdAt).toLocaleString("it-IT")}</span></form>` : "";
  const progress = `${globalNotice}${onboarding}${restoreControl}<section class="book-progress-card"'''
worker = replace_once(worker, progress_anchor, progress_repl, 'restore book control')

# Remove Reimmagina from UI: create-outline appears only before any chapters exist.
outline_ui = '''<div class="actions"><form method="post" action="/libro/${id}/struttura" data-keep-writing-position data-book-path="/libro/${id}"><button class="button">${chapters.results.length ? "Reimmagina l'indice" : "Disegna la trama del mio libro"}</button></form></div>'''
outline_ui_new = '''${chapters.results.length ? "" : `<div class="actions"><form method="post" action="/libro/${id}/struttura" data-keep-writing-position data-book-path="/libro/${id}"><button class="button">Disegna la trama del mio libro</button></form></div>`}'''
worker = replace_once(worker, outline_ui, outline_ui_new, 'remove reimagine UI')

# GET can now show restore/protection messages, and add restore route.
get_book = '''  if (method === "GET" && /^\\/libro\\/[^/]+$/.test(path)) return bookEditor(path.split("/")[2], user, env);'''
get_book_new = '''  if (method === "GET" && /^\\/libro\\/[^/]+$/.test(path)) return bookEditor(path.split("/")[2], user, env, url.searchParams.get("e") || "");'''
worker = replace_once(worker, get_book, get_book_new, 'book GET notice')
restore_route_anchor = '''  if (method === "POST" && /^\\/libro\\/[^/]+\\/elimina$/.test(path)) return deleteOwnedBook(request, path.split("/")[2], user, env);'''
restore_route_new = '''  if (method === "POST" && /^\\/libro\\/[^/]+\\/elimina$/.test(path)) return deleteOwnedBook(request, path.split("/")[2], user, env);
  if (method === "POST" && /^\\/libro\\/[^/]+\\/ripristina$/.test(path)) return restoreLastBookVersion(path.split("/")[2], user, env);'''
worker = replace_once(worker, restore_route_anchor, restore_route_new, 'restore route')

# New JS cache key because studio.js is immutable for a year.
worker = replace_once(worker, '/assets/studio.js?v=20260831-1', '/assets/studio.js?v=20260831-2', 'studio JS cache bust')

# Guide: clarify actual chapter threshold, keep source-material recommendation separate.
worker = worker.replace('Controlla di aver salvato almeno 260\\u2013460 parole concrete e varie, di essere ancora nei 14 giorni,', 'Nel capitolo scrivi almeno 50 parole di spunto complessive nelle tre sezioni; le 260\\u2013460 parole restano invece una raccomandazione per il materiale generale del libro. Controlla inoltre di essere ancora nei 14 giorni,')

# ---------------------------------------------------------------------------
# 6) Client Studio: exact one-way sections, clear counters, cookie, UX
# ---------------------------------------------------------------------------
# CSS fixes and chapter separation.
css_anchor = '.studio-editor-page .spl-section-card.is-over-limit .spl-section-meta{color:#8a6226}\n'
css_extra = '''.studio-editor-page .spl-section-card.is-over-limit .spl-section-meta{color:#8a6226}\n.studio-editor-page .chapter-list{row-gap:46px!important}\n.studio-editor-page .chapter-list>.chapter-card:not(:first-child){position:relative;margin-top:22px}\n.studio-editor-page .chapter-list>.chapter-card:not(:first-child)::before{content:"";position:absolute;left:7%;right:7%;top:-35px;height:1px;background:linear-gradient(90deg,transparent,#c7a15b,transparent)}\n.studio-editor-page .spl-restore-book{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0 20px;padding:13px 15px;border:1px solid #d6e2dd;border-radius:14px;background:#fff}\n.cookie-banner.privacy-first[hidden]{display:none!important}\n@media(max-width:700px){.studio-editor-page .spl-restore-book .button{width:100%}}\n'''
studio = replace_once(studio, css_anchor, css_extra, 'Studio QA CSS')

# Section source and 50-word setup.
section_setup_old = '''    const sectionTarget = 350;
    const requiredMuseWords = 20;
    const parts = balancedSplit(original.value);

    const readiness = document.createElement('p');
    readiness.className = 'spl-muse-readiness';
    readiness.innerHTML = '<strong>Prima di usare la Musa:</strong> per un capitolo di circa 1.000 parole servono almeno <b>20</b> parole di spunto. Se sono di più è meglio: la Musa userà i dettagli disponibili per scrivere circa 350 parole per ciascuna delle tre sezioni.';'''
section_setup_new = '''    const sectionTarget = 350;
    const requiredMuseWords = 50;
    const persistedParts = [0, 1, 2].map(index => form.querySelector('[data-chapter-section-source="' + index + '"]')?.value || '');
    const hasPersistedParts = form.dataset.splSectionState === '1';
    const parts = hasPersistedParts ? persistedParts : balancedSplit(original.value);

    const readiness = document.createElement('p');
    readiness.className = 'spl-muse-readiness';
    readiness.innerHTML = '<strong>Prima di usare la Musa:</strong> servono almeno <b>50 parole di spunto complessive</b> nelle tre sezioni. Non devi scriverne 350: circa 350 è la lunghezza che la Musa può sviluppare per una singola sezione.';'''
studio = replace_once(studio, section_setup_old, section_setup_new, '50-word UI and persisted parts')

areas_old = '''    const sectionAreas = [];
    const sectionHiddenInputs = [];
    const chapterMuseButton = form.querySelector('.muse-draft-button[formaction*="/genera"]');'''
areas_new = '''    const sectionAreas = [];
    const chapterMuseButton = form.querySelector('.muse-draft-button[formaction*="/genera"]');'''
studio = replace_once(studio, areas_old, areas_new, 'remove duplicate section hidden inputs')

area_value = '''      area.setAttribute('aria-labelledby', headingId);
      area.value = parts[index] || '';
      area.placeholder ='''
area_value_new = '''      area.setAttribute('aria-labelledby', headingId);
      area.name = 'section' + index;
      area.dataset.splSectionIndex = String(index);
      area.value = parts[index] || '';
      area.placeholder ='''
studio = replace_once(studio, area_value, area_value_new, 'name section textareas')

hidden_block = '''      card.append(area);
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'museSection' + index;
      hidden.value = area.value;
      form.append(hidden);
      sectionHiddenInputs.push(hidden);
      area.addEventListener('input', () => { hidden.value = area.value; });
      const sectionActions = document.createElement('div');'''
hidden_block_new = '''      card.append(area);
      const sectionActions = document.createElement('div');'''
studio = replace_once(studio, hidden_block, hidden_block_new, 'remove hidden section duplicates')

# Counters: never imply user must type 350 words; update total readiness dynamically.
counter_old = '''    const updateCounters = () => {
      sectionAreas.forEach(area => {
        const count = wordCount(area.value);
        const card = area.closest('.spl-section-card');
        const meta = card.querySelector('[data-spl-section-count]');
        meta.textContent = count + ' / circa ' + sectionTarget + ' parole';
        card.classList.toggle('is-over-limit', count > Math.round(sectionTarget * 1.12));
      });
    };'''
counter_new = '''    const updateCounters = () => {
      const total = sectionAreas.reduce((sum, area) => sum + wordCount(area.value), 0);
      sectionAreas.forEach(area => {
        const count = wordCount(area.value);
        const card = area.closest('.spl-section-card');
        const meta = card.querySelector('[data-spl-section-count]');
        meta.textContent = count + ' parole scritte · Musa: circa ' + sectionTarget;
        card.classList.remove('is-over-limit');
      });
      const remaining = Math.max(0, requiredMuseWords - total);
      readiness.innerHTML = total >= requiredMuseWords
        ? '<strong>Musa pronta:</strong> hai ' + total + ' parole di spunto complessive. Circa 350 parole è l’obiettivo di scrittura della Musa per ciascuna sezione, non un minimo da digitare.'
        : '<strong>Prima di usare la Musa:</strong> hai ' + total + ' parole di spunto; ne servono almeno <b>50</b> complessive. Te ne mancano ' + remaining + '. Non devi scriverne 350: quello è l’obiettivo della Musa per una sezione.';
    };'''
studio = replace_once(studio, counter_old, counter_new, 'clear word counters')

# One-way flow: section -> original. Do not continuously redistribute original back into other sections.
sync_old = '''    const syncOriginal = () => {
      syncing = true;
      original.value = sectionAreas.map(area => area.value.trim()).filter(Boolean).join('\\n\\n');
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
    updateCounters();'''
sync_new = '''    const syncOriginal = () => {
      syncing = true;
      original.value = sectionAreas.map(area => area.value.trim()).join('\\n\\n');
      original.dispatchEvent(new Event('input', { bubbles: true }));
      syncing = false;
      updateCounters();
    };
    sectionAreas.forEach(area => area.addEventListener('input', syncOriginal));
    let acceptLegacyOriginalOnce = !hasPersistedParts;
    original.addEventListener('input', () => {
      if (syncing || !acceptLegacyOriginalOnce) return;
      const nextParts = balancedSplit(original.value);
      sectionAreas.forEach((area, index) => { area.value = nextParts[index] || ''; });
      acceptLegacyOriginalOnce = false;
      updateCounters();
    });
    queueMicrotask(() => { acceptLegacyOriginalOnce = false; });
    updateCounters();'''
studio = replace_once(studio, sync_old, sync_new, 'one-way section flow')

# AI pre-save includes exact section values.
pre_ai_payload = '''    body: JSON.stringify({ title, content })'''
pre_ai_payload_new = '''    body: JSON.stringify({ title, content, section0: form.querySelector('[name="section0"]')?.value || '', section1: form.querySelector('[name="section1"]')?.value || '', section2: form.querySelector('[name="section2"]')?.value || '' })'''
studio = replace_once(studio, pre_ai_payload, pre_ai_payload_new, 'AI pre-save exact sections')

# Base autosave script is patched at serve time to include exact section values.
patch_return = '''  return patched + "\\n" + STUDIO_JS_PATCH;
}'''
patch_return_new = '''  const autosavePayload = "body: JSON.stringify({ title: titleInput?.value || '', content: writingField?.value || '' })";
  const autosaveWithSections = "body: JSON.stringify({ title: titleInput?.value || '', content: writingField?.value || '', section0: form.querySelector('[name=\\\"section0\\\"]')?.value || '', section1: form.querySelector('[name=\\\"section1\\\"]')?.value || '', section2: form.querySelector('[name=\\\"section2\\\"]')?.value || '' })";
  if (patched.includes(autosavePayload)) patched = patched.replace(autosavePayload, autosaveWithSections);
  return patched + "\\n" + STUDIO_JS_PATCH;
}'''
studio = replace_once(studio, patch_return, patch_return_new, 'base autosave section payload')

# Confirm restore action explicitly; prevent accidental overwrite.
submit_guard_anchor = '''  const bypass = new WeakSet();
  const projectAutosaveUrl ='''
submit_guard_new = '''  document.querySelectorAll('[data-restore-book-form]').forEach(form => form.addEventListener('submit', event => {
    if (!window.confirm('Ripristinare l’ultima versione salvata del libro? Lo stato attuale verrà conservato come versione precedente, quindi potrai tornare indietro.')) event.preventDefault();
  }));

  const bypass = new WeakSet();
  const projectAutosaveUrl ='''
studio = replace_once(studio, submit_guard_anchor, submit_guard_new, 'restore confirmation')

# ---------------------------------------------------------------------------
# Guardrails
# ---------------------------------------------------------------------------
checks = {
    '50 word backend': 'sourceWords < 50' in worker and 'almeno 50 parole di spunto complessive' in worker,
    'no reimagine UI': 'Reimmagina l\'indice' not in worker,
    'outline protected': 'L’indice esistente è protetto' in worker,
    'outline delete removed': 'const statements = [];' in worker,
    'section table': 'BookChapterSection' in worker,
    'backup table': 'BookProjectBackup' in worker,
    'restore route': '/ripristina' in worker and 'restoreLastBookVersion' in worker,
    'previous chapter prose isolated': 'museContext(project, [], [interview?.answers, submittedContent]' in worker,
    'section names': "area.name = 'section' + index" in studio,
    'no 350 minimum implication': "parole scritte · Musa: circa" in studio,
    'one-way sections': 'acceptLegacyOriginalOnce' in studio,
    'privacy hidden wins': '.cookie-banner.privacy-first[hidden]{display:none!important}' in studio,
    'chapter separation': '.chapter-list>.chapter-card:not(:first-child)::before' in studio,
    'restore confirm': '[data-restore-book-form]' in studio,
    'new immutable asset': '/assets/studio.js?v=20260831-2' in worker,
    'Qwen unchanged': '@cf/qwen/qwen3.8-27b' in worker,
    '365-day local draft unchanged': '365 * 24 * 60 * 60 * 1000' in studio,
}
failed = [name for name, ok in checks.items() if not ok]
print(checks)
if failed:
    raise SystemExit('QA guardrails failed: ' + ', '.join(failed))

worker_path.write_text(worker, encoding='utf-8')
studio_path.write_text(studio, encoding='utf-8')
