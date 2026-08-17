from pathlib import Path

path = Path("src/worker.js")
text = path.read_text(encoding="utf-8")
changed = False


def replace_once(old: str, new: str, label: str) -> None:
    global text, changed
    if old in text:
        text = text.replace(old, new, 1)
        changed = True
        print(f"patched: {label}")
        return
    if new in text:
        print(f"already patched: {label}")
        return
    raise SystemExit(f"patch anchor not found: {label}")


replace_once(
    '  const attempt = agentChapterAttempts(chapter.status) + 1, paused = attempt >= 3, now = (/* @__PURE__ */ new Date()).toISOString();',
    '  const previousAttempt = agentChapterAttempts(chapter.status), attempt = Math.min(3, previousAttempt + 1), paused = attempt >= 3, now = (/* @__PURE__ */ new Date()).toISOString();',
    "cap retries at three",
)

replace_once(
    '    activeChapter = chapters.results.find((chapter) => !agentChapterComplete(chapter));\n    if (!activeChapter) {',
    '''    activeChapter = chapters.results.find((chapter) => !agentChapterComplete(chapter));
    if (activeChapter && agentChapterAttempts(activeChapter.status) >= 3) {
      const pausedAt = (/* @__PURE__ */ new Date()).toISOString();
      await env.DB.prepare('UPDATE "BookProject" SET status=?,updatedAt=? WHERE id=? AND status=?').bind(AGENT_PROJECT_PAUSED, pausedAt, project.id, AGENT_PROJECT_RUNNING).run();
      await recordAuditEvent(env, { actorRole: "system", action: "agent.paused", targetType: "chapter", targetId: activeChapter.id, outcome: "rejected", metadata: { reason: "chapter_retry_limit", position: activeChapter.position, attempts: agentChapterAttempts(activeChapter.status) } });
      return { ok: false, paused: true, message: `Capitolo ${activeChapter.position} fermato al limite di tre tentativi. Nessun testo precedente è stato sovrascritto.` };
    }
    if (!activeChapter) {''',
    "pause stale or over-limit chapter before generation",
)

replace_once(
    '    const draft = await generateMuseDraft(env, { task, context: museContext(project), current, targetWords, minWords, maxWords, maxTokens: 3200, overlap: 0.14, strictFacts: true });',
    '''    const agentContext = seededBrief ? `${museContext(project)}\n\nDOSSIER SPECIFICO AUTORIZZATO DEL CAPITOLO:\n${seededBrief}` : museContext(project);
    const draft = await generateMuseDraft(env, { task, context: agentContext, current, targetWords, minWords, maxWords, maxTokens: 3200, overlap: 0.14, strictFacts: true });''',
    "authorize chapter-specific curated dossier",
)

replace_once(
    '  await env.DB.prepare(\'UPDATE "BookProject" SET status=?,updatedAt=? WHERE id=? AND status=?\').bind(AGENT_PROJECT_ACTIVE, (/* @__PURE__ */ new Date()).toISOString(), id, AGENT_PROJECT_PAUSED).run();',
    '''  const resumedAt = (/* @__PURE__ */ new Date()).toISOString();
  const blockedChapter = await env.DB.prepare('SELECT id,position,status FROM "BookChapter" WHERE projectId=? AND status LIKE ? ORDER BY position LIMIT 1').bind(id, "agente_errore_%").first();
  if (blockedChapter) {
    await env.DB.prepare('UPDATE "BookChapter" SET status=?,updatedAt=? WHERE id=? AND projectId=?').bind("agente_da_generare", resumedAt, blockedChapter.id, id).run();
  }
  await env.DB.prepare('UPDATE "BookProject" SET status=?,updatedAt=? WHERE id=? AND status=?').bind(AGENT_PROJECT_ACTIVE, resumedAt, id, AGENT_PROJECT_PAUSED).run();''',
    "reset blocked chapter when admin resumes",
)

replace_once(
    'Riprendi dal prossimo capitolo',
    'Riprendi AGENTE',
    "correct resume button label",
)

if changed:
    path.write_text(text, encoding="utf-8")
    print("worker updated")
else:
    print("no changes required")
