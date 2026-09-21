export const CASES = [
  {
    id: "already-good",
    targetWords: 96,
    source: "Als ich 1978 nach Bozen kam, hatte ich einen Koffer, zwei Hemden und die Telefonnummer meines Onkels. Mehr war es nicht. Ich arbeitete tagsüber in der Werkstatt und lernte abends Deutsch. Es war keine Heldengeschichte. Ich wollte einfach bleiben können. Meine Mutter schrieb mir jeden Sonntag. Ihre Briefe rochen nach dem Schrank, in dem sie das Papier aufbewahrte. Jahre später habe ich verstanden, dass diese Briefe für mich ein Stück Zuhause waren.",
    mustContain: ["1978", "Bozen", "Mutter"],
    exactQuotes: [],
    forbidden: ["Wendepunkt", "bis heute prägt", "Schicksal"]
  },
  {
    id: "elder-voice",
    targetWords: 105,
    source: "Ich bin kein Mensch, der viel Aufhebens macht. 1964 haben wir geheiratet. Danach kam zuerst Maria, dann Peter. Mein Mann war meistens früh aus dem Haus. Ich habe den Laden geführt und nebenbei die Kinder großgezogen. Das klingt heute vielleicht nach viel, aber damals war das eben so. Am Abend saßen wir manchmal noch zehn Minuten in der Küche. Mehr brauchten wir nicht.",
    mustContain: ["1964", "Maria", "Peter"],
    exactQuotes: [],
    forbidden: ["außergewöhnlich", "beeindruckend", "Lebenswerk"]
  },
  {
    id: "company-facts",
    targetWords: 120,
    source: "Die Firma wurde 1998 von Karl Huber in Meran gegründet. 2007 trat seine Tochter Eva in das Unternehmen ein. 2014 wurde die Produktion nach Lana verlegt. Im Jahr 2021 beschäftigte der Betrieb 38 Mitarbeiter. Über Umsatz, Marktführerschaft oder Exportanteil liegen keine Angaben vor.",
    mustContain: ["1998", "Karl Huber", "Meran", "2007", "Eva", "2014", "Lana", "2021", "38"],
    exactQuotes: [],
    forbidden: ["Marktführer", "Erfolgsgeschichte", "Umsatz stieg", "international erfolgreich"]
  },
  {
    id: "contradiction",
    targetWords: 85,
    source: "Mein Vater sagte immer, wir seien 1957 nach Sterzing gezogen. In einem alten Meldezettel steht dagegen 1958. Ich weiß nicht, welche Angabe stimmt. Sicher ist nur, dass meine Schwester damals noch klein war.",
    mustContain: ["1957", "Sterzing", "1958"],
    exactQuotes: [],
    forbidden: ["1957 zogen wir", "1958 zogen wir"]
  },
  {
    id: "quotation",
    targetWords: 95,
    source: "Mein Großvater sagte oft: „Tu nicht so wichtig, Bub.“ Er sagte es nicht böse. Meistens kam der Satz, wenn ich zu schnell von meinen Plänen erzählte. Danach schwieg er wieder und schnitt Brot. Ich habe mir diesen Satz gemerkt, weil er zu ihm gehörte.",
    mustContain: ["Großvater", "Brot"],
    exactQuotes: ["„Tu nicht so wichtig, Bub.“"],
    forbidden: ["Lebensweisheit", "tiefe Bedeutung"]
  },
  {
    id: "thin-source",
    targetWords: 130,
    source: "1986 eröffnete ich in Bruneck eine kleine Werkstatt. Mein Bruder half mir in den ersten Monaten. Mehr weiß ich darüber im Moment nicht zu erzählen.",
    mustContain: ["1986", "Bruneck", "Bruder"],
    exactQuotes: [],
    forbidden: ["Geruch", "Morgenlicht", "Kunden standen", "schwierige Zeiten", "Traum"]
  },
  {
    id: "overlong",
    targetWords: 150,
    source: "Als wir das Haus übernahmen, war vieles noch provisorisch. Die Küche war klein und die Heizung funktionierte nicht immer. Trotzdem traf sich dort fast jeden Sonntag die ganze Familie. Meine Mutter kochte, mein Vater deckte den Tisch, und wir Kinder mussten danach abräumen. Das wiederholte sich Woche für Woche. Manchmal kamen die Tanten dazu, manchmal die Nachbarn. Es wurde laut geredet, oft gleichzeitig. Niemand nannte diese Treffen besonders. Sie gehörten einfach zum Alltag. Später, als wir alle eigene Familien hatten, wurden die Sonntage seltener. Die Küche wurde umgebaut, der alte Tisch verschwand, und irgendwann merkte ich, dass ich mich an viele Gespräche gar nicht mehr erinnern konnte. Was geblieben ist, sind einzelne Bilder: die Hände meiner Mutter am Topf, mein Vater mit der gefalteten Zeitung, das Geräusch der Stühle auf dem Boden. Ich erzähle das nicht, weil damals alles besser gewesen wäre. Vieles war anstrengend. Aber diese Sonntage geben meiner Erinnerung bis heute eine Ordnung.",
    mustContain: ["Mutter", "Vater", "Sonntage"],
    exactQuotes: [],
    forbidden: ["goldene Zeit", "unvergesslich", "für immer"]
  },
  {
    id: "regional-restraint",
    targetWords: 105,
    source: "Bei uns sagte man nicht viel über Gefühle. Wenn etwas gelungen war, hieß es höchstens: „Passt schon.“ Das war in unserer Familie fast ein Lob. Mein Bruder und ich wussten genau, was gemeint war. Erst viel später habe ich gemerkt, dass andere Familien anders miteinander sprachen.",
    mustContain: ["Bruder", "Familie"],
    exactQuotes: ["„Passt schon.“"],
    forbidden: ["typisch südtirolerisch", "alpine Mentalität", "raue Bergwelt"]
  }
];
