import localizedWorker from "./i18n-worker.js";

const PUBLIC_LOCALES = new Set(["de", "en"]);
const CANONICAL_SCOPE_VALUES = [
  "Una stagione decisiva",
  "Una vita intera",
  "Una storia generazionale",
  "Un’impresa e la sua visione"
];
const CANONICAL_GOVERNANCE_VALUES = [
  "Livello 1 · Assistenza guidata",
  "Livello 2 · Coerenza editoriale",
  "Livello 3 · Supervisione umana",
  "Livello 4 · Accompagnamento dedicato"
];

const LONG_FORM = {
  de: [
    ["«La cucina di mia nonna non era stata pensata per contenere una famiglia intera. Era una stanza piccola, raccolta, con pochi mobili e un’unica finestra dalla quale entrava una luce chiara, soprattutto nelle mattine d’inverno. Eppure, ogni domenica, accadeva qualcosa di misterioso: le pareti sembravano arretrare di qualche passo per lasciarci entrare tutti.", "«Die Küche meiner Großmutter war nie dafür gedacht, eine ganze Familie aufzunehmen. Es war ein kleiner, geschützter Raum mit wenigen Möbeln und einem einzigen Fenster, durch das vor allem an Wintermorgen ein klares Licht fiel. Und doch geschah jeden Sonntag etwas Geheimnisvolles: Die Wände schienen ein paar Schritte zurückzuweichen, damit wir alle Platz fanden."],
    ["Il tavolo occupava quasi tutto lo spazio. Durante la settimana sembrava un tavolo qualunque, ma la domenica diventava il centro del nostro mondo. Veniva allungato con assi che comparivano da qualche angolo della casa e ricoperto con la tovaglia migliore, quella bianca, un po’ ruvida, che mia nonna conservava piegata con cura in un cassetto. Intorno si sistemavano sedie diverse tra loro, prese dalla cucina, dal soggiorno e perfino dalle camere. Per i più piccoli c’erano gli sgabelli, oppure qualche cuscino aggiunto per farli arrivare all’altezza del piatto.", "Der Tisch nahm fast den ganzen Raum ein. Unter der Woche wirkte er wie ein ganz gewöhnlicher Tisch, doch am Sonntag wurde er zum Mittelpunkt unserer Welt. Er wurde mit Brettern verlängert, die aus irgendeiner Ecke des Hauses hervorkamen, und mit der besten Tischdecke bedeckt, jener weißen, ein wenig rauen, die meine Großmutter sorgfältig gefaltet in einer Schublade aufbewahrte. Rundherum standen ganz unterschiedliche Stühle aus Küche, Wohnzimmer und sogar den Schlafzimmern. Für die Kleinsten gab es Hocker oder ein zusätzliches Kissen, damit sie hoch genug zum Teller kamen."],
    ["Non ricordo di aver mai sentito qualcuno lamentarsi della mancanza di spazio. Ci stringevamo, spostavamo i gomiti, passavamo i piatti sopra le teste e ci alzavamo ogni volta che qualcuno doveva raggiungere il proprio posto. Tutto avveniva in una confusione allegra e perfettamente organizzata. Mia nonna sembrava conoscere una geometria segreta: sapeva dove far sedere ciascuno, come riempire ogni angolo e come aggiungere un posto anche quando sembrava davvero impossibile.", "Ich kann mich nicht erinnern, jemals jemanden über den Platzmangel klagen gehört zu haben. Wir rückten zusammen, zogen die Ellbogen ein, reichten Teller über die Köpfe hinweg und standen auf, wenn jemand zu seinem Platz musste. Alles geschah in einem fröhlichen und zugleich vollkommen organisierten Durcheinander. Meine Großmutter schien eine geheime Geometrie zu kennen: Sie wusste, wo jeder sitzen sollte, wie sich jeder Winkel nutzen ließ und wie man noch einen Platz schuf, selbst wenn es wirklich unmöglich schien."],
    ["Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»,", "Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte: die Sauce, die langsam vor sich hin köchelte, das Fleisch …»,"]
  ],
  en: [
    ["«La cucina di mia nonna non era stata pensata per contenere una famiglia intera. Era una stanza piccola, raccolta, con pochi mobili e un’unica finestra dalla quale entrava una luce chiara, soprattutto nelle mattine d’inverno. Eppure, ogni domenica, accadeva qualcosa di misterioso: le pareti sembravano arretrare di qualche passo per lasciarci entrare tutti.", "“My grandmother’s kitchen had never been designed to hold an entire family. It was a small, intimate room with little furniture and a single window through which clear light entered, especially on winter mornings. Yet every Sunday something mysterious happened: the walls seemed to step back a little to let us all in."],
    ["Il tavolo occupava quasi tutto lo spazio. Durante la settimana sembrava un tavolo qualunque, ma la domenica diventava il centro del nostro mondo. Veniva allungato con assi che comparivano da qualche angolo della casa e ricoperto con la tovaglia migliore, quella bianca, un po’ ruvida, che mia nonna conservava piegata con cura in un cassetto. Intorno si sistemavano sedie diverse tra loro, prese dalla cucina, dal soggiorno e perfino dalle camere. Per i più piccoli c’erano gli sgabelli, oppure qualche cuscino aggiunto per farli arrivare all’altezza del piatto.", "The table took up almost all the space. During the week it looked like any other table, but on Sundays it became the centre of our world. It was extended with boards that appeared from some corner of the house and covered with the best tablecloth, the white, slightly rough one my grandmother kept carefully folded in a drawer. Around it came mismatched chairs from the kitchen, the sitting room and even the bedrooms. For the youngest there were stools, or an extra cushion to bring them up to the height of their plate."],
    ["Non ricordo di aver mai sentito qualcuno lamentarsi della mancanza di spazio. Ci stringevamo, spostavamo i gomiti, passavamo i piatti sopra le teste e ci alzavamo ogni volta che qualcuno doveva raggiungere il proprio posto. Tutto avveniva in una confusione allegra e perfettamente organizzata. Mia nonna sembrava conoscere una geometria segreta: sapeva dove far sedere ciascuno, come riempire ogni angolo e come aggiungere un posto anche quando sembrava davvero impossibile.", "I do not remember ever hearing anyone complain about the lack of space. We squeezed closer, shifted our elbows, passed dishes over one another’s heads and stood up whenever someone needed to reach their seat. Everything happened in cheerful, perfectly organised confusion. My grandmother seemed to know a secret geometry: she knew where everyone should sit, how to fill every corner and how to add one more place even when it truly seemed impossible."],
    ["Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»,", "She had already been at the stove for hours. When we arrived, the house was full of aromas: the sauce simmering slowly, the meat…” ,"]
  ]
};

