#!/usr/bin/env python3
"""Produkt-Changelog aus den Commits eines Dev-Repos → changelog.json.

Liest immer das Repo, das --repo (oder GITHUB_REPOSITORY) nennt — typisch das
Dev-Repo, dessen Living Dashboard gerade gebaut wird, nicht fest vitalos.

Vorbild: der frühere App-Changelog in vitalos
(packages/mini-app-shell/vos-release-info.mjs, releaseNotes()): nur gute
Commit-Messages, Merge/chore/ci/build/docs/test/refactor raus, Typ-Präfix weg,
gleiche Meldung nur einmal (neueste gewinnt). Hier zusätzlich: Bot-Autoren,
Infra-Scopes und Commits ohne Produktdatei raus, Gruppierung nach Tag.

    changelog.py --out changelog.json --repo nimmsel23/<dev-repo> [--days 30] [--max 40]

Fehler (kein Netz, Repo weg) ergeben eine leere Liste; das Dashboard blendet
den Abschnitt dann einfach aus.
"""
from __future__ import annotations

import argparse
import os
import datetime as dt
import json
import re
import subprocess
import tempfile
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("Europe/Vienna")
except Exception:  # noqa: BLE001
    TZ = dt.timezone.utc

# Automatische Autoren. vitalos-org-bot bleibt drin: er merged echte PRs (Squash).
BOT_AUTHORS = re.compile(r"^(github-actions|dependabot|renovate|pre-commit-ci)(\[bot\])?$", re.I)
SKIP_TYPES = {"chore", "ci", "build", "docs", "test", "tests", "refactor", "revert", "release", "wip"}
KEEP_TYPES = {"feat": "neu", "fix": "fix", "perf": "schneller", "style": "design"}
SKIP_SCOPES = {
    "ci", "build", "release", "vos-release", "deps", "deps-dev", "tooling", "test", "tests", "lock",
    "portal", "coordination", "submodules", "pins", "al", "ceo", "cto", "cpo", "pm", "org", "agents",
    "pages", "docs", "dashboard", "dashboards", "org-bot", "auto-doc", "pnpm", "lint", "deps-update", "infra",
}
# Unkonventionelle Präfixe ("coordination: …", "org-bot: …") gelten als Scope.
SKIP_PREFIX = SKIP_SCOPES | {"clean up", "cleanup", "wip", "rules", "merge", "docs", "chore"}
SCOPE_LABELS = {
    "shell": "Shell", "firestore": "Firestore", "legal": "Rechtliches", "store": "Store", "product": "Produkt",
    "hosting": "Hosting", "vos-fitness": "Fitness", "fitness": "Fitness", "fuel": "Fuel", "vos-fuel": "Fuel",
    "journal": "Journal", "habits": "Habits", "learn": "Learn", "plan": "Plan", "relax": "Relax",
    "skills": "Skills", "6pack": "6Pack", "sixpack": "6Pack", "coach": "Coach", "privacy": "Datenschutz",
    "auth": "Login", "push": "Push", "observe": "Observe", "settings": "Einstellungen", "store-build": "Store",
}
NOISE = re.compile(r"pointer[- ]bump|\bbump(s|ed)?\b|\bpins? auf\b|\bclean ?up\b|auto-update|\bwip\b", re.I)
# Pfade, die keine Produktänderung sind.
NON_PRODUCT = re.compile(
    r"(^|/)(docs?|\.github|\.githooks|\.agents|\.archiv|org|coordination|portal|bin|scripts|archive)(/|$)"
    r"|\.md$|(^|/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$|^\.(firebaserc|gitmodules|gitignore)$",
    re.I)
CONV = re.compile(r"^(?P<type>[a-z]+)(?:\((?P<scope>[^)]*)\))?(?P<bang>!)?:\s*(?P<msg>.+)$", re.I)
LOOSE = re.compile(r"^(?P<prefix>[A-Za-z][\w .-]{1,20}?):\s+(?P<msg>.+)$")
PR_REF = re.compile(r"\s*\(#(\d+)\)\s*$")


def classify(subject: str):
    """→ (kind, scope, message) oder None, wenn der Commit nicht ins Produkt-Changelog gehört."""
    s = subject.strip()
    if not s or re.match(r"^(merge|revert)\b", s, re.I) or "[skip ci]" in s.lower():
        return None
    m = CONV.match(s)
    if m:
        typ, scope = m["type"].lower(), (m["scope"] or "").strip().lower()
        if typ in SKIP_TYPES or typ not in KEEP_TYPES:
            return None
        scopes = {x.strip() for x in re.split(r"[,/ ]+", scope) if x.strip()}
        if scopes & SKIP_SCOPES:
            return None
        if NOISE.search(m["msg"]) and typ != "fix":
            return None
        return KEEP_TYPES[typ], scope, m["msg"].strip()
    m = LOOSE.match(s)
    if m and m["prefix"].strip().lower() in SKIP_PREFIX:
        return None
    msg, scope = (m["msg"].strip(), m["prefix"].strip().lower()) if m else (s, "")
    if NOISE.search(msg) and not re.match(r"^fix", msg, re.I):
        return None
    # Ohne Typ-Präfix: "Fix …" bleibt Fix, alles andere ist eine Änderung.
    return ("fix" if re.match(r"^fix(es|ed)?\b", msg, re.I) else "änderung"), scope, msg


