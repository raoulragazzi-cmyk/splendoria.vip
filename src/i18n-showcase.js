const ORIGIN = 'https://www.splendoria.vip';

const SEO = {
  de: {
    lang: 'de',
    ogLocale: 'de_DE',
    title: 'Ihr Leben als Roman — Splendoria',
    description: 'Splendoria verwandelt Familienerinnerungen und Unternehmensgeschichten in sorgfältig gestaltete Bücher – mit digitalen Musen, Kontrolle durch den Autor und menschlicher redaktioneller Begleitung.',
    imageAlt: 'Gebundene Splendoria-Biografie mit goldenen Veredelungen'
  },
  en: {
    lang: 'en',
    ogLocale: 'en_GB',
    title: 'Your life as a novel — Splendoria',
    description: 'Splendoria transforms family memories and business stories into carefully crafted books, with digital Muses, author control and human editorial supervision.',
    imageAlt: 'Bound Splendoria biography with gold detailing'
  }
};

const DE = new Map([
  ['La tua vita in un romanzo — Splendoria', 'Ihr Leben als Roman — Splendoria'],
  ['Come funziona', 'So funktioniert es'],
  ['Listino', 'Preise'],
  ['Guida', 'Leitfaden'],
  ['Contattaci', 'Kontakt'],
  ['Il mio Studio', 'Mein Studio'],
  ['La tua vita in un romanzo.', 'Ihr Leben als Roman.'],
  ['La tua storia destinata a vivere centinaia di anni.', 'Ihre Geschichte – bestimmt, Jahrhunderte zu überdauern.'],
  ['Non lasciare che il tempo sbiadisca ciò che hai costruito. Trasformiamo i tuoi ricordi o la visione della tua impresa in un’opera editoriale d’eccezione, guidata dalle Muse e rifinita attraverso una supervisione umana.', 'Lassen Sie nicht zu, dass die Zeit verblassen lässt, was Sie aufgebaut haben. Wir verwandeln Ihre Erinnerungen oder die Vision Ihres Unternehmens in ein außergewöhnliches Buch – begleitet von den Musen und vollendet durch menschliche redaktionelle Betreuung.'],
  ['Inizia il tuo libro', 'Beginnen Sie Ihr Buch'],
  ['Osserva la trasformazione', 'Erleben Sie die Verwandlung'],
  ['La tua voce resta sovrana', 'Ihre Stimme bleibt maßgebend'],
  ['Supervisione e approvazione umana', 'Menschliche Prüfung und Freigabe'],
  ['Dati custoditi nell’infrastruttura Splendoria', 'Daten geschützt in der Splendoria-Infrastruktur'],
  ['Edizione privata', 'Private Edition'],
  ['Esempio visivo; copertina e allestimento sono definiti sul progetto.', 'Visuelles Beispiel; Einband und Ausstattung werden für jedes Projekt individuell festgelegt.'],
  ['La forza della tradizione', 'Die Kraft der Tradition'],
  ['Il diritto di essere ricordati.', 'Das Recht, in Erinnerung zu bleiben.'],
  ['Una vita non è una successione di date. È un patrimonio di scelte, gesti, fallimenti, errori e visioni che può continuare a orientare chi verrà dopo.', 'Ein Leben ist keine Abfolge von Daten. Es ist ein Vermächtnis aus Entscheidungen, Gesten, Niederlagen, Fehlern und Visionen, das auch kommenden Generationen Orientierung geben kann.'],
  ['Memoria', 'Erinnerung'],
  ['Raccogliere ciò che oggi vive soltanto nei ricordi, prima che il tempo ne consumi i dettagli.', 'Bewahren, was heute nur in Erinnerungen lebt, bevor die Zeit die Einzelheiten verwischt.'],
  ['Identità', 'Identität'],
  ['Riconoscere il filo che unisce origini, svolte e conquiste, senza tradire la voce di chi racconta.', 'Den roten Faden zwischen Herkunft, Wendepunkten und Erfolgen erkennen, ohne die Stimme des Erzählenden zu verfälschen.'],
  ['Trasmissione', 'Weitergabe'],
  ['Consegnare a famiglia, collaboratori e nuove generazioni un’opera leggibile, autorevole e duratura.', 'Familie, Mitarbeitenden und neuen Generationen ein lesbares, glaubwürdiges und dauerhaftes Werk übergeben.'],
  ['Una scelta di metodo', 'Eine Frage der Methode'],
  ['Splendoria e la passione per la bella scrittura.', 'Splendoria und die Leidenschaft für gutes Schreiben.'],
  ['La differenza non è nella quantità delle parole, ma nella responsabilità con cui vengono raccolte, verificate e trasformate.', 'Der Unterschied liegt nicht in der Menge der Worte, sondern in der Sorgfalt, mit der sie gesammelt, geprüft und gestaltet werden.'],
  ['Confronto tra il metodo Splendoria e un processo generico o frammentato', 'Vergleich zwischen der Splendoria-Methode und einem allgemeinen oder fragmentierten Prozess'],
  ['Criterio', 'Kriterium'],
  ['Testo generico o processo frammentato', 'Allgemeiner Text oder fragmentierter Prozess'],
  ['Origine del racconto', 'Ursprung der Geschichte'],
  ['Materiali, ricordi e approvazioni dell’autore', 'Materialien, Erinnerungen und Freigaben des Autors'],
  ['Prompt isolati o interviste senza continuità', 'Isolierte Prompts oder Interviews ohne Kontinuität'],
  ['Voce', 'Stimme'],
  ['Coerenza personale lungo l’intera opera', 'Persönliche Kohärenz im gesamten Werk'],
  ['Tono variabile, spesso anonimo', 'Wechselnder, oft unpersönlicher Ton'],
  ['Controllo', 'Kontrolle'],
  ['Verifiche automatiche e supervisione umana', 'Automatische Prüfungen und menschliche Aufsicht'],
  ['Controllo affidato al singolo passaggio', 'Kontrolle nur im jeweiligen Einzelschritt'],
  ['Dato', 'Daten'],
  ['Progetto conservato su Splendoria D1 con accessi separati', 'Projekt in Splendoria D1 mit getrennten Zugriffsrechten gespeichert'],
  ['File e copie dispersi tra strumenti diversi', 'Dateien und Kopien über verschiedene Werkzeuge verteilt'],
  ['Esito', 'Ergebnis'],
  ['Un libro progettato, revisionato e approvato', 'Ein konzipiertes, redigiertes und freigegebenes Buch'],
  ['Una raccolta di testi da ricomporre', 'Eine Sammlung von Texten, die erst zusammengesetzt werden muss'],
  ['Catalogo dei Percorsi', 'Unsere Editionen'],
  ['Tre possibilità, una grande cura editoriale.', 'Drei Möglichkeiten, dieselbe große redaktionelle Sorgfalt.'],
  ['Il percorso si sceglie in base alla profondità della storia, alla quantità dei materiali e al livello di accompagnamento desiderato.', 'Die passende Edition richtet sich nach der Tiefe Ihrer Geschichte, dem Umfang des Materials und dem gewünschten Grad der Begleitung.'],
  ['Sempre incluso in ogni percorso', 'In jeder Edition enthalten'],
  ['Primo capitolo gratuito, Studio di scrittura riservato, guida delle Muse, dettatura vocale, controllo completo dell’autore, supervisione umana finale, impaginazione editoriale e PDF A5 pronto per la stampa.', 'Kostenloses erstes Kapitel, geschütztes Schreibstudio, Begleitung durch die Musen, Spracheingabe, vollständige Kontrolle durch den Autor, abschließende menschliche Prüfung, redaktionelles Layout und druckfertiges A5-PDF.'],
  ['Percorso intimo', 'Persönliche Edition'],
  ['Fino a 100 pagine · 12 capitoli', 'Bis zu 100 Seiten · 12 Kapitel'],
  ['Per trasformare i ricordi più importanti in un libro autentico, personale e destinato alla propria famiglia.', 'Für alle, die ihre wichtigsten Erinnerungen in ein authentisches, persönliches Buch für die eigene Familie verwandeln möchten.'],
  ['Percorso digitale guidato dalle Muse', 'Digitaler Weg mit Begleitung durch die Musen'],
  ['Raccolta dei ricordi e costruzione della narrazione', 'Sammlung der Erinnerungen und Aufbau der Erzählung'],
  ['PDF editoriale A5 pronto per la lettura e per la stampa', 'Redaktionelles A5-PDF, bereit zum Lesen und Drucken'],
  ['Crea gratuitamente il primo capitolo', 'Erstellen Sie Ihr erstes Kapitel kostenlos'],
  ['Il più scelto', 'Am häufigsten gewählt'],
  ['Percorso approfondito', 'Vertiefte Edition'],
  ['Fino a 120 pagine · 18 capitoli', 'Bis zu 120 Seiten · 18 Kapitel'],
  ['Per raccontare una vita con maggiore profondità, facendo emergere persone, luoghi, passaggi decisivi e significati che meritano più spazio.', 'Für eine Lebensgeschichte mit größerer Tiefe, in der Menschen, Orte, entscheidende Wendepunkte und Bedeutungen den Raum erhalten, den sie verdienen.'],
  ['Più domande e interviste dedicate alle diverse fasi della vita', 'Mehr Fragen und Interviews zu den verschiedenen Lebensphasen'],
  ['Maggiore profondità narrativa e attenzione alla voce dell’autore', 'Mehr erzählerische Tiefe und besondere Aufmerksamkeit für die Stimme des Autors'],
  ['Revisione editoriale approfondita e PDF A5 pronto per la stampa', 'Vertiefte redaktionelle Überarbeitung und druckfertiges A5-PDF'],
  ['Edizione su misura', 'Maßgeschneiderte Edition'],
  ['Fino a 120 pagine · 10 copie cartacee comprese', 'Bis zu 120 Seiten · 10 gedruckte Exemplare inklusive'],
  ['Per famiglie, professionisti e fondatori d’impresa che desiderano trasformare la propria storia in un’edizione privata di particolare prestigio.', 'Für Familien, Persönlichkeiten und Unternehmensgründer, die ihre Geschichte in eine private Edition von besonderem Wert verwandeln möchten.'],
  ['Progetto editoriale e interviste costruiti su misura', 'Maßgeschneidertes redaktionelles Konzept und individuelle Interviews'],
  ['Assistenza personale fino all’approvazione dell’opera', 'Persönliche Begleitung bis zur endgültigen Freigabe des Werkes'],
  ['10 copie rilegate con finiture definite nel progetto', '10 gebundene Exemplare mit projektspezifisch festgelegter Ausstattung'],
  ['Raccontaci il tuo progetto', 'Erzählen Sie uns von Ihrem Projekt'],
  ['Pagine e caratteristiche sono indicative e vengono confermate nella proposta contrattuale. Su richiesta e in base alla disponibilità, può essere concordato un accompagnamento editoriale della Scuola Holden, con proposta separata.', 'Seitenumfang und Merkmale sind Richtwerte und werden im individuellen Angebot bestätigt. Auf Wunsch und je nach Verfügbarkeit kann eine redaktionelle Begleitung durch die Scuola Holden separat vereinbart werden.'],
  ['La stanza della domenica', 'Das Sonntagszimmer'],
  ['La trasmutazione letteraria: dall’aneddoto all’Opera.', 'Literarische Verwandlung: von der Anekdote zum Werk.'],
  ['Muovi il cursore. I fatti restano gli stessi; cambiano ritmo, precisione e forza narrativa.', 'Bewegen Sie den Regler. Die Fakten bleiben dieselben; Rhythmus, Präzision und erzählerische Kraft verändern sich.'],
  ['Sposta il cursore', 'Regler bewegen'],
  ['Mostra il testo grezzo o l’opera trasformata', 'Rohtext oder ausgearbeitete Fassung anzeigen'],
  ['Il Grezzo', 'Der Rohtext'],
  ['«La cucina di mia nonna era piccola, c’era profumo di ragù.»', '„Die Küche meiner Großmutter war klein, und es roch nach Ragù.“'],
  ['L’Opera Splendoria', 'Das Splendoria-Werk'],
  ['«La cucina di mia nonna non era stata pensata per contenere una famiglia intera. Era una stanza piccola, raccolta, con pochi mobili e un’unica finestra dalla quale entrava una luce chiara, soprattutto nelle mattine d’inverno. Eppure, ogni domenica, accadeva qualcosa di misterioso: le pareti sembravano arretrare di qualche passo per lasciarci entrare tutti.', '„Die Küche meiner Großmutter war nicht dafür gedacht, eine ganze Familie aufzunehmen. Sie war klein und behaglich, mit wenigen Möbeln und einem einzigen Fenster, durch das vor allem an Wintermorgen ein helles Licht fiel. Und doch geschah jeden Sonntag etwas beinahe Geheimnisvolles: Die Wände schienen ein paar Schritte zurückzuweichen, um uns allen Platz zu machen.'],
  ['Il tavolo occupava quasi tutto lo spazio. Durante la settimana sembrava un tavolo qualunque, ma la domenica diventava il centro del nostro mondo. Veniva allungato con assi che comparivano da qualche angolo della casa e ricoperto con la tovaglia migliore, quella bianca, un po’ ruvida, che mia nonna conservava piegata con cura in un cassetto. Intorno si sistemavano sedie diverse tra loro, prese dalla cucina, dal soggiorno e perfino dalle camere. Per i più piccoli c’erano gli sgabelli, oppure qualche cuscino aggiunto per farli arrivare all’altezza del piatto.', 'Der Tisch nahm fast den ganzen Raum ein. Unter der Woche wirkte er ganz gewöhnlich, doch am Sonntag wurde er zum Mittelpunkt unserer Welt. Er wurde mit Brettern verlängert, die irgendwo im Haus hervorgeholt wurden, und mit der besten Tischdecke bedeckt – der weißen, etwas rauen, die meine Großmutter sorgfältig gefaltet in einer Schublade aufbewahrte. Rundherum standen Stühle, die nicht zusammenpassten: aus der Küche, dem Wohnzimmer und sogar aus den Schlafzimmern. Für die Kleinsten gab es Hocker oder ein zusätzliches Kissen, damit sie bis zum Teller reichten.'],
  ['Non ricordo di aver mai sentito qualcuno lamentarsi della mancanza di spazio. Ci stringevamo, spostavamo i gomiti, passavamo i piatti sopra le teste e ci alzavamo ogni volta che qualcuno doveva raggiungere il proprio posto. Tutto avveniva in una confusione allegra e perfettamente organizzata. Mia nonna sembrava conoscere una geometria segreta: sapeva dove far sedere ciascuno, come riempire ogni angolo e come aggiungere un posto anche quando sembrava davvero impossibile.', 'Ich kann mich nicht erinnern, dass sich je jemand über den fehlenden Platz beklagt hätte. Wir rückten zusammen, zogen die Ellbogen ein, reichten Teller über die Köpfe hinweg und standen auf, wenn jemand zu seinem Platz musste. Alles geschah in einem fröhlichen und zugleich vollkommen organisierten Durcheinander. Meine Großmutter schien eine geheime Geometrie zu kennen: Sie wusste, wo jeder sitzen sollte, wie sich jede Ecke nutzen ließ und wie selbst dann noch ein Platz entstand, wenn es wirklich unmöglich schien.'],
  ['Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»', 'Sie stand schon seit Stunden am Herd. Wenn wir ankamen, war das Haus voller Düfte: die langsam köchelnde Sauce, das Fleisch …“'],
  ['50% Opera', '50 % Werk'],
  ['Esempio dimostrativo. Splendoria non inventa fatti: l’autore verifica e approva ogni passaggio.', 'Demonstrationsbeispiel. Splendoria erfindet keine Fakten: Der Autor prüft und genehmigt jeden Schritt.'],
  ['Due patrimoni da custodire', 'Zwei Vermächtnisse, die es zu bewahren gilt'],
  ['La memoria di una famiglia. Le gesta di un’impresa.', 'Die Erinnerung einer Familie. Die Geschichte eines Unternehmens.'],
  ['Memoria di famiglia', 'Familienerinnerungen'],
  ['Ciò che i figli non hanno mai avuto il tempo di chiedere.', 'Was Kinder nie die Zeit hatten zu fragen.'],
  ['Infanzia, migrazioni, amori, svolte e piccoli rituali diventano una narrazione capace di attraversare le generazioni.', 'Kindheit, Aufbrüche, Liebe, Wendepunkte und kleine Rituale werden zu einer Erzählung, die Generationen überdauern kann.'],
  ['Gesta d’impresa', 'Unternehmensgeschichte'],
  ['La visione che esisteva prima dei risultati.', 'Die Vision, die vor den Ergebnissen da war.'],
  ['Origini, decisioni, crisi e innovazioni restituiscono a fondatori, famiglie imprenditoriali e organizzazioni il senso della propria identità.', 'Ursprünge, Entscheidungen, Krisen und Innovationen geben Gründern, Unternehmerfamilien und Organisationen ein klares Bewusstsein ihrer Identität zurück.'],
  ['Le Muse ti guidano', 'Die Musen begleiten Sie'],
  ['Quattro livelli di controllo. Nessuna delega cieca.', 'Vier Ebenen der Kontrolle. Keine blinde Delegation.'],
  ['Leggi la Trasparenza IA', 'Mehr über KI-Transparenz'],
  ['Assistenza guidata', 'Geführte Unterstützung'],
  ['La Musa propone; l’Autore modifica, approva o rifiuta.', 'Die Muse schlägt vor; der Autor ändert, genehmigt oder verwirft.'],
  ['Coerenza editoriale', 'Redaktionelle Kohärenz'],
  ['Controlli automatici intercettano ripetizioni, incoerenze e risposte incomplete.', 'Automatische Kontrollen erkennen Wiederholungen, Widersprüche und unvollständige Antworten.'],
  ['Supervisione umana', 'Menschliche Betreuung'],
  ['La revisione professionale prevista dal percorso precede la consegna definitiva.', 'Die in der gewählten Edition vorgesehene professionelle Überarbeitung erfolgt vor der endgültigen Übergabe.'],
  ['I tuoi racconti rimangono segreti.', 'Ihre Geschichten bleiben vertraulich.'],
  ['Assessment Editoriale', 'Redaktionelle Bestandsaufnahme'],
  ['La prima architettura del tuo libro.', 'Die erste Architektur Ihres Buches.'],
  ['Definisci la trama del libro, indica i passaggi decisivi e ricevi una Scheda Tecnica del Progetto Editoriale pronta da stampare o salvare in PDF.', 'Skizzieren Sie die Struktur Ihres Buches, markieren Sie entscheidende Wendepunkte und erhalten Sie einen Projektsteckbrief, den Sie drucken oder als PDF speichern können.'],
  ['Non compilare questo campo', 'Dieses Feld nicht ausfüllen'],
  ['Dimensione della trama del libro', 'Umfang der Erzählung'],
  ['Quale arco della tua storia vuoi consegnare al futuro?', 'Welchen Bogen Ihrer Geschichte möchten Sie der Zukunft übergeben?'],
  ['Una stagione', 'Ein Lebensabschnitt'],
  ['Un passaggio decisivo', 'Ein entscheidender Wendepunkt'],
  ['Una vita', 'Ein ganzes Leben'],
  ['Dalle origini a oggi', 'Von den Anfängen bis heute'],
  ['Una famiglia', 'Eine Familie'],
  ['Più generazioni', 'Mehrere Generationen'],
  ['Un’impresa', 'Ein Unternehmen'],
  ['Fondazione ed eredità', 'Gründung und Vermächtnis'],
  ['Nodi cruciali', 'Entscheidende Knotenpunkte'],
  ['Seleziona le svolte che dovranno dare struttura all’opera.', 'Wählen Sie die Wendepunkte, die dem Werk Struktur geben sollen.'],
  ['Origini e infanzia', 'Herkunft und Kindheit'],
  ['Carriera e impresa', 'Beruf und Unternehmen'],
  ['Legami e incontri', 'Beziehungen und Begegnungen'],
  ['Crisi e rinascite', 'Krisen und Neubeginn'],
  ['Visione e futuro', 'Vision und Zukunft'],
  ['Estrazione Muse', 'Impulse der Musen'],
  ['Tre parole che aprono la memoria', 'Drei Wörter, die Erinnerungen öffnen'],
  ['Scrivi tre parole separate da virgole: luoghi, oggetti, persone o gesti capaci di riportarti dentro una scena.', 'Schreiben Sie drei durch Kommas getrennte Wörter: Orte, Gegenstände, Menschen oder Gesten, die Sie unmittelbar in eine Szene zurückversetzen.'],
  ['Investimento editoriale', 'Redaktionelle Investition'],
  ['Percorso', 'Edition'],
  ['Scegli il percorso', 'Edition wählen'],
  ['Governance', 'Steuerung'],
  ['Supervisione desiderata', 'Gewünschte Begleitung'],
  ['Scegli il livello', 'Stufe wählen'],
  ['Livello 1 · Assistenza guidata', 'Stufe 1 · Geführte Unterstützung'],
  ['Livello 2 · Coerenza editoriale', 'Stufe 2 · Redaktionelle Kohärenz'],
  ['Livello 3 · Supervisione umana', 'Stufe 3 · Menschliche Betreuung'],
  ['Livello 4 · Accompagnamento dedicato', 'Stufe 4 · Persönliche Begleitung'],
  ['L’Autore', 'Der Autor'],
  ['Nome e cognome', 'Vor- und Nachname'],
  ['Telefono', 'Telefon'],
  ['Ho letto la', 'Ich habe die'],
  ['e chiedo di essere ricontattato per questo progetto.', 'gelesen und bitte um Kontaktaufnahme zu diesem Projekt.'],
  ['Genera la Scheda Tecnica', 'Projektsteckbrief erstellen'],
  ['La generazione avviene nel browser e non invia i dati finché non premi “Affida la scheda a Splendoria”.', 'Die Erstellung erfolgt im Browser. Es werden keine Daten gesendet, bevor Sie „Projekt an Splendoria senden“ wählen.'],
  ['Splendoria · Scheda Tecnica', 'Splendoria · Projektsteckbrief'],
  ['Progetto Editoriale', 'Redaktionelles Projekt'],
  ['Una prima mappa del patrimonio narrativo emerso dall’Assessment.', 'Eine erste Übersicht über das erzählerische Material, das aus der Bestandsaufnahme hervorgegangen ist.'],
  ['Percorso indicato', 'Empfohlene Edition'],
  ['Nodi narrativi', 'Erzählknoten'],
  ['Parole-soglia', 'Schlüsselwörter'],
  ['Orizzonte', 'Horizont'],
  ['Trasmissione familiare o d’impresa nel tempo', 'Weitergabe der Familien- oder Unternehmensgeschichte über die Zeit'],
  ['Trama da definire', 'Erzählstruktur noch offen'],
  ['Indice editoriale orientativo basato sulla densità dei materiali indicati; non rappresenta un rendimento economico né una garanzia.', 'Unverbindlicher redaktioneller Index auf Grundlage der Dichte des angegebenen Materials; er stellt weder eine wirtschaftliche Rendite noch eine Garantie dar.'],
  ['Stampa o salva in PDF', 'Drucken oder als PDF speichern'],
  ['Affida la scheda a Splendoria', 'Projekt an Splendoria senden'],
  ['FAQ e riservatezza', 'FAQ und Vertraulichkeit'],
  ['L’opera è tua. La fiducia è il primo contratto.', 'Das Werk gehört Ihnen. Vertrauen ist der erste Vertrag.'],
  ['La memoria personale richiede discrezione, chiarezza e controllo. Queste risposte definiscono i principi; le condizioni definitive sono sempre quelle concordate per iscritto.', 'Persönliche Erinnerungen verlangen Diskretion, Klarheit und Kontrolle. Diese Antworten beschreiben die Grundsätze; verbindlich sind stets die schriftlich vereinbarten Bedingungen.'],
  ['Leggi la Privacy Policy', 'Datenschutzhinweise lesen'],
  ['La Musa può inventare episodi?', 'Darf die Muse Ereignisse erfinden?'],
  ['No: le istruzioni vietano di introdurre fatti, nomi o ricordi non forniti. Poiché un sistema generativo può comunque sbagliare, ogni testo resta modificabile e deve essere approvato dall’autore.', 'Nein. Die Anweisungen verbieten es, nicht bereitgestellte Fakten, Namen oder Erinnerungen einzuführen. Da ein generatives System dennoch Fehler machen kann, bleibt jeder Text bearbeitbar und muss vom Autor freigegeben werden.'],
  ['Chi conserva i materiali del libro?', 'Wo werden die Materialien des Buches gespeichert?'],
  ['Account, progetti, capitoli e interviste sono conservati nell’infrastruttura Splendoria; sul dispositivo restano soltanto preferenze tecniche dichiarate nella Cookie Policy.', 'Konto, Projekte, Kapitel und Interviews werden in der Splendoria-Infrastruktur gespeichert; auf dem Gerät verbleiben nur die in der Cookie Policy beschriebenen technischen Einstellungen.'],
  ['Chi possiede l’opera?', 'Wem gehört das Werk?'],
  ['L’autore conserva i diritti sui materiali originali. Diritti e facoltà d’uso dell’opera finale sono precisati nella conferma contrattuale, nel rispetto del diritto d’autore.', 'Der Autor behält die Rechte an seinen Originalmaterialien. Rechte und Nutzungsbefugnisse am fertigen Werk werden in der vertraglichen Bestätigung unter Beachtung des Urheberrechts festgelegt.'],
  ['La Scuola Holden è sempre inclusa?', 'Ist die Scuola Holden immer enthalten?'],
  ['No. Un eventuale accompagnamento può essere concordato soltanto per Signature, in base al progetto e alla disponibilità, e deve risultare dalla proposta scritta.', 'Nein. Eine mögliche Begleitung kann ausschließlich für Signature, abhängig vom Projekt und von der Verfügbarkeit, vereinbart werden und muss im schriftlichen Angebot aufgeführt sein.'],
  ['Il libro viene stampato?', 'Wird das Buch gedruckt?'],
  ['Digital e Premium prevedono il PDF editoriale; le copie possono essere richieste separatamente. Signature include 10 copie cartacee, con caratteristiche definite nella proposta.', 'Digital und Premium enthalten das redaktionelle PDF; gedruckte Exemplare können separat angefragt werden. Signature umfasst 10 gedruckte Exemplare mit den im Angebot festgelegten Merkmalen.'],
  ['Posso inserire fotografie?', 'Kann ich Fotografien einfügen?'],
  ['Sì, per avere un risultato di qualità l’inserimento delle foto è semi automatico. Componi il tuo PDF scritto, e poi scrivici. Inseriremo manualmente le tue foto, gratuitamente.', 'Ja. Für ein hochwertiges Ergebnis erfolgt das Einfügen der Fotos halbautomatisch. Erstellen Sie zunächst Ihr geschriebenes PDF und kontaktieren Sie uns anschließend. Wir fügen Ihre Fotos manuell und kostenlos ein.'],
  ['La bellezza di poter finalmente trasmettere una visione.', 'Die Schönheit, eine Vision endlich weitergeben zu können.'],
  ['Entra nello Studio di Scrittura', 'Zum Schreibstudio'],
  ['La tua vita in un romanzo', 'Ihr Leben als Roman'],
  ['Guida allo Studio', 'Leitfaden zum Studio'],
  ['Termini e condizioni', 'Allgemeine Geschäftsbedingungen'],
  ['Note legali', 'Rechtliche Hinweise'],
  ['Trasparenza IA', 'KI-Transparenz'],
  ['Privacy, senza sorprese', 'Datenschutz, ohne Überraschungen'],
  ['Usiamo solo strumenti tecnici necessari. Niente pubblicità, niente profilazione. Le bozze possono restare sul tuo dispositivo fino a 12 mesi come copia di sicurezza.', 'Wir verwenden nur technisch notwendige Werkzeuge. Keine Werbung, kein Profiling. Entwürfe können als Sicherungskopie bis zu 12 Monate auf Ihrem Gerät verbleiben.'],
  ['Cookie e dati locali', 'Cookies und lokale Daten'],
  ['Ho capito', 'Verstanden']
]);

