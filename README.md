# dashboards @ engine

Engine für die **Living Dashboards** der VitalOS-Dev-Repos. Jedes Repo bekommt unter
`https://nimmsel23.github.io/<repo>/` ein Dashboard im Stil des VitalOS-CEO-Dashboards.

Dieser Branch (`engine`) ist unabhängig vom Branch `gh-pages` (Master-Dashboard) dieses Repos.

## Wie es läuft

| Schritt | Wer | Was |
| --- | --- | --- |
| Evidenz | `engine/collect.py` | git (dev/master-Abstand, Commits, Aktivität), Actions-Läufe, Issues, PRs, Docs-Auszüge, Firebase-Sites |
| Ampel | `engine/assess.py` (Regeln) | rot = CI auf dev/master rot (≤14 Tage) oder dev/master divergiert · gelb = Promotion hängt >24 h, PR >7 Tage |
| Lagebild | Gemini (`GEMINI_API_KEY`), jeder Lauf | Headline, Lage, Auffälligkeiten, ≤3 nächste Schritte, offene Owner-Fragen — nur aus Evidenz |
| Tiefenanalyse | Claude Code Action (`CLAUDE_CODE_OAUTH_TOKEN`), montags | agentisch: prüft Code/Docs selbst, schreibt `deep.md` mit Belegen |
| Lage-Issue | `engine/issue.py` | genau ein Issue (Label `dashboard`), öffnet nur bei Regel-Rot, schließt sich bei Grün/Gelb |
| Zustand | Branch `dashboard` im Ziel-Repo | `index.html`, `dashboard.json`, `deep.md` — Gedächtnis für den nächsten Lauf |
| Pages | Jekyll über `docs/` + Dashboard als `/index.html` | eine vorhandene docs-Startseite wandert nach `/docs.html` |

Die KI löst nie Alarm aus — Ampel und Issue kommen nur aus Regeln.
`dev`/`master` werden nie beschrieben (würde die Auto-Promotion blockieren).

## Neues Repo anschließen

1. `templates/dashboard.yml` nach `.github/workflows/dashboard.yml` im Ziel-Repo (auf `dev`).
2. Pages-Quelle auf „GitHub Actions“: `gh api -X POST repos/nimmsel23/<repo>/pages -f build_type=workflow`
   (bestehende Seite: `-X PUT`).
3. Environment `github-pages`: Branches `dev` und `master` erlauben.
4. Secrets: `GEMINI_API_KEY` (Pflicht für Lagebild), `CLAUDE_CODE_OAUTH_TOKEN` (optional, Tiefenanalyse;
   erzeugen mit `claude setup-token`).

Lokal testen (im Ziel-Repo):

```sh
python3 ~/dev/dashboards-engine/engine/collect.py --repo nimmsel23/<repo> --out /tmp/ev.json
python3 ~/dev/dashboards-engine/engine/assess.py --evidence /tmp/ev.json --state /tmp/state --out /tmp/as.json
python3 ~/dev/dashboards-engine/engine/render.py --evidence /tmp/ev.json --assessment /tmp/as.json --state /tmp/state --out /tmp/out
```
