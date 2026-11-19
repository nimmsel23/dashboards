# VitalOS Entwicklungsdashboard

Geprüfter Stand: 16. November 2026. Quelle: `nimmsel23/vitalos@6bb6b084198b0195219a4166f1058a46d45183d8`.

- [Statische Dashboard-Ausgabe](index.html)
- [Gemeinsame React-Inhalte](source/src/Dashboard.tsx) und [CSS](source/src/styles.css)
- [Datierter Quellenvergleich](evidence/2026-11-16-snapshot.json)
- [Gitlinks und PR-42-Prüfung](evidence/2026-11-16-audit.json)

## Pflege

Sites-Projekt: `appgprj_6aef3b6e8abc819191c7a4ede0455702`.
Die Site verwendet Vinext. Der Export hier verwendet Vite. Gemeinsame Inhalte sind die React-Komponente und CSS; Hosting-Konfigurationen, Zugangsdaten und Sites-Identität werden nicht in den Export kopiert.

Build: im Ordner `source/` mit Node 22+ `npm install` und `npm run build` ausführen. Geprüfte Dateien aus `source/dist/` nach `development/` kopieren. Nur die eigenen generierten Assets ersetzen, niemals fremde Dashboard-Ordner oder den gesamten gh-pages-Branch.

Die öffentlichen Dateien enthalten keine privaten Nachrichtenlinks, persönlichen Browser-Einträge, Klienten- oder Finanzdaten, internen Org-Protokolle, Firebase-Konfigurationswerte oder Zugangsdaten. Historische Wochenänderungen bleiben im UI als damaliger Wissensstand erhalten. Projekt-/Release-Nachweise sind keine Rechtsprüfung oder Store-Freigabe.

`fitness-product/` bleibt ein eigenständiges bestehendes Board. `vitalos/` ist die bestehende Rollenübersicht und wird nicht durch dieses Dashboard ersetzt. Website-/vos-Kopien wurden zur Migration nur gelesen und werden nicht parallel gepflegt.

## Aktualisierungsregel

Vor PR-Empfehlungen frischen Zustand, merged/merged_at, Head-SHA, Reviews, ungelöste Threads sowie Checks und Statuskontexte genau dieses Heads laden. Erledigte PRs nicht erneut beauftragen. Ein leerer Legacy-Status pending mit total_count=0 ist kein laufender Check. App-CI und Shell-CI getrennt halten. Kein automatischer Merge. Vor neuen Issues offene und geschlossene Arbeit auf Duplikate prüfen.

## Prüfung am 16.11.2026

TypeScript, Vinext- und Vite-Produktionsbuild sowie Browserprüfung von Priorität/Status, Variantenfilter, Roadmap-Drilldown und Wochenarchiv bestanden. Fitness-Komponente und Daten der KW45/KW46 gegenüber Site-Version 3 erhalten. Alle neun Submodul-Pins lesbar; vier upstream master-Stände sind neuer als der gespeicherte Gitlink. Play Console, Firebase Console, Registrar und Geräte waren nicht direkt zugänglich. Live-Webabrufe konnten nicht verifiziert werden.

## Migration / Freigabegrenze

Auf gh-pages fehlten am Beginn README und fitness-product/ gegenüber dem letzten bekannten Commit `01a9e66a37f2392e08f8c15ad516bcbd897cd996`. Die vorherige Fitness-Struktur wird unverändert aus ihrem Git-Tree additiv wiederhergestellt; aktuelle Ordner bleiben erhalten.

Die bestehende Site meldet access_mode=public, obwohl dieser Auftrag eine private Veröffentlichung verlangt. Sites-Version 4 ist mit Quellcommit `e4ea897c27e7d21f5339104c114761159be8a5c1` und lokal gebautem Archiv erfolgreich gespeichert; keine öffentliche Neuveröffentlichung und keine stillschweigende Änderung der Zugriffsrechte. Der öffentliche Git-Export ist separat beauftragt und enthält ausschließlich veröffentlichbare Inhalte.

## Linear

Aufgabendetails können auf ein bestehendes Linear-Ticket verweisen. Die Zuordnung wird im jeweiligen Browser gespeichert. Für offene oder blockierte Punkte ohne Verknüpfung führt der Entwurfslink zu Linear. Er übergibt Titel, Bereich, Priorität, Quellenstand und die öffentliche Projektquelle. Die GitHub-Verbindung wird im Linear-Workspace konfiguriert.
