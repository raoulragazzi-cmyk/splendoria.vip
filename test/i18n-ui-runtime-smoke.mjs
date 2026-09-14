import { bindUiMessagesToLocale } from "../src/i18n-ui-runtime-worker.js";

const source = `
const selectedLanguage = () => languageSelect?.value || 'it-IT';
const message = key => (languageMessages[selectedLanguage()] || languageMessages['it-IT'])[key];
recognition.lang = selectedLanguage();
`;

const de = bindUiMessagesToLocale(source, "de");
if (!de.includes("languageMessages['de-DE']")) throw new Error("de: UI dictation status copy does not follow German UI locale");
if (!de.includes("recognition.lang = selectedLanguage();")) throw new Error("de: dictation recognition language was coupled to UI locale");
if (de.includes("languageMessages[selectedLanguage()]")) throw new Error("de: UI status still follows dictation language");

const en = bindUiMessagesToLocale(source, "en");
if (!en.includes("languageMessages['en-GB']")) throw new Error("en: UI dictation status copy does not follow English UI locale");
if (!en.includes("recognition.lang = selectedLanguage();")) throw new Error("en: dictation recognition language was coupled to UI locale");
if (en.includes("languageMessages[selectedLanguage()]")) throw new Error("en: UI status still follows dictation language");

const it = bindUiMessagesToLocale(source, "it");
if (it !== source) throw new Error("it: canonical runtime must remain unchanged");

console.log("ui runtime i18n: interface language stays independent from dictation recognition language");
