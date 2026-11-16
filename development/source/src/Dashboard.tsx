import {useState, useEffect} from 'react';
type Task={id:number;area:string;title:string;status:string;p:string;variant:string;detail:string;next:string;source:string;date:string};
const areas=['Produkt','Technik','Rechtliches','Domains/Webseiten','Google Play','Monetarisierung'];
const raw=[
  [
    "Produkt",
    "Produktstrategie V1.3.0 freigegeben",
    "Erledigt",
    "P1",
    "Beide",
    "V1.3.0 ist im Meta-Repo weiterhin die freigegebene Strategie. Neuere Produkt-/Geschäftsprioritäten in der öffentlichen Rollenübersicht setzen Store und Feature-Roadmap hinter belegte Nachfrage. Eine neuere Strategieversion liegt im geprüften Meta-Tree nicht vor.",
    "Bestehendes Werkzeug im Coaching nutzen; Store-Roadmap erst nach erfülltem Geschäftsgate aktivieren.",
    "AGENTS.md; dashboards/gh-pages/vitalos/index.html · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Produkt",
    "Observe / Free definiert",
    "Erledigt",
    "P1",
    "Observe",
    "Manueller Journal-/Skill-Kern bleibt Free. Die Scope-Spezifikation nennt 1 KI-Analyse pro Tag als Ziel; im dokumentierten Store-Build ist KI nicht aktiviert. Tags lösen keine Analyse aus.",
    "Manuellen Tages- und Wochenablauf am integrierten Build abnehmen; KI nicht als live versprechen.",
    "prod/docs/SCOPE-OBSERVE-V1.md; DATA-SAFETY-ANSWERS.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Produkt",
    "Operate / Premium definiert",
    "Erledigt",
    "P1",
    "Operate",
    "Operate ist die Premium-Edition derselben prod-Shell. Editionen sind in prod/src/shell/productEdition.js umgesetzt; ein UI-Modus beweist weder Kauf noch serverseitiges Entitlement.",
    "Preis, Kontingent und Zahlungsweg erst im freigegebenen Premium-Vorhaben entscheiden.",
    "prod/src/shell/productEdition.js; SCOPE-OBSERVE-V1.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Produkt",
    "Durchgängigen Tagesablauf abnehmen",
    "Offen",
    "P1",
    "Beide",
    "Manueller Kern, Suche, Wochenbilanz und Voice-Reflexion liegen im integrierten Journal-Pin. Eine vollständige native Abnahme des aktuellen Gesamtstands ist daraus nicht belegt.",
    "Bei freigegebener Geräteabnahme Login, Eintrag, Wiederfinden, Offline-Verhalten und Kontolöschung protokollieren.",
    "journal-app@04836dc; prod/docs/NATIVE-HEALTH-PROFILE.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Produkt",
    "Wochenbilanz und Voice in Quelle integriert",
    "Erledigt",
    "P2",
    "Beide",
    "Wochenbilanz mit Habit-Auswertung und Wochenspiegel sowie regelbasierte Voice-Reflexion am integrierten journal-app-Pin 04836dc gelesen. Das ersetzt die frühere Aussage „Umsetzung nicht bestätigt“. Keine Geräte- oder KI-Abnahme.",
    "Kein erneuter Implementierungsauftrag; Verhalten im nächsten freigegebenen Nutzertest prüfen.",
    "journal-dev@04836dc: JournalV2Range.jsx, VoicePanel.jsx, habitsToday.js · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Technik",
    "React · pnpm · Firebase Hosting",
    "Erledigt",
    "P1",
    "Beide",
    "React-/pnpm-Workspace mit gemeinsamer Lockdatei, privater Root-Shell und getracktem Produktbereich prod/. Beide verwenden dieselben neun Root-Gitlinks. Firebase Hosting und Sites sind getrennte Ziele.",
    "Bei Releases den Gesamtcommit und die tatsächlich eingebundenen App-Pins dokumentieren.",
    "README.md; AGENTS.md; .gitmodules · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Technik",
    "Firestore eur3 · Google Auth",
    "Erledigt",
    "P0",
    "Beide",
    "Firestore eur3, Firebase Auth und Google-Login sind im Produkt-Runbook dokumentiert. Datenbankstandort, Functions-Region und Vertex-Region sind verschiedene Angaben. Native Google-Anmeldung bleibt separat nachzuweisen.",
    "Login und Datenisolation auf dem vorgesehenen Release-Artefakt prüfen.",
    "prod/docs/FIREBASE.md; DATA-SAFETY-ANSWERS.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Technik",
    "Firebase Blaze aktiviert",
    "Erledigt",
    "P1",
    "Beide",
    "Am 05.11. wurde VitalOS auf Blaze umgestellt und Cloud Billing verknüpft. Dies belegt noch keine serverseitige KI-Implementierung.",
    "Budgetwarnungen und tatsächliche Kosten prüfen.",
    "Firebase-Benachrichtigung · im Verlauf ermittelt",
    "05.11.2026"
  ],
  [
    "Technik",
    "Meta-Stand und alle neun Produkt-Pins geprüft",
    "Erledigt",
    "P0",
    "Beide",
    "Meta-master 6bb6b08 gelesen. journal-app pinnt journal-dev@04836dc. Alle neun Gitlinks und Ursprünge sind zugänglich. Observe/Operate liegen als Editionen unter prod/src/shell; vos-observe ist zusätzlich ein älterer PWA-Prototyp im Meta-Repo. Keine separaten vos-Repositories erforderlich.",
    "Pins unter Stack & Varianten ansehen; neuere Upstream-Commits nicht als integriert zählen.",
    ".gitmodules; Git-Tree master; productEdition.js · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Technik",
    "Smart Logging serverseitig absichern",
    "Unbekannt",
    "P0",
    "Beide",
    "Korrektur zum 09.11.: Die neueren Scope-/Data-Safety-Unterlagen beschreiben keine aktive KI im Store-Produkt. Der gelesene Vertex-Adapter gibt für Produktbuilds null zurück. Die frühere Deployment-Meldung bleibt historisch, bestätigt aber keinen aktuellen Produkt-End-to-End-Lauf.",
    "Vor späterer Operate-Freigabe tatsächlichen Functions-Stand, Einwilligung, Kosten und Tagesbudget prüfen; bis dahin keinen Live-KI-Anspruch.",
    "SCOPE-OBSERVE-V1.md; DATA-SAFETY-ANSWERS.md; firebaseVertexaiCompat.js · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Technik",
    "Offline-Sync und Datenisolation",
    "Unbekannt",
    "P0",
    "Beide",
    "Offline-Cache bleibt dokumentiert. Für deleteOwnAccount nennt DATA-SAFETY-ANSWERS einen erfolgreichen Wegwerfkonto-Test am 12.11. Vollständige Offline-/Zwei-Nutzer-Abnahme des aktuellen Pins ist damit nicht belegt.",
    "Offene Offline- und Isolationsfälle getrennt vom bereits dokumentierten Löschtest abnehmen.",
    "prod/docs/DATA-SAFETY-ANSWERS.md; FIREBASE.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Rechtliches",
    "Datenschutzerklärung erstellt",
    "Erledigt",
    "P0",
    "Beide",
    "Datenschutz-URL ist im Produkt auf https://vitalos.at/vitalos/datenschutz vereinheitlicht. Die Datenfluss-Dokumentation wurde ergänzt. Erstellung und Verlinkung sind belegt; Live-Erreichbarkeit und Abdeckung des neuen Health-Imports bleiben offen.",
    "Vor einem neuen Store-Build Gesundheitsimport und tatsächlich ausgelieferte SDKs mit der öffentlichen Erklärung abgleichen.",
    "prod/docs/DATA-SAFETY-ANSWERS.md; FIREBASE.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Rechtliches",
    "Impressum: aktueller Live-Stand ungeprüft",
    "Unbekannt",
    "P0",
    "Beide",
    "Die frühere Platzhalter-Meldung stammt aus dem gespeicherten Stand vom 09.11. Neuere Projektunterlagen dokumentieren eine freigegebene Kontakt-/Ortsangabe; das aktuelle Live-Impressum konnte nicht geladen werden. Eine weiterhin fehlende Anschrift wird nicht ungeprüft behauptet.",
    "Bei nächster Website-Prüfung den tatsächlichen Impressumsinhalt und Betreiberangaben bestätigen.",
    "FIREBASE.md; Live-Abruf am 16.11. nicht möglich · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Rechtliches",
    "Kontolöschung implementiert und Test dokumentiert",
    "Erledigt",
    "P0",
    "Beide",
    "In-App-Einstieg, öffentliche Löschseite und deleteOwnAccount sind implementiert. DATA-SAFETY-ANSWERS dokumentiert am 12.11. den Function-Deploy und einen erfolgreichen Wegwerfkonto-End-to-End-Test. Kein eigener Cloud-Test in diesem Lauf.",
    "Keinen erneuten Implementierungsauftrag erzeugen; Live-URL und Regression des späteren Release-Kandidaten prüfen.",
    "prod/docs/DATA-SAFETY-ANSWERS.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Rechtliches",
    "Datenflüsse und Fristen klären",
    "Offen",
    "P0",
    "Beide",
    "Datenarten, SDKs, Löschpfade und KI-Abgrenzung sind in DATA-SAFETY-ANSWERS beschrieben. Neu: Health-Profilimport ab 14.11.; die öffentliche Erklärung und Console-Angaben müssen zum neuen Bundle passen. Aufbewahrungs-/Backup-Nachweise sind hier nicht vollständig geprüft.",
    "Health-Angaben und Retention am konkreten Build abgleichen.",
    "prod/docs/DATA-SAFETY-ANSWERS.md; NATIVE-HEALTH-PROFILE.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Domains/Webseiten",
    "Beide Domains gekauft",
    "Erledigt",
    "P1",
    "Beide",
    "vitalos.at und daniel-nimmrichter.at sind für ein Jahr registriert. vitalos.at laut Bestellverlauf ohne automatische Verlängerung.",
    "Verlängerung im Registrar-Konto prüfen und einplanen.",
    "Bestätigung im Verlauf · 03.11.2026",
    "03.11.2026"
  ],
  [
    "Domains/Webseiten",
    "Produkt- und Personenseite vorhanden",
    "Erledigt",
    "P1",
    "Beide",
    "VitalOS-Produktseite in Sites; persönliche Seite daniel-nimmrichter.at und Vitaltrainer-Angebot separat. Veröffentlichung im Verlauf gemeldet.",
    "Aktuelle Domain-Zuordnung und Verlinkung kontrollieren.",
    "Veröffentlichungsmeldungen 03.–04.11.",
    "04.11.2026"
  ],
  [
    "Domains/Webseiten",
    "DNS, TLS und Domain-Nachweis",
    "Unbekannt",
    "P0",
    "Beide",
    "Direkte Abrufe der Produkt-Rechtsseiten, Löschseite und daniel-nimmrichter.at waren am 16.11. über das Recherchewerkzeug nicht möglich. Das ist kein Ausfallnachweis. DNS, TLS, Registrar- und Play-Domainnachweis wurden nicht live geprüft.",
    "Erreichbarkeit und Besitznachweis bei verfügbarem Domain-/Console-Zugriff prüfen.",
    "Abrufversuche 16.11.2026 · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Domains/Webseiten",
    "Rechtliche URLs kontrollieren",
    "Offen",
    "P0",
    "Beide",
    "Kanonische Datenschutz-URL, Hosting-Redirect /datenschutz und /konto-loeschen sind im Repo dokumentiert. Die neueren URLs ersetzen die alten pauschalen Routenannahmen. Aktuelle HTTP-Antworten konnten nicht verifiziert werden.",
    "vitalos.at/vitalos/datenschutz, Impressum und vitalos.web.app/konto-loeschen ohne Login prüfen.",
    "prod/docs/FIREBASE.md; PLAY-CLOSED-TEST-CLICKLIST.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Google Play",
    "Entwicklerkonto & Gebühr",
    "Erledigt",
    "P0",
    "Beide",
    "Am 03.11.2026 erstellt und Registrierungsgebühr bezahlt. Kein Nachweis für abgeschlossene Identitätsprüfung oder Production Access.",
    "Console-Verifikationsstatus erfassen.",
    "Nutzerbestätigung 03.11.2026",
    "03.11.2026"
  ],
  [
    "Google Play",
    "App-Eintrag dokumentiert; Console-Status unbekannt",
    "Unbekannt",
    "P0",
    "Beide",
    "Die aktuelle Klickliste dokumentiert den bestehenden Play-App-Eintrag com.vitalos.app und C-001 als erledigt. Console-Verifikation, Testtrack, Tester und Produktionszugang sind weiterhin nicht direkt zugänglich oder belegt.",
    "Nur verbleibende Console-Zustände erfassen, wenn der Store-Auftrag wieder freigegeben ist.",
    "prod/docs/PLAY-CLOSED-TEST-CLICKLIST.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Google Play",
    "Debug-APK und signierte AAB dokumentiert",
    "Erledigt",
    "P0",
    "Beide",
    "Neu gegenüber dem 09.11.: Die Klickliste dokumentiert ein lokal signiertes AAB vom 12.11. mit Hash und Signaturprüfung, versionCode 1. Nachfolgende Änderungen einschließlich Health-Import sind dadurch nicht als Release-Bundle abgenommen.",
    "Bei späterer Release-Freigabe neuen Gesamtstand, Buildnummer und Artefaktnachweis gemeinsam festhalten.",
    "prod/docs/PLAY-CLOSED-TEST-CLICKLIST.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Google Play",
    "Store-Angaben und Testfreigabe",
    "Offen",
    "P0",
    "Beide",
    "Feature Graphic und vier Phone-Screenshots liegen laut Branding-README vor; sie zeigen lokale Shell-/Leerzustände, keine angemeldete Geräteabnahme. Data-Safety-Antworten und Prüferanleitung sind vorbereitet. Console-Einreichung bleibt unbelegt.",
    "Vor dem nächsten autorisierten Upload Grafiken, Health-Angaben und Formulare auf den tatsächlichen Build abstimmen.",
    "prod/branding/store/README.md; DATA-SAFETY-ANSWERS.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Google Play",
    "Produktionsveröffentlichung",
    "Blockiert",
    "P0",
    "Beide",
    "Kein Store-Upload oder veröffentlichter Track belegt. Die aktuelle öffentliche Rollenübersicht stellt Play-Veröffentlichung und Feature-Roadmap hinter belegte Nachfrage und eine bewusste Freigabe. Dieses Dashboard öffnet das Gate nicht.",
    "Kein Upload-Auftrag aus diesem Status. Erst Geschäftsgate und Release-Abnahme belegen.",
    "dashboards/gh-pages/vitalos/index.html; PLAY-CLOSED-TEST-CLICKLIST.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Monetarisierung",
    "Freemium-Modell festgelegt",
    "Erledigt",
    "P1",
    "Beide",
    "Observe und Operate sind Free-/Premium-Zugänge eines Produkts. V1.3.0 ist freigegeben. 6,90 und 9,90 Euro pro Monat sind Testvarianten; 300 Logs sind eine frühere Hypothese. Coaching-Umsatz wird separat betrachtet.",
    "Kosten je erfolgreicher Analyse und Zahlungsbereitschaft messen.",
    "GitHub vitalos@a1b762e · Prüfung 09.11.2026 · V1.3.0",
    "09.11.2026"
  ],
  [
    "Monetarisierung",
    "Zahlungsweg & Entitlements",
    "Offen",
    "P0",
    "Operate",
    "Stripe ist eine frühere Web-Hypothese, kein bestätigter Produkt-Zahlungsweg. Google Play Billing, Abostatus und serverseitige Entitlements sind eigenständige offene Produktarbeit. Edition-Umschalten beweist keine Kaufberechtigung.",
    "Bei freigegebenem Premium-Vorhaben Zahlungsweg und serverseitige Rechte gemeinsam entscheiden.",
    "CEO-STRATEGY-DELTA.md; productEdition.js · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Monetarisierung",
    "Preis und Premium-Kontingent",
    "Unbekannt",
    "P1",
    "Operate",
    "Premium-Preis und Kontingent bleiben offen. V1.3.0 sieht Tests von 6,90 und 9,90 Euro vor. Modell-/Hostingkosten, Store-Auszahlung und Nachfrage sind zu messen; keine belegte Kostendeckung.",
    "Pilotdaten sammeln und Kostenobergrenze definieren.",
    "GitHub vitalos@a1b762e · Prüfung 09.11.2026 · V1.3.0",
    "09.11.2026"
  ],
  [
    "Technik",
    "Aktueller Shell-Deploy und Live Smoke grün",
    "Erledigt",
    "P0",
    "Beide",
    "GitHub meldet für den aktuellen Meta-Commit 6bb6b08 sowohl Deploy VitalOS Shell als auch Live Smoke erfolgreich abgeschlossen. Dies belegt Shell-Workflows, keinen Produkt-Hosting-Deploy und keine Android-Abnahme.",
    "Kein erneuter Lockfile-Fix-Auftrag; native und Produkt-Release-Belege separat führen.",
    "Actions 43648400410 / 43648528786 · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Google Play",
    "M1-RC Geräteabnahme",
    "Offen",
    "P0",
    "Beide",
    "Aktueller Meta-Pin ist neuer als das dokumentierte signierte AAB. Für den Health-Import nennt die Doku ausdrücklich offene Gerätefälle. Ein vollständiger angemeldeter aktueller Android-Durchlauf ist nicht belegt.",
    "Bei Gerätefreigabe auch Ablehnen/Teilfreigabe, Accountwechsel und Offline-Speicherfehler prüfen.",
    "prod/docs/NATIVE-HEALTH-PROFILE.md; PLAY-CLOSED-TEST-CLICKLIST.md · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Produkt",
    "Feature-Freeze Fach-Apps beschlossen",
    "Erledigt",
    "P1",
    "Beide",
    "Owner-Abnahme 08.11.: Fitness, Fuel, Relax, Plan und 6Pack bis 07.02.2027 nur Wartung mit Nutzerbezug. Neue Funktionen sind nicht freigegeben.",
    "M1-RC und Testuser priorisieren; Kernablauf-Lücken dokumentieren.",
    "vitalos Commit 3485b26 · E2",
    "09.11.2026"
  ],
  [
    "Monetarisierung",
    "Coaching priorisiert; App-Umsatz nicht belegt",
    "Offen",
    "P1",
    "Beide",
    "Coaching ist eine eigenständige Umsatzspur; App-Premium darf daraus nicht als verkauft gelten. Die öffentliche Rollenübersicht priorisiert persönliche Leads und aktive Kanäle vor dem Store. Vertrauliche Klienten-, Finanz- und Org-Daten werden hier nicht übernommen.",
    "Bestehendes Coaching-Angebot über persönliche Kontakte validieren; App-Arbeit an konkrete Nutzungssignale binden.",
    "dashboards/gh-pages/vitalos/index.html · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Technik",
    "Produktregressionen am aktuellen Pin unbelegt",
    "Unbekannt",
    "P0",
    "Beide",
    "Der alte Hinweis auf einen noch laufenden Journal-Deploy vom 09.11. ist veraltet und entfernt. journal-app ist jetzt auf 04836dc gepinnt. Einzelne Journal-Automationsläufe ersetzen keine Tests des Meta-Produkts; daraus wird kein neuer PR-/Merge-Auftrag abgeleitet.",
    "Regressionsnachweis beim nächsten freigegebenen Produktbuild am Gesamtcommit führen.",
    "journal-dev-Pin; GitHub Actions am geprüften Head · vitalos@6bb6b08 · geprüft 16.11.2026",
    "16.11.2026"
  ],
  [
    "Technik",
    "PR #42 abgeschlossen",
    "Erledigt",
    "P1",
    "Beide",
    "Live geprüft: closed, merged=true, Merge am 14.11.2026. Head ebadb1f; eine APPROVED-Review, keine ungelösten Review-Threads, zwei erfolgreiche Check Runs. Legacy-Status pending mit total_count=0 bedeutet keinen laufenden Check. Kein offener Meta-PR beim Abruf.",
    "Keine Merge-Aktion erforderlich. Der aktuelle fitness-app-Pin 9c2e87a ist bereits neuer als der damalige Pin.",
    "GitHub PR #42 / Reviews / Threads / Checks am exakten Head · 16.11.2026",
    "16.11.2026"
  ],
  [
    "Produkt",
    "Freiwilliger Health-Profilimport in Quelle",
    "Erledigt",
    "P1",
    "Beide",
    "Im Meta-Stand integriert: freiwilliger nativer Import von Größe/Gewicht, Vorschau und ausdrückliche Bestätigung. Kein Hintergrundsync. Implementierung ist kein Geräte- oder Store-Nachweis.",
    "Offene native Gerätefälle im später freigegebenen Abnahmelauf prüfen.",
    "prod/docs/NATIVE-HEALTH-PROFILE.md · vitalos@6bb6b08",
    "16.11.2026"
  ],
  [
    "Rechtliches",
    "Health-Import vor Release deklarieren",
    "Offen",
    "P0",
    "Beide",
    "Neuer Datenfluss seit 14.11. verlangt Abgleich von öffentlicher Datenschutzerklärung, Health-Connect-/Data-Safety-Angaben und finalem Bundle. Eine Console-Einreichung ist nicht belegt.",
    "Nur für den nächsten autorisierten Release den neuen Import in Erklärung und Formularen abbilden.",
    "prod/docs/NATIVE-HEALTH-PROFILE.md; DATA-SAFETY-ANSWERS.md",
    "16.11.2026"
  ],
  [
    "Technik",
    "Upstream-Stände getrennt vom Produkt-Pin",
    "Erledigt",
    "P1",
    "Beide",
    "Vergleich am 16.11.: fitness-dev master +2, skills-dev +1, relax-dev +2 und 6pack-dev +6 Commits gegenüber dem gespeicherten Gitlink. Journal und vier weitere Repos entsprechen dem Pin. Neuere Quelländerungen sind nicht im Meta-Stand integriert.",
    "Keine automatische Pin-Aktualisierung; nur bei konkretem Produktbedarf und geprüftem Release übernehmen.",
    ".gitmodules / Commit- und Compare-API · 16.11.2026",
    "16.11.2026"
  ]
];
const tasks:Task[]=raw.map((r,id)=>({id,area:r[0],title:r[1],status:r[2],p:r[3],variant:r[4],detail:r[5],next:r[6],source:r[7],date:r[8]}));
const summaries=["Manueller Kern und Health-Import in Quelle; Geräteabnahme offen.", "Neun Pins verifiziert. Shell-Deploy grün; vier Upstream-Stände neuer.", "Löschtest dokumentiert. Health-Datenschutz und Live-Impressum offen.", "Routen in Quelle geklärt; aktueller DNS-/HTTP-Nachweis fehlt.", "AAB und Grafiken dokumentiert. Kein Track-/Upload-Nachweis.", "Coaching vor Store. Premium-Preis, Zahlung und Entitlements offen."];
const phases=[["01", "Bestehenden Produktstand absichern", "Aktuell", [3, 8, 10, 27, 31, 32, 33, 35]], ["02", "Native Abnahme dokumentieren", "Bei Gerätefreigabe", [6, 13, 28]], ["03", "Release-Voraussetzungen prüfen", "Nach Geschäftsgate", [12, 14, 17, 18, 20, 21, 22, 34]], ["04", "Observe veröffentlichen", "Nur nach Freigabe", [23]], ["05", "Operate erproben", "Später", [9, 25, 26, 30]]];
const history=[["03.11.", "Grundlage geschaffen", "Produktstrategie, Entwicklerkonto, Domainkäufe und rechtliche Dokumente liegen vor."], ["04.11.", "Webseiten im Verlauf ergänzt", "Produkt- und Personenseite vorhanden; aktuelle Domain-Routen noch nicht live verifiziert."], ["05.11.", "Firebase Blaze aktiviert", "Cloud Billing wurde verknüpft. Kostenlimits und serverseitiger Analysepfad bleiben zu prüfen."], ["07.11.", "Projektstand konsolidiert", "Erste Dashboard-Version: 27 Punkte, V1.2.0 und wöchentliches Free-Budget als damaliger Kenntnisstand."]];
const changes=[["16.11.", "Meta-Stand und Pins geprüft", "6bb6b08 mit neun zugänglichen Gitlinks. Journal 04836dc integriert; vier andere Master-Stände sind neuer als ihre Pins."], ["16.11.", "PR #42 erledigt; keine Merge-Aufforderung", "Merge vom 14.11. frisch geprüft, einschließlich Head, Reviews, Threads und Checks. Keine offenen Meta-PRs beim Abruf."], ["16.11.", "Löschung und Store-Vorbereitung nachträglich belegt", "Neuere Dokumente belegen Lösch-Function-Test, signiertes AAB und Store-Grafiken. Kein in diesem Lauf ausgeführter Build der App und kein Console-Upload."], ["16.11.", "Health-Import erweitert den Prüfbedarf", "Code/Runbook vom 14.11. vorhanden. Native Gerätefälle sowie öffentliche Datenschutz-/Console-Angaben bleiben offen."], ["16.11.", "KI-Stand korrigiert", "Neuere Scope- und Data-Safety-Doku beschreiben Store ohne aktive KI. Die frühere Deployment-Meldung aus KW 46 ist kein aktueller Endnachweis."], ["16.11.", "Wochenbilanz und Voice bereits integriert", "Dateien am gepinnten journal-app-Commit gelesen. Kein erneuter Implementierungsauftrag."], ["16.11.", "Dashboard-Ablage zentralisiert", "Website-/vos-Kopien nur zur Migration gelesen. Öffentliche Ausgabe enthält keine Mail-Links, Browserdaten, Klienten-/Finanzdaten oder Zugangsdaten."]];
const archive46=[["09.11.", "V1.3.0 und Tagesbudget übernommen", "Am 08.11. freigegeben: Body, Business, Balance, Being; eine kostenlose Analyse pro Tag. Feature-Freeze bis 07.02.2027 dokumentiert."], ["09.11.", "Android-Artefakte nachträglich belegt", "Dokumentation vom 06.11. belegt Debug-APK und signierte AAB aus cb4a55b. Geräteabnahme und Store-Upload bleiben offen."], ["09.11.", "Shell-Deploy wieder grün", "GitHub bestätigt erfolgreichen Shell-Deploy für a1b762e am 08.11. nach Lockfile-Fix."], ["09.11.", "SmartLog-Deployment gemeldet", "CEO-Dispatch meldet Backend-Deployment am 08.11.; Emulator-Endnachweis fehlt weiterhin."], ["09.11.", "Premium und Coaching getrennt", "6,90 / 9,90 Euro sind Preistests. Coaching/Patreon ist als parallele Spur freigegeben, nicht als gestartetes Angebot."], ["09.11.", "Prüfgrenzen aktualisiert", "Rechtsdokumente gelesen, Domain-Abrufe fehlgeschlagen, Play Console nicht direkt zugänglich. Keine Releasefreigabe bestätigt."]];
const fitnessHistory=["13.11.","Fitness-Produktdashboard ergänzt","Anfänger-Einstieg, freiwillige Detailtiefe, explizite Bestätigung und zwei Trainingsmodi als Konzept festgehalten; keine Implementierungsfreigabe."];
const evidence=[["Meta-Stand und Submodule", "https://github.com/nimmsel23/vitalos/tree/6bb6b084198b0195219a4166f1058a46d45183d8"], ["Submodul-Ursprünge", "https://github.com/nimmsel23/vitalos/blob/6bb6b084198b0195219a4166f1058a46d45183d8/.gitmodules"], ["Observe / Operate Scope", "https://github.com/nimmsel23/vitalos/blob/6bb6b084198b0195219a4166f1058a46d45183d8/prod/docs/SCOPE-OBSERVE-V1.md"], ["Firebase und URL-Zuordnung", "https://github.com/nimmsel23/vitalos/blob/6bb6b084198b0195219a4166f1058a46d45183d8/prod/docs/FIREBASE.md"], ["Data Safety / dokumentierter Löschtest", "https://github.com/nimmsel23/vitalos/blob/6bb6b084198b0195219a4166f1058a46d45183d8/prod/docs/DATA-SAFETY-ANSWERS.md"], ["Native Health-Gerätefälle", "https://github.com/nimmsel23/vitalos/blob/6bb6b084198b0195219a4166f1058a46d45183d8/prod/docs/NATIVE-HEALTH-PROFILE.md"], ["Play-Vorbereitung, keine Einreichung", "https://github.com/nimmsel23/vitalos/blob/6bb6b084198b0195219a4166f1058a46d45183d8/prod/docs/PLAY-CLOSED-TEST-CLICKLIST.md"], ["Store-Grafiken und Grenzen", "https://github.com/nimmsel23/vitalos/blob/6bb6b084198b0195219a4166f1058a46d45183d8/prod/branding/store/README.md"], ["Journal am integrierten Pin", "https://github.com/nimmsel23/journal-dev/tree/04836dc9938b3137f689c2c539c766a2843f3545"], ["PR #42 bereits gemergt", "https://github.com/nimmsel23/vitalos/pull/42"], ["Shell-Deploy am Meta-Head", "https://github.com/nimmsel23/vitalos/actions/runs/43648400410"], ["Öffentliche Rollenübersicht / Geschäftsgate", "https://github.com/nimmsel23/dashboards/blob/9b40fde4a6b30a97e6dae2da38946a03bf5764b2/vitalos/index.html"]];
const pinAudit=[{"path": "6pack-app", "repo": "nimmsel23/6pack-dev", "pin": "51bbdc7fa328709ef435a8d49860ee8cca9ce9f9", "upstream": "5284c1a64ee63cc0ada483776bf257ff58d5f390", "ahead": 6}, {"path": "fitness-app", "repo": "nimmsel23/fitness-dev", "pin": "9c2e87a4a3d2e5e3a52387199f3b5cf3ba0fcd51", "upstream": "11d04417b821290df71ec0c4afcaa784b95caae5", "ahead": 2}, {"path": "fuel-app", "repo": "nimmsel23/fuel-dev", "pin": "ed45247357339c9320366d0b637253bf28ccc13f", "upstream": "ed45247357339c9320366d0b637253bf28ccc13f", "ahead": 0}, {"path": "habit-app", "repo": "nimmsel23/habits-dev", "pin": "9c5f1b88190b4b37f4f1c74460ea1f89374faeb2", "upstream": "9c5f1b88190b4b37f4f1c74460ea1f89374faeb2", "ahead": 0}, {"path": "journal-app", "repo": "nimmsel23/journal-dev", "pin": "04836dc9938b3137f689c2c539c766a2843f3545", "upstream": "04836dc9938b3137f689c2c539c766a2843f3545", "ahead": 0}, {"path": "learn-app", "repo": "nimmsel23/learn-dev", "pin": "1c10d38d8bc92cc3f64f066b40f76e9307ddd934", "upstream": "1c10d38d8bc92cc3f64f066b40f76e9307ddd934", "ahead": 0}, {"path": "plan-app", "repo": "nimmsel23/plan-dev", "pin": "d4181a861810d7a4f26cebbcb9b0c91814ed2f28", "upstream": "d4181a861810d7a4f26cebbcb9b0c91814ed2f28", "ahead": 0}, {"path": "relax-app", "repo": "nimmsel23/relax-dev", "pin": "522538150e15d78d3d0ccc6cf868ce44fd265714", "upstream": "a35f38a35183c6955134f9f78f06d06a02cbe202", "ahead": 2}, {"path": "skills-app", "repo": "nimmsel23/skills-dev", "pin": "6098a12abce234d626542efa5394a8fb0f824fdb", "upstream": "422fe84f5602964014eacf88359ce1c491c7fc49", "ahead": 1}];
const statusClass=(s:string)=>s==='Erledigt'?'done':s==='Blockiert'?'blocked':s==='Unbekannt'?'unknown':'open';
const fitnessDecisions = [
 ['Anfänger zuerst','Bestätigt','P0','Angeleitet ins Training starten und den eigenen Körper besser verstehen.','Erstes Workout ohne zusätzliche Erklärung beginnen können.'],
 ['Coach-Plan oder Vorlage','Bestätigt','P0','Ein bereitgestellter Coach-Plan oder ein vorgefertigtes Workout gibt den Einstieg.','Umfang der Planerstellung und Zuweisung durch Coaches klären.'],
 ['Explizit bestätigen','Bestätigt','P0','Übungen und Sätze abhaken; Eingaben und Korrekturen bleiben möglich. Planwerte sind keine automatisch absolvierten Werte.','Abhaken, Ändern und Überspringen im Ablauf konkretisieren.'],
 ['Freiwillige Detailtiefe','Bestätigt','P0','Auch ein Split ohne Übungen ist ein gültiger Eintrag. Auswertungen bleiben auf die vorhandenen Daten begrenzt.','Für jede Eingabestufe nachvollziehbare Auswertungen definieren.'],
 ['Zwei Trainingsmodi','Bestätigt','P1','Skills-Runner für Zirkel, Calisthenics und Sixpack; freies Logging über vorausgefüllte Session oder Plan-Tab.','Beide Abläufe an einem Beispielworkout durchspielen.'],
 ['Gemeinsamer Session-Kern','Vorschlag','P1','Beide Modi könnten denselben Plan, dieselben Bestätigungen und dieselbe Historie nutzen.','Mit vorhandener Architektur abgleichen; noch keine Umsetzung bestätigt.'],
 ['Belastung & Superkompensation','Offen','P1','Muskelvisualisierung und relative Superkompensationswerte gehören zur ursprünglichen Vision. Modell, Datenbasis und Aussagegrenzen sind offen.','Modell fachlich prüfen; Schätzungen sichtbar von gemessenen Daten trennen.'],
 ['Skills, Coaching & Tarife','Offen','P2','Bedeutung von Skills, Coach-Editor, Plan-Zuweisung und Fitness-Grenzen zwischen Observe/Free und Operate/Premium sind noch offen.','Entscheidungen im CPO-Gespräch treffen; keine Tarifzuordnung vorwegnehmen.']
];
function FitnessDashboard(){
 const [mode,setMode]=useState('Runner'),[level,setLevel]=useState(0),[state,setState]=useState('Alle'),[prio,setPrio]=useState('Alle');
 const levels=[['Nur Split','Push / Pull / Legs','Split-Ratio im Trainingszyklus','Keine konkreten Übungen, keine individuelle Muskelbelastung.'],['Übungen','Split + ausgeführte Übungen','Zuordnung zu beanspruchten Muskeln','Keine quantifizierte Belastung ohne weitere Angaben.'],['Sätze & Wiederholungen','Übungen + bestätigte Sätze / Wiederholungen','Dokumentierter Trainingsumfang','Gewicht, Anstrengung und Erholung bleiben unbekannt.'],['Weitere Details','Zusätzlich Gewicht und optional Anstrengung','Detaillierter Verlauf vergleichbarer Einträge','Kein direkt gemessener Erholungs- oder Superkompensationswert.']];
 const list=fitnessDecisions.filter(x=>(state==='Alle'||x[1]===state)&&(prio==='Alle'||x[2]===prio));
 return <div className="fitness">
 <section className="fitness-hero"><div><div className="eyebrow">VITALOS / FITNESS · PRODUKTVISION</div><h2>Wissen, was zu tun ist.<br/>Verstehen, was es bewirkt.</h2><p>Anfänger starten mit einem Plan, dokumentieren so viel sie möchten und entdecken ihr Training durch verständliche Visualisierungen.</p><span className="fitness-stamp">Konzeptstand · 13. November 2026</span></div><div className="fitness-cycle"> <span>01 <b>Orientierung</b><small>Coach-Plan oder Workout-Vorlage</small></span><span>02 <b>Durchführung</b><small>Explizit abhaken und frei ergänzen</small></span><span>03 <b>Verständnis</b><small>Auswertung passend zur Datentiefe</small></span></div></section>
 <div className="fitness-metrics"><div><strong>2</strong><span>Trainingsmodi</span></div><div><strong>4</strong><span>Stufen der Eingabetiefe</span></div><div><strong>5</strong><span>Bestätigte Produktentscheidungen</span></div><div><strong>Offen</strong><span>Implementierungsnachweis</span></div></div>
 <div className="sectiontitle"><h2>Ein Training. Zwei Bedienweisen.</h2><span>Beschlossener Produktumfang</span></div>
 <section className="fitness-panel"><div className="segmented" aria-label="Trainingsmodus">{['Runner','Freies Logging'].map(x=><button key={x} aria-pressed={mode===x} className={mode===x?'on':''} onClick={()=>setMode(x)}>{x==='Runner'?'Skills-Runner':x}</button>)}</div><div className="fitness-mode"><div><div className="eyebrow">{mode==='Runner'?'GEFÜHRTER ABLAUF':'FLEXIBLE SESSION'}</div><h3>{mode==='Runner'?'Schritt für Schritt durchs Workout':'Der Plan bleibt sichtbar. Du bleibst flexibel.'}</h3><p>{mode==='Runner'?'Für Zirkeltraining, Calisthenics und Sixpack-Workouts: Die aktuelle Station steht im Mittelpunkt. Ausgeführte Schritte werden ausdrücklich bestätigt; Angaben lassen sich ergänzen.':'Start über eine vorausgefüllte Session oder einen eigenen Plan-Tab. Übungen und Sätze sind frei zugänglich, editierbar und einzeln bestätigbar.'}</p></div><ol>{(mode==='Runner'?['Workout auswählen','Aktuelle Übung ausführen','Abhaken und Angaben ergänzen','Zum nächsten Schritt wechseln']:['Session oder Plan öffnen','Übung und Satz auswählen','Ausführung bestätigen und Werte eingeben','Session mit tatsächlichen Einträgen abschließen']).map(x=><li key={x}>{x}</li>)}</ol></div><p className="notice">Gemeinsame Regel: Geplant ist nicht absolviert. Nur bestätigte Ausführung fließt in die Trainingshistorie ein. Dies ist eine Ablaufbeschreibung, kein laufender Workout-Tracker.</p></section>
 <div className="sectiontitle"><h2>Du bestimmst die Detailtiefe.</h2><span>Interaktive Produktlogik</span></div>
 <section className="fitness-panel"><div className="fitness-levels">{levels.map((x,i)=><button key={x[0]} aria-pressed={level===i} className={level===i?'chosen':''} onClick={()=>setLevel(i)}><small>0{i+1}</small>{x[0]}</button>)}</div><div className="fitness-data" aria-live="polite"><div><small>ERFASST</small><h3>{levels[level][1]}</h3></div><div><small>DARAUS SICHTBAR</small><h3>{levels[level][2]}</h3></div></div><p className="notice"><b>Aussagegrenze:</b> {levels[level][3]} Mehr Details sind optional. Es werden keine fehlenden Werte erfunden.</p></section>
 <div className="sectiontitle"><h2>Entscheidungen & offene Fragen</h2><span>{list.length} von {fitnessDecisions.length} Punkten</span></div><div className="filters"><select aria-label="Fitness Entscheidungsstatus" value={state} onChange={e=>setState(e.target.value)}>{['Alle','Bestätigt','Vorschlag','Offen'].map(x=><option key={x}>{x}</option>)}</select><select aria-label="Fitness Priorität" value={prio} onChange={e=>setPrio(e.target.value)}>{['Alle','P0','P1','P2'].map(x=><option key={x}>{x}</option>)}</select><button className="reset" onClick={()=>{setState('Alle');setPrio('Alle')}}>Zurücksetzen</button></div><p className="fitness-caption">„Bestätigt“ = im Gespräch entschieden, nicht entwickelt oder veröffentlicht. Prioritäten sind ein CPO-Vorschlag.</p>
 <div className="fitness-decisions">{list.map(([title,status,p,detail,next])=><details key={title}><summary><span className={'badge '+(status==='Bestätigt'?'done':'open')}>{status}</span><strong>{title}</strong><span className="priority">{p}</span><span>⌄</span></summary><div><p>{detail}</p><p className="next"><b>Nächster Schritt:</b> {next}</p></div></details>)}{!list.length&&<p className="empty">Keine Punkte für diese Filter.</p>}</div>
 <div className="sectiontitle"><h2>Roadmap für das Fitness-Produkt</h2><span>Vorschlag · keine zugesagten Termine</span></div><div className="fitness-roadmap">{[['01','Produktregeln festhalten','Eingabetiefe, Bestätigung und die zwei Modi sind beschrieben.','Nächster Schritt: offene Begriffe und Coach-Rolle entscheiden.'],['02','Einen Trainingsablauf erproben','Eine Vorlage durch Runner und freie Session führen.','Abnahmevorschlag: Ein Anfänger startet und beendet das Workout ohne mündliche Hilfe; keine Planwerte werden ungefragt als Leistung gespeichert.'],['03','Visualisierung prüfen','Split-Ratio und Muskelzuordnung getrennt entwickeln und testen.','Gate: Erfasste Daten und Aussagegrenzen sind sichtbar; ein Belastungs- oder Erholungsmodell benötigt einen eigenen fachlichen Nachweis.']].map(([n,t,d,a])=><details key={n}><summary><b>{n}</b><strong>{t}</strong><span>⌄</span></summary><p>{d}</p><p className="notice">{a}</p></details>)}</div>
 <section className="fitness-panel fitness-source"><div className="eyebrow">HERKUNFT & EINORDNUNG</div><h3>Aus Erfahrung mit Fitness-Apps entstanden.</h3><div className="fitness-tags">{['Madbarz','Thenics','6 Pack Promise','Strong'].map(x=><span key={x}>{x}</span>)}</div><p>Vom Gründer genannte Inspirationsquellen. Welche konkreten Funktionen übernommen oder verbessert werden sollen, ist noch zu klären; kein geprüfter Vergleich der Apps.</p><p><b>Quelle:</b> CPO-Gespräch in diesem Thread, 13.11.2026. Fitness ist Teil des VitalOS Skill Stacks. Die Zuordnung zu Observe/Free und Operate/Premium bleibt offen.</p><p><b>Wochenänderung · KW 46:</b> Ursprüngliche Fitness-Vision, Anfänger-Einstieg, freiwillige Detailtiefe, explizites Abhaken und zwei Trainingsmodi erstmals als Produktdashboard festgehalten.</p><p className="notice">Kein neuer Git-/Release-Abgleich für Fitness in dieser Ergänzung. Bestehende Projekt- und Wochenstände bleiben erhalten. Die Produktplanung ist keine Freigabe einer App-Implementierung oder einer Änderung des dokumentierten Feature-Freeze.</p></section>
 </div>
}
export default function Dashboard(){const [view,V]=useState('Überblick'),[area,A]=useState('Alle Bereiche'),[priority,P]=useState('Alle Prioritäten'),[status,S]=useState('Alle Status'),[variant,F]=useState('Alle'),[query,Q]=useState(''),[selected,D]=useState<Task|null>(null),[week,W]=useState('Diese Woche');
useEffect(()=>{if(window.location.hash==='#fitness')V('Fitness');},[]);
const filtered=tasks.filter(t=>(area==='Alle Bereiche'||t.area===area)&&(priority==='Alle Prioritäten'||t.p===priority)&&(status==='Alle Status'||t.status===status)&&(variant==='Alle'||t.variant===variant||t.variant==='Beide')&&`${t.title} ${t.detail} ${t.area}`.toLowerCase().includes(query.toLowerCase()));
const row=(t:Task)=><button className="task" key={t.id} onClick={()=>D(t)}><span className={'mark '+statusClass(t.status)}>{t.status==='Erledigt'?'✓':t.status==='Blockiert'?'!':t.status==='Unbekannt'?'?':'○'}</span><span className="taskname">{t.title}<small>{t.area} · {t.variant==='Beide'?'Gemeinsam':t.variant}</small></span><span className="priority">{t.p}</span><span className={'badge '+statusClass(t.status)}>{t.status}</span><span className="arrow">↗</span></button>;
return <div className="shell"><aside className="sidebar"><a className="brand" href="#" onClick={()=>V('Überblick')}><b className="logo">V</b>VitalOS<span>DEV</span></a><div className="projectlabel">DEVELOPMENT WORKSPACE</div><nav>{['Überblick','Fitness','Roadmap','Wochenansicht','Stack & Varianten'].map((n,i)=><button className={view===n?'active':''} key={n} onClick={()=>{V(n);window.history.replaceState(null,'',n==='Fitness'?'#fitness':window.location.pathname)}}><span>{['◫','◇','⌁','▤','⊞'][i]}</span>{n}{n==='Wochenansicht'&&<em>KW 47</em>}</button>)}</nav><div className="projectlabel">PROJEKTBEREICHE</div><nav>{areas.map((a,i)=><button key={a} className={area===a?'selected':''} onClick={()=>{A(a);V('Überblick')}}><span className={'dot d'+i}/>{a}<em>{tasks.filter(t=>t.area===a&&t.status!=='Erledigt').length}</em></button>)}</nav><div className="sidebarfoot"><span className="live"/> Android in Entwicklung<p>Daniel Nimmrichter<br/>Quellenbasiertes Projektdashboard</p></div></aside><main><header><div>Workspace <span>/</span> VitalOS <span>/</span> <b>{view}</b></div><span className="snapshot">{view==='Fitness'?'◷ Konzept 13. Nov. 2026':'◷ Stand 16. Nov. 2026'}</span></header><div className="content"><div className="heading"><div className="eyebrow">BUILD WITH INTENTION</div><h1>{view==='Fitness'?'Fitness. Der Ursprung von VitalOS.':view==='Überblick'?'Vom Journal zum Android-Release.':view==='Roadmap'?'Der Weg zum Release.':view==='Wochenansicht'?'Was sich bewegt hat.':'Eine Basis. Zwei Varianten.'}</h1><p>{view==='Fitness'?'Produktentscheidungen, Trainingsmodi und die nächsten offenen Fragen.':view==='Überblick'?'Sechs Bereiche. Ein klarer nächster Schritt. Dein VitalOS-Projekt im Überblick.':view==='Roadmap'?'Etappen aufklappen, Aufgaben prüfen und Abhängigkeiten verstehen.':view==='Wochenansicht'?'Datierte Fortschritte und offene Prüfungen in einer kompakten Wochenübersicht.':'Observe und Operate teilen Daten und Tagespraxis. Premium soll die KI-Nutzung erweitern.'}</p></div>{view==='Fitness'?<FitnessDashboard/>:<><div className="topline"><div className="segmented">{['Alle','Observe','Operate'].map(x=><button key={x} className={variant===x?'on':''} onClick={()=>F(x)}>{x==='Alle'?'Gesamtprojekt':x+(x==='Observe'?' / Free':' / Premium')}</button>)}</div><span className="muted">Dokumentierter Stand · kein Live-Sync</span></div>
<div className="stats">{[['Erledigte Punkte','Erledigt','green'],['Offene Aufgaben','Offen','blue'],['Blocker','Blockiert','red'],['Noch zu klären','Unbekannt','gray']].map(([label,st,color])=><button className={'stat '+color} key={st} onClick={()=>{S(status===st?'Alle Status':st);V('Überblick')}}><span>{label} ↗</span><strong>{tasks.filter(t=>t.status===st&&(variant==='Alle'||t.variant===variant||t.variant==='Beide')).length.toString().padStart(2,'0')}</strong><small>{st==='Erledigt'?'Bestätigt oder dokumentiert':st==='Blockiert'?'Abhängigkeiten auflösen':st==='Unbekannt'?'Nachweise fehlen':'Nächste Umsetzung'}</small></button>)}</div>
{view!=='Stack & Varianten'&&<div className="filters"><input aria-label="Aufgaben suchen" placeholder="⌕  Aufgaben durchsuchen …" value={query} onChange={e=>Q(e.target.value)}/><select aria-label="Bereich" value={area} onChange={e=>A(e.target.value)}>{['Alle Bereiche',...areas].map(x=><option key={x}>{x}</option>)}</select><select aria-label="Priorität" value={priority} onChange={e=>P(e.target.value)}>{['Alle Prioritäten','P0','P1','P2'].map(x=><option key={x}>{x}</option>)}</select><select aria-label="Status" value={status} onChange={e=>S(e.target.value)}>{['Alle Status','Erledigt','Offen','Blockiert','Unbekannt'].map(x=><option key={x}>{x}</option>)}</select><button className="reset" onClick={()=>{A('Alle Bereiche');P('Alle Prioritäten');S('Alle Status');Q('');F('Alle')}}>Zurücksetzen</button></div>}
{view==='Überblick'&&<><section className="focus"><span className="focusicon">↗</span><div><div className="eyebrow">NÄCHSTER MEILENSTEIN</div><h2>Produktstand sichern. Geschäftsgate beachten.</h2><p>Shell-Stand und neue Datenflüsse sind dokumentiert. Store-Arbeit folgt erst nach belegter Nachfrage und eigener Freigabe.</p></div><button onClick={()=>V('Roadmap')}>Roadmap öffnen →</button></section><div className="sectiontitle"><h2>Projektbereiche</h2><span>{filtered.length} passende Punkte · P0 zuerst</span></div><div className="cards">{areas.map((a,i)=>{const list=filtered.filter(t=>t.area===a);if(!list.length)return null;const done=tasks.filter(t=>t.area===a&&t.status==='Erledigt').length,total=tasks.filter(t=>t.area===a).length;return <section className="card" key={a}><div className="cardhead"><span className={'areaicon d'+i}>{['◈','⌘','§','◎','▷','€'][i]}</span><span className="cardcount">{done}/{total} dokumentiert erledigt</span></div><h2>{a}</h2><p className="summary">{summaries[i]}</p><div className="bar"><i style={{width:`${done/total*100}%`}}/></div>{list.sort((a,b)=>a.p.localeCompare(b.p)).map(row)}</section>})}</div>{!filtered.length&&<div className="empty">Keine Aufgaben für diese Filter. <button onClick={()=>{S('Alle Status');A('Alle Bereiche');P('Alle Prioritäten');Q('')}}>Filter löschen</button></div>}</>}
{view==='Roadmap'&&<section className="roadmap"><p className="notice">Reihenfolge statt zugesagter Termine. Release-Gates gelten erst nach belegter Abnahme als erfüllt.</p>{phases.map(([num,title,when,ids])=>{const list=filtered.filter(t=>(ids as number[]).includes(t.id));return <details key={num as string} open={num==='01'}><summary><b className="phase">{num}</b><span><strong>{title}</strong><small>{when} · {list.length} passende Aufgaben</small></span><span className="chevron">⌄</span></summary><div className="phasebody">{list.length?list.map(row):<p>Keine passenden Aufgaben unter den aktuellen Filtern.</p>}<p className="accept"><b>Abnahme:</b> {num==='01'?'Commit, Datenpfade und Konto-/Domainstatus sind nachvollziehbar dokumentiert.':num==='02'?'Einträge bleiben nach Offline-Sync erhalten; erneute Übernahme erzeugt keine Duplikate.':num==='03'?'Testpaket, finale URLs und Console-Angaben sind vollständig geprüft.':num==='04'?'Tests und kontospezifische Freigaben sind abgeschlossen; Einreichung ist bestätigt.':'Berechtigungen, Kontingente, Zahlungsstatus und Fehlerfälle sind serverseitig geprüft.'}</p></div></details>})}</section>}
{view==='Wochenansicht'&&<section className="week"><div className="sectiontitle"><h2>{week==='Archiv KW 45'?'02.–08. November · KW 45':week==='Archiv KW 46'?'09.–15. November · KW 46':'16.–22. November · KW 47'}</h2><select aria-label="Zeitraum" value={week} onChange={e=>W(e.target.value)}><option>Diese Woche</option><option>Seit letztem Quellenstand</option><option>Archiv KW 46</option><option>Archiv KW 45</option></select></div><p className="notice">Vergleich: zuletzt gespeicherte Site-Version 3 vom 13.11.2026 (Quellenbasis 09.11., Fitness-Ergänzung 13.11.) → Prüfung 16.11.2026. Archiv KW 45/46 zeigt den damaligen Wissensstand; historische Meldungen sind keine aktuellen Aufgaben. Neue Nachweise sind nicht heute ausgeführte App-Builds.</p>{(week==='Archiv KW 45'?history:week==='Archiv KW 46'?[...archive46,fitnessHistory]:changes).map(([d,t,b])=><div className="event" key={d+t}><time>{d}</time><span className="eventdot"/><div><h3>{t}</h3><p>{b}</p></div></div>)}<h2 className="weeksubtitle">{week.startsWith('Archiv')?'Historische Quellenlage · keine aktuellen Aufgaben':'Neu bewertete Aufgaben'}</h2>{!week.startsWith('Archiv')&&filtered.filter(t=>t.date==='16.11.2026').map(row)}<h2 className="weeksubtitle">Quellen & Prüfgrenzen</h2><ul>{evidence.map(([title,url])=><li key={url}><a href={url} target="_blank" rel="noreferrer">{title} ↗</a></li>)}</ul><p className="notice">GitHub-Quellen und alle neun Pins zugänglich. Kein direkter Zugriff auf Play Console, Firebase Console, Registrar, lokale Artefakte oder Testgeräte. Live-Webabrufe waren nicht möglich; daraus folgt kein Ausfall. Keine zusätzlichen Nachrichten oder persönlichen Browser-Einträge übernommen. Fehlende separate vos-Repositories sind kein Blocker. Preis-/Bedarfsannahmen und historische Angaben ohne neuen Nachweis bleiben als solche gekennzeichnet.</p></section>}
{view==='Stack & Varianten'&&<><div className="variants">{[['Observe','FREE','Manueller Kern. KI als späteres Kontingent.','Ziel: 1 KI-Analyse/Tag; Store-KI derzeit nicht aktiv','prod/src/shell/productEdition.js · observe'],['Operate','PREMIUM','Gleiche Praxis. Mehr KI als Produktziel.','Premium-Kontingent noch offen','prod/src/shell/productEdition.js · operate']].filter(x=>variant==='Alle'||variant===x[0]).map(([name,label,desc,quota,repo])=><section className="variant" key={name}><span className="badge done">{label}</span><h2>{name}</h2><p>{desc}</p><ul><li>Journal, vier Deposits und manuelle Skills</li><li>Direkte Tags wie +hot</li><li>{quota}</li><li>Gemeinsame Speicher- und Punkteregeln</li></ul><code>{repo}</code></section>)}</div><section className="stack"><h2>Technische Basis</h2><div className="stackgrid">{[['Frontend','React · pnpm'],['Hosting','Firebase Hosting + Sites für Webseiten'],['Daten','Cloud Firestore · eur3'],['Identität','Google Login · Firebase Auth'],['Analyse','Vertex AI / Gemini · Store deaktiviert laut Quelle'],['Abrechnung','Blaze dokumentiert · Produkt-Zahlungsweg offen']].map(([a,b])=><div key={a}><small>{a}</small><strong>{b}</strong></div>)}</div><h2>Repositories & Zuständigkeit</h2>{[['journal-dev','Journal-Kern, Freitextanalyse, Vorschau und Übernahme','https://github.com/nimmsel23/journal-dev'],['vitalos','Meta-Repository, Integration und Skill-Submodule','https://github.com/nimmsel23/vitalos'],['vos-observe/','Historischer PWA-Prototyp im Meta-Repo; nicht die gemeinsame Store-Shell',''],['prod/src/shell/productEdition.js','Observe/Operate sind Editionen desselben Produkts','']].map(([r,d,url])=><div className="repo" key={r}><code>{url?<a href={url} target="_blank" rel="noreferrer">{r} ↗</a>:r}</code><span>{d}</span></div>)}<p className="notice">Quellprüfung 16.11.: Meta-master 6bb6b08. Die Tabelle trennt gespeicherte Gitlinks von den am Prüfungstag gelesenen master-Spitzen. Upstream-Fortschritt ist keine Produktintegration; Branch-Konfiguration ersetzt keinen Pin.</p><div className="pin-table"><table><caption>Alle neun Submodule · Prüfung 16.11.2026</caption><thead><tr><th>Meta-Pfad / Ursprung</th><th>Eingebunden</th><th>Upstream master</th><th>Vergleich</th></tr></thead><tbody>{pinAudit.map(p=><tr key={p.path}><td>{p.path}<small>{p.repo}</small></td><td><a href={`https://github.com/${p.repo}/commit/${p.pin}`} target="_blank" rel="noreferrer">{p.pin.slice(0,7)}</a></td><td><a href={`https://github.com/${p.repo}/commit/${p.upstream}`} target="_blank" rel="noreferrer">{p.upstream.slice(0,7)}</a></td><td>{p.ahead?`${p.ahead} neuere Commits · nicht integriert`:"identisch"}</td></tr>)}</tbody></table></div></section></>}
</>}<footer>VitalOS · Aufmerksamkeit und Alltag bewusster steuern.<span>Stand 16.11.2026 · Quellenprüfung 16.11.2026</span></footer></div></main>{selected&&<div className="overlay" onClick={()=>D(null)}><section className="drawer" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e=>e.stopPropagation()}><button className="close" aria-label="Details schließen" autoFocus onClick={()=>D(null)}>×</button><div className="eyebrow">{selected.area} / {selected.variant}</div><h2>{selected.title}</h2><div className="detailtags"><span className={'badge '+statusClass(selected.status)}>{selected.status}</span><span className="priority">{selected.p} · {selected.p==='P0'?'Release-relevant':selected.p==='P1'?'Hoch':'Später'}</span></div><h3>Aktueller Stand</h3><p>{selected.detail}</p><h3>Nächster Schritt</h3><div className="next">→ {selected.next}</div><h3>Nachweis & Einordnung</h3><p>{selected.source}</p><small>Quellen-/Prüfdatum: {selected.date}<br/>Stand zusammengetragen am 16.11.2026</small><p className="notice">„Erledigt“ bezieht sich nur auf den genannten Punkt. Verfügbarkeit und Umsetzung abhängiger Schritte sind separat ausgewiesen.</p><button className="primary" onClick={()=>D(null)}>Zurück zum Dashboard</button></section></div>}</div>}
