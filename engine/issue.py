#!/usr/bin/env python3
"""Pflegt genau EIN Lage-Issue pro Repo (Label `dashboard`).

- Ampel rot (nur Regeln) → Issue öffnen bzw. Text aktualisieren
  (Kommentar nur, wenn sich die roten Befunde geändert haben → Benachrichtigung).
- Ampel nicht rot → offenes Lage-Issue mit Kommentar schließen.

    issue.py --repo owner/name --assessment a.json --pages-url URL
"""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

LABEL = "dashboard"
TITLE = "Dashboard-Lage: rot"
MARK = "<!-- dashboard-lage -->"


def gh(*args: str, input_: str | None = None) -> str:
    p = subprocess.run(["gh", *args], capture_output=True, text=True, input=input_, check=False)
    if p.returncode:
        print(f"::warning::gh {' '.join(args[:3])}: {p.stderr.strip()[:200]}")
    return p.stdout.strip()


def body(repo: str, asm: dict, url: str) -> tuple[str, str]:
    red = [s for s in asm["signals"] if s["level"] == "red"]
    fp = "|".join(sorted(s["key"] for s in red))
    lines = [MARK, f"<!-- fp:{fp} -->", "## Rote Befunde (Regeln)", ""]
    lines += [f"- [{s['text']}]({s['url']})" if s.get("url") else f"- {s['text']}" for s in red]
    ai = asm.get("ai") or {}
    if ai:
        lines += ["", f"## Lagebild ({ai.get('model', 'KI')})", "", f"**{ai.get('headline', '')}**", "", ai.get("lage", "")]
        if ai.get("naechste_schritte"):
            lines += ["", "**Nächste Schritte**", ""] + [f"{i}. {s}" for i, s in enumerate(ai["naechste_schritte"][:3], 1)]
    lines += ["", f"Dashboard: {url or '(Pages noch nicht aktiv)'}",
              "", "_Automatisch gepflegt vom Dashboard-Workflow. Schließt sich selbst, sobald keine Regel mehr rot ist._"]
    return "\n".join(lines), fp


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--assessment", required=True)
    ap.add_argument("--pages-url", default="")
    a = ap.parse_args()
    asm = json.loads(Path(a.assessment).read_text())

    found = gh("issue", "list", "-R", a.repo, "--label", LABEL, "--state", "open",
               "--json", "number,body", "--limit", "5")
    open_issues = json.loads(found) if found else []
    current = open_issues[0] if open_issues else None

    if asm["status"] != "red":
        if current:
            gh("issue", "close", str(current["number"]), "-R", a.repo, "--comment",
               f"Keine roten Befunde mehr (Ampel: {asm['status']}). Automatisch geschlossen.")
            print(f"Lage-Issue #{current['number']} geschlossen")
        return 0

    text, fp = body(a.repo, asm, a.pages_url)
    if current:
        old_fp = (current.get("body") or "").split("<!-- fp:", 1)[-1].split(" -->", 1)[0]
        gh("issue", "edit", str(current["number"]), "-R", a.repo, "--body-file", "-", input_=text)
        if old_fp != fp:
            gh("issue", "comment", str(current["number"]), "-R", a.repo, "--body",
               "Rote Befunde haben sich geändert — siehe aktualisierte Beschreibung.")
        print(f"Lage-Issue #{current['number']} aktualisiert")
    else:
        gh("label", "create", LABEL, "-R", a.repo, "--color", "536644",
           "--description", "Automatisches Lage-Issue des Dashboards", "--force")
        gh("issue", "create", "-R", a.repo, "--title", TITLE, "--label", LABEL, "--body-file", "-", input_=text)
        print("Lage-Issue angelegt")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
