import studioDeepWorker from "./studio-deep-i18n-worker.js";
import { applyGermanGhostwriter } from "./german-ghostwriter-worker.js";
import { applyGermanStyleV2 } from "./german-ghostwriter-style-v2-worker.js";
import { projectIdFromPath, readPreference } from "./studio-language-worker.js";

const ROOM_MARKER = "INTERNE REDAKTION SPLENDORIA — DEUTSCH";
const GERMAN_CONTEXT = /PROFESSIONELLER GHOSTWRITER-MODUS — DEUTSCH|VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE|LINGUA DELL'OPERA:\s*TEDESCO/i;
const GERMAN_EDITOR_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const STYLE_FINGERPRINT_CONTRACT = `STIMMPROFIL — VOR JEDEM EINGRIFF INTERN ERFASSEN
- Bewahre Erzählperson, Zeitform, Erzähldistanz und Grad der emotionalen Offenheit.
- Bewahre die typische Satzlänge und den Rhythmus des Autors. Kurze, nüchterne Sätze dürfen kurz und nüchtern bleiben.
- Bewahre charakteristische Wörter, Understatement, Wiederholungen mit erkennbarer Absicht und belegte regionale Wendungen.
- Hebe das sprachliche Register nicht künstlich an. Ersetze einfache Wörter nicht nur deshalb durch literarischere Synonyme.
- Keine künstliche Pointe, Moral, Lebensweisheit oder abschließende Zusammenfassung ergänzen, wenn sie im Material nicht angelegt ist.
- Ein bereits guter Satz darf unverändert bleiben. Redaktion ist kein Beweis dafür, dass jedes Wort geändert werden muss.`;


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
- Direkte Zitate, ihre Wortfolge, Schreibweise und Anführungszeichen bleiben bytegetreu unverändert.
- Keine neuen Beispiele, Bilder, Dialoge, Details oder Deutungen hinzufügen.
- Eine eigenwillige, glaubwürdige Autorenformulierung darf stehen bleiben, wenn sie korrekt und verständlich ist.
- Ziel ist ein druckreifer Text, nicht ein stilistisch anderer Text.`,

  stilredaktion: `ROLLE — STILREDAKTION
Du bist in diesem Arbeitsgang die Stilredaktion. Arbeite am vorhandenen Text, nicht an den Tatsachen.
- Verbessere Lesefluss, Rhythmus, Präzision, Übergänge und Wortwahl, ohne Information, Perspektive oder Stimme zu verändern.
- Direkte Zitate, ihre Wortfolge, Schreibweise und Anführungszeichen bleiben bytegetreu unverändert.
- Entferne unnötige Wiederholungen, Füllwörter, schwache Verb-Substantiv-Konstruktionen, Bürokratendeutsch, Werbefloskeln und erkennbare KI-Muster.
- Entferne unbelegte Deutungen oder Wertungen aus dem Entwurf, statt sie sprachlich zu veredeln.
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
Verbessere Klarheit, Rhythmus und Präzision moderat. Bewahre Eigenart, Informationsdichte und ungefähr die Länge des Ausgangstextes, sofern kein ausdrückliches Längenziel vorliegt.`,
  clarity: `AUFTRAG — KLARHEIT UND FLUSS
Mache Bezüge eindeutig, entzerre unnötig komplizierte Sätze und verbessere Übergänge. Vereinfache nicht auf Kosten von Nuancen und blähe kurze Sätze nicht auf.`,
  emotional: `AUFTRAG — EMOTIONALE WIRKUNG
Verstärke nur die emotionale Wirkung, die bereits durch belegte Ereignisse, Aussagen oder Reaktionen im Text angelegt ist. Keine Gefühle, Motive oder dramatischen Details erfinden. Understatement des Autors hat Vorrang vor emotionaler Intensivierung.`,
  vivid: `AUFTRAG — ANSCHAULICHKEIT
Mache vorhandene, belegte Details klarer und konkreter. Keine Farben, Gerüche, Gesten, Räume oder Sinneseindrücke ergänzen, die nicht im Material stehen. Wenn keine konkreten Details vorliegen, nicht künstlich anschaulich werden.`,
  elegant: `AUFTRAG — ELEGANZ
Glätte Rhythmus, Syntax und Wortwahl mit Zurückhaltung. Eleganz bedeutet Präzision und Leichtigkeit, nicht gehobene Ersatzwörter, längere Sätze oder literarische Verzierung.`,
  short: `AUFTRAG — VERDICHTUNG
