import appWorker from "./studio-worker.js";

const CANONICAL_ORIGIN = "https://www.splendoria.vip";
const LOCALES = Object.freeze({
  it: { path: "/", html: "it", og: "it_IT", label: "IT" },
  de: { path: "/de/", html: "de", og: "de_DE", label: "DE" },
  en: { path: "/en/", html: "en", og: "en_GB", label: "EN" }
});

const PUBLIC_HOME_PATHS = new Map([
  ["/", "it"], ["/de", "de"], ["/de/", "de"], ["/en", "en"], ["/en/", "en"]
]);

const SHARED = [
  ["Come funziona", { de: "So funktioniert es", en: "How it works" }],
  ["Listino", { de: "Preise", en: "Pricing" }],
  ["Guida", { de: "Leitfaden", en: "Guide" }],
  ['aria-label="Informazioni e assistenza"', { de: 'aria-label="Informationen und Unterstützung"' }],
  ["Contattaci", { de: "Kontakt", en: "Contact" }],
  ["Il mio Studio", { de: "Mein Studio", en: "My Studio" }],
  ["Account", { de: "Konto", en: "Account" }],
  ["Esci", { de: "Abmelden", en: "Sign out" }],
  ["La tua vita in un romanzo", { de: "Dein Leben als Roman", en: "Your life as a novel" }],
  ["Guida allo Studio", { de: "Studio-Leitfaden", en: "Studio Guide" }],
  ["Termini e condizioni", { de: "Allgemeine Geschäftsbedingungen", en: "Terms and conditions" }],
  ["Note legali", { de: "Rechtliche Hinweise", en: "Legal notice" }],
  ["Trasparenza IA", { de: "KI-Transparenz", en: "AI transparency" }],
  ["Privacy, senza sorprese", { de: "Datenschutz, ohne Überraschungen", en: "Privacy, without surprises" }],
  ["Usiamo solo strumenti tecnici necessari. Niente pubblicità, niente profilazione. Le bozze possono restare sul tuo dispositivo fino a 12 mesi come copia di sicurezza.", { de: "Wir verwenden nur technisch notwendige Werkzeuge. Keine Werbung, kein Profiling. Entwürfe können als Sicherheitskopie bis zu 12 Monate auf deinem Gerät verbleiben.", en: "We use only technically necessary tools. No advertising, no profiling. Drafts may remain on your device for up to 12 months as a safety copy." }],
  ["Cookie e dati locali", { de: "Cookies und lokale Daten", en: "Cookies and local data" }],
  ["Ho capito", { de: "Verstanden", en: "Got it" }],
  ["Chiudi l’informativa privacy", { de: "Datenschutzhinweis schließen", en: "Close privacy notice" }]
];

