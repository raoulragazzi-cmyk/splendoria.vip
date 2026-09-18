import studioWorker, { projectIdFromPath, readPreference } from "./studio-language-worker.js";
import appWorker from "./i18n-email-worker.js";

const LOCALES = new Set(["de", "en"]);
const SUPPORTED_BOOK_LANGUAGES = new Set(["it-IT", "de-DE", "en-GB"]);
const ITALIAN_STANDARD_BLOCK = /Applica rigorosamente l'italiano standard contemporaneo\.[\s\S]*?Prima della consegna esegui silenziosamente due riletture: una grammaticale e sintattica, una logica e narrativa\./gi;

const DE_RUNTIME_PAIRS = [
  ["Torna all’inizio della pagina", "Zum Seitenanfang"],
  ["<span>Torna su</span>", "<span>Nach oben</span>"],
  ["Se non sai da dove partire, puoi raccontare:", "Wenn du nicht weißt, wo du anfangen sollst, kannst du erzählen über:"],
  ["['Infanzia','Famiglia','Scuola','Primo amore','Amicizie','Lavoro','Incontri decisivi','Viaggi','Svolte','Perdite','Conquiste','Persone che ti hanno cambiato']", "['Kindheit','Familie','Schule','Erste Liebe','Freundschaften','Arbeit','Prägende Begegnungen','Reisen','Wendepunkte','Verluste','Erfolge','Menschen, die dich verändert haben']"],
  ["<strong>Prima di usare la Musa:</strong> servono almeno <b>50 parole di spunto complessive</b> nelle tre sezioni. Non devi scriverne 350: circa 350 è la lunghezza che la Musa può sviluppare per una singola sezione.", "<strong>Bevor du die Muse einsetzt:</strong> brauchst du in den drei Abschnitten zusammen mindestens <b>50 Wörter als Ausgangsmaterial</b>. Du musst nicht 350 Wörter selbst schreiben: Etwa 350 Wörter sind die Länge, die die Muse für einen einzelnen Abschnitt ausarbeiten kann."],
  ["['1. Introduzione', 'Apri la scena: dove siamo, chi c’è, che cosa sta per accadere.']", "['1. Einstieg', 'Öffne die Szene: Wo sind wir, wer ist da und was steht unmittelbar bevor?']"],
  ["['2. Svolgimento', 'Racconta fatti, azioni, dialoghi, svolte e conseguenze.']", "['2. Entwicklung', 'Erzähle von Ereignissen, Handlungen, Dialogen, Wendepunkten und Folgen.']"],
  ["['3. Chiusura', 'Chiudi il movimento narrativo: cosa cambia, cosa resta, dove porta.']", "['3. Abschluss', 'Schließe den Erzählbogen: Was verändert sich, was bleibt und wohin führt es?']"],
  ["Inizia dalla scena o dal ricordo che apre il capitolo…", "Beginne mit der Szene oder Erinnerung, die das Kapitel eröffnet…"],
  ["Sviluppa ciò che accade e ciò che cambia…", "Entfalte, was geschieht und was sich verändert…"],
  ["Porta il capitolo a una conclusione naturale…", "Führe das Kapitel zu einem natürlichen Abschluss…"],
  ["Affidati alla Musa per questa sezione", "Diesen Abschnitt der Muse anvertrauen"],
  ["' parole scritte · Musa: circa '", "' Wörter geschrieben · Muse: etwa '"],
  ["<strong>Musa pronta:</strong> hai ", "<strong>Muse bereit:</strong> Du hast "],
  [" parole di spunto complessive. Circa 350 parole è l’obiettivo di scrittura della Musa per ciascuna sezione, non un minimo da digitare.", " Wörter Ausgangsmaterial insgesamt. Etwa 350 Wörter sind das Schreibziel der Muse pro Abschnitt, nicht die Mindestmenge, die du eingeben musst."],
  ["<strong>Prima di usare la Musa:</strong> hai ", "<strong>Bevor du die Muse einsetzt:</strong> Du hast "],
  [" parole di spunto; ne servono almeno <b>50</b> complessive. Te ne mancano ", " Wörter Ausgangsmaterial; insgesamt werden mindestens <b>50</b> benötigt. Es fehlen noch "],
  [". Non devi scriverne 350: quello è l’obiettivo della Musa per una sezione.", ". Du musst nicht 350 Wörter selbst schreiben: Das ist das Schreibziel der Muse für einen Abschnitt."],
  ["Ripristinare l’ultima versione salvata del libro? Lo stato attuale verrà conservato come versione precedente, quindi potrai tornare indietro.", "Die zuletzt gespeicherte Buchversion wiederherstellen? Der aktuelle Stand wird als vorherige Version gesichert, sodass du bei Bedarf zurückkehren kannst."],
  ["Metto al sicuro le tue parole…", "Ich sichere deine Worte…"],
  ["Non sono riuscita a salvare in sicurezza ciò che hai scritto. Le tue parole restano qui: riprova tra un momento.", "Ich konnte deinen Text nicht sicher speichern. Deine Worte bleiben hier erhalten; versuche es in einem Moment erneut."],
  // Dynamic Studio UI added after the first i18n rollout.
  // Keep these phrases exact and specific: they are visible runtime copy, not
  // authored book content or machine values.
  ["La Musa sta rileggendo", "Die Muse liest deinen Text noch einmal"],
  ["La Musa sta scrivendo", "Die Muse schreibt"],
  ["Confronta il testo con le tue parole e ne preserva il significato…", "Sie vergleicht den Text mit deinen Worten und bewahrt seine Bedeutung…"],
  ["Raccoglie le tue parole e le fonti autorizzate…", "Sie sammelt deine Worte und die freigegebenen Quellen…"],
  ["La Musa rilegge…", "Die Muse liest nach…"],
  ["La Musa scrive…", "Die Muse schreibt…"],
  ["Controlla grammatica, sintassi e fluidità…", "Sie prüft Grammatik, Satzbau und Lesefluss…"],
  ["Verifica che fatti, nomi e voce siano rimasti fedeli…", "Sie prüft, ob Fakten, Namen und deine Stimme den Quellen treu geblieben sind…"],
  ["Completa l’ultima rilettura editoriale…", "Sie schließt die letzte redaktionelle Durchsicht ab…"],
  ["Costruisce il capitolo con una prosa fluida…", "Sie formt das Kapitel zu einem flüssigen Text…"],
  ["Controlla grammatica e coerenza narrativa…", "Sie prüft Grammatik und erzählerische Kohärenz…"],
  ["Le due password non coincidono.", "Die beiden Passwörter stimmen nicht überein."],
  ["Altri interventi editoriali", "Weitere Überarbeitungen"],
  ["Salvataggio automatico attivo", "Automatisches Speichern aktiv"],
  ["Navigazione tra i capitoli", "Kapitelnavigation"],
  ["Il tuo posto nella storia", "Dein Platz in der Geschichte"],
  ["Riprendiamo da dove avevi lasciato.", "Mach dort weiter, wo du aufgehört hast."],
  ["Capitolo precedente", "Vorheriges Kapitel"],
  ["Scegli il capitolo", "Kapitel auswählen"],
  ["Capitolo successivo", "Nächstes Kapitel"],
  ["Capitoli successivi bloccati", "Weitere Kapitel sind gesperrt"],
  ["Ultimo capitolo", "Letztes Kapitel"],
  ["Salva e passa al capitolo successivo →", "Speichern und zum nächsten Kapitel →"],
  ["Salva e passa al capitolo successivo \\u2192", "Speichern und zum nächsten Kapitel \\u2192"],
  ["Ogni capitolo comincia da una prima frase.", "Jedes Kapitel beginnt mit einem ersten Satz."],
  ["Il capitolo sta prendendo forma.", "Dein Kapitel nimmt Form an."],
  ["La storia si sta facendo più nitida.", "Deine Geschichte gewinnt an Klarheit."],
  ["Sei vicino alla lunghezza prevista.", "Du bist fast bei der vorgesehenen Länge."],
  ["Il capitolo ha raggiunto la lunghezza prevista.", "Das Kapitel hat die vorgesehene Länge erreicht."],
  ["Una pagina nuova ti aspetta. Comincia da un’immagine, una voce o un gesto.", "Eine neue Seite wartet auf dich. Beginne mit einem Bild, einer Stimme oder einer Geste."],
  ["Apri questo capitolo", "Dieses Kapitel öffnen"],
  ["Le tue parole appariranno qui mentre scrivi o detti il capitolo.", "Deine Worte erscheinen hier, während du das Kapitel schreibst oder diktierst."],
  ["Sto custodendo le tue parole…", "Ich sichere deine Worte…"],
  ["Le tue nuove parole saranno salvate tra pochi secondi…", "Deine neuen Worte werden in wenigen Sekunden gespeichert…"],
  ["Le tue parole sono al sicuro · Salvato alle ", "Deine Worte sind sicher · Gespeichert um "],
  ["Salvataggio automatico non riuscito. Usa “Salva le mie modifiche”.", "Automatisches Speichern fehlgeschlagen. Verwende „Meine Änderungen speichern“."],
  ["Salvataggio online automatico attivo nel tuo account", "Automatisches Online-Speichern in deinem Konto aktiv"],
  ["Salvato online nel tuo account · ", "Online in deinem Konto gespeichert · "],
  ["Sto custodendo i tuoi ricordi…", "Ich sichere deine Erinnerungen…"],
  ["Conferma la dichiarazione sui contenuti per attivare il salvataggio automatico", "Bestätige die Erklärung zu den Inhalten, um das automatische Speichern zu aktivieren."],
  ["Le modifiche saranno salvate tra pochi secondi…", "Deine Änderungen werden in wenigen Sekunden gespeichert…"],
  ["Salvataggio automatico non riuscito. Premi “Custodisci questi ricordi”.", "Automatisches Speichern fehlgeschlagen. Wähle „Diese Erinnerungen sichern“."],
  ["Salvataggio non riuscito", "Speichern fehlgeschlagen"],
  ["Senza titolo", "Ohne Titel"],
  ["Titolo del capitolo", "Kapiteltitel"],
  ["Come lavora la Musa", "So arbeitet die Muse"],
  ["Assessment editoriale · ", "Redaktionelle Einschätzung · "],
  ["SCHEDA TECNICA DEL PROGETTO EDITORIALE", "REDAKTIONELLES PROJEKTBLATT"],
  ["Autore: ", "Autor: "],
  ["Dimensione della trama del libro: ", "Erzählumfang des Buches: "],
  ["Nodi cruciali: ", "Entscheidende Wendepunkte: "],
  ["Parole-soglia: ", "Schlüsselwörter: "],
  ["Percorso: ", "Programm: "],
  ["Governance: ", "Redaktionelle Steuerung: "],
  ["Indice editoriale orientativo: ", "Redaktioneller Orientierungswert: "],
  ["'Pagina ' + (activePage + 1) + ' di ' + pages.length", "'Seite ' + (activePage + 1) + ' von ' + pages.length"],
  ["totalWords + ' parole \\xB7 ' + pages.length + (pages.length === 1 ? ' pagina stimata' : ' pagine stimate')", "totalWords + ' Wörter \\xB7 ' + pages.length + (pages.length === 1 ? ' geschätzte Seite' : ' geschätzte Seiten')"],
  ["totalWords + ' parole · ' + pages.length + (pages.length === 1 ? ' pagina stimata' : ' pagine stimate')", "totalWords + ' Wörter · ' + pages.length + (pages.length === 1 ? ' geschätzte Seite' : ' geschätzte Seiten')"],
  ["'Capitolo ' + (index + 1) + ' \\xB7 '", "'Kapitel ' + (index + 1) + ' \\xB7 '"],
  ["'Capitolo ' + (index + 1) + ' · '", "'Kapitel ' + (index + 1) + ' · '"],
  ["nodes.join(', ') || 'da approfondire'", "nodes.join(', ') || 'im Interview weiter vertiefen'"],
  ["'Erzählumfang des Buches: ' + scope", "'Erzählumfang des Buches: ' + ({'Una stagione decisiva':'Eine entscheidende Lebensphase','Una vita intera':'Ein ganzes Leben','Una storia generazionale':'Eine generationenübergreifende Geschichte','Un’impresa e la sua visione':'Ein Unternehmen und seine Vision'}[scope] || scope)"],
];

