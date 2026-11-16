# VitalOS Dashboards

Ab 13.11.2026 zentrale Ablage für Dashboard-Quellen und veröffentlichbare Ausgaben. Bestehender Branch: gh-pages. Vor Änderungen den aktuellen Stand lesen und andere Boards erhalten.

| Dashboard | Einstieg | Quellen |
| --- | --- | --- |
| Master / Coaching | [Master](index.html) | Bisher extern aus vos generiert |
| Entwicklung (16.11.2026) | [Dashboard](development/index.html) | [React/Vite](development/source/) |
| Fitness Produkt (CPO) | [Fitness](fitness-product/index.html) | [React/Vite](fitness-product/source/) |

Neue Dashboards erhalten einen eigenen Ordner. Bestehende Kopien in Website- oder Rollen-Repositories nicht ohne abgestimmte Migration löschen. Rollen-Repositories können Mandat, Entscheidungen, Research und Backlog enthalten und auf ihr Dashboard hier verweisen; diese Rollenstruktur ist ein Vorschlag, noch keine durchgeführte Migration.

Öffentliches Repository: nur zur Veröffentlichung geeignete Inhalte. Private Arbeitsdaten bleiben in den jeweiligen privaten Quellen. Generatoren müssen fremde Dashboard-Ordner erhalten; der Master-Index stammt aktuell aus einer externen Pipeline.

## Aktualisierung 16.11.2026

Die bisherige README und `fitness-product/` fehlten im aktuellen gh-pages-Tree. Beide werden aus dem letzten bekannten Stand additiv wieder aufgenommen. Die vorhandenen Boards business/, coach/, coaching/, creator/, fitness/, org/, vitalos/, vitaltrainer/ und workspace/ bleiben unverändert. Die bestehende vitalos/-Rollenübersicht und das Entwicklungsdashboard haben getrennte Ordner.

[Prüfung, Migration und Veröffentlichungsgrenze](development/README.md). Zentrale Quellenpflege erfolgt hier; alte Website-/vos-Kopien werden nicht parallel geändert. Generatoren dürfen nur ihre eigenen Pfade ersetzen.