const HOME = [
  ["La tua vita in un romanzo.", { de: "Dein Leben als Roman.", en: "Your life as a novel." }],
  ["La tua storia destinata a vivere centinaia di anni.", { de: "Deine Geschichte, bestimmt dafür, Jahrhunderte zu überdauern.", en: "Your story, made to live for centuries." }],
  ["Non lasciare che il tempo sbiadisca ciò che hai costruito. Trasformiamo i tuoi ricordi o la visione della tua impresa in un’opera editoriale d’eccezione, guidata dalle Muse e rifinita attraverso una supervisione umana.", { de: "Lass nicht zu, dass die Zeit verblassen lässt, was du aufgebaut hast. Wir verwandeln deine Erinnerungen oder die Vision deines Unternehmens in ein außergewöhnliches Buchprojekt – geführt von den Musen und durch menschliche Redaktion verfeinert.", en: "Do not let time fade what you have built. We turn your memories or your company’s vision into an exceptional editorial work, guided by the Muses and refined through human supervision." }],
  ["Inizia il tuo libro", { de: "Beginne dein Buch", en: "Start your book" }],
  ["Osserva la trasformazione", { de: "Sieh die Verwandlung", en: "See the transformation" }],
  ["La tua voce resta sovrana", { de: "Deine Stimme bleibt maßgeblich", en: "Your voice remains in control" }],
  ["Supervisione e approvazione umana", { de: "Menschliche Prüfung und Freigabe", en: "Human review and approval" }],
  ["Dati custoditi nell’infrastruttura Splendoria", { de: "Daten geschützt in der Splendoria-Infrastruktur", en: "Data safeguarded within Splendoria infrastructure" }],
  ["Esempio di un libro biografico Splendoria rilegato, con titolo dorato", { de: "Beispiel eines gebundenen biografischen Splendoria-Buchs mit goldgeprägtem Titel", en: "Example of a bound Splendoria biographical book with a gold title" }],
  ["Edizione privata", { de: "Private Edition", en: "Private edition" }],
  ["Esempio visivo; copertina e allestimento sono definiti sul progetto.", { de: "Visuelles Beispiel; Umschlag und Ausstattung werden für jedes Projekt individuell festgelegt.", en: "Visual example; cover and finishing are defined for each project." }],

  ["La forza della tradizione", { de: "Die Kraft der Tradition", en: "The strength of tradition" }],
  ["Il diritto di essere ricordati.", { de: "Das Recht, in Erinnerung zu bleiben.", en: "The right to be remembered." }],
  ["Una vita non è una successione di date. È un patrimonio di scelte, gesti, fallimenti, errori e visioni che può continuare a orientare chi verrà dopo.", { de: "Ein Leben ist keine Abfolge von Daten. Es ist ein Vermächtnis aus Entscheidungen, Gesten, Niederlagen, Fehlern und Visionen, das auch kommende Generationen leiten kann.", en: "A life is not a sequence of dates. It is a legacy of choices, gestures, failures, mistakes and visions that can continue to guide those who come after." }],
  ["Memoria", { de: "Erinnerung", en: "Memory" }],
  ["Raccogliere ciò che oggi vive soltanto nei ricordi, prima che il tempo ne consumi i dettagli.", { de: "Bewahren, was heute nur in Erinnerungen lebt, bevor die Zeit die Einzelheiten verwischt.", en: "Gather what today lives only in memory, before time wears away the details." }],
  ["Identità", { de: "Identität", en: "Identity" }],
  ["Riconoscere il filo che unisce origini, svolte e conquiste, senza tradire la voce di chi racconta.", { de: "Den roten Faden erkennen, der Herkunft, Wendepunkte und Erfolge verbindet, ohne die Stimme des Erzählenden zu verfälschen.", en: "Recognise the thread connecting origins, turning points and achievements, without betraying the narrator’s voice." }],
  ["Trasmissione", { de: "Weitergabe", en: "Transmission" }],
  ["Consegnare a famiglia, collaboratori e nuove generazioni un’opera leggibile, autorevole e duratura.", { de: "Familie, Mitarbeitenden und neuen Generationen ein lesbares, glaubwürdiges und dauerhaftes Werk übergeben.", en: "Pass on to family, colleagues and future generations a readable, authoritative and lasting work." }],

  ["Una scelta di metodo", { de: "Eine Frage der Methode", en: "A matter of method" }],
  ["Splendoria e la passione per la bella scrittura.", { de: "Splendoria und die Leidenschaft für gutes Schreiben.", en: "Splendoria and a passion for beautiful writing." }],
  ["La differenza non è nella quantità delle parole, ma nella responsabilità con cui vengono raccolte, verificate e trasformate.", { de: "Der Unterschied liegt nicht in der Menge der Wörter, sondern in der Sorgfalt, mit der sie gesammelt, geprüft und verwandelt werden.", en: "The difference is not in the number of words, but in the responsibility with which they are gathered, verified and transformed." }],
  ["Confronto tra Splendoria e una lavorazione editoriale frammentata", { de: "Vergleich zwischen Splendoria und einem fragmentierten Redaktionsprozess", en: "Comparison between Splendoria and a fragmented editorial process" }],
  ["Confronto tra il metodo Splendoria e un processo generico o frammentato", { de: "Vergleich zwischen der Splendoria-Methode und einem allgemeinen oder fragmentierten Prozess", en: "Comparison between the Splendoria method and a generic or fragmented process" }],
  ["Criterio", { de: "Kriterium", en: "Criterion" }],
  ["Testo generico o processo frammentato", { de: "Allgemeiner Text oder fragmentierter Prozess", en: "Generic text or fragmented process" }],
  ["Origine del racconto", { de: "Ursprung der Erzählung", en: "Source of the story" }],
  ["Materiali, ricordi e approvazioni dell’autore", { de: "Materialien, Erinnerungen und Freigaben des Autors", en: "Materials, memories and approvals from the author" }],
  ["Prompt isolati o interviste senza continuità", { de: "Isolierte Prompts oder Interviews ohne Kontinuität", en: "Isolated prompts or interviews without continuity" }],
  ["Voce", { de: "Stimme", en: "Voice" }],
  ["Coerenza personale lungo l’intera opera", { de: "Persönliche Kohärenz im gesamten Werk", en: "Personal consistency throughout the work" }],
  ["Tono variabile, spesso anonimo", { de: "Wechselnder, oft anonymer Ton", en: "Variable tone, often anonymous" }],
  ["Controllo", { de: "Kontrolle", en: "Control" }],
  ["Verifiche automatiche e supervisione umana", { de: "Automatische Prüfungen und menschliche Aufsicht", en: "Automated checks and human supervision" }],
  ["Controllo affidato al singolo passaggio", { de: "Kontrolle nur im einzelnen Arbeitsschritt", en: "Control left to each individual step" }],
  ["Dato", { de: "Daten", en: "Data" }],
  ["Progetto conservato su Splendoria D1 con accessi separati", { de: "Projekt in Splendoria D1 mit getrennten Zugriffsrechten gespeichert", en: "Project stored in Splendoria D1 with separated access" }],
  ["File e copie dispersi tra strumenti diversi", { de: "Dateien und Kopien über verschiedene Werkzeuge verstreut", en: "Files and copies scattered across different tools" }],
  ["Esito", { de: "Ergebnis", en: "Outcome" }],
  ["Un libro progettato, revisionato e approvato", { de: "Ein geplantes, redigiertes und freigegebenes Buch", en: "A book that is designed, reviewed and approved" }],
  ["Una raccolta di testi da ricomporre", { de: "Eine Sammlung von Texten, die noch zusammengesetzt werden muss", en: "A collection of texts that still needs assembling" }],

  ["Catalogo dei Percorsi", { de: "Unsere Wege", en: "Our programmes" }],
  ["Tre possibilità, una grande cura editoriale.", { de: "Drei Möglichkeiten, dieselbe große redaktionelle Sorgfalt.", en: "Three possibilities, one exceptional level of editorial care." }],
  ["Il percorso si sceglie in base alla profondità della storia, alla quantità dei materiali e al livello di accompagnamento desiderato.", { de: "Der passende Weg richtet sich nach der Tiefe der Geschichte, der Menge des Materials und dem gewünschten Maß an Begleitung.", en: "The right path depends on the depth of the story, the amount of material and the level of support you want." }],
  ["Servizi inclusi in ogni percorso", { de: "Leistungen in jedem Programm", en: "Services included in every programme" }],
  ["Sempre incluso in ogni percorso", { de: "Immer in jedem Programm enthalten", en: "Always included in every programme" }],
  ["Primo capitolo gratuito, Studio di scrittura riservato, guida delle Muse, dettatura vocale, controllo completo dell’autore, supervisione umana finale, impaginazione editoriale e PDF A5 pronto per la stampa.", { de: "Kostenloses erstes Kapitel, privates Schreibstudio, Begleitung durch die Musen, Spracheingabe, vollständige Kontrolle durch den Autor, abschließende menschliche Prüfung, redaktionelles Layout und druckfertiges A5-PDF.", en: "Free first chapter, private Writing Studio, guidance from the Muses, voice dictation, full author control, final human supervision, editorial layout and a print-ready A5 PDF." }],
  ["Percorso intimo", { de: "Persönlicher Weg", en: "Intimate programme" }],
  ["Fino a 100 pagine · 12 capitoli", { de: "Bis zu 100 Seiten · 12 Kapitel", en: "Up to 100 pages · 12 chapters" }],
  ["Per trasformare i ricordi più importanti in un libro autentico, personale e destinato alla propria famiglia.", { de: "Für alle, die ihre wichtigsten Erinnerungen in ein authentisches, persönliches Buch für die eigene Familie verwandeln möchten.", en: "For turning your most important memories into an authentic, personal book made for your family." }],
  ["Percorso digitale guidato dalle Muse", { de: "Digitaler Weg, geführt von den Musen", en: "Digital programme guided by the Muses" }],
  ["Raccolta dei ricordi e costruzione della narrazione", { de: "Sammlung der Erinnerungen und Aufbau der Erzählung", en: "Gathering memories and shaping the narrative" }],
  ["PDF editoriale A5 pronto per la lettura e per la stampa", { de: "Redaktionelles A5-PDF, bereit zum Lesen und Drucken", en: "Editorial A5 PDF ready for reading and printing" }],
  ["Crea gratuitamente il primo capitolo", { de: "Erstelle dein erstes Kapitel kostenlos", en: "Create your first chapter for free" }],
  ["Il più scelto", { de: "Am häufigsten gewählt", en: "Most popular" }],
  ["Percorso approfondito", { de: "Vertiefter Weg", en: "In-depth programme" }],
  ["Fino a 120 pagine · 18 capitoli", { de: "Bis zu 120 Seiten · 18 Kapitel", en: "Up to 120 pages · 18 chapters" }],
  ["Per raccontare una vita con maggiore profondità, facendo emergere persone, luoghi, passaggi decisivi e significati che meritano più spazio.", { de: "Für eine Lebensgeschichte mit größerer Tiefe, in der Menschen, Orte, entscheidende Wendepunkte und Bedeutungen den Raum erhalten, den sie verdienen.", en: "For telling a life story in greater depth, bringing out people, places, decisive moments and meanings that deserve more space." }],
  ["Più domande e interviste dedicate alle diverse fasi della vita", { de: "Mehr Fragen und Interviews zu den verschiedenen Lebensphasen", en: "More questions and interviews dedicated to the different stages of life" }],
  ["Maggiore profondità narrativa e attenzione alla voce dell’autore", { de: "Mehr erzählerische Tiefe und besondere Aufmerksamkeit für die Stimme des Autors", en: "Greater narrative depth and closer attention to the author’s voice" }],
  ["Revisione editoriale approfondita e PDF A5 pronto per la stampa", { de: "Vertiefte redaktionelle Überarbeitung und druckfertiges A5-PDF", en: "In-depth editorial review and a print-ready A5 PDF" }],
  ["Edizione su misura", { de: "Edition nach Maß", en: "Bespoke edition" }],
  ["Fino a 120 pagine · 10 copie cartacee comprese", { de: "Bis zu 120 Seiten · 10 gedruckte Exemplare inklusive", en: "Up to 120 pages · 10 printed copies included" }],
  ["Per famiglie, professionisti e fondatori d’impresa che desiderano trasformare la propria storia in un’edizione privata di particolare prestigio.", { de: "Für Familien, Professionals und Unternehmensgründer, die ihre Geschichte in eine private Edition von besonderem Wert verwandeln möchten.", en: "For families, professionals and company founders who want to turn their story into a private edition of particular distinction." }],
  ["Progetto editoriale e interviste costruiti su misura", { de: "Redaktionelles Konzept und Interviews nach Maß", en: "Bespoke editorial project and interviews" }],
  ["Assistenza personale fino all’approvazione dell’opera", { de: "Persönliche Begleitung bis zur Freigabe des Werks", en: "Personal support through to final approval" }],
  ["10 copie rilegate con finiture definite nel progetto", { de: "10 gebundene Exemplare mit projektbezogen festgelegter Ausstattung", en: "10 bound copies with finishes defined for the project" }],
  ["Raccontaci il tuo progetto", { de: "Erzähl uns von deinem Projekt", en: "Tell us about your project" }],
  ["Pagine e caratteristiche sono indicative e vengono confermate nella proposta contrattuale. Su richiesta e in base alla disponibilità, può essere concordato un accompagnamento editoriale della Scuola Holden, con proposta separata.", { de: "Seitenumfang und Merkmale sind Richtwerte und werden im Vertragsangebot bestätigt. Auf Anfrage und je nach Verfügbarkeit kann eine redaktionelle Begleitung durch die Scuola Holden separat vereinbart werden.", en: "Page counts and features are indicative and are confirmed in the contractual proposal. On request and subject to availability, editorial support from Scuola Holden may be agreed under a separate proposal." }],

  ["La stanza della domenica", { de: "Das Sonntagszimmer", en: "The Sunday room" }],
  ["La trasmutazione letteraria: dall’aneddoto all’Opera.", { de: "Literarische Verwandlung: von der Anekdote zum Werk.", en: "Literary transmutation: from anecdote to finished work." }],
  ["Muovi il cursore. I fatti restano gli stessi; cambiano ritmo, precisione e forza narrativa.", { de: "Bewege den Regler. Die Fakten bleiben gleich; Rhythmus, Präzision und erzählerische Kraft verändern sich.", en: "Move the slider. The facts stay the same; rhythm, precision and narrative power change." }],
  ["Sposta il cursore", { de: "Regler bewegen", en: "Move the slider" }],
  ["Mostra il testo grezzo o l’opera trasformata", { de: "Rohtext oder bearbeitetes Werk anzeigen", en: "Show the raw text or the transformed work" }],
  ["Il Grezzo", { de: "Der Rohtext", en: "The raw text" }],
  ["«La cucina di mia nonna era piccola, c’era profumo di ragù.»", { de: "«Die Küche meiner Großmutter war klein, und es roch nach Ragù.»", en: "“My grandmother’s kitchen was small, and it smelled of ragù.”" }],
  ["L’Opera Splendoria", { de: "Das Splendoria-Werk", en: "The Splendoria work" }],
  ["50% Opera", { de: "50% Werk", en: "50% Work" }],
  ["Esempio dimostrativo. Splendoria non inventa fatti: l’autore verifica e approva ogni passaggio.", { de: "Demonstrationsbeispiel. Splendoria erfindet keine Fakten: Der Autor prüft und genehmigt jeden Schritt.", en: "Demonstration example. Splendoria does not invent facts: the author verifies and approves every step." }],

  ["Due patrimoni da custodire", { de: "Zwei Vermächtnisse, die es zu bewahren gilt", en: "Two legacies to preserve" }],
  ["La memoria di una famiglia. Le gesta di un’impresa.", { de: "Die Erinnerung einer Familie. Die Geschichte eines Unternehmens.", en: "A family’s memory. A company’s story." }],
  ["Memoria di famiglia", { de: "Familienerinnerung", en: "Family memory" }],
  ["Ciò che i figli non hanno mai avuto il tempo di chiedere.", { de: "Was die Kinder nie die Zeit hatten zu fragen.", en: "What children never had time to ask." }],
  ["Infanzia, migrazioni, amori, svolte e piccoli rituali diventano una narrazione capace di attraversare le generazioni.", { de: "Kindheit, Migrationen, Lieben, Wendepunkte und kleine Rituale werden zu einer Erzählung, die Generationen verbindet.", en: "Childhood, migrations, loves, turning points and small rituals become a narrative capable of crossing generations." }],
  ["Gesta d’impresa", { de: "Unternehmensgeschichte", en: "Company story" }],
  ["La visione che esisteva prima dei risultati.", { de: "Die Vision, die vor den Ergebnissen da war.", en: "The vision that existed before the results." }],
  ["Origini, decisioni, crisi e innovazioni restituiscono a fondatori, famiglie imprenditoriali e organizzazioni il senso della propria identità.", { de: "Ursprünge, Entscheidungen, Krisen und Innovationen geben Gründern, Unternehmerfamilien und Organisationen ein klares Gefühl für ihre Identität zurück.", en: "Origins, decisions, crises and innovations restore to founders, business families and organisations a clear sense of their identity." }],

  ["Le Muse ti guidano", { de: "Die Musen begleiten dich", en: "The Muses guide you" }],
  ["Quattro livelli di controllo. Nessuna delega cieca.", { de: "Vier Kontrollebenen. Keine blinde Delegation.", en: "Four levels of control. No blind delegation." }],
  ["Leggi la Trasparenza IA", { de: "KI-Transparenz lesen", en: "Read our AI transparency" }],
  ["Assistenza guidata", { de: "Geführte Unterstützung", en: "Guided assistance" }],
  ["La Musa propone; l’Autore modifica, approva o rifiuta.", { de: "Die Muse schlägt vor; der Autor bearbeitet, genehmigt oder verwirft.", en: "The Muse proposes; the Author edits, approves or rejects." }],
  ["Coerenza editoriale", { de: "Redaktionelle Kohärenz", en: "Editorial consistency" }],
  ["Controlli automatici intercettano ripetizioni, incoerenze e risposte incomplete.", { de: "Automatische Kontrollen erkennen Wiederholungen, Widersprüche und unvollständige Antworten.", en: "Automated checks flag repetition, inconsistencies and incomplete answers." }],
  ["Supervisione umana", { de: "Menschliche Aufsicht", en: "Human supervision" }],
  ["La revisione professionale prevista dal percorso precede la consegna definitiva.", { de: "Die im gewählten Programm vorgesehene professionelle Überarbeitung erfolgt vor der endgültigen Übergabe.", en: "The professional review included in the chosen programme takes place before final delivery." }],
  ["I tuoi racconti rimangono segreti.", { de: "Deine Geschichten bleiben vertraulich.", en: "Your stories remain private." }],

  ["Assessment Editoriale", { de: "Redaktionelle Einschätzung", en: "Editorial assessment" }],
  ["La prima architettura del tuo libro.", { de: "Die erste Architektur deines Buches.", en: "The first architecture of your book." }],
  ["Definisci la trama del libro, indica i passaggi decisivi e ricevi una Scheda Tecnica del Progetto Editoriale pronta da stampare o salvare in PDF.", { de: "Definiere die Struktur deines Buches, markiere die entscheidenden Wendepunkte und erhalte ein technisches Projektblatt, das du drucken oder als PDF speichern kannst.", en: "Define the structure of your book, identify the decisive moments and receive an Editorial Project Sheet ready to print or save as PDF." }],
  ["Dimensione della trama del libro", { de: "Umfang der Buchhandlung", en: "Scope of the book" }],
  ["Quale arco della tua storia vuoi consegnare al futuro?", { de: "Welchen Bogen deiner Geschichte möchtest du der Zukunft übergeben?", en: "Which arc of your story do you want to pass on to the future?" }],
  ["Una stagione", { de: "Eine Lebensphase", en: "A season" }],
  ["Un passaggio decisivo", { de: "Ein entscheidender Wendepunkt", en: "A decisive turning point" }],
  ["Una vita", { de: "Ein ganzes Leben", en: "A lifetime" }],
  ["Dalle origini a oggi", { de: "Von den Anfängen bis heute", en: "From the beginning to today" }],
  ["Una famiglia", { de: "Eine Familie", en: "A family" }],
  ["Più generazioni", { de: "Mehrere Generationen", en: "Several generations" }],
  ["Un’impresa", { de: "Ein Unternehmen", en: "A company" }],
  ["Fondazione ed eredità", { de: "Gründung und Vermächtnis", en: "Foundation and legacy" }],
  ["Nodi cruciali", { de: "Entscheidende Knotenpunkte", en: "Crucial turning points" }],
  ["Seleziona le svolte che dovranno dare struttura all’opera.", { de: "Wähle die Wendepunkte, die dem Werk seine Struktur geben sollen.", en: "Select the turning points that should give structure to the work." }],
  ["Origini e infanzia", { de: "Herkunft und Kindheit", en: "Origins and childhood" }],
  ["Carriera e impresa", { de: "Karriere und Unternehmen", en: "Career and business" }],
  ["Legami e incontri", { de: "Beziehungen und Begegnungen", en: "Relationships and encounters" }],
  ["Crisi e rinascite", { de: "Krisen und Neuanfänge", en: "Crises and rebirths" }],
  ["Visione e futuro", { de: "Vision und Zukunft", en: "Vision and future" }],
  ["Estrazione Muse", { de: "Muses-Extraktion", en: "Muse extraction" }],
  ["Tre parole che aprono la memoria", { de: "Drei Wörter, die Erinnerungen öffnen", en: "Three words that unlock memory" }],
  ["Per esempio: officina, domenica, mare", { de: "Zum Beispiel: Werkstatt, Sonntag, Meer", en: "For example: workshop, Sunday, sea" }],
  ["Scrivi tre parole separate da virgole: luoghi, oggetti, persone o gesti capaci di riportarti dentro una scena.", { de: "Schreibe drei durch Kommas getrennte Wörter: Orte, Gegenstände, Personen oder Gesten, die dich in eine Szene zurückversetzen.", en: "Write three comma-separated words: places, objects, people or gestures that can take you back into a scene." }],
  ["Investimento editoriale", { de: "Redaktionelle Investition", en: "Editorial investment" }],
  ["Percorso", { de: "Programm", en: "Programme" }],
  ["Scegli il percorso", { de: "Programm wählen", en: "Choose a programme" }],
  ["Supervisione desiderata", { de: "Gewünschte Betreuung", en: "Preferred supervision" }],
  ["Scegli il livello", { de: "Stufe wählen", en: "Choose a level" }],
  ["Livello 1 · Assistenza guidata", { de: "Stufe 1 · Geführte Unterstützung", en: "Level 1 · Guided assistance" }],
  ["Livello 2 · Coerenza editoriale", { de: "Stufe 2 · Redaktionelle Kohärenz", en: "Level 2 · Editorial consistency" }],
  ["Livello 3 · Supervisione umana", { de: "Stufe 3 · Menschliche Aufsicht", en: "Level 3 · Human supervision" }],
  ["Livello 4 · Accompagnamento dedicato", { de: "Stufe 4 · Persönliche Begleitung", en: "Level 4 · Dedicated support" }],
  ["L’Autore", { de: "Der Autor", en: "The Author" }],
  ["Nome e cognome", { de: "Vor- und Nachname", en: "Full name" }],
  ["Telefono", { de: "Telefon", en: "Phone" }],
  ["Ho letto la Privacy Policy e chiedo di essere ricontattato per questo progetto.", { de: "Ich habe die Datenschutzerklärung gelesen und möchte zu diesem Projekt kontaktiert werden.", en: "I have read the Privacy Policy and ask to be contacted about this project." }],
  ["Genera la Scheda Tecnica", { de: "Projektblatt erstellen", en: "Generate the Project Sheet" }],
  ["La generazione avviene nel browser e non invia i dati finché non premi “Affida la scheda a Splendoria”.", { de: "Die Erstellung erfolgt im Browser; Daten werden erst gesendet, wenn du „Projektblatt an Splendoria senden“ auswählst.", en: "Generation happens in your browser and does not send data until you select “Send the sheet to Splendoria”." }],
  ["Splendoria · Scheda Tecnica", { de: "Splendoria · Projektblatt", en: "Splendoria · Project Sheet" }],
  ["Progetto Editoriale", { de: "Redaktionelles Projekt", en: "Editorial Project" }],
  ["Una prima mappa del patrimonio narrativo emerso dall’Assessment.", { de: "Eine erste Karte des erzählerischen Materials, das aus der Einschätzung hervorgegangen ist.", en: "A first map of the narrative material emerging from the assessment." }],
  ["Percorso indicato", { de: "Empfohlenes Programm", en: "Suggested programme" }],
  ["Nodi narrativi", { de: "Narrative Knotenpunkte", en: "Narrative turning points" }],
  ["Parole-soglia", { de: "Schlüsselwörter", en: "Threshold words" }],
  ["Orizzonte", { de: "Horizont", en: "Horizon" }],
  ["Trasmissione familiare o d’impresa nel tempo", { de: "Familien- oder Unternehmensvermächtnis über die Zeit", en: "Family or business legacy over time" }],
  ["Trama da definire", { de: "Struktur noch zu definieren", en: "Structure to be defined" }],
  ["Indice editoriale orientativo basato sulla densità dei materiali indicati; non rappresenta un rendimento economico né una garanzia.", { de: "Orientierender redaktioneller Index auf Grundlage der Dichte des angegebenen Materials; er stellt weder eine finanzielle Rendite noch eine Garantie dar.", en: "Indicative editorial index based on the density of the material provided; it does not represent a financial return or a guarantee." }],
  ["Stampa o salva in PDF", { de: "Drucken oder als PDF speichern", en: "Print or save as PDF" }],
  ["Affida la scheda a Splendoria", { de: "Projektblatt an Splendoria senden", en: "Send the sheet to Splendoria" }],

  ["FAQ e riservatezza", { de: "FAQ und Vertraulichkeit", en: "FAQ and confidentiality" }],
  ["L’opera è tua. La fiducia è il primo contratto.", { de: "Das Werk gehört dir. Vertrauen ist der erste Vertrag.", en: "The work is yours. Trust is the first contract." }],
  ["La memoria personale richiede discrezione, chiarezza e controllo. Queste risposte definiscono i principi; le condizioni definitive sono sempre quelle concordate per iscritto.", { de: "Persönliche Erinnerungen verlangen Diskretion, Klarheit und Kontrolle. Diese Antworten beschreiben die Grundsätze; verbindlich sind stets die schriftlich vereinbarten Bedingungen.", en: "Personal memory requires discretion, clarity and control. These answers set out the principles; the definitive terms are always those agreed in writing." }],
  ["Leggi la Privacy Policy", { de: "Datenschutzerklärung lesen", en: "Read the Privacy Policy" }],
  ["La Musa può inventare episodi?", { de: "Kann die Muse Episoden erfinden?", en: "Can the Muse invent events?" }],
  ["No: le istruzioni vietano di introdurre fatti, nomi o ricordi non forniti. Poiché un sistema generativo può comunque sbagliare, ogni testo resta modificabile e deve essere approvato dall’autore.", { de: "Nein. Die Anweisungen verbieten das Hinzufügen nicht bereitgestellter Fakten, Namen oder Erinnerungen. Da ein generatives System dennoch Fehler machen kann, bleibt jeder Text bearbeitbar und muss vom Autor freigegeben werden.", en: "No. The instructions prohibit introducing facts, names or memories that were not provided. Because a generative system can still make mistakes, every text remains editable and must be approved by the author." }],
  ["Chi conserva i materiali del libro?", { de: "Wer speichert die Materialien des Buches?", en: "Who stores the book materials?" }],
  ["Account, progetti, capitoli e interviste sono conservati nell’infrastruttura Splendoria; sul dispositivo restano soltanto preferenze tecniche dichiarate nella Cookie Policy.", { de: "Konto, Projekte, Kapitel und Interviews werden in der Splendoria-Infrastruktur gespeichert; auf dem Gerät verbleiben nur die in der Cookie-Richtlinie beschriebenen technischen Präferenzen.", en: "Accounts, projects, chapters and interviews are stored within Splendoria infrastructure; only the technical preferences described in the Cookie Policy remain on the device." }],
  ["Chi possiede l’opera?", { de: "Wem gehört das Werk?", en: "Who owns the work?" }],
  ["L’autore conserva i diritti sui materiali originali. Diritti e facoltà d’uso dell’opera finale sono precisati nella conferma contrattuale, nel rispetto del diritto d’autore.", { de: "Der Autor behält die Rechte an den Originalmaterialien. Rechte und Nutzungsbefugnisse am endgültigen Werk werden in der Vertragsbestätigung unter Beachtung des Urheberrechts festgelegt.", en: "The author retains the rights to the original materials. Rights and permitted uses of the final work are specified in the contractual confirmation, in accordance with copyright law." }],
  ["La Scuola Holden è sempre inclusa?", { de: "Ist die Scuola Holden immer enthalten?", en: "Is Scuola Holden always included?" }],
  ["No. Un eventuale accompagnamento può essere concordato soltanto per Signature, in base al progetto e alla disponibilità, e deve risultare dalla proposta scritta.", { de: "Nein. Eine mögliche Begleitung kann nur für Signature, abhängig vom Projekt und von der Verfügbarkeit, vereinbart werden und muss im schriftlichen Angebot festgehalten sein.", en: "No. Any additional support can only be agreed for Signature, depending on the project and availability, and must be stated in the written proposal." }],
  ["Il libro viene stampato?", { de: "Wird das Buch gedruckt?", en: "Is the book printed?" }],
  ["Digital e Premium prevedono il PDF editoriale; le copie possono essere richieste separatamente. Signature include 10 copie cartacee, con caratteristiche definite nella proposta.", { de: "Digital und Premium enthalten das redaktionelle PDF; gedruckte Exemplare können separat bestellt werden. Signature umfasst 10 gedruckte Exemplare, deren Eigenschaften im Angebot festgelegt werden.", en: "Digital and Premium include the editorial PDF; printed copies can be requested separately. Signature includes 10 printed copies, with specifications defined in the proposal." }],
  ["Posso inserire fotografie?", { de: "Kann ich Fotos einfügen?", en: "Can I include photographs?" }],
  ["Sì, per avere un risultato di qualità l’inserimento delle foto è semi automatico. Componi il tuo PDF scritto, e poi scrivici. Inseriremo manualmente le tue foto, gratuitamente.", { de: "Ja. Für ein hochwertiges Ergebnis erfolgt das Einfügen der Fotos halbautomatisch. Erstelle zunächst dein geschriebenes PDF und kontaktiere uns anschließend. Wir fügen deine Fotos kostenlos von Hand ein.", en: "Yes. To achieve a high-quality result, photo insertion is semi-automatic. First create your written PDF, then contact us. We will add your photographs manually, free of charge." }],
  ["La bellezza di poter finalmente trasmettere una visione.", { de: "Die Schönheit, eine Vision endlich weitergeben zu können.", en: "The beauty of finally being able to pass on a vision." }],
  ["Entra nello Studio di Scrittura", { de: "Zum Schreibstudio", en: "Enter the Writing Studio" }]
];