Ziele auf ungefähr 70–80 % der Ausgangslänge. Kürze zuerst Wiederholungen, Umwege und Füllwörter. Erhalte alle eigenständigen Fakten, notwendigen Bezüge, wichtigen Nuancen und die Stimme des Autors.`
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
  const hasVerdictPair = /\bAPPROVATO\b/.test(text) && /\bRIFIUTATO\b/.test(text);
  const hasInsufficientSentinel = /\[FONTI_INSUFFICIENTI\]/.test(text);
  const hasControlIntent = /controllo qualit|controllo.*fedelt|valuta|verifica|fonti.*sufficient|quality control|fidelity check|qualit[aä]tskontroll|quellenkontroll|pr[uü]f/i.test(text);
  const hasRewriteIntent = /riscriv|scrivi|riscrivere|testo revisionato|versione completa e fedele|rewrite|write\b|schreib|[uü]berarbeit|redig/i.test(text);
  if (hasVerdictPair && hasControlIntent) return true;
  return hasInsufficientSentinel && hasControlIntent && !hasRewriteIntent;
}

export function germanEditorialModel(model, options, requestedRole = "ghostwriter") {
  const text = instructionText(options);
  // Faktenkontrolle keeps the model selected by the canonical core. Live
  // benchmarks gave both Qwen and Llama 6/6 on verdict-only fact checks, so
  // there is no evidence that justifies overriding the core here.
  if (isGermanMachineControl(options) || requestedRole === "faktenkontrolle") return model;
  if (requestedRole === "lektor" || requestedRole === "stilredaktion") return GERMAN_EDITOR_MODEL;
  const isExistingFinalEditorialPass = /revisore letterario finale di Splendoria|testo revisionato|Prima di riscrivere, confronta internamente ogni affermazione concreta/i.test(text);
  if (isExistingFinalEditorialPass) return GERMAN_EDITOR_MODEL;

  // Writer calls deliberately keep the model chosen by the canonical core.
  return model;
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

function explicitTargetWords(options) {
  const text = instructionText(options);
  const patterns = [
    /(?:circa|etwa|ungefähr|about|approximately)\s+(\d{2,4})\s+(?:parole|wörter|words)\b/i,
    /(?:obiettivo|ziel|target)\D{0,20}(\d{2,4})\s*(?:parole|wörter|words)\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = Number(match?.[1] || 0);
    if (value >= 20 && value <= 5000) return value;
  }
  return 0;
}

function lengthContract(options, role, action) {
  if (role === "faktenkontrolle") return "";
  const target = explicitTargetWords(options);
  if (target) return `LÄNGENVERTRAG
- Zielgröße: ungefähr ${target} Wörter, normalerweise innerhalb von ±10 %.
- Fakten- und Quellentreue haben Vorrang vor der Zielzahl. Bei zu wenig belastbarem Material bewusst kürzer bleiben; niemals auffüllen oder erfinden.
- Keine Wiederholung, Meta-Erklärung oder künstliche Schlusswendung nur zum Erreichen der Zielzahl.`;
  if (role === "lektor") return `LÄNGENVERTRAG
- Bei reiner Sprachkorrektur die Länge praktisch erhalten; grob 95–105 % des Ausgangstextes.
- Keine zusätzlichen Beispiele, Übergänge oder Schlussgedanken erzeugen.`;
  if (action === "short") return `LÄNGENVERTRAG
- Zielgröße: ungefähr 70–80 % der Ausgangslänge.
- Erst Redundanz und Umwege entfernen; keine eigenständigen Fakten streichen.`;
  if (role === "stilredaktion") return `LÄNGENVERTRAG
- Ohne ausdrückliches Ziel die Textlänge im Regelfall nahe am Ausgangstext halten, ungefähr 90–110 %.
- Kürzer ist erlaubt, wenn nur unbelegte oder redundante Passagen entfernt werden.`;
  return `LÄNGENVERTRAG
- Ohne ausdrückliche Zielzahl bestimmt die Dichte des belegten Materials die Länge.
- Dünnes Material nicht aufblasen; ein kürzerer wahrer Text ist besser als ein längerer erfundener.`;
}

function editorialBlock(role, action, options) {
  const main = ROLE_CONTRACTS[role] || ROLE_CONTRACTS.ghostwriter;
  const style = role === "faktenkontrolle" ? "" : `\n\n${STYLE_FINGERPRINT_CONTRACT}`;
  const task = role === "stilredaktion" && STYLE_ACTIONS[action] ? `\n\n${STYLE_ACTIONS[action]}` : "";
  const length = lengthContract(options, role, action);
  return `${ROOM_MARKER}\n${main}${style}${task}${length ? `\n\n${length}` : ""}`;
}

export function applyGermanEditorialRole(options, requestedRole = "ghostwriter", action = "") {
  if (!options || typeof options !== "object") return options;
  const existing = instructionText(options);
  if (existing.includes(ROOM_MARKER)) return options;
  const machineControl = isGermanMachineControl(options);
  if (!machineControl && !GERMAN_CONTEXT.test(existing)) return options;
  const role = machineControl ? "faktenkontrolle" : requestedRole;
  if (!ROLE_CONTRACTS[role]) return options;
  const block = editorialBlock(role, action, options);
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
      const selectedModel = germanEditorialModel(model, options, role);
      return binding.run(selectedModel, composeGermanEditorialOptions(options, role, action));
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
