#!/usr/bin/env python3
"""Sammelt Repo-Evidenz für das Dashboard → evidence.json.

Nur Fakten aus git + GitHub-API (gh CLI). Keine Bewertung, keine Schätzungen.
Aufruf (im Checkout des Ziel-Repos):
    collect.py --repo owner/name --out evidence.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
from collections import Counter
from pathlib import Path

SELF_WORKFLOWS = {"Dashboard"}  # eigener Lauf zählt nicht als CI-Signal
DOC_CANDIDATES = ["NEXT.md", "TODO.md", "ROADMAP.md", "HANDOFF.md", "STATUS.md", "README.md"]


def sh(cmd: list[str]) -> str:
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=60, check=False).stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return ""


def gh_json(path: str):
    out = sh(["gh", "api", "-H", "Accept: application/vnd.github+json", path])
    try:
        return json.loads(out) if out else None
    except json.JSONDecodeError:
        return None


def git(*args: str) -> str:
    return sh(["git", *args])


def ref_exists(ref: str) -> bool:
    return subprocess.run(["git", "rev-parse", "-q", "--verify", ref], capture_output=True).returncode == 0


def commits(ref: str, n: int = 20) -> list[dict]:
    out = git("log", ref, f"-{n}", "--format=%h%x1f%cI%x1f%an%x1f%s")
    rows = []
    for line in out.splitlines():
        p = line.split("\x1f")
        if len(p) == 4:
            rows.append({"sha": p[0], "date": p[1], "author": p[2], "subject": p[3]})
    return rows


def activity(ref: str, days: int = 21) -> list[dict]:
    since = (dt.date.today() - dt.timedelta(days=days - 1)).isoformat()
    out = git("log", ref, f"--since={since}", "--format=%cs")
    c = Counter(out.splitlines())
    return [
        {"day": (d := (dt.date.today() - dt.timedelta(days=i)).isoformat()), "n": c.get(d, 0)}
        for i in range(days - 1, -1, -1)
    ]


def branches() -> dict:
    res: dict = {}
    has_dev, has_master = ref_exists("origin/dev"), ref_exists("origin/master")
    main = "origin/master" if has_master else ("origin/main" if ref_exists("origin/main") else None)
    res["main"] = main.split("/", 1)[1] if main else None
    res["has_dev"] = has_dev
    if has_dev and main:
        lr = git("rev-list", "--left-right", "--count", f"{main}...origin/dev").split()
        if len(lr) == 2:
            res["dev_behind"], res["dev_ahead"] = int(lr[0]), int(lr[1])
        oldest = git("log", f"{main}..origin/dev", "--reverse", "--format=%cI").splitlines()
        res["oldest_unpromoted"] = oldest[0] if oldest else None
    for name in ("dev", res["main"]):
        if name and ref_exists(f"origin/{name}"):
            res[f"{name}_head"] = git("log", "-1", f"origin/{name}", "--format=%h %cI")
    return res


def workflows(repo: str) -> list[dict]:
    data = gh_json(f"repos/{repo}/actions/runs?per_page=100") or {}
    latest: dict[tuple, dict] = {}
    for r in data.get("workflow_runs", []):
        name = r.get("name") or "?"
        if name in SELF_WORKFLOWS or r.get("event") == "dynamic":  # Dependabot/Pages-intern
            continue
        key = (name, r.get("head_branch"))
        if key in latest:
            continue
        latest[key] = {
            "name": name,
            "branch": r.get("head_branch"),
            "event": r.get("event"),
            "status": r.get("status"),
            "conclusion": r.get("conclusion"),
            "created_at": r.get("created_at"),
            "url": r.get("html_url"),
            "sha": (r.get("head_sha") or "")[:7],
        }
    return sorted(latest.values(), key=lambda x: x["created_at"] or "", reverse=True)


def issues(repo: str) -> tuple[list[dict], list[dict]]:
    iss = gh_json(f"repos/{repo}/issues?state=open&per_page=50") or []
    prs = gh_json(f"repos/{repo}/pulls?state=open&per_page=30") or []
    pick = lambda i: {  # noqa: E731
        "number": i.get("number"),
        "title": i.get("title"),
        "created_at": i.get("created_at"),
        "updated_at": i.get("updated_at"),
        "labels": [l.get("name") for l in i.get("labels", [])],
        "url": i.get("html_url"),
        "author": (i.get("user") or {}).get("login"),
    }
    issue_rows = [pick(i) for i in iss if "pull_request" not in i]
    pr_rows = []
    for p in prs:
        row = pick(p)
        row["head"] = (p.get("head") or {}).get("ref")
        row["base"] = (p.get("base") or {}).get("ref")
        row["draft"] = p.get("draft")
        pr_rows.append(row)
    return issue_rows, pr_rows


def docs(root: Path) -> dict:
    found = {}
    for name in DOC_CANDIDATES:
        for p in (root / name, root / "docs" / name):
            if p.is_file():
                text = p.read_text(encoding="utf-8", errors="replace")
                found[str(p.relative_to(root))] = "\n".join(text.splitlines()[:60])[:4000]
                break
    listing = sorted(
        str(p.relative_to(root)) for p in (root / "docs").glob("*") if p.is_file() and not p.name.startswith(".")
    ) if (root / "docs").is_dir() else []
    return {"excerpts": found, "docs_files": listing[:80]}


def live_sites(root: Path) -> list[str]:
    urls: list[str] = []
    for fb in [root / "firebase.json", *root.glob("*/firebase.json")]:
        try:
            cfg = json.loads(fb.read_text())
        except (OSError, json.JSONDecodeError):
            continue
        hosting = cfg.get("hosting")
        for h in hosting if isinstance(hosting, list) else [hosting] if hosting else []:
            site = h.get("site") if isinstance(h, dict) else None
            if site and re.fullmatch(r"[a-z0-9-]+", site):
                urls.append(f"https://{site}.web.app")
    rc = root / ".firebaserc"
    if rc.is_file():
        try:
            targets = json.loads(rc.read_text()).get("targets", {})
            for proj in targets.values():
                for sites in (proj.get("hosting") or {}).values():
                    urls += [f"https://{s}.web.app" for s in sites if re.fullmatch(r"[a-z0-9-]+", s)]
        except (OSError, json.JSONDecodeError, AttributeError):
            pass
    return sorted(set(urls))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    root = Path.cwd()

    meta = gh_json(f"repos/{a.repo}") or {}
    pages = gh_json(f"repos/{a.repo}/pages") or {}
    br = branches()
    work_ref = "origin/dev" if br.get("has_dev") else f"origin/{br.get('main') or 'HEAD'}"
    iss, prs = issues(a.repo)
    pkg = {}
    if (root / "package.json").is_file():
        try:
            j = json.loads((root / "package.json").read_text())
            pkg = {"name": j.get("name"), "version": j.get("version")}
        except json.JSONDecodeError:
            pass

    ev = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "repo": a.repo,
        "meta": {
            "name": meta.get("name") or a.repo.split("/")[-1],
            "description": meta.get("description"),
            "html_url": meta.get("html_url") or f"https://github.com/{a.repo}",
            "pushed_at": meta.get("pushed_at"),
            "default_branch": meta.get("default_branch"),
            "visibility": meta.get("visibility"),
            "pages_url": pages.get("html_url"),
        },
        "package": pkg,
        "branches": br,
        "commits": commits(work_ref),
        "activity": activity(work_ref),
        "workflows": workflows(a.repo),
        "issues": iss,
        "pulls": prs,
        "docs": docs(root),
        "live_sites": live_sites(root),
    }
    Path(a.out).write_text(json.dumps(ev, ensure_ascii=False, indent=1))
    print(f"evidence: {len(ev['commits'])} commits, {len(ev['workflows'])} workflows, "
          f"{len(iss)} issues, {len(prs)} PRs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