const EN = new Map([
  ['La tua vita in un romanzo — Splendoria', 'Your life as a novel — Splendoria'],
  ['Come funziona', 'How it works'],
  ['Listino', 'Pricing'],
  ['Guida', 'Guide'],
  ['Contattaci', 'Contact us'],
  ['Il mio Studio', 'My Studio'],
  ['La tua vita in un romanzo.', 'Your life as a novel.'],
  ['La tua storia destinata a vivere centinaia di anni.', 'Your story, made to live for centuries.'],
  ['Non lasciare che il tempo sbiadisca ciò che hai costruito. Trasformiamo i tuoi ricordi o la visione della tua impresa in un’opera editoriale d’eccezione, guidata dalle Muse e rifinita attraverso una supervisione umana.', 'Do not let time fade what you have built. We transform your memories or your company’s vision into an exceptional editorial work, guided by the Muses and refined through human supervision.'],
  ['Inizia il tuo libro', 'Start your book'],
  ['Osserva la trasformazione', 'See the transformation'],
  ['La tua voce resta sovrana', 'Your voice remains in control'],
  ['Supervisione e approvazione umana', 'Human review and approval'],
  ['Dati custoditi nell’infrastruttura Splendoria', 'Data protected within Splendoria infrastructure'],
  ['Edizione privata', 'Private edition'],
  ['Esempio visivo; copertina e allestimento sono definiti sul progetto.', 'Visual example; cover and production details are defined for each project.'],
  ['La forza della tradizione', 'The strength of tradition'],
  ['Il diritto di essere ricordati.', 'The right to be remembered.'],
  ['Una vita non è una successione di date. È un patrimonio di scelte, gesti, fallimenti, errori e visioni che può continuare a orientare chi verrà dopo.', 'A life is not a sequence of dates. It is a legacy of choices, gestures, failures, mistakes and visions that can continue to guide those who come after us.'],
  ['Memoria', 'Memory'],
  ['Raccogliere ciò che oggi vive soltanto nei ricordi, prima che il tempo ne consumi i dettagli.', 'Gather what now lives only in memory before time wears away its details.'],
  ['Identità', 'Identity'],
  ['Riconoscere il filo che unisce origini, svolte e conquiste, senza tradire la voce di chi racconta.', 'Recognise the thread connecting origins, turning points and achievements without betraying the narrator’s voice.'],
  ['Trasmissione', 'Legacy'],
  ['Consegnare a famiglia, collaboratori e nuove generazioni un’opera leggibile, autorevole e duratura.', 'Give family, colleagues and future generations a readable, authoritative and lasting work.'],
  ['Una scelta di metodo', 'A matter of method'],
  ['Splendoria e la passione per la bella scrittura.', 'Splendoria and a passion for fine writing.'],
  ['La differenza non è nella quantità delle parole, ma nella responsabilità con cui vengono raccolte, verificate e trasformate.', 'The difference is not the number of words, but the responsibility with which they are gathered, verified and transformed.'],
  ['Confronto tra il metodo Splendoria e un processo generico o frammentato', 'Comparison between the Splendoria method and a generic or fragmented process'],
  ['Criterio', 'Criterion'],
  ['Testo generico o processo frammentato', 'Generic text or fragmented process'],
  ['Origine del racconto', 'Source of the story'],
  ['Materiali, ricordi e approvazioni dell’autore', 'Materials, memories and author approvals'],
  ['Prompt isolati o interviste senza continuità', 'Isolated prompts or interviews without continuity'],
  ['Voce', 'Voice'],
  ['Coerenza personale lungo l’intera opera', 'A consistent personal voice throughout the work'],
  ['Tono variabile, spesso anonimo', 'Variable, often anonymous tone'],
  ['Controllo', 'Control'],
  ['Verifiche automatiche e supervisione umana', 'Automated checks and human supervision'],
  ['Controllo affidato al singolo passaggio', 'Control left to each individual step'],
  ['Dato', 'Data'],
  ['Progetto conservato su Splendoria D1 con accessi separati', 'Project stored on Splendoria D1 with separated access'],
  ['File e copie dispersi tra strumenti diversi', 'Files and copies scattered across different tools'],
  ['Esito', 'Outcome'],
  ['Un libro progettato, revisionato e approvato', 'A book that is designed, edited and approved'],
  ['Una raccolta di testi da ricomporre', 'A collection of texts still to be assembled'],
  ['Catalogo dei Percorsi', 'Our editions'],
  ['Tre possibilità, una grande cura editoriale.', 'Three possibilities, one high standard of editorial care.'],
  ['Il percorso si sceglie in base alla profondità della storia, alla quantità dei materiali e al livello di accompagnamento desiderato.', 'Choose the edition according to the depth of the story, the amount of source material and the level of support you want.'],
  ['Sempre incluso in ogni percorso', 'Included in every edition'],
  ['Primo capitolo gratuito, Studio di scrittura riservato, guida delle Muse, dettatura vocale, controllo completo dell’autore, supervisione umana finale, impaginazione editoriale e PDF A5 pronto per la stampa.', 'Free first chapter, private Writing Studio, guidance from the Muses, voice dictation, full author control, final human supervision, editorial layout and a print-ready A5 PDF.'],
  ['Percorso intimo', 'Personal edition'],
  ['Fino a 100 pagine · 12 capitoli', 'Up to 100 pages · 12 chapters'],
  ['Per trasformare i ricordi più importanti in un libro autentico, personale e destinato alla propria famiglia.', 'For turning your most important memories into an authentic, personal book for your family.'],
  ['Percorso digitale guidato dalle Muse', 'Digital journey guided by the Muses'],
  ['Raccolta dei ricordi e costruzione della narrazione', 'Gathering memories and shaping the narrative'],
  ['PDF editoriale A5 pronto per la lettura e per la stampa', 'Editorial A5 PDF ready to read and print'],
  ['Crea gratuitamente il primo capitolo', 'Create your first chapter for free'],
  ['Il più scelto', 'Most popular'],
  ['Percorso approfondito', 'In-depth edition'],
  ['Fino a 120 pagine · 18 capitoli', 'Up to 120 pages · 18 chapters'],
  ['Per raccontare una vita con maggiore profondità, facendo emergere persone, luoghi, passaggi decisivi e significati che meritano più spazio.', 'For telling a life story in greater depth, giving people, places, decisive moments and meanings the space they deserve.'],
  ['Più domande e interviste dedicate alle diverse fasi della vita', 'More questions and interviews dedicated to different stages of life'],
  ['Maggiore profondità narrativa e attenzione alla voce dell’autore', 'Greater narrative depth and closer attention to the author’s voice'],
  ['Revisione editoriale approfondita e PDF A5 pronto per la stampa', 'In-depth editorial review and print-ready A5 PDF'],
  ['Edizione su misura', 'Bespoke edition'],
  ['Fino a 120 pagine · 10 copie cartacee comprese', 'Up to 120 pages · 10 printed copies included'],
  ['Per famiglie, professionisti e fondatori d’impresa che desiderano trasformare la propria storia in un’edizione privata di particolare prestigio.', 'For families, professionals and company founders who want to turn their story into a private edition of particular distinction.'],
  ['Progetto editoriale e interviste costruiti su misura', 'Bespoke editorial project and interviews'],
  ['Assistenza personale fino all’approvazione dell’opera', 'Personal support through to final approval of the work'],
  ['10 copie rilegate con finiture definite nel progetto', '10 bound copies with finishes defined for the project'],
  ['Raccontaci il tuo progetto', 'Tell us about your project'],
  ['Pagine e caratteristiche sono indicative e vengono confermate nella proposta contrattuale. Su richiesta e in base alla disponibilità, può essere concordato un accompagnamento editoriale della Scuola Holden, con proposta separata.', 'Page counts and features are indicative and are confirmed in the contractual proposal. On request and subject to availability, editorial support from Scuola Holden may be agreed under a separate proposal.'],
  ['La stanza della domenica', 'The Sunday room'],
  ['La trasmutazione letteraria: dall’aneddoto all’Opera.', 'Literary transformation: from anecdote to finished work.'],
  ['Muovi il cursore. I fatti restano gli stessi; cambiano ritmo, precisione e forza narrativa.', 'Move the slider. The facts stay the same; rhythm, precision and narrative force change.'],
  ['Sposta il cursore', 'Move the slider'],
  ['Mostra il testo grezzo o l’opera trasformata', 'Show the raw text or the transformed work'],
  ['Il Grezzo', 'The raw text'],
  ['«La cucina di mia nonna era piccola, c’era profumo di ragù.»', '“My grandmother’s kitchen was small; it smelled of ragù.”'],
  ['L’Opera Splendoria', 'The Splendoria version'],
  ['«La cucina di mia nonna non era stata pensata per contenere una famiglia intera. Era una stanza piccola, raccolta, con pochi mobili e un’unica finestra dalla quale entrava una luce chiara, soprattutto nelle mattine d’inverno. Eppure, ogni domenica, accadeva qualcosa di misterioso: le pareti sembravano arretrare di qualche passo per lasciarci entrare tutti.', '“My grandmother’s kitchen had never been designed to hold an entire family. It was a small, intimate room with little furniture and a single window through which clear light entered, especially on winter mornings. Yet every Sunday something almost mysterious happened: the walls seemed to step back to make room for all of us.'],
  ['Il tavolo occupava quasi tutto lo spazio. Durante la settimana sembrava un tavolo qualunque, ma la domenica diventava il centro del nostro mondo. Veniva allungato con assi che comparivano da qualche angolo della casa e ricoperto con la tovaglia migliore, quella bianca, un po’ ruvida, che mia nonna conservava piegata con cura in un cassetto. Intorno si sistemavano sedie diverse tra loro, prese dalla cucina, dal soggiorno e perfino dalle camere. Per i più piccoli c’erano gli sgabelli, oppure qualche cuscino aggiunto per farli arrivare all’altezza del piatto.', 'The table took up almost all the space. During the week it looked ordinary, but on Sundays it became the centre of our world. It was extended with boards that appeared from some corner of the house and covered with the best tablecloth, the white, slightly rough one my grandmother kept carefully folded in a drawer. Around it went mismatched chairs from the kitchen, the sitting room and even the bedrooms. The youngest had stools, or an extra cushion to bring them up to plate height.'],
  ['Non ricordo di aver mai sentito qualcuno lamentarsi della mancanza di spazio. Ci stringevamo, spostavamo i gomiti, passavamo i piatti sopra le teste e ci alzavamo ogni volta che qualcuno doveva raggiungere il proprio posto. Tutto avveniva in una confusione allegra e perfettamente organizzata. Mia nonna sembrava conoscere una geometria segreta: sapeva dove far sedere ciascuno, come riempire ogni angolo e come aggiungere un posto anche quando sembrava davvero impossibile.', 'I do not remember anyone ever complaining about the lack of space. We squeezed together, moved our elbows, passed dishes over people’s heads and stood up whenever someone needed to reach their place. Everything happened in a cheerful, perfectly organised confusion. My grandmother seemed to know a secret geometry: she knew where everyone should sit, how to fill every corner and how to add one more place even when it truly seemed impossible.'],
  ['Lei era già ai fornelli da ore. Quando arrivavamo, la casa era piena di profumi: il sugo che sobbolliva lentamente, la carne...»', 'She had already been at the stove for hours. When we arrived, the house was full of aromas: the sauce simmering slowly, the meat…”'],
  ['50% Opera', '50% finished work'],
  ['Esempio dimostrativo. Splendoria non inventa fatti: l’autore verifica e approva ogni passaggio.', 'Demonstration example. Splendoria does not invent facts: the author verifies and approves every step.'],
  ['Due patrimoni da custodire', 'Two legacies worth preserving'],
  ['La memoria di una famiglia. Le gesta di un’impresa.', 'A family’s memories. A company’s story.'],
  ['Memoria di famiglia', 'Family memories'],
  ['Ciò che i figli non hanno mai avuto il tempo di chiedere.', 'What children never had time to ask.'],
  ['Infanzia, migrazioni, amori, svolte e piccoli rituali diventano una narrazione capace di attraversare le generazioni.', 'Childhood, migrations, loves, turning points and small rituals become a narrative capable of crossing generations.'],
  ['Gesta d’impresa', 'Company story'],
  ['La visione che esisteva prima dei risultati.', 'The vision that existed before the results.'],
  ['Origini, decisioni, crisi e innovazioni restituiscono a fondatori, famiglie imprenditoriali e organizzazioni il senso della propria identità.', 'Origins, decisions, crises and innovations help founders, business families and organisations recover a clear sense of their identity.'],
  ['Le Muse ti guidano', 'The Muses guide you'],
  ['Quattro livelli di controllo. Nessuna delega cieca.', 'Four levels of control. No blind delegation.'],
  ['Leggi la Trasparenza IA', 'Read about AI transparency'],
  ['Assistenza guidata', 'Guided assistance'],
  ['La Musa propone; l’Autore modifica, approva o rifiuta.', 'The Muse proposes; the Author edits, approves or rejects.'],
  ['Coerenza editoriale', 'Editorial consistency'],
  ['Controlli automatici intercettano ripetizioni, incoerenze e risposte incomplete.', 'Automated checks detect repetition, inconsistencies and incomplete answers.'],
  ['Supervisione umana', 'Human supervision'],
  ['La revisione professionale prevista dal percorso precede la consegna definitiva.', 'The professional review included in the chosen edition takes place before final delivery.'],
  ['I tuoi racconti rimangono segreti.', 'Your stories remain private.'],
  ['Assessment Editoriale', 'Editorial assessment'],
  ['La prima architettura del tuo libro.', 'The first architecture of your book.'],
  ['Definisci la trama del libro, indica i passaggi decisivi e ricevi una Scheda Tecnica del Progetto Editoriale pronta da stampare o salvare in PDF.', 'Define the structure of your book, identify the decisive moments and receive an Editorial Project Brief ready to print or save as a PDF.'],
  ['Non compilare questo campo', 'Do not fill in this field'],
  ['Dimensione della trama del libro', 'Scope of the story'],
  ['Quale arco della tua storia vuoi consegnare al futuro?', 'Which arc of your story do you want to pass on to the future?'],
  ['Una stagione', 'One chapter of life'],
  ['Un passaggio decisivo', 'A decisive turning point'],
  ['Una vita', 'A lifetime'],
  ['Dalle origini a oggi', 'From the beginning to today'],
  ['Una famiglia', 'A family'],
  ['Più generazioni', 'Several generations'],
  ['Un’impresa', 'A company'],
  ['Fondazione ed eredità', 'Founding and legacy'],
  ['Nodi cruciali', 'Key turning points'],
  ['Seleziona le svolte che dovranno dare struttura all’opera.', 'Select the turning points that should give the work its structure.'],
  ['Origini e infanzia', 'Origins and childhood'],
  ['Carriera e impresa', 'Career and business'],
  ['Legami e incontri', 'Relationships and encounters'],
  ['Crisi e rinascite', 'Crises and new beginnings'],
  ['Visione e futuro', 'Vision and future'],
  ['Estrazione Muse', 'Muse prompts'],
  ['Tre parole che aprono la memoria', 'Three words that unlock memory'],
  ['Scrivi tre parole separate da virgole: luoghi, oggetti, persone o gesti capaci di riportarti dentro una scena.', 'Write three comma-separated words: places, objects, people or gestures that can take you back into a scene.'],
  ['Investimento editoriale', 'Editorial investment'],
  ['Percorso', 'Edition'],
  ['Scegli il percorso', 'Choose an edition'],
  ['Governance', 'Governance'],
  ['Supervisione desiderata', 'Preferred level of support'],
  ['Scegli il livello', 'Choose a level'],
  ['Livello 1 · Assistenza guidata', 'Level 1 · Guided assistance'],
  ['Livello 2 · Coerenza editoriale', 'Level 2 · Editorial consistency'],
  ['Livello 3 · Supervisione umana', 'Level 3 · Human supervision'],
  ['Livello 4 · Accompagnamento dedicato', 'Level 4 · Dedicated support'],
  ['L’Autore', 'The Author'],
  ['Nome e cognome', 'Full name'],
  ['Telefono', 'Phone'],
  ['Ho letto la', 'I have read the'],
  ['e chiedo di essere ricontattato per questo progetto.', 'and I would like to be contacted about this project.'],
  ['Genera la Scheda Tecnica', 'Generate the Project Brief'],
  ['La generazione avviene nel browser e non invia i dati finché non premi “Affida la scheda a Splendoria”.', 'The brief is generated in your browser and no data is sent until you press “Send the brief to Splendoria”.'],
  ['Splendoria · Scheda Tecnica', 'Splendoria · Project Brief'],
  ['Progetto Editoriale', 'Editorial Project'],
  ['Una prima mappa del patrimonio narrativo emerso dall’Assessment.', 'A first map of the narrative material that emerged from the assessment.'],
  ['Percorso indicato', 'Suggested edition'],
  ['Nodi narrativi', 'Narrative nodes'],
  ['Parole-soglia', 'Key words'],
  ['Orizzonte', 'Horizon'],
  ['Trasmissione familiare o d’impresa nel tempo', 'Passing a family or company story on through time'],
  ['Trama da definire', 'Story structure to define'],
  ['Indice editoriale orientativo basato sulla densità dei materiali indicati; non rappresenta un rendimento economico né una garanzia.', 'Indicative editorial index based on the density of the material provided; it does not represent an economic return or a guarantee.'],
  ['Stampa o salva in PDF', 'Print or save as PDF'],
  ['Affida la scheda a Splendoria', 'Send the brief to Splendoria'],
  ['FAQ e riservatezza', 'FAQ and privacy'],
  ['L’opera è tua. La fiducia è il primo contratto.', 'The work is yours. Trust is the first contract.'],
  ['La memoria personale richiede discrezione, chiarezza e controllo. Queste risposte definiscono i principi; le condizioni definitive sono sempre quelle concordate per iscritto.', 'Personal memories require discretion, clarity and control. These answers set out the principles; the definitive terms are always those agreed in writing.'],
  ['Leggi la Privacy Policy', 'Read the Privacy Policy'],
  ['La Musa può inventare episodi?', 'Can the Muse invent events?'],
  ['No: le istruzioni vietano di introdurre fatti, nomi o ricordi non forniti. Poiché un sistema generativo può comunque sbagliare, ogni testo resta modificabile e deve essere approvato dall’autore.', 'No. The instructions prohibit introducing facts, names or memories that were not provided. Because a generative system can still make mistakes, every text remains editable and must be approved by the author.'],
  ['Chi conserva i materiali del libro?', 'Where are the book materials stored?'],
  ['Account, progetti, capitoli e interviste sono conservati nell’infrastruttura Splendoria; sul dispositivo restano soltanto preferenze tecniche dichiarate nella Cookie Policy.', 'Accounts, projects, chapters and interviews are stored in Splendoria infrastructure; only the technical preferences described in the Cookie Policy remain on the device.'],
  ['Chi possiede l’opera?', 'Who owns the work?'],
  ['L’autore conserva i diritti sui materiali originali. Diritti e facoltà d’uso dell’opera finale sono precisati nella conferma contrattuale, nel rispetto del diritto d’autore.', 'The author retains the rights to their original material. Rights and permitted uses of the final work are specified in the contractual confirmation, in accordance with copyright law.'],
  ['La Scuola Holden è sempre inclusa?', 'Is Scuola Holden always included?'],
  ['No. Un eventuale accompagnamento può essere concordato soltanto per Signature, in base al progetto e alla disponibilità, e deve risultare dalla proposta scritta.', 'No. Any support can only be agreed for Signature, depending on the project and availability, and must be stated in the written proposal.'],
  ['Il libro viene stampato?', 'Is the book printed?'],
  ['Digital e Premium prevedono il PDF editoriale; le copie possono essere richieste separatamente. Signature include 10 copie cartacee, con caratteristiche definite nella proposta.', 'Digital and Premium include the editorial PDF; printed copies can be requested separately. Signature includes 10 printed copies, with specifications defined in the proposal.'],
  ['Posso inserire fotografie?', 'Can I include photographs?'],
  ['Sì, per avere un risultato di qualità l’inserimento delle foto è semi automatico. Componi il tuo PDF scritto, e poi scrivici. Inseriremo manualmente le tue foto, gratuitamente.', 'Yes. To ensure a high-quality result, photographs are inserted semi-automatically. Complete your written PDF first, then contact us. We will insert your photographs manually, free of charge.'],
  ['La bellezza di poter finalmente trasmettere una visione.', 'The beauty of finally being able to pass on a vision.'],
  ['Entra nello Studio di Scrittura', 'Enter the Writing Studio'],
  ['La tua vita in un romanzo', 'Your life as a novel'],
  ['Guida allo Studio', 'Studio Guide'],
  ['Termini e condizioni', 'Terms and conditions'],
  ['Note legali', 'Legal notice'],
  ['Trasparenza IA', 'AI transparency'],
  ['Privacy, senza sorprese', 'Privacy, without surprises'],
  ['Usiamo solo strumenti tecnici necessari. Niente pubblicità, niente profilazione. Le bozze possono restare sul tuo dispositivo fino a 12 mesi come copia di sicurezza.', 'We use only technically necessary tools. No advertising, no profiling. Drafts may remain on your device for up to 12 months as a backup copy.'],
  ['Cookie e dati locali', 'Cookies and local data'],
  ['Ho capito', 'Got it']
]);