const META = {
  de: {
    title: "Dein Leben als Roman — Splendoria",
    description: "Splendoria verwandelt Familienerinnerungen und Unternehmensgeschichten in sorgfältig gestaltete Bücher – mit digitalen Musen, Kontrolle durch den Autor und menschlicher Redaktion."
  },
  en: {
    title: "Your life as a novel — Splendoria",
    description: "Splendoria turns family memories and company stories into carefully crafted books, with digital Muses, author control and human editorial supervision."
  }
};

function translate(html, locale) {
  if (locale === "it") return html;
  let out = html;
  // Full German phrases must precede their shorter substrings; EN keeps its contract.
  const pairs = [...SHARED, ...HOME];
  if (locale === "de") pairs.sort((a, b) => b[0].length - a[0].length);
  for (const [italian, target] of pairs) {
    const translated = target[locale];
    if (!translated || !italian) continue;
    out = out.split(italian).join(translated);
  }
  return out;
}

function localeSwitcher(locale) {
  const link = (key) => {
    const cfg = LOCALES[key];
    const current = key === locale;
    return `<a class="spl-lang-link${current ? " is-current" : ""}" href="${cfg.path}" hreflang="${cfg.html}" lang="${cfg.html}"${current ? ' aria-current="page"' : ""}>${cfg.label}</a>`;
  };
  return `<nav class="spl-language-switcher" aria-label="${locale === "de" ? "Sprache" : locale === "en" ? "Language" : "Lingua"}">${link("it")}${link("de")}${link("en")}</nav>`;
}

