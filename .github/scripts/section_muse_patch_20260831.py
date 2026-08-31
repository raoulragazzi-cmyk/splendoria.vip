from pathlib import Path

studio_path = Path('src/studio-worker.js')
worker_path = Path('src/worker.js')
studio = studio_path.read_text(encoding='utf-8')
worker = worker_path.read_text(encoding='utf-8')

marker = 'spl-section-muse-v1'
if marker in studio or 'sectionMode ? 1 : 3' in worker:
    raise SystemExit('Per-section Musa patch already present; refusing duplicate patch')

# 1) Minimal UI styling under each of the three section editors.
css_anchor = '.studio-editor-page .spl-section-card.is-over-limit .spl-section-meta{color:#8a6226}\n'
css_add = (
    '.studio-editor-page .spl-section-actions{display:flex;justify-content:flex-end;margin-top:12px} /* spl-section-muse-v1 */\n'
    '.studio-editor-page .spl-section-muse{min-height:42px;padding:10px 16px;font-size:14px!important}\n'
    '@media(max-width:700px){.studio-editor-page .spl-section-actions{justify-content:stretch}.studio-editor-page .spl-section-muse{width:100%}}\n'
)
if studio.count(css_anchor) != 1:
    raise SystemExit(f'CSS anchor count={studio.count(css_anchor)}')
studio = studio.replace(css_anchor, css_anchor + css_add, 1)

# 2) Keep each section explicitly in the form and add one Musa button per card.
areas_anchor = "    const sectionAreas = [];\n    labels.forEach((entry, index) => {"
areas_add = (
    "    const sectionAreas = [];\n"
    "    const sectionHiddenInputs = [];\n"
    "    const chapterMuseButton = form.querySelector('.muse-draft-button[formaction*=\"/genera\"]');\n"
    "    const chapterMuseAction = chapterMuseButton ? chapterMuseButton.formAction : form.action.replace(/\\/salva$/, '/genera');\n"
    "    labels.forEach((entry, index) => {"
)
if studio.count(areas_anchor) != 1:
    raise SystemExit(f'sectionAreas anchor count={studio.count(areas_anchor)}')
studio = studio.replace(areas_anchor, areas_add, 1)

card_anchor = "      card.append(area);\n      editor.append(card);\n      sectionAreas.push(area);"
card_add = """      card.append(area);
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
      sectionAreas.push(area);"""
if studio.count(card_anchor) != 1:
    raise SystemExit(f'card append anchor count={studio.count(card_anchor)}')
studio = studio.replace(card_anchor, card_add, 1)

original_anchor = "      sectionAreas.forEach((area, index) => { area.value = nextParts[index] || ''; });"
original_add = "      sectionAreas.forEach((area, index) => { area.value = nextParts[index] || ''; if (sectionHiddenInputs[index]) sectionHiddenInputs[index].value = area.value; });"
if studio.count(original_anchor) != 1:
    raise SystemExit(f'original sync anchor count={studio.count(original_anchor)}')
studio = studio.replace(original_anchor, original_add, 1)

# 3) Backend: optional section mode on the existing authenticated /genera route.
submitted_anchor = '  const submittedContent = collapseAccidentalRepetitions(clean(submitted.content, 6e4), 6e4);\n'
submitted_add = (
    '  const submittedContent = collapseAccidentalRepetitions(clean(submitted.content, 6e4), 6e4);\n'
    '  const requestedSection = Number.parseInt(String(submitted.museSection ?? ""), 10);\n'
    '  const sectionMode = Number.isInteger(requestedSection) && requestedSection >= 0 && requestedSection < 3;\n'
    '  const submittedSections = [0, 1, 2].map((index) => collapseAccidentalRepetitions(clean(submitted[`museSection${index}`], 2e4), 2e4));\n'
)
if worker.count(submitted_anchor) != 1:
    raise SystemExit(f'submittedContent anchor count={worker.count(submitted_anchor)}')
worker = worker.replace(submitted_anchor, submitted_add, 1)

count_anchor = '  const sourceForCount = museSourceMaterial(project, [], [interview?.answers, submittedContent].filter(Boolean).join("\\\n\\\n"));'
count_add = '  const sourceForCount = museSourceMaterial(project, [], [interview?.answers, submittedContent, sectionMode ? submittedSections[requestedSection] : ""].filter(Boolean).join("\\\n\\\n"));'
if worker.count(count_anchor) != 1:
    raise SystemExit(f'sourceForCount anchor count={worker.count(count_anchor)}')