const EN_RUNTIME_PAIRS = [
  ["Torna all’inizio della pagina", "Back to the top of the page"],
  ["<span>Torna su</span>", "<span>Back to top</span>"],
  ["Se non sai da dove partire, puoi raccontare:", "If you are not sure where to begin, you could write about:"],
  ["['Infanzia','Famiglia','Scuola','Primo amore','Amicizie','Lavoro','Incontri decisivi','Viaggi','Svolte','Perdite','Conquiste','Persone che ti hanno cambiato']", "['Childhood','Family','School','First love','Friendships','Work','Defining encounters','Travel','Turning points','Losses','Achievements','People who changed you']"],
  ["<strong>Prima di usare la Musa:</strong> servono almeno <b>50 parole di spunto complessive</b> nelle tre sezioni. Non devi scriverne 350: circa 350 è la lunghezza che la Musa può sviluppare per una singola sezione.", "<strong>Before using the Muse:</strong> you need at least <b>50 words of source material in total</b> across the three sections. You do not need to write 350 words yourself: about 350 words is the length the Muse can develop for one section."],
  ["['1. Introduzione', 'Apri la scena: dove siamo, chi c’è, che cosa sta per accadere.']", "['1. Opening', 'Set the scene: where are we, who is there and what is about to happen?']"],
  ["['2. Svolgimento', 'Racconta fatti, azioni, dialoghi, svolte e conseguenze.']", "['2. Development', 'Tell the events, actions, dialogue, turning points and consequences.']"],
  ["['3. Chiusura', 'Chiudi il movimento narrativo: cosa cambia, cosa resta, dove porta.']", "['3. Closing', 'Bring the narrative movement to a close: what changes, what remains and where does it lead?']"],
  ["Inizia dalla scena o dal ricordo che apre il capitolo…", "Begin with the scene or memory that opens the chapter…"],
  ["Sviluppa ciò che accade e ciò che cambia…", "Develop what happens and what changes…"],
  ["Porta il capitolo a una conclusione naturale…", "Bring the chapter to a natural close…"],
  ["Affidati alla Musa per questa sezione", "Entrust this section to the Muse"],
  ["' parole scritte · Musa: circa '", "' words written · Muse: about '"],
  ["<strong>Musa pronta:</strong> hai ", "<strong>Muse ready:</strong> You have "],
  [" parole di spunto complessive. Circa 350 parole è l’obiettivo di scrittura della Musa per ciascuna sezione, non un minimo da digitare.", " words of source material in total. About 350 words is the Muse’s writing target for each section, not a minimum you need to type."],
  ["<strong>Prima di usare la Musa:</strong> hai ", "<strong>Before using the Muse:</strong> You have "],
  [" parole di spunto; ne servono almeno <b>50</b> complessive. Te ne mancano ", " words of source material; at least <b>50</b> are needed in total. You still need "],
  [". Non devi scriverne 350: quello è l’obiettivo della Musa per una sezione.", ". You do not need to write 350 words yourself: that is the Muse’s writing target for one section."],
  ["Ripristinare l’ultima versione salvata del libro? Lo stato attuale verrà conservato come versione precedente, quindi potrai tornare indietro.", "Restore the latest saved version of the book? The current state will be kept as the previous version, so you can return to it if needed."],
  ["Metto al sicuro le tue parole…", "Safeguarding your words…"],
  ["Non sono riuscita a salvare in sicurezza ciò che hai scritto. Le tue parole restano qui: riprova tra un momento.", "I could not save what you wrote safely. Your words are still here; please try again in a moment."],
  // Dynamic Studio UI added after the first i18n rollout.
  ["La Musa sta rileggendo", "The Muse is reviewing your text"],
  ["La Musa sta scrivendo", "The Muse is writing"],
  ["Confronta il testo con le tue parole e ne preserva il significato…", "It compares the text with your words and preserves their meaning…"],
  ["Raccoglie le tue parole e le fonti autorizzate…", "It gathers your words and the authorised sources…"],
  ["La Musa rilegge…", "The Muse is reviewing…"],
  ["La Musa scrive…", "The Muse is writing…"],
  ["Controlla grammatica, sintassi e fluidità…", "Checking grammar, syntax and flow…"],
  ["Verifica che fatti, nomi e voce siano rimasti fedeli…", "Checking that facts, names and your voice remain faithful to the sources…"],
  ["Completa l’ultima rilettura editoriale…", "Completing the final editorial review…"],
  ["Costruisce il capitolo con una prosa fluida…", "Shaping the chapter into fluent prose…"],
  ["Controlla grammatica e coerenza narrativa…", "Checking grammar and narrative coherence…"],
  ["Le due password non coincidono.", "The two passwords do not match."],
  ["Altri interventi editoriali", "More editorial options"],
  ["Salvataggio automatico attivo", "Automatic saving is on"],
  ["Navigazione tra i capitoli", "Chapter navigation"],
  ["Il tuo posto nella storia", "Your place in the story"],
  ["Riprendiamo da dove avevi lasciato.", "Pick up where you left off."],
  ["Capitolo precedente", "Previous chapter"],
  ["Scegli il capitolo", "Choose a chapter"],
  ["Capitolo successivo", "Next chapter"],
  ["Capitoli successivi bloccati", "Later chapters are locked"],
  ["Ultimo capitolo", "Last chapter"],
  ["Salva e passa al capitolo successivo →", "Save and go to the next chapter →"],
  ["Salva e passa al capitolo successivo \\u2192", "Save and go to the next chapter \\u2192"],
  ["Ogni capitolo comincia da una prima frase.", "Every chapter begins with a first sentence."],
  ["Il capitolo sta prendendo forma.", "Your chapter is taking shape."],
  ["La storia si sta facendo più nitida.", "Your story is coming into sharper focus."],
  ["Sei vicino alla lunghezza prevista.", "You are close to the intended length."],
  ["Il capitolo ha raggiunto la lunghezza prevista.", "The chapter has reached the intended length."],
  ["Una pagina nuova ti aspetta. Comincia da un’immagine, una voce o un gesto.", "A new page is waiting. Begin with an image, a voice or a gesture."],
  ["Apri questo capitolo", "Open this chapter"],
  ["Le tue parole appariranno qui mentre scrivi o detti il capitolo.", "Your words will appear here as you write or dictate the chapter."],
  ["Sto custodendo le tue parole…", "Saving your words…"],
  ["Le tue nuove parole saranno salvate tra pochi secondi…", "Your new words will be saved in a few seconds…"],
  ["Le tue parole sono al sicuro · Salvato alle ", "Your words are safe · Saved at "],
  ["Salvataggio automatico non riuscito. Usa “Salva le mie modifiche”.", "Automatic saving failed. Use “Save my changes”."],
  ["Salvataggio online automatico attivo nel tuo account", "Automatic online saving is active in your account"],
  ["Salvato online nel tuo account · ", "Saved online in your account · "],
  ["Sto custodendo i tuoi ricordi…", "Saving your memories…"],
  ["Conferma la dichiarazione sui contenuti per attivare il salvataggio automatico", "Confirm the content declaration to enable automatic saving."],
  ["Le modifiche saranno salvate tra pochi secondi…", "Your changes will be saved in a few seconds…"],
  ["Salvataggio automatico non riuscito. Premi “Custodisci questi ricordi”.", "Automatic saving failed. Choose “Save these memories”."],
  ["Salvataggio non riuscito", "Saving failed"],
  ["Senza titolo", "Untitled"],
  ["Titolo del capitolo", "Chapter title"],
  ["Come lavora la Musa", "How the Muse works"],
  ["Assessment editoriale · ", "Editorial assessment · "],
  ["SCHEDA TECNICA DEL PROGETTO EDITORIALE", "EDITORIAL PROJECT SHEET"],
  ["Autore: ", "Author: "],
  ["Dimensione della trama del libro: ", "Narrative scope: "],
  ["Nodi cruciali: ", "Key turning points: "],
  ["Parole-soglia: ", "Keywords: "],
  ["Percorso: ", "Programme: "],
  ["Governance: ", "Editorial governance: "],
  ["Indice editoriale orientativo: ", "Editorial guidance score: "],
  ["'Pagina ' + (activePage + 1) + ' di ' + pages.length", "'Page ' + (activePage + 1) + ' of ' + pages.length"],
  ["totalWords + ' parole \\xB7 ' + pages.length + (pages.length === 1 ? ' pagina stimata' : ' pagine stimate')", "totalWords + ' words \\xB7 ' + pages.length + (pages.length === 1 ? ' estimated page' : ' estimated pages')"],
  ["totalWords + ' parole · ' + pages.length + (pages.length === 1 ? ' pagina stimata' : ' pagine stimate')", "totalWords + ' words · ' + pages.length + (pages.length === 1 ? ' estimated page' : ' estimated pages')"],
  ["'Capitolo ' + (index + 1) + ' \\xB7 '", "'Chapter ' + (index + 1) + ' \\xB7 '"],
  ["'Capitolo ' + (index + 1) + ' · '", "'Chapter ' + (index + 1) + ' · '"],
  ["nodes.join(', ') || 'da approfondire'", "nodes.join(', ') || 'explore further in the interview'"],
  ["'Narrative scope: ' + scope", "'Narrative scope: ' + ({'Una stagione decisiva':'A decisive period','Una vita intera':'A whole life','Una storia generazionale':'A multigenerational story','Un’impresa e la sua visione':'A company and its vision'}[scope] || scope)"],
];

