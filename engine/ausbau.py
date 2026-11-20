#!/usr/bin/env python3
"""Macht aus der Tabelle „## Ausbaustufen“ der Tiefenanalyse GitHub-Issues (Label `ausbaustufe`).

- Nur Stufen Gerüst / halb fertig / verwaist (Idee und benutzbar nicht).
- Ein Issue pro Bereich (Marker im Body). Offenes Issue → Text aktualisieren.
- Geschlossenes Issue → nie wieder anlegen (Daniel hat entschieden).
- Höchstens MAX_NEW neue Issues pro Lauf, damit nichts überflutet.

    ausbau.py --repo owner/name --deep work/deep.md --pages-url URL [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path

LABEL = "ausbaustufe"
MAX_NEW = 5
STAGES = {"gerüst": "Gerüst", "geruest": "Gerüst", "halb fertig": "halb fertig", "verwaist": "verwaist"}


def gh(*args: str) -> str:
    p = subprocess.run(["gh", *args], capture_output=True, text=True, check=False)
    if p.returncode:
        print(f"::warning::gh {' '.join(args[:3])}: {p.stderr.strip()[:200]}")
    return p.stdout.strip()


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9äöüß]+", "-", text.lower()).strip("-")[:60]


def clean(cell: str) -> str:
    return re.sub(r"\s+", " ", cell.replace("**", "")).strip()


def parse(deep: str) -> list[dict]:
    m = re.search(r"^##\s+Ausbaustufen.*?$(.*?)(?=^##\s|\Z)", deep, flags=re.M | re.S)
    if not m:
        return []
    rows = []
    for line in m.group(1).splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [clean(c) for c in line.strip("|").split("|")]
        if len(cells) < 2 or all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
            continue
        if cells[0].lower() in ("bereich", "funktionsbereich"):
            continue
        stage = STAGES.get(cells[1].lower().strip())
        if not stage:
            continue
        rows.append({
            "area": cells[0],
            "stage": stage,
            "missing": cells[2] if len(cells) > 2 else "",
            "evidence": cells[3] if len(cells) > 3 else "",
        })
    return rows


def body(row: dict, url: str) -> str:
    return "\n".join([
        f"<!-- ausbau:{slug(row['area'])} -->",
        f"**Stufe:** {row['stage']}",
        "",
        f"**Was fehlt zum nächsten Schritt:** {row['missing'] or '—'}",
        "",
        f"**Beleg:** {row['evidence'] or '—'}",
        "",
        f"Aus der wöchentlichen Tiefenanalyse · Dashboard: {url or '—'}",
        "",
        "_Automatisch angelegt. Schließen = erledigt oder bewusst verworfen; das Issue wird dann nicht wieder angelegt._",
    ])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--deep", required=True)
    ap.add_argument("--pages-url", default="")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    path = Path(a.deep)
    rows = parse(path.read_text(encoding="utf-8")) if path.is_file() else []
    if not rows:
        print("Keine Ausbaustufen-Zeilen für Issues.")
        return 0

    raw = gh("issue", "list", "-R", a.repo, "--label", LABEL, "--state", "all", "--limit", "500",
             "--json", "number,state,body") if not a.dry_run else "[]"
    known: dict[str, dict] = {}
    for issue in json.loads(raw or "[]"):
        mm = re.search(r"<!-- ausbau:(\S+) -->", issue.get("body") or "")
        if mm:
            known.setdefault(mm.group(1), issue)

    if not a.dry_run:
        gh("label", "create", LABEL, "-R", a.repo, "--color", "C5DEF5",
           "--description", "Halb fertig / verwaist — aus der Tiefenanalyse", "--force")
    created = 0
    for row in rows:
        key = slug(row["area"])
        text = body(row, a.pages_url)
        title = f"Ausbaustufe: {row['area']} ({row['stage']})"
        issue = known.get(key)
        if a.dry_run:
            print(f"DRY {title}")
            continue
        if issue and issue["state"] == "OPEN":
            gh("issue", "edit", str(issue["number"]), "-R", a.repo, "--title", title, "--body", text)
        elif issue:
            continue  # geschlossen = entschieden
        elif created < MAX_NEW:
            gh("issue", "create", "-R", a.repo, "--title", title, "--label", LABEL, "--body", text)
            created += 1
    print(f"Ausbaustufen: {len(rows)} Zeilen, {created} neue Issues.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