worker = worker.replace(count_anchor, count_add, 1)

section_pos = worker.find('  const sectionSpecs = [')
generated_anchor = '  const generatedSections = [];\n'
gen_pos = worker.find(generated_anchor, section_pos)
if section_pos < 0 or gen_pos < 0:
    raise SystemExit('generatedSections anchor not found after sectionSpecs')
generated_add = '  const sectionIndexes = sectionMode ? [requestedSection] : [0, 1, 2];\n  const generatedSections = [];\n'
worker = worker[:gen_pos] + generated_add + worker[gen_pos + len(generated_anchor):]

loop_anchor = '  for (let index = 0; index < sectionSpecs.length; index++) {'
if worker.count(loop_anchor) != 1:
    raise SystemExit(f'loop anchor count={worker.count(loop_anchor)}')
worker = worker.replace(loop_anchor, '  for (const index of sectionIndexes) {', 1)

label_anchor = '    const [label, focus] = sectionSpecs[index];\n'
label_add = '    const [label, focus] = sectionSpecs[index];\n    const currentDraft = sectionMode ? submittedSections[index] : "";\n'
if worker.count(label_anchor) != 1:
    raise SystemExit(f'label anchor count={worker.count(label_anchor)}')
worker = worker.replace(label_anchor, label_add, 1)

task_anchor = "LUNGHEZZA: circa 350 parole, idealmente tra 300 e 400.\\\nCOERENZA CON L'INDICE:"
task_add = "LUNGHEZZA: circa 350 parole, idealmente tra 300 e 400.\\\nBOZZA ATTUALE DELLA SEZIONE (se presente, sviluppala senza cancellarne i fatti):\\\n${currentDraft || \"Nessuna\"}\\\nCOERENZA CON L'INDICE:"
if worker.count(task_anchor) != 1:
    raise SystemExit(f'task anchor count={worker.count(task_anchor)}')
worker = worker.replace(task_anchor, task_add, 1)

content_anchor = '  const content = collapseAccidentalRepetitions(generatedSections.join("\\\n\\\n"), 6e4);'
content_add = '  const content = collapseAccidentalRepetitions(sectionMode ? submittedSections.map((part, index) => index === requestedSection ? generatedSections[0] : part).join("\\\n\\\n") : generatedSections.join("\\\n\\\n"), 6e4);'
if worker.count(content_anchor) != 1:
    raise SystemExit(f'content compose anchor count={worker.count(content_anchor)}')
worker = worker.replace(content_anchor, content_add, 1)

audit_anchor = 'metadata: { position: chapter.position, words: wordCount(content), model: "qwen3.8-27b", sections: 3 }'
audit_add = 'metadata: { position: chapter.position, words: wordCount(content), model: "qwen3.8-27b", sections: sectionMode ? 1 : 3, section: sectionMode ? sectionSpecs[requestedSection][0] : "all" }'
if worker.count(audit_anchor) != 1:
    raise SystemExit(f'audit anchor count={worker.count(audit_anchor)}')
worker = worker.replace(audit_anchor, audit_add, 1)

# studio.js is cached for a year, so change the query key to ship the new client code.
cache_anchor = '/assets/studio.js?v=20260829-1'
if worker.count(cache_anchor) != 1:
    raise SystemExit(f'studio.js version anchor count={worker.count(cache_anchor)}')
worker = worker.replace(cache_anchor, '/assets/studio.js?v=20260831-1', 1)

checks = {
    'section button UI': "sectionMuse.textContent = 'Affidati alla Musa per questa sezione'" in studio,
    'hidden section values': "hidden.name = 'museSection' + index" in studio,
    'backend section mode': 'const sectionIndexes = sectionMode ? [requestedSection] : [0, 1, 2];' in worker,
    'global generator retained': 'for (const index of sectionIndexes)' in worker,
    'other sections preserved': 'index === requestedSection ? generatedSections[0] : part' in worker,
    'qwen retained': '@cf/qwen/qwen3.8-27b' in worker,
    '20 word rule retained': 'sourceWords < 20' in worker,
    'cache bumped': '/assets/studio.js?v=20260831-1' in worker,
}
failed = [name for name, ok in checks.items() if not ok]
print(checks)
if failed:
    raise SystemExit('Guardrails failed: ' + ', '.join(failed))

studio_path.write_text(studio, encoding='utf-8')
worker_path.write_text(worker, encoding='utf-8')