const DE_STATIC_EDITOR_PAIRS = [
  ['<p class="eyebrow">DAMMI ALTRI DATI E FATTI</p>', '<p class="eyebrow">GIB MIR WEITERE DATEN UND FAKTEN</p>'],
  ['<h3>Più realtà mi affidi, più il racconto sarà tuo.</h3>', '<h3>Je mehr Wirklichkeit du mir anvertraust, desto mehr bleibt die Geschichte deine.</h3>'],
  ['Inserisci qui la maggiore quantità possibile di materiale concreto: date, luoghi, nomi e ruoli dei personaggi, relazioni, eventi, parole ricordate, conseguenze e ogni altro dettaglio reale. Più elementi fornisci, più la Musa potrà comporre un testo preciso, ricco e fedele alla tua voce.', 'Füge hier möglichst viele konkrete Informationen ein: Daten, Orte, Namen und Rollen der Personen, Beziehungen, Ereignisse, erinnerte Worte, Folgen und jedes weitere reale Detail. Je mehr du bereitstellst, desto genauer, reicher und deiner Stimme treuer kann die Muse den Text gestalten.'],
  ['<span class="sr-only">Dati e fatti aggiuntivi</span>', '<span class="sr-only">Zusätzliche Daten und Fakten</span>'],
  ['placeholder="Per esempio: nel 1987 ci trasferimmo a Milano; mia madre Anna lavorava…"', 'placeholder="Zum Beispiel: 1987 zogen wir nach Mailand; meine Mutter Anna arbeitete…"'],
  ['● Aggiungi dati a voce', '● Daten per Spracheingabe hinzufügen'],
  ['<label class="field">Racconta liberamente la storia<textarea', '<label class="field">Erzähle deine Geschichte frei<textarea'],
  ['placeholder="Scrivi come parleresti a una persona cara. Non preoccuparti dello stile: a quello penseremo insieme."', 'placeholder="Schreibe so, wie du einer vertrauten Person erzählen würdest. Um den Stil kümmern wir uns gemeinsam."'],
  ['● Racconta a voce', '● Per Sprache erzählen'],
  ['<label class="field">I protagonisti<textarea', '<label class="field">Die Hauptpersonen<textarea'],
  ['<label class="field">I momenti decisivi<textarea', '<label class="field">Die entscheidenden Momente<textarea'],
  ['<label class="field">Ciò che vuoi lasciare<textarea', '<label class="field">Was du hinterlassen möchtest<textarea'],
  ['<p class="eyebrow">Intervista narrativa</p>', '<p class="eyebrow">Narratives Interview</p>'],
  ['<h3>La Musa diventa la tua giornalista personale</h3>', '<h3>Die Muse wird zu deiner persönlichen Interviewerin</h3>'],
  ['<p class="eyebrow">La tua Musa</p>', '<p class="eyebrow">Deine Muse</p>'],
  ['<p class="muse-role">Guida digitale, sensibilità umana</p>', '<p class="muse-role">Digitale Begleitung, menschliches Feingefühl</p>'],
  ['<h3 id="muse-title">Racconta con la tua voce.</h3>', '<h3 id="muse-title">Erzähle mit deiner eigenen Stimme.</h3>']
];

