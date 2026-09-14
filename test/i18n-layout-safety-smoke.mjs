import { styles } from "../src/styles.js";
import { localizeClientDeletePanel, localizePrivateFooter } from "../src/i18n-editor-delete-worker.js";

function requireRule(pattern, label) {
  if (!pattern.test(styles)) throw new Error(`layout safety: missing ${label}`);
}

function requireText(fragment, label) {
  if (!styles.includes(fragment)) throw new Error(`layout safety: missing ${label}`);
}

requireRule(/\.navlinks\{[^}]*flex-wrap:wrap/, "wrapping navigation links");
requireRule(/\.actions\{[^}]*flex-wrap:wrap/, "wrapping action groups");
requireRule(/\.footer-links\{[^}]*flex-wrap:wrap/, "wrapping footer links");
requireRule(/\.magic-tools\{[^}]*flex-wrap:wrap/, "wrapping editor tool buttons");
requireRule(/\.tablebox\{[^}]*overflow:auto/, "horizontal containment for wide tables");
requireRule(/\.legal-table-wrap\{[^}]*overflow-x:auto/, "horizontal containment for legal tables");
requireRule(/\.muse \.button\{[^}]*white-space:normal[^}]*text-align:center/, "multiline Muse buttons");
requireText("@media(max-width:700px)", "small-screen breakpoint");
requireText(".studio-editor-page .chapter-compose-form>.actions{display:grid;grid-template-columns:1fr}", "single-column editor actions on small screens");
requireText(".studio-editor-page .chapter-compose-form>.actions .button{width:100%;margin:0}", "full-width editor buttons on small screens");
requireText("@media(max-width:760px)", "showcase mobile breakpoint");
requireText(".legacy-showcase .navin{align-items:flex-start;flex-wrap:wrap;padding:10px 0}", "wrapping showcase navigation on small screens");

const globalButtonRule = styles.match(/\.pill,\.button\{([^}]*)\}/)?.[1] || "";
if (!globalButtonRule) throw new Error("layout safety: global button rule not found");
if (/white-space\s*:\s*nowrap/.test(globalButtonRule)) throw new Error("layout safety: global buttons must not force long translated labels onto one line");

const footer = '<nav class="footer-links" aria-label="Informazioni e assistenza"><a href="/guida">Guida allo Studio</a><a href="/privacy-policy">Privacy Policy</a><a href="/cookie-policy">Cookie Policy</a><a href="/termini-condizioni">Termini e condizioni</a><a href="/note-legali">Note legali</a><a href="/trasparenza-ai">Trasparenza IA</a></nav>';
const deletion = '<details class="book-delete-panel is-compact"><summary class="button danger">Elimina libro</summary><h3>Eliminazione definitiva</h3><strong>Project Aurora</strong><button class="button danger">Elimina definitivamente questo libro</button></details>';

const expectations = {
  de: ["Allgemeine Geschäftsbedingungen", "Studio-Leitfaden", "Rechtliche Hinweise", "KI-Transparenz", "Buch löschen", "Dieses Buch endgültig löschen"],
  en: ["Terms and conditions", "Studio Guide", "Legal notice", "AI transparency", "Delete book", "Permanently delete this book"]
};

for (const locale of ["de", "en"]) {
  const localizedFooter = localizePrivateFooter(footer, locale);
  const localizedDeletion = localizeClientDeletePanel(deletion, locale);
  const output = `${localizedFooter}\n${localizedDeletion}`;
  for (const marker of expectations[locale]) {
    if (!output.includes(marker)) throw new Error(`${locale}: long-label QA marker missing: ${marker}`);
  }
  if (!localizedDeletion.includes("Project Aurora")) throw new Error(`${locale}: authored book title changed during layout-safe localization`);
  if (output.includes("Termini e condizioni") || output.includes("Elimina libro")) throw new Error(`${locale}: Italian long-label residual remains`);
}

console.log("i18n layout safety: long DE/EN labels have wrapping/mobile containment and authored content remains untouched");
