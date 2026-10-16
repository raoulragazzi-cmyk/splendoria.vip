/** German dictation candidate. No DOM/Worker dependency; fail unchanged on drift. */
const START = 'const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;';
const END = "document.querySelectorAll('textarea[data-word-count]')";
const MARKER = 'spl-dictation-de-ux-v2';

export const GERMAN_DICTATION_CSS = `
.studio-editor-page .spl-dictation-control{min-height:48px;min-width:160px;padding:12px 18px;font:700 18px/1.35 var(--font-ui,system-ui);white-space:normal;overflow-wrap:anywhere;background:#075d56;color:#fff;border:2px solid transparent}
.studio-editor-page .spl-dictation-control.listening{background:#873820;border-color:currentColor}
.studio-editor-page .spl-dictation-control:focus-visible{outline:3px solid #153f37;outline-offset:3px;box-shadow:0 0 0 3px #fff}
.studio-editor-page .spl-dictation-control:disabled{opacity:1;background:#edf3f0;color:#35554d;cursor:not-allowed}
.studio-editor-page [data-voice-status]{font-size:16px!important;line-height:1.5!important;white-space:normal;overflow-wrap:anywhere;max-width:100%}
.studio-editor-page .muse-voice :is(label,select,p){font-size:16px!important;line-height:1.5}
.studio-editor-page .muse-voice select{min-height:44px}
@media(max-width:640px){.studio-editor-page .spl-dictation-control{width:100%;min-width:0;flex-basis:100%}.studio-editor-page [data-voice-status]{width:100%;flex-basis:100%}}
`;

