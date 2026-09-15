import ghostwriterWorker from "./german-ghostwriter-worker.js";

const BASE_MARKER = "PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH";
const STYLE_V2_MARKER = "ZEITGENÖSSISCHER GHOSTWRITER-STILPASS V2 — DEUTSCH";

const DE_STYLE_V2_CORE = `${STYLE_V2_MARKER}
Dieser zusätzliche Stilpass verfeinert ausschließlich neu erzeugten deutschen Text. Er darf niemals Fakten, Zitate, Namen, Zahlen, Chronologie, Beziehungen oder die erkennbare Stimme des Autors verändern.

SPRACHZIEL 2026: MODERN, FRISCH, UNAUFDRINGLICH
- Schreibe zeitgemäßes, idiomatisches Hochdeutsch, das im gesamten DACH-Raum natürlich wirkt. Moderne Sprache bedeutet Klarheit, Präzision und lebendigen Rhythmus, nicht Slang oder modische Effekte.
- Bevorzuge starke, konkrete Verben und anschauliche, alltägliche Wörter vor abstrakten Konstruktionen. Wo möglich: „entscheiden“ statt „eine Entscheidung treffen“, „prüfen“ statt „einer Prüfung unterziehen“, „zeigen“ statt „zum Ausdruck bringen“ — aber nur, wenn Bedeutung und Ton vollständig erhalten bleiben.
- Reduziere unnötige Verwaltungsformeln wie „im Rahmen von“, „in Bezug auf“, „im Zuge dessen“, „hinsichtlich“, „seitens“ oder „unter Beweis stellen“, wenn eine einfachere Formulierung präziser klingt.
- Vermeide modische Buzzwords, Marketingvokabular und leere Wertwörter wie „einzigartig“, „innovativ“, „authentisch“, „nachhaltig“, „spannend“ oder „visionär“, sofern die Quelle oder der fachliche Kontext sie nicht wirklich trägt.
- Vermeide überalterte Füllformen und steife Relativkonstruktionen, wenn modernes Deutsch direkter sein kann. Kein künstlich „literarisches“ Vokabular nur um Eleganz zu signalisieren.

DACH- UND ZEITKONTEXT
- Regionale Begriffe, Ortsnamen, Institutionen und kulturelle Besonderheiten aus Deutschland, Österreich, der Schweiz oder Südtirol bleiben erhalten, wenn sie aus den Quellen stammen. Nicht unnötig „eindeutschen“ oder vereinheitlichen.
- Zeitgenössische Erzählsprache darf modern sein; historische Zitate, zeitgebundene Begriffe und die Sprache realer Dokumente dürfen nicht modernisiert oder anachronistisch umgeschrieben werden.
- Bei beruflichen Themen etablierte Fachsprache erhalten. Anglizismen nur nutzen, wenn sie im konkreten Feld tatsächlich üblich sind und zur Stimme des Autors passen.

MIKROSTIL UND RHYTHMUS
- Vermeide Serien identisch gebauter Sätze, gleich lange Absätze und wiederholte Einstiege mit „Ich“, „Dann“, „Doch“, „Dabei“ oder „Es war“.
- Nutze Absatzwechsel dort, wo Gedanke, Zeit, Ort, Sprecher oder emotionale Bewegung wirklich wechseln; keine dekorativen Ein-Satz-Absätze in Serie.
- Setze Doppelpunkte, Gedankenstriche, Semikolons und Klammern gezielt und sparsam ein. Satzzeichen dürfen nicht zum Stil-Ersatz werden.
- Vermeide formelhafte Kontraste in Serie: „nicht nur … sondern auch“, „nicht X, sondern Y“, „mehr als nur …“. Wenn der Gegensatz wichtig ist, variiere die Konstruktion natürlich.
- Vermeide künstliche Schluss-Sätze, die jede Passage philosophisch aufladen. Ein Kapitel darf ruhig, offen oder sachlich enden, wenn das Material das trägt.

ERZÄHLÖKONOMIE
- Beginne möglichst dort, wo etwas Relevantes geschieht, erinnert, entschieden oder erkannt wird. Keine allgemeinen Vorreden, wenn die Quellen einen konkreten Einstieg erlauben.
- Verdichte Wiederholungen, aber lösche keine biografisch wichtigen Nuancen. Zwei ähnliche Aussagen dürfen zusammengeführt werden, wenn dabei keine Information verloren geht.
- Gib wichtigen Momenten Raum und überbrücke Routine knapp. Länge folgt Bedeutung und Quellenlage, nicht einem starren Muster.
- Nutze konkrete Details nur, wenn sie belegt sind. Fehlen Details, bleibe präzise und schlicht statt Atmosphäre zu erfinden.

STIMME VOR SCHÖNHEIT
- Bewahre individuelle Eigenheiten, sofern sie verständlich und funktional sind. Professionelles Ghostwriting bedeutet Veredelung, nicht Austausch der Persönlichkeit.
- Ein schlichter, glaubwürdiger Satz ist besser als eine elegante Formulierung, die der Autor niemals sagen würde.
- Humor, Ironie, Understatement, Direktheit und Emotionalität nur in der Stärke einsetzen, die aus Material und Tonprofil hervorgeht.

ANTI-KI-LEKTORAT
Prüfe vor der Ausgabe zusätzlich still:
- Klingt eine Passage nach generischer Motivationsprosa oder Unternehmensbroschüre? Dann konkretisieren oder zurücknehmen.
- Wiederholen sich rhetorische Muster, Dreierfiguren, Gegensatzpaare oder pathetische Übergänge? Dann variieren oder streichen.
- Enthält der Text unbelegte Deutungen wie „ich wusste“, „mir wurde klar“, „es sollte sich zeigen“, „das veränderte alles“? Nur behalten, wenn die Quelle das tatsächlich trägt.
- Könnte ein präziseres Verb ein schwaches Verb plus Substantiv ersetzen, ohne den Ton zu verfälschen? Dann bevorzugen.
- Ist ein modernes Wort nur modisch oder wirklich natürlich? Im Zweifel die zeitbeständigere, idiomatische Form wählen.`;