const ATTRS = {
  de: new Map([
    ['Esempio di un libro biografico Splendoria rilegato, con titolo dorato', 'Beispiel einer gebundenen Splendoria-Biografie mit goldener Titelprägung'],
    ['Navigazione principale', 'Hauptnavigation'],
    ['Confronto tra Splendoria e una lavorazione editoriale frammentata', 'Vergleich zwischen Splendoria und einem fragmentierten redaktionellen Prozess'],
    ['Servizi inclusi in ogni percorso', 'Leistungen, die in jeder Edition enthalten sind'],
    ['Informazioni e assistenza', 'Informationen und Hilfe'],
    ['Chiudi l’informativa privacy', 'Datenschutzhinweis schließen'],
    ['Informazioni privacy', 'Datenschutzinformationen'],
    ['Per esempio: officina, domenica, mare', 'Zum Beispiel: Werkstatt, Sonntag, Meer'],
    ['Sposta il cursore', 'Regler bewegen'],
    ['Libro biografico Splendoria rilegato con finiture dorate', 'Gebundene Splendoria-Biografie mit goldenen Veredelungen']
  ]),
  en: new Map([
    ['Esempio di un libro biografico Splendoria rilegato, con titolo dorato', 'Example of a bound Splendoria biography with a gold title'],
    ['Navigazione principale', 'Main navigation'],
    ['Confronto tra Splendoria e una lavorazione editoriale frammentata', 'Comparison between Splendoria and a fragmented editorial process'],
    ['Servizi inclusi in ogni percorso', 'Services included in every edition'],
    ['Informazioni e assistenza', 'Information and support'],
    ['Chiudi l’informativa privacy', 'Close privacy notice'],
    ['Informazioni privacy', 'Privacy information'],
    ['Per esempio: officina, domenica, mare', 'For example: workshop, Sunday, sea'],
    ['Sposta il cursore', 'Move the slider'],
    ['Libro biografico Splendoria rilegato con finiture dorate', 'Bound Splendoria biography with gold detailing']
  ])
};