function injectSwitcher(html, locale) {
  if (html.includes("spl-language-switcher")) return html;
  const css = `<style data-spl-i18n-nav>
.spl-language-switcher{display:flex;align-items:center;gap:5px;margin-left:auto;padding:2px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(255,255,255,.06)}
.spl-lang-link{display:inline-flex;align-items:center;justify-content:center;min-width:38px;min-height:31px;padding:5px 8px;border-radius:999px;color:#dce9e3!important;font:800 12px/1 Inter,ui-sans-serif,system-ui,sans-serif!important;letter-spacing:.06em;text-decoration:none!important}
.spl-lang-link:hover{background:rgba(255,255,255,.12)}
.spl-lang-link.is-current{background:#c5a059;color:#10261d!important}
@media(max-width:760px){.spl-language-switcher{order:2;margin-left:0}.legacy-showcase .navlinks{order:3}.legacy-showcase .navin{justify-content:space-between}}
</style>`;
  let out = html.replace(/<\/head>/i, `${css}</head>`);
  const switcher = localeSwitcher(locale);
  out = out.replace(/(<a class="brand"[^>]*>Splendoria<\/a>)/i, `$1${switcher}`);
  return out;
}

function localizeLinks(html, locale) {
  if (locale === "it") return html;
  const prefix = `/${locale}`;
  return html
    .replace(/href="\/#(metodo|formule|contatti)"/g, `href="${prefix}/#$1"`)
    .replace(/href="\/\?formula=assisted#contatti"/g, `href="${prefix}/?formula=assisted#contatti"`);
}

