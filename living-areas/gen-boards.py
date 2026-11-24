#!/usr/bin/env python3
"""Generate living Area-Boards from local repo evidence → living-areas/boards/*.md

Usage:
  python3 living-areas/gen-boards.py           # write boards + BOARDS.md
  python3 living-areas/gen-boards.py --check   # exit 1 if boards stale vs sources

No network required. Missing paths → "fehlt". Never invents KPIs.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import subprocess
import sys
from pathlib import Path

# BOARDS_HOME: Basis der Sibling-Repos (CI checkt sie nach $RUNNER_TEMP/siblings aus).
HOME = Path(os.environ.get("BOARDS_HOME") or Path.home())
ROOT = Path(__file__).resolve().parent  # living-areas/
VITALOS_ROOT = Path(os.environ["VITALOS_ROOT"]) if os.environ.get("VITALOS_ROOT") else (HOME / "vitalos")
BOARDS_DIR = ROOT / "boards"
BOARDS_INDEX = ROOT / "BOARDS.md"
COORD = ROOT  # alias for relative prints

AREAS = [
    {
        "id": "workspace",
        "title": "workspace Hub",
        "issue": 28,
        "repo": "nimmsel23/workspace",
        "root": HOME / "workspace",
    },
    {
        "id": "vitaltrainer",
        "title": "VitalTraining",
        "issue": 29,
        "repo": "nimmsel23/business-vitaltraining",
        "root": HOME / "vitaltrainer",
    },
    {
        "id": "creator",
        "title": "creator",
        "issue": 30,
        "repo": "nimmsel23/business-creator",
        "root": HOME / "creator",
    },
    {
        "id": "business",
        "title": "business Vault",
        "issue": 31,
        "repo": "nimmsel23/obsidian-business",
        "root": HOME / "business",
    },
    {
        "id": "vitalos",
        "title": "vitalos Meta",
        "issue": 32,
        "repo": "nimmsel23/vitalos",
        "root": VITALOS_ROOT,
    },
    {
        "id": "coach",
        "title": "coach-dev",
        "issue": 33,
        "repo": "nimmsel23/coach-dev",
        "root": HOME / "dev" / "coach-dev",
    },
]


def now_iso() -> str:
    return dt.datetime.now().astimezone().isoformat(timespec="seconds")


def run(cmd: list[str], cwd: Path | None = None) -> str:
    try:
        p = subprocess.run(
            cmd,
            cwd=str(cwd) if cwd else None,
            text=True,
            capture_output=True,
            timeout=30,
        )
        if p.returncode != 0:
            return ""
        return (p.stdout or "").strip()
    except (OSError, subprocess.TimeoutExpired):
        return ""


def git_sha(root: Path) -> str:
    return run(["git", "rev-parse", "--short", "HEAD"], cwd=root) or "fehlt"


def git_sb(root: Path) -> str:
    return run(["git", "status", "-sb"], cwd=root) or "fehlt"


def git_log(root: Path, n: int = 8) -> list[str]:
    out = run(["git", "log", f"-{n}", "--oneline"], cwd=root)
    return out.splitlines() if out else []


def exists(p: Path) -> bool:
    try:
        return p.exists()
    except OSError:
        return False


def list_names(p: Path, pattern: str = "*") -> list[str]:
    if not exists(p):
        return []
    try:
        return sorted(x.name for x in p.glob(pattern) if x.is_file() or x.is_dir())
    except OSError:
        return []


def read_head(p: Path, n: int = 40) -> str:
    if not exists(p):
        return ""
    try:
        lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
        return "\n".join(lines[:n])
    except OSError:
        return ""


def grep_file(p: Path, pattern: str, max_hits: int = 12) -> list[str]:
    if not exists(p):
        return []
    try:
        rx = re.compile(pattern, re.I)
        hits = []
        for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            if rx.search(line):
                hits.append(f"L{i}: {line.strip()[:160]}")
                if len(hits) >= max_hits:
                    break
        return hits
    except OSError:
        return []


def md_list(items: list[str], empty: str = "fehlt") -> str:
    if not items:
        return f"- {empty}\n"
    return "".join(f"- `{x}`\n" if not x.startswith("-") and "\n" not in x and len(x) < 120 else f"- {x}\n" for x in items)


def section(title: str, body: str) -> str:
    body = body.strip() + "\n" if body.strip() else "- fehlt\n"
    return f"## {title}\n\n{body}\n"


def gen_workspace(root: Path) -> str:
    agents = list_names(root / ".claude" / "agents", "*.md")
    prompts = list_names(root / "team" / "prompts", "*.md")
    berichte = [n for n in list_names(root / "team" / "berichte", "*.md") if n != "VORLAGE.md"]
    siblings = []
    for name in ("creator", "vitaltrainer", "business"):
        link = root / name
        ok = link.is_symlink() and link.resolve().is_dir()
        siblings.append(f"{name}: {'ok → ' + str(link.resolve()) if ok else 'fehlt/broken'}")
    auto = read_head(root / "team" / "AUTOMATISIERUNG.md", 25)
    offen = grep_file(root / "team" / "TEAM.md", r"Offen|Avatarin|Automatisierung")
    parts = [
        section("1. Team", md_list(agents) + f"\nAgenten-Dateien: **{len(agents)}** (Evidence: `.claude/agents/`).\n"),
        section("2. Wochenrhythmus", md_list(prompts) + f"\nBerichte (ohne Vorlage): **{len(berichte)}** — {', '.join(berichte) or 'keine'}.\n"),
        section("3. Git / Siblings", f"```\n{git_sb(root)}\n```\n\nSHA `{git_sha(root)}`\n\n" + md_list(siblings)),
        section("4. Automation backlog", "AUTOMATISIERUNG.md Kopf:\n\n```\n" + (auto or "fehlt") + "\n```\n"),
        section("5. Owner-Offen (TEAM.md Treffer)", md_list(offen)),
        section("6. Outbound-Guard", "- Agenten nur vorbereiten; Mails/Posts/Buchungen = Owner (TEAM.md / AGENTS.md).\n"),
    ]
    return "\n".join(parts)


def gen_vitaltrainer(root: Path) -> str:
    research = list_names(root / "docs" / "research", "*.md")
    skills = list_names(root / ".skills")
    offers = list_names(root / "templates" / "angebote")
    stub = exists(root / "docs" / "FIRE-BLUEPRINT-STUB.md")
    timing = [n for n in research if "taktik-timing" in n or "b2b" in n]
    focus = HOME / "business" / "FOCUS_MAP_2026_11-12_Business.md"
    parts = [
        section(
            "1. Offers",
            md_list(offers or ["templates/angebote fehlt"])
            + f"- Fire Blueprint Stub: {'ja' if stub else 'fehlt'}\n",
        ),
        section("2. Research-Inbox", md_list(research)),
        section(
            "3. B2B-Direkt + Timing",
            "- Kanal: Direkt-Werkvertrag, eigene Rechnung (keine Agentur).\n"
            + md_list([f"Timing/B2B-Docs: {', '.join(timing) or 'fehlt'}"])
            + (
                md_list(
                    grep_file(
                        root / "docs" / "research" / timing[0],
                        r"Kurzfazit|Hauptfenster|Q4|Januar",
                        6,
                    )
                )
                if timing
                else ""
            ),
        ),
        section("4. Skills", md_list(skills)),
        section(
            "5. Website / CI",
            "- web-pipeline Skill: "
            + ("ja" if (root / ".skills" / "vitaltrainer-web-pipeline").exists() else "fehlt")
            + "\n- Firebase-Repo-Health: fehlt (lokal nicht abgefragt)\n",
        ),
        section(
            "6. Focus-Map-Bridge",
            f"- `{focus}`: {'lesbar' if exists(focus) else 'fehlt'}\n"
            + md_list(grep_file(focus, r"Kern-Avatarin|Workshop|Audit", 5)),
        ),
    ]
    return "\n".join(parts)


def gen_creator(root: Path) -> str:
    skill = root / ".skills" / "build-in-public" / "SKILL.md"
    bip = grep_file(skill, r"Beachhead|Influencer|40\+|Substance")
    content_root = root / "projects" / "content"
    kws = list_names(content_root) if exists(content_root) else []
    docs = [n for n in ("CONTENT_STRATEGY.md", "SOCIAL_MEDIA.md", "PATREON.md") if exists(root / "docs" / n)]
    log = git_log(root, 8)
    elim = grep_file(skill, r"FaDaRo|Elimin|dating|Hustle|Influencer-Kopie")
    parts = [
        section("1. Avatarin / BIP", md_list(bip or ["Skill-Treffer fehlt"])),
        section("2. Content-KW", md_list(kws) if kws else "- `projects/content/`: keine KW-Ordner (fehlt)\n"),
        section("3. Docs-Spine", md_list([f"docs/{d}" for d in docs] or ["fehlt"])),
        section("4. Ship-Log", md_list(log)),
        section("5. Eliminations", md_list(elim or ["keine Treffer im Skill — Regeln trotzdem in AGENTS.md"])),
    ]
    return "\n".join(parts)


def gen_business(root: Path) -> str:
    focus = [n for n in list_names(root, "FOCUS_MAP*.md")]
    frame_dirs = list_names(root / "Frame") if exists(root / "Frame") else []
    # broken symlink sample
    broken = []
    for p in root.iterdir() if exists(root) else []:
        if p.is_symlink() and not p.exists():
            broken.append(str(p.name))
    fristen = []
    # bewusst flach: nur wenige Top-Ordner, kein volles Vault-Crawl
    scan_dirs = [root]
    for sub in ("Bewerbungen", "Schulsportcamps", "Windsurfen", "Frame", "Focus"):
        p = root / sub
        if p.is_dir():
            scan_dirs.append(p)
    for base in scan_dirs:
        for md in base.glob("**/*.md"):
            if len(md.parts) - len(root.parts) > 4:
                continue
            try:
                text = md.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if re.search(r"frist:", text, re.I):
                fristen.append(str(md.relative_to(root))[:80])
                if len(fristen) >= 10:
                    break
        if len(fristen) >= 10:
            break
    parts = [
        section("1. Focus Map", md_list(focus)),
        section("2. Frame", md_list(frame_dirs) if frame_dirs else "- `Frame/`: fehlt\n"),
        section("3. Vault-Links", f"- Broken top-level symlinks: {len(broken)}\n" + md_list(broken)),
        section("4. Fristen (`frist:`)", md_list(fristen)),
        section("5. Git-Drift", f"```\n{git_sb(root)}\n```\n\nSHA `{git_sha(root)}`\n"),
    ]
    return "\n".join(parts)


def gen_vitalos(root: Path) -> str:
    mods = []
    gitmodules = root / ".gitmodules"
    if exists(gitmodules):
        names = re.findall(r"path\s*=\s*(\S+)", gitmodules.read_text(encoding="utf-8", errors="replace"))
        for path in names[:20]:
            p = root / path
            sha = git_sha(p) if exists(p) else "fehlt"
            mods.append(f"{path}: `{sha}`")
    store_hits = []
    for p in (root / "docs").glob("*.md") if exists(root / "docs") else []:
        if re.search(r"store|play|privacy|legal", p.name, re.I):
            store_hits.append(p.name)
    portal = exists(root / "portal" / "index.html") or exists(root / "docs" / "DEV-DASHBOARD.md")
    vos_org = HOME / ".vos" / "org"
    if not exists(vos_org):
        vos_org = HOME / "vos" / "org"
    log = git_log(root, 10)
    parts = [
        section("1. Submodule-Pins (Kurz)", md_list(mods)),
        section("2. Store / Legal Docs", md_list(store_hits)),
        section(
            "3. CI-Routing",
            "- Offene CI-Failure-Issues: fehlt (kein `gh` im Generator-Default)\n"
            "- Evidence: git log + `nimmsel23/vos` org/\n",
        ),
        section(
            "4. Org-Ritual",
            md_list(
                [
                    f"vos/org: {'ja' if exists(vos_org) else 'fehlt'}",
                    f"OWNER-CONTRACT: {'ja' if exists(vos_org / 'OWNER-CONTRACT.md') else 'fehlt'}",
                    f"LAGE.json: {'ja' if exists(vos_org / 'LAGE.json') else 'fehlt'}",
                ]
            ),
        ),
        section(
            "5. Portal-Inventar",
            f"- Dev-Dashboard / vos-portal Surface: {'ja' if portal else 'fehlt'}\n"
            "- Living Boards Output: `nimmsel23/dashboards` `living-areas/boards/` (@engine)\n",
        ),
        section("6. Release-Train / Ship-Log", md_list(log)),
    ]
    return "\n".join(parts)


def gen_coach(root: Path) -> str:
    log = git_log(root, 15)
    scopes = {"auth": 0, "client": 0, "inspector": 0, "habit": 0, "insight": 0, "plan": 0, "test": 0, "ci": 0}
    for line in log:
        low = line.lower()
        for k in list(scopes):
            if k in low:
                scopes[k] += 1
    results = root / "RESULTS.md"
    open_acc = grep_file(results, r"remaining|offen|TODO|Acceptance|preview", 8) if exists(results) else []
    parts = [
        section("1. Auth & access (recent log hits)", f"- auth-ish commits in last 15: **{scopes['auth']}**\n" + md_list(log[:5])),
        section("2. Client scope", f"- client/habit/insight hits: **{scopes['client'] + scopes['habit'] + scopes['insight']}**\n"),
        section("3. Inspector / notes", f"- inspector hits: **{scopes['inspector']}**\n"),
        section("4. Plan integration", f"- plan hits: **{scopes['plan']}**\n"),
        section("5. CI gate", f"- test/ci hits: **{scopes['test'] + scopes['ci']}**\n"),
        section("6. Open acceptance (RESULTS.md)", md_list(open_acc)),
        section(
            "7. Runtime-Hinweis",
            "- coach-api typisch `:9150` (Funnel) — Status hier nicht gescraped\n"
            "- Details: `~/COACH.md`\n",
        ),
    ]
    return "\n".join(parts)


GENERATORS = {
    "workspace": gen_workspace,
    "vitaltrainer": gen_vitaltrainer,
    "creator": gen_creator,
    "business": gen_business,
    "vitalos": gen_vitalos,
    "coach": gen_coach,
}


def write_board(area: dict) -> Path:
    root: Path = area["root"]
    gen = GENERATORS[area["id"]]
    body = gen(root) if exists(root) else section("Hinweis", f"- Repo-Pfad `{root}` fehlt auf diesem Host.\n")
    sha = git_sha(root) if exists(root) else "fehlt"
    header = (
        f"# Dashboard — {area['title']}\n\n"
        f"Generated: {now_iso()} · SHA: `{sha}` · Issue: "
        f"[#{area['issue']}](https://github.com/nimmsel23/vitalos/issues/{area['issue']}) · "
        f"Repo: `{area['repo']}`\n\n"
        f"Refresh: `living-areas/gen-boards.py` in `nimmsel23/dashboards` @ `engine`.\n\n"
        f"---\n\n"
    )
    BOARDS_DIR.mkdir(parents=True, exist_ok=True)
    out = BOARDS_DIR / f"{area['id']}.md"
    out.write_text(header + body, encoding="utf-8")
    return out


def update_boards_index(written: list[dict]) -> None:
    rows = []
    for a in written:
        rows.append(
            f"| {a['title']} | [#{a['issue']}](https://github.com/nimmsel23/vitalos/issues/{a['issue']}) | "
            f"`{a['repo']}` | generiert (`boards/{a['id']}.md`) |"
        )
    text = f"""# Living Area Boards