const EN_STATIC_EDITOR_PAIRS = [
  ['<p class="eyebrow">DAMMI ALTRI DATI E FATTI</p>', '<p class="eyebrow">GIVE ME MORE DATA AND FACTS</p>'],
  ['<h3>Più realtà mi affidi, più il racconto sarà tuo.</h3>', '<h3>The more reality you entrust to me, the more the story remains yours.</h3>'],
  ['Inserisci qui la maggiore quantità possibile di materiale concreto: date, luoghi, nomi e ruoli dei personaggi, relazioni, eventi, parole ricordate, conseguenze e ogni altro dettaglio reale. Più elementi fornisci, più la Musa potrà comporre un testo preciso, ricco e fedele alla tua voce.', 'Add as much concrete material as possible here: dates, places, names and roles, relationships, events, remembered words, consequences and any other real detail. The more you provide, the more precisely and richly the Muse can shape a text that remains faithful to your voice.'],
  ['<span class="sr-only">Dati e fatti aggiuntivi</span>', '<span class="sr-only">Additional data and facts</span>'],
  ['placeholder="Per esempio: nel 1987 ci trasferimmo a Milano; mia madre Anna lavorava…"', 'placeholder="For example: in 1987 we moved to Milan; my mother Anna worked…"'],
  ['● Aggiungi dati a voce', '● Add facts by voice'],
  ['<label class="field">Racconta liberamente la storia<textarea', '<label class="field">Tell the story freely<textarea'],
  ['placeholder="Scrivi come parleresti a una persona cara. Non preoccuparti dello stile: a quello penseremo insieme."', 'placeholder="Write as you would speak to someone close to you. Do not worry about style: we will work on that together."'],
  ['● Racconta a voce', '● Tell it by voice'],
  ['<label class="field">I protagonisti<textarea', '<label class="field">The main people<textarea'],
  ['<label class="field">I momenti decisivi<textarea', '<label class="field">The turning points<textarea'],
  ['<label class="field">Ciò che vuoi lasciare<textarea', '<label class="field">What you want to leave behind<textarea'],
  ['<p class="eyebrow">Intervista narrativa</p>', '<p class="eyebrow">Narrative interview</p>'],
  ['<h3>La Musa diventa la tua giornalista personale</h3>', '<h3>The Muse becomes your personal interviewer</h3>'],
  ['<p class="eyebrow">La tua Musa</p>', '<p class="eyebrow">Your Muse</p>'],
  ['<p class="muse-role">Guida digitale, sensibilità umana</p>', '<p class="muse-role">Digital guidance, human sensitivity</p>'],
  ['<h3 id="muse-title">Racconta con la tua voce.</h3>', '<h3 id="muse-title">Tell it in your own voice.</h3>']
];

