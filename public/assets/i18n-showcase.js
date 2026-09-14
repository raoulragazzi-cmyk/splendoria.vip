(() => {
  const lang = document.documentElement.lang === 'de' ? 'de' : document.documentElement.lang === 'en' ? 'en' : '';
  if (!lang) return;

  const maps = {
    de: {
      'Trama ad alta densità narrativa': 'Erzählstruktur mit hoher narrativer Dichte',
      'Trama definita': 'Klar definierte Erzählstruktur',
      'Nucleo narrativo da approfondire': 'Erzählkern weiter vertiefen',
      'Da approfondire nell’intervista': 'Im Interview weiter vertiefen',
      'Prossimo passo consigliato: ordinare i nodi scelti in una cronologia e associare a ciascuno persone, date, luoghi e documenti disponibili.': 'Empfohlener nächster Schritt: Ordnen Sie die gewählten Wendepunkte chronologisch und ergänzen Sie zu jedem Personen, Daten, Orte und verfügbare Dokumente.',
      'Prossimo passo consigliato: aggiungere almeno tre svolte concrete, indicando per ciascuna persone, date, luoghi e conseguenze.': 'Empfohlener nächster Schritt: Ergänzen Sie mindestens drei konkrete Wendepunkte und nennen Sie jeweils Personen, Daten, Orte und Folgen.'
    },
    en: {
      'Trama ad alta densità narrativa': 'High-density narrative structure',
      'Trama definita': 'Clearly defined story structure',
      'Nucleo narrativo da approfondire': 'Narrative core to develop further',
      'Da approfondire nell’intervista': 'To be explored further in the interview',
      'Prossimo passo consigliato: ordinare i nodi scelti in una cronologia e associare a ciascuno persone, date, luoghi e documenti disponibili.': 'Recommended next step: place the selected turning points in chronological order and associate people, dates, places and available documents with each one.',
      'Prossimo passo consigliato: aggiungere almeno tre svolte concrete, indicando per ciascuna persone, date, luoghi e conseguenze.': 'Recommended next step: add at least three concrete turning points, giving people, dates, places and consequences for each one.'
    }
  };

  const selectors = ['[data-assessment-rating]', '[data-assessment-next]', '[data-assessment-turning]'];
  const translateNode = node => {
    if (!node) return;
    const value = node.textContent.trim();
    if (maps[lang][value]) node.textContent = maps[lang][value];
  };

  const dateNode = document.querySelector('[data-assessment-date]');
  const localizeDate = () => {
    if (!dateNode || !dateNode.textContent.trim()) return;
    dateNode.textContent = new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'long' }).format(new Date());
  };

  const localizeAssessment = () => {
    selectors.forEach(selector => translateNode(document.querySelector(selector)));
    localizeDate();
    const subject = document.querySelector('[data-assessment-subject]');
    const author = document.querySelector('[data-assessment-author]')?.textContent.trim();
    if (subject && author) subject.value = lang === 'de' ? `Redaktionelle Bestandsaufnahme · ${author}` : `Editorial assessment · ${author}`;
  };

  const output = document.querySelector('[data-assessment-output]');
  if (output) {
    new MutationObserver(localizeAssessment).observe(output, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-assessment-generate]')) setTimeout(localizeAssessment, 0);
  });
  localizeAssessment();
})();
