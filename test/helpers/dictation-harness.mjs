import vm from 'node:vm';

// Synthetic browser events and network only. No app or real microphone access.
export function createDictationHarness(source, { supported = true, storedLanguage = null, bookLanguage = null, delayedStart = false, delayedEnd = false } = {}) {
  const state = { requests: [], starts: 0, stops: 0, instances: 0, recognition: null, startError: null, stopError: null, ending: null, styles: [] };
  const classes = () => { const s = new Set(); return { add: x => s.add(x), contains: x => s.has(x), toggle: (x, flag) => flag ? s.add(x) : s.delete(x) }; };
  const node = () => ({ id: '', textContent: '', attrs: {}, classList: classes(), setAttribute(k, v) { this.attrs[k] = v; } });
  const targets = Object.fromEntries(['a','b'].map(id => [id, { id, value: id === 'a' ? 'Vorgeschichte A.' : 'Vorgeschichte B.', inputs: 0, focused: 0, listeners: {}, addEventListener(k, fn) { (this.listeners[k] ||= new Set()).add(fn); }, removeEventListener(k, fn) { this.listeners[k]?.delete(fn); }, dispatchEvent(event) { this.inputs++; for (const fn of [...(this.listeners[event.type] || [])]) fn(event); }, focus() { this.focused++; } }]));
  const statuses = [node(), node()];
  const buttons = ['a','b'].map((id, i) => ({ ...node(), dataset: { voiceTarget: id }, disabled: false, events: {}, parentElement: { querySelector: () => statuses[i] }, addEventListener(k, fn) { this.events[k] = fn; }, click() { if (!this.disabled) this.events.click?.(); } }));
  const select = { value: bookLanguage || 'de-DE', events: {}, getAttribute: key => bookLanguage ? ({ name: 'dictationLanguage', form: 'spl-book-settings' }[key] || null) : null, querySelector: () => ({}), addEventListener(k, fn) { this.events[k] = fn; }, change(value) { this.value = value; this.events.change(); } };
  class Recognition {
    constructor() { state.instances++; state.recognition = this; }
    start() { if (state.startError) throw state.startError; state.starts++; if (!delayedStart) this.onstart?.(); }
    stop() { state.stops++; if (state.stopError) throw state.stopError; if (!delayedEnd) state.ending = this.onend?.(); }
  }
  const document = {
    querySelector: s => s === '[data-voice-language]' ? select : null,
    querySelectorAll: s => s === '[data-voice-target]' ? buttons : [],
    getElementById: id => targets[id] || state.styles.find(s => s.id === id) || null,
    createElement: () => node(), head: { append: n => state.styles.push(n) },
    body: { classList: { contains: c => c === 'studio-editor-page' } }
  };
  vm.runInNewContext(source, {
    document, window: supported ? { SpeechRecognition: Recognition } : {},
    localStorage: { getItem: () => storedLanguage, setItem() {} }, Event: class { constructor(type) { this.type = type; } },
    fetch: (url, options) => new Promise((resolve, reject) => state.requests.push({ url, body: JSON.parse(options.body), resolve, reject }))
  });
  return {
    state, targets, buttons, statuses, select, document,
    edit(id, value, type = 'input') { targets[id].value = value; targets[id].dispatchEvent({ type }); },
    results(items, resultIndex = 0) { const results = items.map(([text, final]) => Object.assign([{ transcript: text }], { isFinal: final })); state.recognition.onresult({ resultIndex, results }); },
    result(text, final = true) { const r = [{ transcript: text }]; r.isFinal = final; state.recognition.onresult({ resultIndex: 0, results: [r] }); },
    end() { return state.recognition.onend(); },
    resolve(index, text, ok = true) { state.requests[index].resolve({ ok, json: async () => ({ text }) }); }
  };
}
