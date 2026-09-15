import studioDeepWorker from "./studio-deep-i18n-worker.js";
import { applyGermanGhostwriter } from "./german-ghostwriter-worker.js";
import { applyGermanStyleV2 } from "./german-ghostwriter-style-v2-worker.js";
import { projectIdFromPath, readPreference } from "./studio-language-worker.js";

const ROOM_MARKER = "INTERNE REDAKTION SPLENDORIA — DEUTSCH";
const GERMAN_CONTEXT = /PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH|VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE|LINGUA DELL'OPERA:\s*TEDESCO/i;

const ROLE_CONTRACTS = {
  ghostwriter: `ROLLE — GHOSTWRITER
Du bist in diesem Arbeitsgang der Ghostwriter. Schreibe oder entwickle Text aus dem freigegebenen Material, ohne die Persönlichkeit des Autors durch eine neutrale KI-Stimme zu ersetzen.
- Quellen und bereits gelieferte Fakten bilden die absolute Grenze des Erfindbaren.
- Verdichte, ordne und erzähle; ergänze keine Dialoge, Gedanken, Motive, Sinneseindrücke, Daten oder Kausalitäten, die nicht belegt sind.
- Gib wichtigen belegten Momenten Raum und halte Übergänge knapp, wenn das Material dünn ist.
- Schreibe modernes, idiomatisches Deutsch mit natürlichem Rhythmus. Der Text soll wie die sehr gut redigierte Fassung der Stimme des Autors wirken, nicht wie eine Übersetzung und nicht wie generische KI-Prosa.
- Bei zu wenig Material: enger und kürzer schreiben statt Lücken zu füllen.`,

  lektor: `ROLLE — LEKTOR
Du bist in diesem Arbeitsgang der konservative Lektor. Verbessere Sprache, ohne den Inhalt neu zu schreiben.
- Korrigiere Orthografie, Grammatik, Kasus, Kongruenz, Verbposition, Präpositionen, Zeichensetzung, unklare Bezüge und inkonsistente Zeitformen.
- Bewahre Bedeutung, Fakten, Erzählperspektive, Reihenfolge, Ton, charakteristische Wortwahl und Absatzlogik, soweit sie sprachlich funktionieren.
- Keine neuen Beispiele, Bilder, Dialoge, Details oder Deutungen hinzufügen.
- Eine eigenwillige, glaubwürdige Autorenformulierung darf stehen bleiben, wenn sie korrekt und verständlich ist.
- Ziel ist ein druckreifer Text, nicht ein stilistisch anderer Text.`,

  stilredaktion: `ROLLE — STILREDAKTION
Du bist in diesem Arbeitsgang die Stilredaktion. Arbeite am vorhandenen Text, nicht an den Tatsachen.
- Verbessere Lesefluss, Rhythmus, Präzision, Übergänge und Wortwahl, ohne Information, Perspektive oder Stimme zu verändern.
- Entferne unnötige Wiederholungen, Füllwörter, schwache Verb-Substantiv-Konstruktionen, Bürokratendeutsch, Werbefloskeln und erkennbare KI-Muster.
- Variiere Satzlängen organisch; keine dekorative Eleganz, keine künstlichen Synonyme und keine Pathos-Steigerung.
- Nutze frisches, heutiges Standarddeutsch, aber kein erzwungenes Jugendvokabular, keine Trendwörter und kein unnötiges Denglisch.
- Wenn eine stilistische Verbesserung neue Tatsachen voraussetzen würde, unterlasse sie.`,

  faktenkontrolle: `ROLLE — FAKTENKONTROLLE
Du bist in diesem Arbeitsgang ausschließlich die Fakten- und Quellenkontrolle. Du schreibst den Text nicht neu.
- Vergleiche den zu prüfenden Text ausschließlich mit den autorisierten Quellen und Angaben im aktuellen Auftrag.
- Prüfe besonders Namen, Daten, Zahlen, Orte, Beziehungen, Chronologie, Zitate, zugeschriebene Aussagen, Motive, Gefühle, Sinneseindrücke, Ursachen und Folgen.
- Jede konkrete Behauptung, die nicht durch die gelieferten Quellen gedeckt ist, gilt als nicht belegt. Plausibilität ist kein Beleg.
- Sprachliche Schönheit darf eine faktische Abweichung niemals rechtfertigen.
- Wenn der aufrufende Systemvertrag eine exakte maschinenlesbare Antwort wie APPROVATO, RIFIUTATO oder [FONTI_INSUFFICIENTI] verlangt, gib ausschließlich den dort verlangten Token zurück: keine Erklärung, kein Präfix, keine Übersetzung.`
};