/** @returns {{source: string, applied: boolean, reason: string}} */
export function buildGermanDictationCandidate(source, locale = 'de') {
  const original = String(source || '');
  if (locale !== 'de') return { source: original, applied: false, reason: 'other-locale' };
  if (original.includes(MARKER)) return { source: original, applied: true, reason: 'already-applied' };
  const start = original.indexOf(START), end = original.indexOf(END, start);
  if (start < 0 || end <= start || original.indexOf(START, start + 1) !== -1) {
    return { source: original, applied: false, reason: 'controller-boundary-mismatch' };
  }
  let voice = original.slice(start, end);
  const once = (oldText, newText) => {
    if (voice.split(oldText).length !== 2) throw new Error('controller-contract-mismatch');
    voice = voice.replace(oldText, newText);
  };
  try {
    // This is UI copy, not the selected recognition/book language.
    const dePattern = /'de-DE': \{[\s\S]*?\n\s*\},/g;
    if ([...voice.matchAll(dePattern)].length !== 1) throw new Error('copy-contract-mismatch');
    voice = voice.replace(dePattern, `'de-DE': {
        ready: 'Klicke auf „Diktat starten“ und sprich.',
        unavailable: 'Hier ist keine Browser-Diktierfunktion verfügbar. Du kannst tippen oder die Diktierfunktion deines Geräts verwenden.',
        listening: 'Das Mikrofon ist aktiv. Sprich in deinem Tempo.',
        denied: 'Erlaube den Mikrofonzugriff in den Browser-Einstellungen. Dein vorhandener Text bleibt erhalten.',
        noSpeech: 'Ich habe keine Sprache erkannt. Sprich etwas näher am Mikrofon oder versuche es erneut.',
        noMicrophone: 'Es wurde kein verfügbares Mikrofon erkannt. Prüfe das Gerät und die Browser-Einstellungen.',
        networkError: 'Die Spracherkennung ist gerade nicht erreichbar. Dein vorhandener Text bleibt erhalten.',
        interrupted: 'Das Diktat wurde unterbrochen. Prüfe deinen Text und starte bei Bedarf erneut.',
        correcting: 'Grammatik und Zeichensetzung werden geprüft. Dein Text bleibt bearbeitbar.',
        finished: 'Diktat beendet. Prüfe deinen Text vor dem Speichern.',
        stopping: 'Das Diktat wird beendet. Bitte warte auf die Bestätigung.',
        editing: 'Das Diktat wird beendet. Deine Änderungen bleiben erhalten.',
        edited: 'Diktat beendet. Deine Änderungen bleiben erhalten.'
      },`);
    once('let activeButton = null;', `// ${MARKER}
    let voiceRun = 0;
    let voiceStatusId = 0;
    let activeVoiceLanguage = '';
    let voiceInitialValue = '';
    let voiceLastValue = '';
    let voiceManualEdit = false;
    let voiceStopRequested = false;
    const voiceTargetRuns = new WeakMap();
    let activeButton = null;`);
    once("button.setAttribute('aria-pressed', live ? 'true' : 'false');", `button.setAttribute('aria-pressed', live ? 'true' : 'false');
      const voiceLabel = live ? 'Diktat beenden' : 'Diktat starten';
      button.textContent = voiceLabel;
      button.setAttribute('aria-label', voiceLabel);
      button.classList.add('spl-dictation-control');
      if (button.dataset.voiceTarget) button.setAttribute('aria-controls', button.dataset.voiceTarget);`);
    once('if (status) status.textContent = text;', `if (status) {
        if (!status.id) status.id = 'spl-dictation-status-' + (++voiceStatusId);
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
        button.setAttribute('aria-describedby', status.id);
        status.textContent = text;
      }`);
    // Result indices, not equal-looking words, identify repeated browser notifications.
    // Distinct final slots must preserve repetitions and umlauts (Web Speech results contract).
    const mergeStart = voice.indexOf('const speechWords = value =>');
    const mergeEnd = voice.indexOf('const setStatus = (button, text, live = false) =>', mergeStart);
    if (mergeStart < 0 || mergeEnd <= mergeStart) throw new Error('segment-contract-mismatch');
    const oldMerge = voice.slice(mergeStart, mergeEnd);
    if (!oldMerge.includes('const mergeRecognitionText = (current, incoming) =>')) throw new Error('segment-contract-mismatch');
    once(oldMerge, `// recognitionSegments deduplicates by result slot, never by vocabulary.
    const mergeRecognitionText = (current, incoming) => joinText(current, incoming);
    `);
    once('if (languageSelect) {', `const requestVoiceStop = () => {
      if (!activeButton || !recognition) return;
      voiceStopRequested = true;
      setStatus(activeButton, message(voiceManualEdit ? 'editing' : 'stopping'), true);
      // The browser can still be starting or already stopping. onstart retries;
      // activeTarget stays owned by this session until its onend arrives.
      try { recognition.stop(); } catch {}
    };
    const preserveVoiceEdit = event => {
      if (!activeTarget) return false;
      if (!voiceManualEdit && event?.type !== 'compositionstart' && activeTarget.value === voiceLastValue) return false;
      voiceManualEdit = true;
      if (!voiceStopRequested) requestVoiceStop();
      return true;
    };
    const removeVoiceEditListeners = target => {
      target?.removeEventListener('input', preserveVoiceEdit);
      target?.removeEventListener('compositionstart', preserveVoiceEdit);
    };
    if (languageSelect) {`);
    once("const savedLanguage = localStorage.getItem('splendoria-voice-language');", `// A server-rendered preference belongs to this book, not the last book in this browser.
        const bookBoundLanguage = languageSelect.getAttribute('name') === 'dictationLanguage' && languageSelect.getAttribute('form') === 'spl-book-settings';
        const savedLanguage = bookBoundLanguage ? null : localStorage.getItem('splendoria-voice-language');`);
    once('if (activeButton && recognition) recognition.stop();', 'if (activeButton && recognition) requestVoiceStop();');
    once("document.querySelectorAll('[data-voice-target]').forEach(button => setStatus(button, recognition ? message('ready') : message('unavailable')));", "document.querySelectorAll('[data-voice-target]').forEach(button => { if (button !== activeButton) setStatus(button, recognition ? message('ready') : message('unavailable')); });");
    once("if (activeButton) setStatus(activeButton, message('listening'), true);", "if (voiceStopRequested) { requestVoiceStop(); return; }\n        if (activeButton) setStatus(activeButton, message('listening'), true);");
    once('if (!activeTarget) return;', 'if (!activeTarget || preserveVoiceEdit()) return;');
    once('activeTarget.value = joinText(baseText, mergeRecognitionText(finalTranscript, interimTranscript));', `const spokenText = mergeRecognitionText(finalTranscript, interimTranscript);
        const nextValue = spokenText ? joinText(baseText, spokenText) : voiceInitialValue;
        if (activeTarget.value === nextValue) return;
        voiceLastValue = nextValue;
        activeTarget.value = nextValue;`);
    once("endedWithError = true;\n        if (activeButton) setStatus(activeButton, event.error === 'not-allowed' ? message('denied') : message('interrupted'));", "if (event.error === 'aborted' && voiceStopRequested) return;\n        endedWithError = true;\n        if (activeButton && !voiceManualEdit) {\n          const errorKey = event.error === 'not-allowed' || event.error === 'service-not-allowed'\n            ? 'denied'\n            : event.error === 'no-speech'\n              ? 'noSpeech'\n              : event.error === 'audio-capture'\n                ? 'noMicrophone'\n                : event.error === 'network'\n                  ? 'networkError'\n                  : 'interrupted';\n          setStatus(activeButton, message(errorKey));\n        }");
    once('if (activeButton) { recognition.stop(); return; }', 'if (activeButton) { requestVoiceStop(); return; }');
    const onEndStart = voice.indexOf('recognition.onend = async () => {');
    const onEndFinish = voice.indexOf("document.querySelectorAll('[data-voice-target]').forEach(button => {", onEndStart);
    if (onEndStart < 0 || onEndFinish < 0) throw new Error('end-contract-mismatch');
    const originalEnd = voice.slice(onEndStart, onEndFinish);
    const required = ['const button = activeButton;', 'language: selectedLanguage()', 'if (result?.text && target.value === committed)', "if (button && !endedWithError) setStatus(button, message('finished'));", 'target?.focus();'];
    if (required.some(text => originalEnd.split(text).length !== 2)) throw new Error('end-contract-mismatch');
    const safeEnd = originalEnd
      .replace('const button = activeButton;', `const completedRun = voiceRun;
        const completedBase = baseText;
        const completedLanguage = activeVoiceLanguage;
        const completedWithError = endedWithError;
        const completedFocus = document.activeElement;
        const completedManualEdit = voiceManualEdit || Boolean(activeTarget && activeTarget.value !== voiceLastValue);
        removeVoiceEditListeners(activeTarget);
        const button = activeButton;`)
      .replace('if (target) {', 'if (target && rawFinal && !completedManualEdit && target.value !== committed) {')
      .replace('if (button && !endedWithError && rawFinal && target)', 'if (button && !endedWithError && !completedManualEdit && rawFinal && target)')
      .replaceAll('joinText(baseText,', 'joinText(completedBase,')
      .replaceAll('!endedWithError', '!completedWithError')
      .replace('language: selectedLanguage()', 'language: completedLanguage')
      .replace("setStatus(button, message('correcting'));", `setStatus(button, message('correcting'));
          let correctionWasEdited = false;
          const invalidateCorrection = () => { correctionWasEdited = true; };
          target.addEventListener('input', invalidateCorrection);
          target.addEventListener('compositionstart', invalidateCorrection);`)
      .replace('} catch {}', `} catch {} finally {
            target.removeEventListener('input', invalidateCorrection);
            target.removeEventListener('compositionstart', invalidateCorrection);
          }`)
      .replace('if (result?.text && target.value === committed)', "if (typeof result?.text === 'string' && result.text.trim() && !correctionWasEdited && target.value === committed && voiceTargetRuns.get(target) === completedRun)")
      .replace("if (button && !completedWithError) setStatus(button, message('finished'));", "if (button && voiceTargetRuns.get(target) === completedRun && button !== activeButton) { if (completedManualEdit) setStatus(button, message('edited')); else if (!completedWithError) setStatus(button, message('finished')); }")
      .replace('target?.focus();', 'if (!completedManualEdit && voiceRun === completedRun && !activeButton && document.activeElement === completedFocus && completedFocus === button) target?.focus();');
    once(originalEnd, safeEnd);
    once('recognition.lang = selectedLanguage();\n        recognition.start();', `activeVoiceLanguage = selectedLanguage();
        voiceInitialValue = target.value;
        voiceLastValue = target.value;
        voiceManualEdit = false;
        voiceStopRequested = false;
        target.addEventListener('input', preserveVoiceEdit);
        target.addEventListener('compositionstart', preserveVoiceEdit);
        const startedRun = ++voiceRun;
        voiceTargetRuns.set(target, startedRun);
        recognition.lang = activeVoiceLanguage;
        try {
          recognition.start();
        } catch (error) {
          endedWithError = true;
          removeVoiceEditListeners(target);
          activeButton = null;
          activeTarget = null;
          setStatus(button, error?.name === 'NotAllowedError' ? message('denied') : message('interrupted'));
        }`);
  } catch (error) {
    return { source: original, applied: false, reason: error.message };
  }
  const styleScript = `\n;(() => {
    if (!document.body?.classList.contains('studio-editor-page') || document.getElementById('${MARKER}')) return;
    const style = document.createElement('style');
    style.id = '${MARKER}';
    style.textContent = ${JSON.stringify(GERMAN_DICTATION_CSS)};
    document.head.append(style);
  })();\n`;
  return { source: original.slice(0, start) + voice + original.slice(end) + styleScript, applied: true, reason: 'applied' };
}