def tidy(msg: str) -> tuple[str, str | None]:
    pr = PR_REF.search(msg)
    msg = PR_REF.sub("", msg).strip().rstrip(".")
    if msg and msg[0].islower():
        msg = msg[0].upper() + msg[1:]
    return msg, (pr.group(1) if pr else None)


def scope_label(scope: str) -> str:
    if not scope:
        return ""
    first = re.split(r"[,/ ]+", scope)[0]
    if re.fullmatch(r"[a-z]{1,4}-\d+", first):  # Ticket-ID (C-013) ist kein Bereich
        return ""
    return SCOPE_LABELS.get(first, first[:1].upper() + first[1:])


def git_log(repo: str, days: int, branch: str) -> str:
    since = (dt.date.today() - dt.timedelta(days=days + 1)).isoformat()
    with tempfile.TemporaryDirectory() as tmp:
        dest = Path(tmp) / "src.git"
        subprocess.run(["git", "clone", "-q", "--bare", "--filter=blob:none", f"--shallow-since={since}",
                        "--branch", branch, f"https://github.com/{repo}.git", str(dest)],
                       check=True, capture_output=True, timeout=180)
        return subprocess.run(["git", "-C", str(dest), "log", "--no-merges", f"--since={since}",
                               "--format=%x1e%H%x1f%aI%x1f%an%x1f%s", "--name-only"],
                              check=True, capture_output=True, text=True, timeout=120).stdout


def build(log: str, repo: str, days: int, limit: int) -> dict:
    entries, seen = [], set()
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)
    skipped = 0
    for rec in log.split("\x1e"):
        rec = rec.strip()
        if not rec:
            continue
        head, *paths = rec.split("\n")
        parts = head.split("\x1f")
        if len(parts) != 4:
            continue
        sha, date, author, subject = parts
        when = dt.datetime.fromisoformat(date)
        if when < cutoff:
            continue
        c = classify(subject)
        paths = [p for p in paths if p.strip()]
        if not c or BOT_AUTHORS.match(author) or not any(not NON_PRODUCT.search(p) for p in paths):
            skipped += 1
            continue
        kind, scope, msg = c
        msg, pr = tidy(msg)
        key = re.sub(r"[.!\s]+$", "", msg.lower())
        if not msg or key in seen:  # neueste Meldung gewinnt (Log ist neueste zuerst)
            skipped += 1
            continue
        seen.add(key)
        entries.append({"sha": sha, "date": when.isoformat(), "day": when.astimezone(TZ).date().isoformat(),
                        "kind": kind, "scope": scope_label(scope), "message": msg, "pr": pr,
                        "url": f"https://github.com/{repo}/commit/{sha}"})
        if len(entries) >= limit:
            break
    days_out: list[dict] = []
    for en in entries:
        if not days_out or days_out[-1]["day"] != en["day"]:
            days_out.append({"day": en["day"], "entries": []})
        days_out[-1]["entries"].append(en)
    return {"repo": repo, "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "days": days, "count": len(entries), "filtered": skipped, "groups": days_out}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--repo", default="", help="owner/name; sonst GITHUB_REPOSITORY. Kein vitalos-Default.")
    ap.add_argument("--branch", default="master")
    ap.add_argument("--days", type=int, default=30)
    ap.add_argument("--max", type=int, default=40)
    a = ap.parse_args()
    a.repo = (a.repo or os.environ.get("GITHUB_REPOSITORY") or "").strip()
    if not a.repo or "/" not in a.repo:
        print("::error::changelog.py braucht --repo owner/name oder GITHUB_REPOSITORY")
        data = {"repo": a.repo, "count": 0, "groups": [], "error": "repo missing"}
        Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        return 1
    try:
        data = build(git_log(a.repo, a.days, a.branch), a.repo, a.days, a.max)
    except Exception as exc:  # noqa: BLE001
        print(f"::warning::Changelog aus {a.repo} nicht lesbar: {exc}")
        data = {"repo": a.repo, "count": 0, "groups": [], "error": str(exc)[:200]}
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"changelog: {data['count']} Einträge aus {a.repo}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