const DE_HTML_PAIRS = [
  ["Il tuo posto nella storia", "Dein Platz in der Geschichte"],
  ["Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui.", "Mach dort weiter, wo du aufgehört hast: Deine Geschichte wartet hier auf dich."],
  ["La storia si sta facendo più nitida.", "Deine Geschichte gewinnt an Klarheit."],
  ["Stai scrivendo qui", "Hier schreibst du gerade"],
  ["Titolo del capitolo • puoi rinominarlo in qualsiasi momento", "Kapiteltitel • jederzeit umbenennbar"],
  ["Titolo del capitolo · puoi rinominarlo in qualsiasi momento", "Kapiteltitel · jederzeit umbenennbar"]
];

const EN_HTML_PAIRS = [
  ["Il tuo posto nella storia", "Your place in the story"],
  ["Riprendiamo da dove avevi lasciato: la tua storia ti aspetta qui.", "Pick up where you left off: your story is waiting for you here."],
  ["La storia si sta facendo più nitida.", "Your story is coming into sharper focus."],
  ["Stai scrivendo qui", "You’re writing here"],
  ["Titolo del capitolo • puoi rinominarlo in qualsiasi momento", "Chapter title • you can rename it at any time"],
  ["Titolo del capitolo · puoi rinominarlo in qualsiasi momento", "Chapter title · you can rename it at any time"]
];

