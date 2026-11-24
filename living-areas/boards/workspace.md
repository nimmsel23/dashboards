# Dashboard — workspace Hub

Generated: 2026-11-25T00:12:24+01:00 · SHA: `797b955` · Issue: [#28](https://github.com/nimmsel23/vitalos/issues/28) · Repo: `nimmsel23/workspace`

Refresh: `living-areas/gen-boards.py` in `nimmsel23/dashboards` @ `engine`.

---

## 1. Team

- `angebot.md`
- `bewerbung.md`
- `content.md`
- `klienten.md`
- `strategie.md`
- `verwaltung.md`

Agenten-Dateien: **6** (Evidence: `.claude/agents/`).


## 2. Wochenrhythmus

- `di-content.md`
- `do-bewerbung.md`
- `fr-verwaltung.md`
- `mi-angebot.md`
- `mo-wochenstart.md`
- `monat-abschluss.md`
- `so-profit-review.md`

Berichte (ohne Vorlage): **1** — 2026-KW47.md.


## 3. Git / Siblings

```
## master...origin/master [voraus 1, hinterher 2]
?? .vos
```

SHA `797b955`

- `creator: ok → /home/alpha/creator`
- `vitaltrainer: ok → /home/alpha/vitaltrainer`
- `business: ok → /home/alpha/business`


## 4. Automation backlog

AUTOMATISIERUNG.md Kopf:

```
# Automatisierung — Ideen für das Business-Team

Stand 2026-11-12. **Noch nichts davon ist aktiv.** Reihenfolge nach Nutzen pro Aufwand.
Regel aus dem Arbeitsprofil: erst ein Lieferstück abschließen, dann die nächste Automatisierung. Höchstens eine neue pro Woche.

## Stufe 1 — Dezember (einfach, sofort nützlich)

| # | Idee | Auslöser | Werkzeug | Nutzen |
| --- | --- | --- | --- | --- |
| 1 | **Wochen-Prompts per Timer** | Mo/Di/Mi/Do/Fr 07:30, So 18:00 | systemd --user Timer → `~/workspace/team/run <prompt>` | Der Wochenbericht füllt sich ohne Anstoßen |
| 2 | **Ein-Zeilen-Info aufs Handy** | Ende jedes Timer-Laufs | `/home/alpha/.dotfiles/bin/tele` (absoluter Pfad, systemd hat keinen PATH) | Daniel sieht den Stand, ohne den Laptop zu öffnen. Nur 1 Nachricht pro Lauf |
| 3 | **Gmail-Plus-Adressen für das Business** | eingehende Mail an `+workshop`, `+audit`, `+bewerbung` | Gmail-Filter → Label; `mi-angebot`/`do-bewerbung` suchen nach Label | Anfragen gehen nicht im Posteingang unter. Gleiches Muster wie `+hotlist`/`+fitness` |
| 4 | **Schmerz-Log aus dem Audit-Bericht** | Audit-Bericht im Klienten-Ordner fertig | Agent `klienten` hängt 3 anonyme Bullets an | Content- und Produkt-Input ohne Extraschritt |
| 5 | **Starter-Kit-Build** | Änderung an `~/vitaltrainer/marketing/starter-kit/*.md` | Skill `pdf` (bzw. pandoc) → PDF mit Versionsnummer | Das Kit bleibt eine Quelle, das PDF ist immer aktuell |

Timer-Gerüst für #1 (Beispiel Montag):

```ini
# ~/.config/systemd/user/team-mo.service
[Service]
Type=oneshot
ExecStart=/home/alpha/workspace/team/run mo-wochenstart

# ~/.config/systemd/user/team-mo.timer
[Timer]
```


## 5. Owner-Offen (TEAM.md Treffer)

- L49: 1. **Arbeitsprofil zuerst:** `~/Astrologie/daniel-radix/agenten/business.md`. Ein Ziel, ein Output. Keine Visionen vergrößern, keine neuen Tools oder Architektu
- `L58: ## Offene Punkte für Daniel`
- L60: - **Avatarin:** erledigt — Influencer-Mütter stecken als Beachhead im Skill `build-in-public` (präventiv/40+ bleibt der Rahmen). Focus Map = aktueller Fokus.
- L62: - **Automatisierung:** Ideen und Reihenfolge stehen in `team/AUTOMATISIERUNG.md`. Bisher läuft nichts automatisch (Timer ab Dez geplant).


## 6. Outbound-Guard

- Agenten nur vorbereiten; Mails/Posts/Buchungen = Owner (TEAM.md / AGENTS.md).