const DYNAMIC = {
  de: {
    slider: "% Werk",
    authorFallback: "des Autors",
    validation: "Bitte gib mindestens drei durch Kommas getrennte Wörter ein.",
    ratingHigh: "Erzählstruktur mit hoher narrativer Dichte",
    ratingDefined: "Klar definierte Erzählstruktur",
    ratingLow: "Erzählkern, der weiter vertieft werden sollte",
    nextRich: "Empfohlener nächster Schritt: Ordne die ausgewählten Wendepunkte chronologisch und verknüpfe sie jeweils mit Personen, Daten, Orten und verfügbaren Dokumenten.",
    nextSparse: "Empfohlener nächster Schritt: Ergänze mindestens drei konkrete Wendepunkte und gib jeweils Personen, Daten, Orte und Folgen an.",
    interviewFallback: "Im Interview weiter vertiefen",
    dateLocale: "de-DE",
    scopes: {
      "Una stagione decisiva": "Eine entscheidende Lebensphase",
      "Una vita intera": "Ein ganzes Leben",
      "Una storia generazionale": "Eine generationenübergreifende Geschichte",
      "Un’impresa e la sua visione": "Ein Unternehmen und seine Vision"
    }
  },
  en: {
    slider: "% Work",
    authorFallback: "the Author",
    validation: "Please enter at least three comma-separated words.",
    ratingHigh: "High-density narrative structure",
    ratingDefined: "Well-defined narrative structure",
    ratingLow: "Narrative core to develop further",
    nextRich: "Recommended next step: place the selected turning points in chronological order and link each one to people, dates, places and available documents.",
    nextSparse: "Recommended next step: add at least three concrete turning points, identifying the people, dates, places and consequences for each one.",
    interviewFallback: "To be explored further in the interview",
    dateLocale: "en-GB",
    scopes: {
      "Una stagione decisiva": "A decisive season",
      "Una vita intera": "A whole life",
      "Una storia generazionale": "A generational story",
      "Un’impresa e la sua visione": "A company and its vision"
    }
  }
};

function replaceAll(source, from, to) {
  return String(source).split(from).join(to);
}

function repairSequentialValues(html, name, canonicalValues) {
  let index = 0;
  const pattern = new RegExp(`(<input[^>]*name="${name}"[^>]*value=")[^"]*("[^>]*>)`, "g");
  return html.replace(pattern, (match, before, after) => {
    const value = canonicalValues[index++];
    return value ? `${before}${value}${after}` : match;
  });
}

function repairGovernanceValues(html) {
  return html.replace(/(<select[^>]*name="governance"[^>]*>)([\s\S]*?)(<\/select>)/, (match, start, body, end) => {
    let index = 0;
    const repaired = body.replace(/(<option value=")[^"]+("[^>]*>)/g, (option, before, after) => {
      const value = CANONICAL_GOVERNANCE_VALUES[index++];
      return value ? `${before}${value}${after}` : option;
    });
    return `${start}${repaired}${end}`;
  });
}

function repairSemanticFormValues(html) {
  return repairGovernanceValues(repairSequentialValues(html, "legacyScope", CANONICAL_SCOPE_VALUES));
}

function patchLongForm(html, locale) {
  let out = html;
  for (const [italian, translated] of LONG_FORM[locale] || []) out = replaceAll(out, italian, translated);
  return out;
}

