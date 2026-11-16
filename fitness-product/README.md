# VitalOS Fitness · Produktdashboard

Zentrale Dashboard-Ablage ab 13.11.2026: nimmsel23/dashboards. Produktstand aus dem CPO-Gespräch; keine neue Implementierungs- oder Releaseprüfung.

- `index.html` und `assets/`: geprüfter Vite-Build mit relativen Asset-Pfaden.
- `source/`: React-/CSS-Quellen und Vite-Projekt. Node >=22.13; `npm install`, `npm run dev` bzw. `npm run build` in source/. Buildausgabe nach ../ kopieren, vorhandene fremde Dateien erhalten.
- Gleicher Fitness-Inhalt als Sidebar-Tab: https://vitalos-development-hub.nimmdaniel.chatgpt.site/#fitness
- Herkunft: vos@148ebcf0b8396c673fa930c641876ce74fcb48a6, fitness/product-dashboard. Dortige Dateien unverändert übernommen; bisherige Kopien in vos und Vitaltrainer bleiben erhalten.
- Modi, Eingabetiefe, Filter und Roadmap im Browser geprüft; Vite-Produktionsbuild erfolgreich. Bestätigte Produktentscheidungen sind keine fertigen Features.

## Pflege

Neue Dashboard-Änderungen hier committen. Dieses Repository ist öffentlich: keine privaten Org-Dokumente, Zugangsdaten oder Nutzerdaten übernehmen. Die alte Website-/vos-Kopie ist keine zusätzliche Schreibquelle. Der Master-Index wird derzeit extern aus vos generiert; ein späterer Generatorlauf kann den ergänzten lokalen Link ersetzen. fitness-product/ muss bei Veröffentlichung erhalten bleiben.
