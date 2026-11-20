# COO Workspace

Statisches operatives Dashboard mit Anfragen, Aufträgen, nächsten Schritten, Leistungserfüllung, Zahlungseingängen und Browser-Sicherungen. Die Gestaltung folgt den bestehenden VitalOS-Rollenboards.

## Quellen und Veröffentlichung

- `source/`: HTML, CSS, JavaScript und Icon ohne Geschäfts-Snapshots, Preise, Kontakte oder Klientendaten.
- Privater Rollenbereich und Hosting-Zuordnung: `nimmsel23/vos`, `coo/dashboard/`.
- Diese Quellen liegen im Branch `source/coo-workspace`, außerhalb des Pages-Publishers. Kein öffentlicher Dashboard-Deploy.
- Für die private Site `source/` nach `dist/` kopieren. Die private Hosting-ID und die optionalen privaten Quellenstände kommen aus dem privaten Rollenbereich; sie werden nicht in diesen öffentlichen Branch übernommen.
- `private-sources.json` ist optional. Fehlende Quellenstände blockieren den persönlichen Arbeitsstand nicht.

## Verhalten

Das Dashboard speichert Vorgänge zunächst im Browser. Unter **Daten** verbindet ein freigegebenes Google-Konto das Gerät mit dem privaten COO-Arbeitsstand. Änderungen werden bei aktiver Verbindung übertragen. Bei widersprüchlichen Änderungen zeigt die App beide Fassungen zur Auswahl. Die private Git-Kopie liegt unter `vos/coo/data/`. JSON-Export und -Import bleiben verfügbar. Datierte Quellenstände erscheinen separat und werden nicht zu lokalen Vorgängen addiert. Für Kontakte Kürzel verwenden.

Geldeingänge sind positive ganze Centbeträge. Nur gebuchte/erledigte Aufträge können Zahlungseingänge führen. Einzelzahlungen bleiben erhalten, der offene Betrag bleibt auch nach Erledigung sichtbar. Konflikte zwischen Tabs werden beim Speichern abgewiesen. Sicherungsimport ersetzt den Arbeitsstand erst nach Bestätigung.

THE FIRE ist ausschließlich eine Produktidee (Klarstellung Daniel, 19.11.2026). Kein aktives Angebot und keine daraus erzeugten Verkaufsaufgaben.

## Prüfung

`node --check coo/source/app.js`

Die Domain-Tests lesen den ausführbaren Quellstand aus `source/`:

`node --test coo/tests/*.cjs coo/tests/*.mjs`

Geprüft: Teilzahlungen, Restforderungen nach Erledigung, importierte Zahlungsregeln, Datumsprüfung, doppelte Zahlungs-IDs, Centbeträge, Tab-Konflikte, mehr als 20 nächste Schritte und sichere Textausgabe.

Browser-QA: Erstellen und Bearbeiten eines Testauftrags, Teilzahlungen bis vollständige Zahlung, Neuladen, Suche sowie Layout/Eingabemaske bei 320 und 390 px. Testdaten sind ausschließlich lokal in der QA-Sitzung entstanden.

## Installierbare Web-App (19.11.2026)

Manifest mit stabilem App-ID/Scope, Standalone-Modus und Direktzugriffen auf Vorgänge, nächste Schritte und Zahlungen. PNG-App-Icons 192/512 px, maskierbare Icons 192/512 px und Apple-Touch-Icon 180 px. Gleiche VitalOS-Marke wie das Favicon, als PNG exportiert.

Der Service Worker cached ausschließlich die statischen UI-Dateien und den bestätigten App-Start. Private Quellenstände, Anmeldewege, URLs mit Queryparametern und fremde Origins werden nicht gecached. Ein echter Online-Anmeldebildschirm wird stets angezeigt und verwirft den gespeicherten Offline-App-Start. Offline-Zugriff auf die bereits geladenen lokalen Vorgänge ist nach dem ersten erfolgreichen Online-Öffnen möglich.

Eine neue Version wartet auf „Aktualisieren“; bei geöffnetem Vorgang wird das Neuladen verhindert. Kein automatisches Neuladen während Eingaben. `VERSION` in `sw.js` und `coo-build` im HTML bei Änderungen an Shell/Assets gemeinsam erhöhen.

`node --test coo/tests/pwa.cjs` prüft neun PWA-Fälle zusätzlich zu den elf Domain-Tests. Installation auf einem echten iPhone wurde nicht geprüft. Auf dem iPhone zuerst die private Seite in Safari anmelden, dann Teilen → Zum Home-Bildschirm; falls angeboten, Als Web-App öffnen aktivieren. Safari und installierte App können getrennte lokale Datenbereiche verwenden. Für den Abgleich auf beiden Geräten dasselbe freigegebene Google-Konto wählen.
