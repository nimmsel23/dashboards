# COO Workspace

Statisches operatives Dashboard mit Anfragen, Aufträgen, nächsten Schritten, Leistungserfüllung, Zahlungseingängen und Browser-Sicherungen. Die Gestaltung folgt den bestehenden VitalOS-Rollenboards.

## Quellen und Veröffentlichung

- `source/`: HTML, CSS, JavaScript und Icon ohne Geschäfts-Snapshots, Preise, Kontakte oder Klientendaten.
- Privater Rollenbereich und Hosting-Zuordnung: `nimmsel23/vos`, `coo/dashboard/`.
- Diese Quellen liegen im Branch `source/coo-workspace`, außerhalb des Pages-Publishers. Kein öffentlicher Dashboard-Deploy.
- Für die private Site `source/` nach `dist/` kopieren. Die private Hosting-ID und die optionalen privaten Quellenstände kommen aus dem privaten Rollenbereich; sie werden nicht in diesen öffentlichen Branch übernommen.
- `private-sources.json` ist optional. Fehlende Quellenstände blockieren den persönlichen Arbeitsstand nicht.

## Verhalten

Vorgänge starten leer und bleiben im Browser. Keine Synchronisierung mit anderen Geräten, Linear oder den aggregierten Geschäftsquellen. Die Oberfläche benennt diese Grenze und bietet JSON-Export/-Import an. Datierte Quellenstände erscheinen separat und werden nicht zu lokalen Vorgängen addiert. Für Kontakte Kürzel verwenden.

Geldeingänge sind positive ganze Centbeträge. Nur gebuchte/erledigte Aufträge können Zahlungseingänge führen. Einzelzahlungen bleiben erhalten, der offene Betrag bleibt auch nach Erledigung sichtbar. Konflikte zwischen Tabs werden beim Speichern abgewiesen. Sicherungsimport ersetzt den Arbeitsstand erst nach Bestätigung.

THE FIRE ist ausschließlich eine Produktidee (Klarstellung Daniel, 19.11.2026). Kein aktives Angebot und keine daraus erzeugten Verkaufsaufgaben.

## Prüfung

`node --check source/app.js`

Die Domain-Tests lesen den ausführbaren Quellstand aus `source/`:

`node --test tests/domain.cjs`

Geprüft: Teilzahlungen, Restforderungen nach Erledigung, importierte Zahlungsregeln, Datumsprüfung, doppelte Zahlungs-IDs, Centbeträge, Tab-Konflikte, mehr als 20 nächste Schritte und sichere Textausgabe.

Browser-QA: Erstellen und Bearbeiten eines Testauftrags, Teilzahlungen bis vollständige Zahlung, Neuladen, Suche sowie Layout/Eingabemaske bei 320 und 390 px. Testdaten sind ausschließlich lokal in der QA-Sitzung entstanden.