const DE_GENRE_PROFILES = {
  autobiografie: `GENREPROFIL — AUTOBIOGRAFIE
- Erste Person und persönliche Perspektive konsequent halten.
- Biografische Fakten klar verankern; Reflexion darf vertiefen, aber keine späteren Einsichten rückwirkend als damaliges Wissen darstellen.
- Konkrete Lebensmomente vor allgemeinen Selbstbeschreibungen bevorzugen.`,
  memoir: `GENREPROFIL — MEMOIR
- Thematische Erinnerung und innere Entwicklung vor lückenloser Chronik priorisieren.
- Szenen und Reflexion ineinandergreifen lassen, ohne unbelegte Details zu ergänzen.
- Wiederkehrende Motive nur dann aufnehmen, wenn sie im Material tatsächlich vorhanden sind; nicht künstlich symbolisieren.`,
  familiengeschichte: `GENREPROFIL — FAMILIENGESCHICHTE
- Generationen, Verwandtschaftsverhältnisse, Zeiträume und Ortswechsel besonders klar führen.
- Respektvoll und warm schreiben, aber familiäre Konflikte oder Gefühle nicht glätten oder dramatisieren.
- Namen und Rollen früh genug wiederholen, damit Pronomen nie unklar werden.`,
  unternehmensbiografie: `GENREPROFIL — UNTERNEHMENSBIOGRAFIE
- Menschliche Entscheidungen, Wendepunkte und konkrete Arbeit vor Selbstdarstellung stellen.
- Keine PR-Superlative, keine unbelegten Marktführerschafts- oder Innovationsbehauptungen.
- Zahlen, Produkte, Funktionen und Fachbegriffe konsistent benennen; geschäftliche Entwicklung verständlich erzählen statt in Chronikstil aufzulisten.`,
  roman: `GENREPROFIL — ROMAN / NARRATIVE LITERARISCHE FORM
- Nur mit den vom Autor gelieferten fiktionalen Prämissen, Figurenmerkmalen und Ereignissen arbeiten; keine neuen kanonischen Fakten einschmuggeln.
- Szenische Dynamik, Perspektive und Spannung handwerklich stärken, ohne Stilkopien realer Autoren.
- Dialoge dürfen nur dann frei ausgestaltet werden, wenn der Auftrag ausdrücklich fiktionales Erfinden erlaubt; bei autobiografischem Material bleibt die strengere Quellenregel maßgeblich.`
};