const DE_BRAIN_CONTRACT = `VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE — DEUTSCH (HOCHDEUTSCH)
- Verfasse alle neu erzeugten narrativen Texte, Kapitelüberschriften, Gliederungen, Interviewfragen und redaktionellen Vorschläge in natürlichem, idiomatischem Standarddeutsch.
- Vermeide wörtliche Übertragungen italienischer Satzmuster. Schreibe wie eine deutschsprachige Autorin bzw. ein deutschsprachiger Lektor: klar, elegant, rhythmisch und ungekünstelt.
- Beachte deutsche Grammatik, Kasus, Genus, Deklination, Verbposition, trennbare Verben, Präpositionen, Zeichensetzung und konsistente Zeitformen.
- Fakten, Namen, Zahlen, Orte, Chronologie und vom Autor gelieferte Details dürfen nicht erfunden, erweitert oder verfälscht werden.
- Originalzitate und bewusst fremdsprachige Passagen bleiben in ihrer Ausgangssprache, sofern keine Übersetzung ausdrücklich verlangt wird.
- Die Stimme des Autors hat Vorrang vor stilistischer Glättung. Dialekt oder regionale Färbung nur beibehalten, wenn sie aus den Quellen stammt oder ausdrücklich gewünscht ist.
- Technische Tokens und maschinenlesbare Kontrollwerte bleiben exakt unverändert.`;

const EN_BRAIN_CONTRACT = `MANDATORY LANGUAGE CONTRACT FOR THE MUSE — BRITISH ENGLISH
- Write all newly generated narrative prose, chapter titles, outlines, interview questions and editorial suggestions in natural, idiomatic British English.
- Avoid literal calques from Italian syntax. Write like a skilled British-English author and editor: clear, elegant, rhythmic and unforced.
- Use consistent British spelling, grammar, punctuation, articles, prepositions, verb tense and aspect, while keeping register and point of view coherent.
- Never invent, expand or distort facts, names, numbers, places, chronology or details supplied by the author.
- Preserve original quotations and deliberately foreign-language passages verbatim unless translation is explicitly requested.
- The author’s voice takes precedence over stylistic smoothing. Preserve dialect or regional colouring only when it is present in the source material or explicitly requested.
- Keep technical tokens and machine-readable control values exactly unchanged.`;

const LANGUAGE_DIRECTIVES = {
  "de-DE": "LINGUA DELL'OPERA: TEDESCO. Tutto il testo narrativo destinato al libro deve essere in tedesco naturale, editoriale e coerente. Le istruzioni tecniche possono restare in italiano e non determinano la lingua dell'output. Non tradurre nomi propri, dati, citazioni, numeri o fatti forniti dall'autore. Mantieni invariati eventuali token tecnici tra parentesi quadre.",
  "en-GB": "LINGUA DELL'OPERA: INGLESE BRITANNICO. Tutto il testo narrativo destinato al libro deve essere in inglese britannico naturale, editoriale e coerente. Le istruzioni tecniche possono restare in italiano e non determinano la lingua dell'output. Non tradurre nomi propri, dati, citazioni, numeri o fatti forniti dall'autore. Mantieni invariati eventuali token tecnici tra parentesi quadre."
};

function replacePairs(value, pairs) {
  let out = String(value || "");
  for (const [source, target] of pairs) out = out.split(source).join(target);
  return out;
}