const DYNAMIC = {
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceTextNode(html, source, target) {
  const re = new RegExp(`>(\\s*)${escapeRegExp(source)}(\\s*)<`, 'g');
  return html.replace(re, (_m, before, after) => `>${before}${target}${after}<`);
}

function replaceAttributeValue(html, source, target) {
  for (const attr of ['alt', 'aria-label', 'placeholder', 'title']) {
    const re = new RegExp(`(${attr}=["'])${escapeRegExp(source)}(["'])`, 'g');
    html = html.replace(re, `$1${target}$2`);
  }
  return html;
}

function languageLinks() {
  return `<link rel="alternate" hreflang="it" href="${ORIGIN}/"><link rel="alternate" hreflang="de" href="${ORIGIN}/de/"><link rel="alternate" hreflang="en" href="${ORIGIN}/en/"><link rel="alternate" hreflang="x-default" href="${ORIGIN}/">`;
}

function selector(locale) {
  const labels = { it: 'IT', de: 'DE', en: 'EN' };
  const paths = { it: '/', de: '/de/', en: '/en/' };
  const links = ['it', 'de', 'en'].map(code => `<a href="${paths[code]}" hreflang="${code}" lang="${code}"${code === locale ? ' aria-current="page"' : ''}>${labels[code]}</a>`).join('');
  const aria = locale === 'de' ? 'Sprache wählen' : locale === 'en' ? 'Choose language' : 'Scegli lingua';
  return `<div class="spl-language-bar"><div class="wrap"><nav class="spl-language-switch" aria-label="${aria}">${links}</nav></div></div>`;
}

function selectorCss() {
  return `<style id="spl-language-style">.spl-language-bar{background:#08291f;color:#fff;border-bottom:1px solid rgba(197,160,89,.32)}.spl-language-bar>.wrap{display:flex;justify-content:flex-end}.spl-language-switch{display:flex;align-items:center;gap:0;min-height:34px}.spl-language-switch a{display:inline-flex;align-items:center;justify-content:center;min-width:42px;min-height:34px;padding:4px 10px;color:#dbe6e1;text-decoration:none;font:750 12px/1 Inter,ui-sans-serif,system-ui,sans-serif;letter-spacing:.09em;border-left:1px solid rgba(255,255,255,.13)}.spl-language-switch a:last-child{border-right:1px solid rgba(255,255,255,.13)}.spl-language-switch a[aria-current="page"]{color:#f1d397;background:rgba(255,255,255,.06)}.spl-language-switch a:hover{color:#fff;background:rgba(255,255,255,.08)}@media(max-width:640px){.spl-language-bar>.wrap{justify-content:center}.spl-language-switch a{min-width:48px}}</style>`;
}

function injectSharedLanguageUi(html, locale) {
  if (!html.includes('id="spl-language-style"')) html = html.replace('</head>', `${selectorCss()}</head>`);
  if (!html.includes('class="spl-language-bar"')) html = html.replace(/(<nav class="nav"\b)/, `${selector(locale)}$1`);
  if (!html.includes('hreflang="x-default"')) {
    const canonical = html.match(/<link rel="canonical" href="[^"]+">/)?.[0];
    html = canonical ? html.replace(canonical, `${canonical}${languageLinks()}`) : html.replace('</head>', `${languageLinks()}</head>`);
  }
  return html;
}

function localizeSeo(html, locale) {
  const seo = SEO[locale];
  const canonical = `${ORIGIN}/${locale}/`;
  html = html.replace('<html lang="it">', `<html lang="${seo.lang}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${seo.title}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${seo.description}$2`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${canonical}$2`);
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(">)/, `$1${seo.ogLocale}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${seo.title}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${seo.description}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${canonical}$2`);
  html = html.replace(/(<meta property="og:image:alt" content=")[^"]*(">)/, `$1${seo.imageAlt}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${seo.title}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${seo.description}$2`);
  html = html.replace(/(<meta name="twitter:image:alt" content=")[^"]*(">)/, `$1${seo.imageAlt}$2`);
  return html;
}

function localizeHomeLinks(html, locale) {
  html = html.replace('<a class="brand" href="/">', `<a class="brand" href="/${locale}/">`);
  html = html.replaceAll('href="/#metodo"', `href="/${locale}/#metodo"`);
  html = html.replaceAll('href="/#formule"', `href="/${locale}/#formule"`);
  html = html.replaceAll('href="/#contatti"', `href="/${locale}/#contatti"`);
  html = html.replaceAll('href="/?formula=assisted#contatti"', `href="/${locale}/?formula=assisted#contatti"`);
  html = html.replace('action="/contatti"', `action="/${locale}/contatti"`);
  return html;
}

function addRuntimePatch(html, locale) {
  const tag = `<script src="/assets/i18n-showcase.js?lang=${locale}" defer><\/script>`;
  if (!html.includes('/assets/i18n-showcase.js?lang=')) html = html.replace('</head>', `${tag}</head>`);
  return html;
}

export function localizeShowcaseHtml(html, locale) {
  const dict = locale === 'de' ? DE : EN;
  html = localizeSeo(html, locale);
  for (const [source, target] of dict) html = replaceTextNode(html, source, target);
  for (const [source, target] of ATTRS[locale]) html = replaceAttributeValue(html, source, target);
  html = localizeHomeLinks(html, locale);
  html = injectSharedLanguageUi(html, locale);
  html = addRuntimePatch(html, locale);
  return html;
}

export function enhanceItalianShowcaseHtml(html) {
  return injectSharedLanguageUi(html, 'it');
}

export function localizedShowcaseRoute(url) {
  const normalized = url.pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/de') return { locale: 'de', kind: 'home' };
  if (normalized === '/en') return { locale: 'en', kind: 'home' };
  if (normalized === '/de/contatti') return { locale: 'de', kind: 'contact' };
  if (normalized === '/en/contatti') return { locale: 'en', kind: 'contact' };
  return null;
}

export function toBaseShowcaseRequest(request, route) {
  const url = new URL(request.url);
  url.pathname = route.kind === 'contact' ? '/contatti' : '/';
  const init = { method: request.method, headers: new Headers(request.headers), redirect: request.redirect };
  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) init.body = request.body;
  return new Request(url.toString(), init);
}

export function rewriteLocalizedContactResponse(response, locale) {
  if (![301, 302, 303, 307, 308].includes(response.status)) return response;
  const location = response.headers.get('location');
  if (!location) return response;
  const resolved = new URL(location, ORIGIN);
  if (resolved.origin !== ORIGIN || resolved.pathname !== '/') return response;
  resolved.pathname = `/${locale}/`;
  const headers = new Headers(response.headers);
  headers.set('location', resolved.toString());
  return new Response(null, { status: response.status, statusText: response.statusText, headers });
}

export function localizedDynamicMap(locale) {
  return DYNAMIC[locale] || {};
}