function instructionText(options) {
  const parts = [];
  if (typeof options?.prompt === "string") parts.push(options.prompt);
  if (Array.isArray(options?.messages)) {
    for (const message of options.messages) {
      if (message?.role === "system" && typeof message.content === "string") parts.push(message.content);
    }
  }
  return parts.join("\n");
}

function allText(options) {
  const parts = [instructionText(options)];
  if (Array.isArray(options?.messages)) {
    for (const message of options.messages) if (typeof message?.content === "string") parts.push(message.content);
  }
  return parts.join("\n");
}

export function detectGermanGenre(options) {
  const text = allText(options);
  const explicit = text.match(/(?:Genere|Genre|Gattung)\s*:\s*([^\n.]+)/i)?.[1]?.trim().toLowerCase() || "";
  if (/autobiografia|autobiografie|autobiography/.test(explicit)) return "autobiografie";
  if (/memoriale|memoir|memoiren/.test(explicit)) return "memoir";
  if (/storia di famiglia|familiengeschichte|family history/.test(explicit)) return "familiengeschichte";
  if (/biografia aziendale|unternehmensbiografie|company biography|corporate biography/.test(explicit)) return "unternehmensbiografie";
  if (/romanzo|roman|novel/.test(explicit)) return "roman";
  return "";
}

function isMachineControl(options) {
  const text = instructionText(options);
  return /APPROVATO|RIFIUTATO|\[FONTI_INSUFFICIENTI\]/.test(text)
    && /controllo qualit|valuta|fonti insufficienti/i.test(text);
}

export function applyGermanStyleV2(options) {
  if (!options || typeof options !== "object") return options;
  const instructions = instructionText(options);
  if (!instructions.includes(BASE_MARKER) || instructions.includes(STYLE_V2_MARKER) || isMachineControl(options)) return options;

  const genre = detectGermanGenre(options);
  const block = [DE_STYLE_V2_CORE, genre ? DE_GENRE_PROFILES[genre] : ""].filter(Boolean).join("\n\n");
  const out = { ...options };

  if (Array.isArray(options.messages)) {
    let injected = false;
    out.messages = options.messages.map(message => {
      if (injected || message?.role !== "system" || typeof message.content !== "string") return message;
      injected = true;
      return { ...message, content: `${block}\n\n${message.content}` };
    });
  } else if (typeof options.prompt === "string") {
    out.prompt = `${block}\n\n${options.prompt}`;
  }

  return out;
}

function envWithGermanStyleV2(env) {
  if (!env?.AI?.run) return env;
  const binding = env.AI;
  const wrapped = Object.create(env);
  Object.assign(wrapped, env);
  wrapped.AI = {
    run(model, options) {
      return binding.run(model, applyGermanStyleV2(options));
    }
  };
  return wrapped;
}

export default {
  fetch(request, env, ctx) { return ghostwriterWorker.fetch(request, envWithGermanStyleV2(env), ctx); },
  email(message, env, ctx) { return ghostwriterWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return ghostwriterWorker.scheduled(controller, env, ctx); }
};