Anleitung für Agenten: `~/DASHBOARDS.md`.  
Epic: https://github.com/nimmsel23/vitalos/issues/27  
Heimat: `nimmsel23/dashboards` Branch `engine` → `living-areas/`.

Living Area Boards sind **keine** Ersatz-STATUS.md und **kein** Rollen-Dashboard
(vos Zentrale / CEO·CPO·CTO). Sie ergänzen die Org-Lage mit area-weiten,
selbst-aktualisierenden Kategorien.

Zuletzt generiert: {now_iso()}

## Boards

| Area | Issue | Repo | Status |
| --- | --- | --- | --- |
{chr(10).join(rows)}

## Generierte Dateien

| Datei | Zweck |
| --- | --- |
| `boards/<id>.md` | Area-Dashboard (Evidence) |
| `gen-boards.py` | Generator |
| `.github/workflows/living-areas.yml` | Mo-Refresh + manuell |

## Verwandte Oberflächen

| Oberfläche | Zweck |
| --- | --- |
| [vos-zentrale](https://vos-zentrale.web.app) | Rollen-/Org-Login-Hub |
| Dev-Repo Pages | `nimmsel23.github.io/<repo>/` (engine) |
| `~/DASHBOARDS.md` | Bau-Guide |

## Regeln

- Evidence oder „fehlt“ — keine geschätzten KPIs
- Keine Klienten-PII / Secrets
- Refresh: `python3 living-areas/gen-boards.py`
"""
    BOARDS_INDEX.write_text(text, encoding="utf-8")


def newest_mtime(paths: list[Path]) -> float:
    m = 0.0
    for p in paths:
        try:
            if p.exists():
                m = max(m, p.stat().st_mtime)
        except OSError:
            pass
    return m


def check_stale() -> int:
    """Rough staleness: board older than its area root HEAD file or missing."""
    stale = 0
    for a in AREAS:
        out = BOARDS_DIR / f"{a['id']}.md"
        root = a["root"]
        if not out.exists():
            print(f"STALE missing {out}")
            stale += 1
            continue
        head = root / ".git" / "HEAD"
        if exists(head) and out.stat().st_mtime + 1 < head.stat().st_mtime:
            # only flag if HEAD newer by >1s and board older than 1h after HEAD change — soft
            if out.stat().st_mtime < head.stat().st_mtime:
                print(f"STALE {a['id']}: board older than git HEAD")
                stale += 1
    return 1 if stale else 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if args.check:
        return check_stale()

    written = []
    for a in AREAS:
        path = write_board(a)
        print(f"wrote {path.relative_to(COORD)}")
        written.append(a)
    update_boards_index(written)
    print(f"wrote {BOARDS_INDEX.relative_to(COORD)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