function protectAuthored(html) {
  const stash = [];
  const token = value => `__SPL_DEEP_AUTHORED_${stash.push(String(value)) - 1}__`;
  let out = String(html || "");
  out = out.replace(/(<textarea\b[^>]*>)([\s\S]*?)(<\/textarea>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  out = out.replace(/(<input\b[^>]*\bvalue=")([^"]*)(")/gi, (_m, open, value, close) => `${open}${token(value)}${close}`);
  out = out.replace(/(<h[1-5]\b[^>]*>)([\s\S]*?)(<\/h[1-5]>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  out = out.replace(/(<div class="live-page-copy"[^>]*>)([\s\S]*?)(<\/div>)/gi, (_m, open, body, close) => `${open}${token(body)}${close}`);
  return {
    html: out,
    restore(value) {
      return String(value || "").replace(/__SPL_DEEP_AUTHORED_(\d+)__/g, (_m, index) => stash[Number(index)] ?? _m);
    }
  };
}

export function localizeDeepStudioHtml(html, locale) {
  if (!LOCALES.has(locale)) return String(html || "");
  const staticLocalized = replacePairs(String(html || ""), locale === "de" ? DE_STATIC_EDITOR_PAIRS : EN_STATIC_EDITOR_PAIRS);
  const protectedHtml = protectAuthored(staticLocalized);
  let out = replacePairs(protectedHtml.html, locale === "de" ? DE_HTML_PAIRS : EN_HTML_PAIRS);
  if (locale === "de") {
    out = out.replace(/(\d[\d.,]*) parole · ([\d.,]+) pagine stimate/g, "$1 Wörter · $2 geschätzte Seiten");
    out = out.replace(/Obiettivo: circa ([\d.,]+) pagine · ([\d.,]+) parole/g, "Ziel: etwa $1 Seiten · $2 Wörter");
  } else {
    out = out.replace(/(\d[\d.,]*) parole · ([\d.,]+) pagine stimate/g, "$1 words · $2 estimated pages");
    out = out.replace(/Obiettivo: circa ([\d.,]+) pagine · ([\d.,]+) parole/g, "Target: about $1 pages · $2 words");
  }
  return protectedHtml.restore(out);
}

export function localizeDeepStudioScript(source, locale) {
  let out = String(source || "");
  if (!LOCALES.has(locale)) return out;
  out = replacePairs(out, locale === "de" ? DE_RUNTIME_PAIRS : EN_RUNTIME_PAIRS);
  const wordLabel = locale === "de" ? "Wörter" : "words";
  out = out.replace("targetLine.match(/([\\d.\\s]+)\\s*parole/i)", `targetLine.match(/([\\d.,\\s]+)\\s*(?:parole|${wordLabel})/i)`);
  out = out.replace("window.location.pathname.match(/^\\/libro\\/([^/]+)/)", "window.location.pathname.match(/^\\/(?:(?:de|en)\\/)?libro\\/([^/]+)/)");
  return out;
}

function cleanBookLanguage(value) {
  return SUPPORTED_BOOK_LANGUAGES.has(String(value || "")) ? String(value) : "it-IT";
}

function isMachineControlPrompt(options) {
  const systems = Array.isArray(options?.messages)
    ? options.messages.filter(message => message?.role === "system").map(message => String(message?.content || ""))
    : [];
  return systems.some(text => /APPROVATO|RIFIUTATO/.test(text) && /controllo qualit|valuta/i.test(text));
}

function languageStandardDirective(language) {
  if (language === "de-DE") {
    return "Applica rigorosamente il tedesco standard contemporaneo (Hochdeutsch). Correggi grammatica, ortografia e punteggiatura senza alterare significato, tono, voce o fatti. Controlla casi, genere e numero, declinazioni, concordanze, reggenze, tempi verbali, posizione del verbo, verbi separabili, preposizioni e costruzione delle subordinate. Mantieni coerenti soggetto, punto di vista, riferimenti pronominali, cronologia e tempi verbali. Conserva regionalismi o dialetto soltanto nel discorso diretto quando sono presenti nelle fonti o richiesti dall'autore. Prima della consegna esegui silenziosamente due riletture: una grammaticale e sintattica, una logica e narrativa.";
  }
  return "Applica rigorosamente l'inglese britannico standard contemporaneo. Correggi grammatica, spelling britannico e punteggiatura senza alterare significato, tono, voce o fatti. Controlla concordanze, tempi e aspetti verbali, articoli, pronomi, preposizioni, reggenze, struttura delle frasi e coerenza del registro. Mantieni coerenti soggetto, punto di vista, riferimenti pronominali, cronologia e tempi verbali. Conserva forme regionali o dialettali soltanto nel discorso diretto quando sono presenti nelle fonti o richieste dall'autore. Prima della consegna esegui silenziosamente due riletture: una grammaticale e sintattica, una logica e narrativa.";
}

function localizeSystemInstruction(text, language) {
  const target = language === "de-DE" ? "tedesco" : "inglese britannico";
  const literature = language === "de-DE" ? "letteratura tedesca e comparata" : "letteratura inglese e comparata";
  const prose = language === "de-DE" ? "prosa tedesca originale" : "prosa originale in inglese britannico";
  return String(text || "")
    .replace(ITALIAN_STANDARD_BLOCK, languageStandardDirective(language))
    .replace(/letteratura italiana e comparata/gi, literature)
    .replace(/prosa italiana originale/gi, prose)
    .replace(/per un libro in italiano\b/gi, `per un libro in ${target}`)
    .replace(/titoli di capitolo in italiano\b/gi, `titoli di capitolo in ${target}`)
    .replace(/domande in italiano\b/gi, `domande in ${target}`)
    .replace(/\bin italiano\b/gi, `in ${target}`);
}

function localizePromptInstruction(prompt, language) {
  const source = String(prompt || "");
  const boundary = source.indexOf(" Titolo:");
  if (boundary < 0 || !/^Crea un indice di esattamente \d+ capitoli per un libro in italiano\b/.test(source)) return source;
  const target = language === "de-DE" ? "tedesco" : "inglese britannico";
  const instruction = source.slice(0, boundary).replace(/per un libro in italiano\b/, `per un libro in ${target}`);
  return instruction + source.slice(boundary);
}

function languageContract(language) {
  return language === "de-DE" ? DE_BRAIN_CONTRACT : EN_BRAIN_CONTRACT;
}

export function localizeMuseOptionsSafely(options, language) {
  const normalized = cleanBookLanguage(language);
  if (normalized === "it-IT" || !options || typeof options !== "object" || isMachineControlPrompt(options)) return options;
  const directive = LANGUAGE_DIRECTIVES[normalized];
  const contract = languageContract(normalized);
  const out = { ...options };
  if (Array.isArray(options.messages)) {
    out.messages = options.messages.map(message => {
      if (!message || message.role !== "system" || typeof message.content !== "string") return message;
      const localized = localizeSystemInstruction(message.content, normalized);
      return { ...message, content: `${contract}\n\n${directive}\n\n${localized}` };
    });
  }
  if (typeof options.prompt === "string") {
    out.prompt = `${contract}\n\n${directive}\n\n${localizePromptInstruction(options.prompt, normalized)}`;
  }
  return out;
}

export function strengthenMuseOptions(options) {
  if (!options || typeof options !== "object") return options;
  const values = [];
  if (typeof options.prompt === "string") values.push(options.prompt);
  if (Array.isArray(options.messages)) {
    for (const message of options.messages) if (message?.role === "system" && typeof message.content === "string") values.push(message.content);
  }
  const language = values.some(value => /LINGUA DELL'OPERA:\s*TEDESCO/i.test(value))
    ? "de-DE"
    : values.some(value => /LINGUA DELL'OPERA:\s*INGLESE BRITANNICO/i.test(value)) ? "en-GB" : "it-IT";
  if (language === "it-IT") return options;
  const marker = language === "de-DE" ? "VERBINDLICHER SPRACHVERTRAG FÜR DIE MUSE" : "MANDATORY LANGUAGE CONTRACT FOR THE MUSE";
  if (values.some(value => value.includes(marker))) return options;
  return localizeMuseOptionsSafely(options, language);
}

function envWithSafeMuseLanguage(env, language) {
  const normalized = cleanBookLanguage(language);
  if (normalized === "it-IT" || !env?.AI?.run) return env;
  const wrapped = Object.create(env);
  Object.assign(wrapped, env);
  const binding = env.AI;
  wrapped.AI = {
    run(model, options) {
      return binding.run(model, localizeMuseOptionsSafely(options, normalized));
    }
  };
  return wrapped;
}

function canonicalPath(pathname) {
  const stripped = String(pathname || "/").replace(/^\/(?:de|en)(?=\/|$)/, "");
  return stripped || "/";
}

function isProjectMusePost(request, pathname) {
  if (request.method !== "POST") return false;
  const path = canonicalPath(pathname);
  return /^\/libro\/[^/]+\/(?:migliora|affidati|struttura|intervista)$/.test(path)
    || /^\/libro\/[^/]+\/risposte\/(?:migliora|affidati)$/.test(path)
    || /^\/libro\/[^/]+\/capitolo\/[^/]+\/(?:genera|rifinisci)$/.test(path);
}

async function fetchMusePostSafely(request, env, ctx) {
  const projectId = projectIdFromPath(new URL(request.url).pathname);
  if (!projectId) return appWorker.fetch(request, env, ctx);
  const pref = await readPreference(env, projectId);
  const language = cleanBookLanguage(pref.museOutputLanguage || pref.bookLanguage);
  return appWorker.fetch(request, envWithSafeMuseLanguage(env, language), ctx);
}

function localeFromPrivatePath(pathname) {
  return pathname.match(/^\/(de|en)\/(?:studio|account(?:\/|$)|libro(?:\/|$))/)?.[1] || "";
}

async function deepFetch(request, env, ctx) {
  const url = new URL(request.url);
  const response = isProjectMusePost(request, url.pathname)
    ? await fetchMusePostSafely(request, env, ctx)
    : await studioWorker.fetch(request, env, ctx);
  if (!response.ok) return response;
  const type = response.headers.get("content-type") || "";

  const scriptLocale = url.pathname === "/assets/studio.js" && LOCALES.has(url.searchParams.get("lang")) ? url.searchParams.get("lang") : "";
  if (scriptLocale && type.includes("javascript")) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(localizeDeepStudioScript(await response.text(), scriptLocale), { status: response.status, statusText: response.statusText, headers });
  }

  const locale = localeFromPrivatePath(url.pathname);
  if (request.method === "GET" && locale && type.includes("text/html")) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control", "private, no-store, max-age=0");
    headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return new Response(localizeDeepStudioHtml(await response.text(), locale), { status: response.status, statusText: response.statusText, headers });
  }

  return response;
}

export default {
  fetch: deepFetch,
  email(message, env, ctx) { return studioWorker.email(message, env, ctx); },
  scheduled(controller, env, ctx) { return studioWorker.scheduled(controller, env, ctx); }
};
