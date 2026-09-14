import { localizeEditorConsent } from "../src/i18n-editor-legal-copy-worker.js";

for (const locale of ["de", "en"]) {
  const html = `<label class="legal-check legal-check-panel"><input type="checkbox" name="specialDataConsent" value="yes" required><span>Confermo di poter condividere i contenuti inseriti e, se comprendono dati particolari che mi riguardano, presto il consenso esplicito al loro trattamento per realizzare il libro. Per eventuali dati di terzi dichiaro di averne titolo. <a href="/${locale}/privacy-policy" target="_blank" rel="noopener">Approfondisci</a>.</span></label>`;
  const output = localizeEditorConsent(html, locale);
  if (output.includes("Confermo di poter condividere") || output.includes(">Approfondisci<")) throw new Error(`${locale}: consent copy left in Italian`);
  if (!output.includes('name="specialDataConsent" value="yes"')) throw new Error(`${locale}: consent machine value changed`);
  if (!output.includes(`href="/${locale}/privacy-policy"`)) throw new Error(`${locale}: privacy link left locale namespace`);
  if (locale === "de" && (!output.includes("Ich bestätige") || !output.includes("Mehr erfahren"))) throw new Error("de: consent translation incomplete");
  if (locale === "en" && (!output.includes("I confirm") || !output.includes("Learn more"))) throw new Error("en: consent translation incomplete");
}

const italian = '<span>Confermo di poter condividere</span>';
if (localizeEditorConsent(italian, "it") !== italian) throw new Error("it: canonical consent copy must remain unchanged");

console.log("editor legal i18n: special-data consent copy and machine value DE/EN verified");