function injectSeo(html, locale) {
  const cfg = LOCALES[locale];
  const canonical = `${CANONICAL_ORIGIN}${cfg.path}`;
  const alternates = `<link rel="alternate" hreflang="it" href="${CANONICAL_ORIGIN}/"><link rel="alternate" hreflang="de" href="${CANONICAL_ORIGIN}/de/"><link rel="alternate" hreflang="en" href="${CANONICAL_ORIGIN}/en/"><link rel="alternate" hreflang="x-default" href="${CANONICAL_ORIGIN}/">`;
  let out = html.replace(/<html lang="[^"]+">/i, `<html lang="${cfg.html}">`);
  out = out.replace(/<link rel="canonical" href="[^"]*">/i, "");
  out = out.replace(/<head([^>]*)>/i, `<head$1>${alternates}<link rel="canonical" href="${canonical}">`);
  if (locale !== "it") {
    const meta = META[locale];
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${meta.title}</title>`);
    out = out.replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${meta.description}">`);
    out = out.replace(/<meta property="og:locale" content="[^"]*">/i, `<meta property="og:locale" content="${cfg.og}">`);
    out = out.replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonical}">`);
    out = out.replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${meta.title}">`);
    out = out.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${meta.description}">`);
    out = out.replace(/<meta name="twitter:title" content="[^"]*">/i, `<meta name="twitter:title" content="${meta.title}">`);
    out = out.replace(/<meta name="twitter:description" content="[^"]*">/i, `<meta name="twitter:description" content="${meta.description}">`);
  }
  return out;
}

function localizedHomepage(html, locale) {
  let out = translate(html, locale);
  out = localizeLinks(out, locale);
  out = injectSeo(out, locale);
  out = injectSwitcher(out, locale);
  return out;
}

function cloneRequestToItalianHomepage(request) {
  const original = new URL(request.url);
  const target = new URL(request.url);
  target.pathname = "/";
  return new Request(target.toString(), request);
}

async function fetchLocalized(request, env, ctx) {
  const url = new URL(request.url);
  const locale = PUBLIC_HOME_PATHS.get(url.pathname);
  if (!locale || request.method !== "GET") return appWorker.fetch(request, env, ctx);

  const upstreamRequest = locale === "it" ? request : cloneRequestToItalianHomepage(request);
  const response = await appWorker.fetch(upstreamRequest, env, ctx);
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html") || !response.ok) return response;

  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("content-language", LOCALES[locale].html);
  headers.set("vary", "Accept-Language");
  return new Response(localizedHomepage(html, locale), {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  fetch: fetchLocalized,
  email(message, env, ctx) {
    return appWorker.email(message, env, ctx);
  },
  scheduled(controller, env, ctx) {
    return appWorker.scheduled(controller, env, ctx);
  }
};