function patchSplitMarkupCopy(html, locale) {
  if (locale === "de") {
    return html
      .replace("> Ho letto la <a", "> Ich habe die <a")
      .replace("</a> e chiedo di essere ricontattato per questo progetto.", "</a> gelesen und möchte zu diesem Projekt kontaktiert werden.")
      .replace("La tua Scheda Tecnica è stata affidata a Splendoria. Ti risponderemo al più presto.", "Dein Projektblatt wurde an Splendoria übermittelt. Wir melden uns so bald wie möglich.")
      .replace("Controlla i campi obbligatori e riprova.", "Bitte prüfe die Pflichtfelder und versuche es erneut.");
  }
  return html
    .replace("> Ho letto la <a", "> I have read the <a")
    .replace("</a> e chiedo di essere ricontattato per questo progetto.", "</a> and ask to be contacted about this project.")
    .replace("La tua Scheda Tecnica è stata affidata a Splendoria. Ti risponderemo al più presto.", "Your Project Sheet has been entrusted to Splendoria. We will get back to you as soon as possible.")
    .replace("Controlla i campi obbligatori e riprova.", "Please check the required fields and try again.");
}

function attachLocaleToHomepageScript(html, locale) {
  return html.replace(/src="\/assets\/studio\.js\?([^"#]*)"/i, (match, query) => {
    const params = new URLSearchParams(query || "");
    params.set("lang", locale);
    return `src="/assets/studio.js?${params.toString()}"`;
  });
}

function localizeScopeOutputScript(source, locale) {
  const scopes = DYNAMIC[locale].scopes;
  const expression = JSON.stringify(scopes);
  return source.replace(
    "put('[data-assessment-scope]', scope);",
    `put('[data-assessment-scope]', (${expression}[scope] || scope));`
  );
}

function localizeHomepageScript(source, locale) {
  const t = DYNAMIC[locale];
  let out = source;
  out = replaceAll(out, "% Opera", t.slider);
  out = replaceAll(out, "dell’Autore", t.authorFallback);
  out = replaceAll(out, "Inserisci almeno tre parole separate da virgole.", t.validation);
  out = replaceAll(out, "Trama ad alta densità narrativa", t.ratingHigh);
  out = replaceAll(out, "Trama definita", t.ratingDefined);
  out = replaceAll(out, "Nucleo narrativo da approfondire", t.ratingLow);
  out = replaceAll(out, "Prossimo passo consigliato: ordinare i nodi scelti in una cronologia e associare a ciascuno persone, date, luoghi e documenti disponibili.", t.nextRich);
  out = replaceAll(out, "Prossimo passo consigliato: aggiungere almeno tre svolte concrete, indicando per ciascuna persone, date, luoghi e conseguenze.", t.nextSparse);
  out = replaceAll(out, "Da approfondire nell’intervista", t.interviewFallback);
  out = replaceAll(out, "new Intl.DateTimeFormat('it-IT'", `new Intl.DateTimeFormat('${t.dateLocale}'`);
  out = localizeScopeOutputScript(out, locale);
  return out;
}

function localizedHomePath(pathname) {
  const match = pathname.match(/^\/(de|en)\/?$/);
  return match?.[1] || "";
}

function cleanLocalizedHome(html, locale) {
  let out = repairSemanticFormValues(html);
  out = patchLongForm(out, locale);
  out = patchSplitMarkupCopy(out, locale);
  out = attachLocaleToHomepageScript(out, locale);
  return out;
}

function redirectSlash(url, locale) {
  const target = new URL(url.toString());
  target.pathname = `/${locale}/`;
  return Response.redirect(target.toString(), 308);
}

async function fetchGuarded(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method === "GET" && (url.pathname === "/de" || url.pathname === "/en")) {
    return redirectSlash(url, url.pathname.slice(1));
  }

  if (request.method === "GET" && url.pathname === "/assets/studio.js") {
    const locale = url.searchParams.get("lang") || "";
    if (PUBLIC_LOCALES.has(locale)) {
      const response = await localizedWorker.fetch(request, env, ctx);
      const type = response.headers.get("content-type") || "";
      if (!response.ok || !type.includes("javascript")) return response;
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.set("content-language", locale);
      headers.set("cache-control", "public, max-age=300, must-revalidate");
      return new Response(localizeHomepageScript(await response.text(), locale), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }
  }

  const locale = localizedHomePath(url.pathname);
  const response = await localizedWorker.fetch(request, env, ctx);
  if (!locale || request.method !== "GET") return response;
  const type = response.headers.get("content-type") || "";
  if (!response.ok || !type.includes("text/html")) return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("vary");
  headers.set("content-language", locale);
  headers.set("cache-control", "public, max-age=300, stale-while-revalidate=600");
  return new Response(cleanLocalizedHome(await response.text(), locale), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchGuarded,
  email(message, env, ctx) {
    return localizedWorker.email(message, env, ctx);
  },
  scheduled(controller, env, ctx) {
    return localizedWorker.scheduled(controller, env, ctx);
  }
};