const STYLE_ACTIONS = {
  improve: `AUFTRAG — ALLGEMEINE STILVERBESSERUNG
Verbessere Klarheit, Rhythmus und Präzision moderat. Bewahre Länge und Eigenart, sofern kein offensichtlicher Ballast vorliegt.`,
  clarity: `AUFTRAG — KLARHEIT UND FLUSS
Mache Bezüge eindeutig, entzerre unnötig komplizierte Sätze und verbessere Übergänge. Vereinfache nicht auf Kosten von Nuancen.`,
  emotional: `AUFTRAG — EMOTIONALE WIRKUNG
Verstärke nur die emotionale Wirkung, die bereits durch belegte Ereignisse, Aussagen oder Reaktionen im Text angelegt ist. Keine Gefühle, Motive oder dramatischen Details erfinden.`,
  vivid: `AUFTRAG — ANSCHAULICHKEIT
Mache vorhandene, belegte Details klarer und konkreter. Keine Farben, Gerüche, Gesten, Räume oder Sinneseindrücke ergänzen, die nicht im Material stehen.`,
  elegant: `AUFTRAG — ELEGANZ
Glätte Rhythmus, Syntax und Wortwahl mit Zurückhaltung. Eleganz bedeutet Präzision und Leichtigkeit, nicht gehobene Ersatzwörter oder literarische Verzierung.`,
  short: `AUFTRAG — VERDICHTUNG
Kürze Wiederholungen, Umwege und Füllwörter. Erhalte alle eigenständigen Fakten, notwendigen Bezüge, wichtigen Nuancen und die Stimme des Autors.`
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

export function isGermanMachineControl(options) {
  const text = instructionText(options);
  const hasToken = /APPROVATO|RIFIUTATO|\[FONTI_INSUFFICIENTI\]/.test(text);
  const hasControlIntent = /controllo qualit|controllo.*fedelt|valuta|verifica|fonti insufficienti|fonti.*sufficient/i.test(text);
  return hasToken && hasControlIntent;
}

export function canonicalEditorialPath(pathname) {
  const stripped = String(pathname || "/").replace(/^\/(?:de|en)(?=\/|$)/, "");
  return stripped || "/";
}

export function editorialRequestRole(pathname, action = "") {
  const path = canonicalEditorialPath(pathname);
  if (/^\/libro\/[^/]+\/(?:affidati|struttura|intervista)$/.test(path)) return "ghostwriter";
  if (/^\/libro\/[^/]+\/risposte\/affidati$/.test(path)) return "ghostwriter";
  if (/^\/libro\/[^/]+\/capitolo\/[^/]+\/genera$/.test(path)) return "ghostwriter";
  if (/^\/libro\/[^/]+\/migliora$/.test(path)) return "stilredaktion";
  if (/^\/libro\/[^/]+\/risposte\/migliora$/.test(path)) return "stilredaktion";
  if (/^\/libro\/[^/]+\/capitolo\/[^/]+\/rifinisci$/.test(path)) return action === "grammar" ? "lektor" : "stilredaktion";
  return "";
}

export function editorialDefaultAction(pathname) {
  const path = canonicalEditorialPath(pathname);
  if (/^\/libro\/[^/]+\/migliora$/.test(path)) return "improve";
  if (/^\/libro\/[^/]+\/risposte\/migliora$/.test(path)) return "improve";
  return "";
}

function editorialBlock(role, action) {
  const main = ROLE_CONTRACTS[role] || ROLE_CONTRACTS.ghostwriter;
  const task = role === "stilredaktion" && STYLE_ACTIONS[action] ? `\n\n${STYLE_ACTIONS[action]}` : "";
  return `${ROOM_MARKER}\n${main}${task}`;
}

export function applyGermanEditorialRole(options, requestedRole = "ghostwriter", action = "") {
  if (!options || typeof options !== "object") return options;
  const existing = instructionText(options);
  if (existing.includes(ROOM_MARKER)) return options;

  const machineControl = isGermanMachineControl(options);
  if (!machineControl && !GERMAN_CONTEXT.test(existing)) return options;
  const role = machineControl ? "faktenkontrolle" : requestedRole;
  if (!ROLE_CONTRACTS[role]) return options;
  const block = editorialBlock(role, action);
  const out = { ...options };

  if (Array.isArray(options.messages)) {
    let injected = false;
    out.messages = options.messages.map(message => {
      if (injected || message?.role !== "system" || typeof message.content !== "string") return message;
      injected = true;
      return { ...message, content: `${block}\n\n${message.content}` };
    });
    if (!injected) out.messages = [{ role: "system", content: block }, ...out.messages];
  } else if (typeof options.prompt === "string") {
    out.prompt = `${block}\n\n${options.prompt}`;
  } else {
    return options;
  }

  return out;
}

export function composeGermanEditorialOptions(options, role, action = "") {
  if (!options || typeof options !== "object") return options;
  if (isGermanMachineControl(options)) return applyGermanEditorialRole(options, "faktenkontrolle", action);
  if (role === "lektor") return applyGermanEditorialRole(options, "lektor", action);
  const ghostwritten = applyGermanGhostwriter(options);
  const styled = applyGermanStyleV2(ghostwritten);
  return applyGermanEditorialRole(styled, role, action);
}

async function requestAction(request, pathname) {
  const defaultAction = editorialDefaultAction(pathname);
  if (defaultAction) return defaultAction;
  if (!/\/rifinisci$/.test(canonicalEditorialPath(pathname))) return "";
  try {
    const form = await request.clone().formData();
    return String(form.get("action") || "");
  } catch {
    return "";
  }
}

function envWithEditorialRoom(env, role, action) {
  if (!env?.AI?.run || !role) return env;
  const binding = env.AI;
  const wrapped = Object.create(env);
  Object.assign(wrapped, env);
  wrapped.AI = {
    run(model, options) {
      return binding.run(model, composeGermanEditorialOptions(options, role, action));
    }
  };
  return wrapped;
}

async function editorialFetch(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method !== "POST") return studioDeepWorker.fetch(request, env, ctx);

  const initialRole = editorialRequestRole(url.pathname);
  if (!initialRole) return studioDeepWorker.fetch(request, env, ctx);

  const projectId = projectIdFromPath(url.pathname);
  if (!projectId) return studioDeepWorker.fetch(request, env, ctx);

  const pref = await readPreference(env, projectId);
  const language = pref.museOutputLanguage || pref.bookLanguage || "it-IT";
  if (language !== "de-DE") return studioDeepWorker.fetch(request, env, ctx);

  const action = await requestAction(request, url.pathname);
  const role = editorialRequestRole(url.pathname, action) || initialRole;
  return studioDeepWorker.fetch(request, envWithEditorialRoom(env, role, action), ctx);
}

export default {
  fetch: editorialFetch,
  email(message, env, ctx) { return studioDeepWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return studioDeepWorker.scheduled(controller, env, ctx); }
};
