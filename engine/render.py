#!/usr/bin/env python3
"""Rendert evidence.json + assessment.json (+ deep.md) → index.html + dashboard.json.

Statisches, eigenständiges HTML (kein Build, keine externen Assets).
Formensprache angelehnt an das VitalOS-CEO-Dashboard (olive/lime, Sidebar, Karten).

    render.py --evidence e.json --assessment a.json --state <dir> --out <dir>
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
from pathlib import Path

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo("Europe/Vienna")
except Exception:  # noqa: BLE001
    TZ = dt.timezone.utc

NOW = dt.datetime.now(dt.timezone.utc)
e = lambda s: html.escape(str(s if s is not None else ""), quote=True)  # noqa: E731

ICONS = {
    "pulse": '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    "branch": '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 4-6 3-10 7"/>',
    "check": '<path d="M5 12l5 5L20 7"/>',
    "issue": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5"/>',
    "pr": '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 7v10M18 17V9a3 3 0 0 0-3-3h-4"/><path d="M13 3l-2 3 2 3"/>',
    "commit": '<circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6"/>',
    "spark": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    "brain": '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
    "doc": '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    "github": '<path d="M9 19c-4 1.5-4-2-6-2m12 4v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    "ext": '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
    "alert": '<path d="M12 3 2 20h20zM12 10v4M12 17h.01"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
}


def icon(name: str, cls: str = "icon") -> str:
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true">{ICONS.get(name, "")}</svg>'


def parse(iso: str | None) -> dt.datetime | None:
    if not iso:
        return None
    try:
        return dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None


def rel(iso: str | None) -> str:
    d = parse(iso)
    if not d:
        return "—"
    s = (NOW - d).total_seconds()
    if s < 3600:
        return f"vor {max(1, int(s // 60))} Min."
    if s < 86400:
        return f"vor {int(s // 3600)} Std."
    days = int(s // 86400)
    return "gestern" if days == 1 else f"vor {days} Tagen"


def absdate(iso: str | None) -> str:
    d = parse(iso)
    return d.astimezone(TZ).strftime("%d.%m.%Y %H:%M") if d else "—"


def inl(s) -> str:
    """Escapen + `code` + **fett** für KI-Kurztexte."""
    s = e(s)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    return re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)


def md(text: str) -> str:
    """Minimal-Markdown → HTML (Überschriften, Listen, Absätze, fett, code, Links)."""
    def inline(s: str) -> str:
        s = e(s)
        s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
        return s
    out, lst, para = [], None, []

    def flush():
        nonlocal lst, para
        if para:
            out.append(f"<p>{inline(' '.join(para))}</p>")
            para = []
        if lst:
            out.append(f"</{lst}>")
            lst = None
    for raw in text.splitlines():
        line = raw.rstrip()
        m = re.match(r"^(#{1,4})\s+(.*)", line)
        if m:
            flush()
            lvl = min(len(m.group(1)) + 2, 5)
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
            continue
        m = re.match(r"^\s*([-*]|\d+\.)\s+(.*)", line)
        if m:
            if para:
                out.append(f"<p>{inline(' '.join(para))}</p>")
                para = []
            kind = "ol" if m.group(1)[0].isdigit() else "ul"
            if lst != kind:
                if lst:
                    out.append(f"</{lst}>")
                out.append(f"<{kind}>")
                lst = kind
            out.append(f"<li>{inline(m.group(2))}</li>")
            continue
        if not line.strip():
            flush()
            continue
        if lst:
            out.append(f"</{lst}>")
            lst = None
        para.append(line.strip())
    flush()
    return "\n".join(out)


STATUS = {
    "green": ("Grün", "Keine Regel schlägt an."),
    "yellow": ("Gelb", "Etwas hängt, nichts ist kaputt."),
    "red": ("Rot", "Mindestens ein harter Befund — Lage-Issue ist offen."),
}
LEVEL_PILL = {"red": "red", "hoch": "red", "yellow": "amber", "mittel": "amber", "info": "neutral"}


def conclusion_pill(w: dict) -> str:
    c = w.get("conclusion") or w.get("status") or "?"
    cls = {"success": "", "failure": "red", "timed_out": "red", "startup_failure": "red",
           "cancelled": "neutral", "skipped": "neutral"}.get(c, "amber")
    label = {"success": "grün", "failure": "rot", "cancelled": "abgebrochen", "skipped": "übersprungen",
             "in_progress": "läuft", "queued": "wartet"}.get(c, c)
    return f'<span class="pill {cls}">{e(label)}</span>'


def activity_svg(rows: list[dict]) -> str:
    if not rows:
        return ""
    mx = max(1, max(r["n"] for r in rows))
    w, h, gap = 12, 64, 4
    bars = []
    for i, r in enumerate(rows):
        bh = 3 if r["n"] == 0 else max(6, round(r["n"] / mx * h))
        cls = "bar zero" if r["n"] == 0 else "bar"
        bars.append(f'<rect class="{cls}" x="{i * (w + gap)}" y="{h - bh}" width="{w}" height="{bh}" rx="3">'
                    f'<title>{e(r["day"])}: {r["n"]} Commit(s)</title></rect>')
    total = len(rows) * (w + gap) - gap
    return f'<svg class="activity" viewBox="0 0 {total} {h}" preserveAspectRatio="none" role="img" aria-label="Commits pro Tag, letzte {len(rows)} Tage">{"".join(bars)}</svg>'


CSS = """
:root{--bg:#f6f7f3;--paper:#fff;--ink:#252c25;--muted:#6e7963;--line:#e7e9e2;--olive:#536644;--olive-dark:#32462e;
--lime:#dfebba;--soft:#eef2e5;--amber:#9d6d34;--amber-bg:#fbf2e7;--red:#aa6051;--red-bg:#f8ede9;--radius:14px;
--shadow:0 3px 8px #2733260a;color-scheme:light}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:20px}
body{margin:0;background:var(--bg);color:var(--ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.55}
a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #9db47b;outline-offset:3px;border-radius:4px}
h1,h2,h3,h4,h5,p{margin:0}h1{font-size:30px;letter-spacing:-1.1px;font-weight:550;line-height:1.2}
h2{font-size:15px;letter-spacing:-.3px;font-weight:600}
svg.icon{width:18px;height:18px;stroke:currentColor;stroke-width:1.65;fill:none;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;vertical-align:middle}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em;background:var(--soft);padding:1px 5px;border-radius:4px}
.shell{display:flex;min-height:100vh}
.sidebar{width:236px;background:#fcfdf9;border-right:1px solid var(--line);padding:28px 16px;position:fixed;inset:0 auto 0 0;display:flex;flex-direction:column;overflow-y:auto}
.brand{display:flex;gap:11px;align-items:center;padding:0 8px 26px;font-size:21px;font-weight:650;letter-spacing:-.8px;line-height:1.1}
.brand-mark{width:38px;height:38px;border-radius:11px;background:var(--olive-dark);color:var(--lime);display:grid;place-items:center;flex-shrink:0}
.brand-mark svg{width:24px;height:24px}.brand small{display:block;font-size:9px;letter-spacing:1.3px;color:var(--muted);font-weight:600;margin-top:4px}
.nav-label{font-size:9px;letter-spacing:1.3px;color:var(--muted);font-weight:600;padding:20px 10px 9px}
.nav a{display:flex;align-items:center;gap:11px;border-radius:7px;padding:9px 10px;font-size:12.5px;color:var(--muted)}
.nav a:hover{background:#f0f2eb;color:var(--olive-dark)}.nav a .count{margin-left:auto;font-size:10px;padding:1px 6px;border-radius:4px;background:var(--soft)}
.side-bottom{margin-top:auto;padding-top:26px}
.principle{background:var(--soft);border-radius:11px;padding:15px;font-size:11.5px;color:#4b5a40}
.principle strong{display:block;color:var(--olive-dark);margin-bottom:4px}
.main{margin-left:236px;width:calc(100% - 236px);min-width:0}
.topbar{height:68px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 34px;background:#fcfdf9cc;gap:14px;position:sticky;top:0;backdrop-filter:blur(8px);z-index:5}
.crumb{font-size:12.5px;color:var(--muted)}.crumb strong{color:var(--ink)}
.stamp{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:5px 11px;background:#fff}
.dot{width:7px;height:7px;border-radius:50%;background:#8fae5f;display:inline-block}
.dot.red{background:var(--red)}.dot.yellow{background:#c99a52}
.content{padding:34px;max-width:1240px}
.hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:end;margin-bottom:26px}
.eyebrow{font-size:10px;letter-spacing:1.4px;color:var(--muted);font-weight:600;text-transform:uppercase;margin-bottom:8px}
.hero p.lead{color:#56614f;margin-top:10px;max-width:720px;font-size:14.5px;line-height:1.7}
.status{display:flex;align-items:center;gap:12px;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);padding:14px 18px;box-shadow:var(--shadow);min-width:240px}
.status .big{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--lime);color:var(--olive-dark)}
.status.red .big{background:var(--red-bg);color:var(--red)}.status.yellow .big{background:var(--amber-bg);color:var(--amber)}
.status b{display:block;font-size:15px}.status span{font-size:11.5px;color:var(--muted)}
.metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;margin-bottom:22px}
.metric{background:#fff;border:1px solid var(--line);border-radius:11px;padding:15px 17px;box-shadow:var(--shadow);min-height:112px}
.metric-top{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--muted)}
.metric-top .icon{width:15px;height:15px}
.metric-value{font-size:28px;font-weight:500;letter-spacing:-.8px;margin-top:10px;line-height:1.1}
.metric-value.warn{color:var(--amber)}.metric-value.bad{color:var(--red)}
.metric-bottom{font-size:10.5px;color:var(--muted);margin-top:8px}
.grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:16px;margin-bottom:16px}
.panel{border:1px solid var(--line);border-radius:var(--radius);background:var(--paper);box-shadow:var(--shadow);overflow:hidden;margin-bottom:16px}
.grid .panel{margin-bottom:0}
.panel-head{display:flex;align-items:center;justify-content:space-between;padding:19px 21px 12px;gap:12px}
.panel-head p{font-size:11px;color:var(--muted);margin-top:2px}
.panel-body{padding:0 21px 19px}
.pill{display:inline-flex;align-items:center;gap:4px;font-size:10px;padding:2px 8px;border-radius:5px;background:#eef3e3;color:#4f6a3a;white-space:nowrap;font-weight:500}
.pill.amber{background:var(--amber-bg);color:#99703f}.pill.red{background:var(--red-bg);color:var(--red)}
.pill.neutral{background:#f2f3ee;color:var(--muted)}.pill.outline{border:1px solid var(--line);background:transparent;color:var(--muted)}
.lage{font-size:14px;line-height:1.75;color:#3a4335}
.lage .headline{font-size:18px;font-weight:600;letter-spacing:-.4px;color:var(--olive-dark);margin-bottom:8px;line-height:1.35}
.changed{margin-top:12px;font-size:12px;color:var(--muted);border-left:3px solid var(--lime);padding-left:10px}
.list{list-style:none;margin:0;padding:0}
.list li{display:flex;gap:11px;align-items:flex-start;padding:11px 0;border-top:1px solid var(--line);font-size:13px}
.list li:first-child{border-top:0}.list .meta{margin-left:auto;font-size:11px;color:var(--muted);white-space:nowrap;padding-left:10px}
.list .sub{display:block;font-size:11px;color:var(--muted);margin-top:2px}
.list a:hover{color:var(--olive)}
.steps{counter-reset:s;list-style:none;margin:0;padding:0}
.steps li{counter-increment:s;display:flex;gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:13.5px}
.steps li:first-child{border-top:0}
.steps li::before{content:counter(s);flex-shrink:0;width:24px;height:24px;border-radius:7px;background:var(--olive-dark);color:var(--lime);display:grid;place-items:center;font-size:11px;font-weight:600}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th{text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:600;padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}tr:last-child td{border-bottom:0}
td a:hover{color:var(--olive)}.mono{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--muted)}
.table-wrap{overflow-x:auto;padding:0 11px 8px}
.activity{width:100%;height:64px;display:block;margin:4px 0 6px}.activity .bar{fill:var(--olive)}.activity .bar.zero{fill:var(--line)}
.legend{display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted)}
.deep{font-size:13.5px;line-height:1.75;color:#3a4335}.deep h3,.deep h4,.deep h5{font-size:14px;margin:16px 0 6px;color:var(--olive-dark)}
.deep p{margin:8px 0}.deep ul,.deep ol{padding-left:20px;margin:6px 0}
.empty{font-size:12.5px;color:var(--muted);padding:6px 0}
.links{display:flex;flex-wrap:wrap;gap:8px}
.links a{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:8px;padding:7px 11px;font-size:12px;background:#fcfdf9}
.links a:hover{border-color:#cfd8bf;color:var(--olive-dark)}.links .icon{width:15px;height:15px}
.footer{padding:20px 34px 34px;font-size:11px;color:var(--muted);display:flex;flex-wrap:wrap;gap:6px 18px}
@media (max-width:1100px){.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.grid{grid-template-columns:1fr}}
@media (max-width:860px){.sidebar{position:static;width:auto;border-right:0;border-bottom:1px solid var(--line);padding:16px}
.shell{flex-direction:column}.main{margin:0;width:100%}.side-bottom,.nav-label{display:none}.brand{padding:0 0 12px}
.nav{display:flex;gap:4px;overflow-x:auto}.nav a{white-space:nowrap;padding:7px 10px}.nav a .count{margin-left:4px}
.topbar{padding:0 16px;height:56px}.content{padding:20px 16px}.hero{grid-template-columns:1fr}
.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.footer{padding:16px}h1{font-size:25px}}
"""


def render(ev: dict, asm: dict, deep: str, deep_at: str | None) -> str:
    meta, br = ev["meta"], ev.get("branches", {})
    name = meta["name"]
    main = br.get("main") or "master"
    status = asm.get("status", "green")
    st_label, st_text = STATUS.get(status, STATUS["green"])
    ai = asm.get("ai") or {}
    sig = asm.get("signals", [])
    wfs = ev.get("workflows", [])
    watched = [w for w in wfs if w.get("branch") in ("dev", main)]
    red_wf = [w for w in watched if w.get("conclusion") in ("failure", "timed_out", "startup_failure")]
    issues, pulls, commits = ev.get("issues", []), ev.get("pulls", []), ev.get("commits", [])
    ahead = br.get("dev_ahead", 0)
    act = ev.get("activity", [])
    act_sum = sum(r["n"] for r in act)

    # Kennzahlen
    ci_val = f"{len(watched) - len(red_wf)}/{len(watched)}" if watched else "—"
    metrics = [
        ("check", "CI grün", ci_val, "bad" if red_wf else "", f"{len(red_wf)} rot auf dev/{main}" if red_wf else f"letzte Läufe auf dev/{main}"),
        ("branch", f"dev vor {main}", str(ahead) if br.get("has_dev") else "—", "warn" if ahead else "",
         f"seit {rel(br.get('oldest_unpromoted'))}" if ahead else "alles promotet"),
        ("commit", "Commits 21 Tage", str(act_sum), "", f"letzter {rel(commits[0]['date'])}" if commits else "keine"),
        ("issue", "Offene Issues", str(len(issues)), "", "inkl. Lage-Issue" if any("dashboard" in (i.get("labels") or []) for i in issues) else "ohne Bot-Issues"),
        ("pr", "Offene PRs", str(len(pulls)), "warn" if any(s["key"].startswith("pr:") for s in sig) else "",
         f"{sum(1 for p in pulls if p.get('draft'))} Entwurf" if pulls else "keine"),
    ]
    metrics_html = "".join(
        f'<div class="metric"><div class="metric-top"><span>{e(t)}</span>{icon(ic)}</div>'
        f'<div class="metric-value {cls}">{e(v)}</div><div class="metric-bottom">{e(sub)}</div></div>'
        for ic, t, v, cls, sub in metrics)

    # Lage (KI)
    if ai:
        lage_html = (f'<div class="lage"><div class="headline">{inl(ai.get("headline"))}</div><p>{inl(ai.get("lage"))}</p>'
                     + (f'<div class="changed">{inl(ai["veraendert"])}</div>' if ai.get("veraendert") else "") + "</div>")
        steps = ai.get("naechste_schritte") or []
        steps_html = ('<ol class="steps">' + "".join(f"<li><span>{inl(s)}</span></li>" for s in steps[:3]) + "</ol>") if steps else '<p class="empty">Keine.</p>'
        fragen = ai.get("fragen") or []
    else:
        lage_html = '<p class="empty">Keine KI-Einschätzung in diesem Lauf (kein GEMINI_API_KEY oder Fehler). Regeln und Fakten unten sind vollständig.</p>'
        steps_html, fragen = '<p class="empty">—</p>', []

    findings = [(s["level"], s["text"], s.get("url"), "Regel") for s in sig]
    findings += [(a.get("level", "info"), a.get("text", ""), None, "KI") for a in (ai.get("auffaelligkeiten") or [])]
    def linked(t: str, u: str | None) -> str:
        return f'<a href="{e(u)}" target="_blank" rel="noopener">{inl(t)}</a>' if u else inl(t)
    find_html = "".join(
        f'<li>{icon("check" if l == "info" else "alert")}<span>{linked(t, u)}</span>'
        f'<span class="meta"><span class="pill {LEVEL_PILL.get(l, "neutral")}">{e(src)}</span></span></li>'
        for l, t, u, src in findings) or '<li><span class="empty">Nichts auffällig.</span></li>'
    fragen_html = ('<div class="panel"><div class="panel-head"><div><h2>Offene Entscheidungen</h2><p>Nur du kannst das entscheiden</p></div></div>'
                   '<div class="panel-body"><ul class="list">' + "".join(f"<li>{icon('arrow')}<span>{inl(f)}</span></li>" for f in fragen[:2])
                   + "</ul></div></div>") if fragen else ""

    # CI
    ci_rows = "".join(
        f'<tr><td><a href="{e(w.get("url"))}" target="_blank" rel="noopener">{e(w["name"])}</a></td>'
        f'<td><span class="pill outline">{e(w.get("branch"))}</span></td><td>{conclusion_pill(w)}</td>'
        f'<td class="mono">{e(w.get("sha"))}</td><td class="mono" title="{e(absdate(w.get("created_at")))}">{e(rel(w.get("created_at")))}</td></tr>'
        for w in wfs[:18])
    ci_html = (f'<div class="table-wrap"><table><thead><tr><th>Workflow</th><th>Branch</th><th>Ergebnis</th><th>Commit</th><th>Wann</th></tr></thead>'
               f'<tbody>{ci_rows}</tbody></table></div>') if wfs else '<div class="panel-body"><p class="empty">Keine Workflow-Läufe gefunden.</p></div>'

    # Commits
    gh = meta["html_url"]
    com_html = "".join(
        f'<li>{icon("commit")}<span><a href="{e(gh)}/commit/{e(c["sha"])}" target="_blank" rel="noopener">{e(c["subject"])}</a>'
        f'<span class="sub"><span class="mono">{e(c["sha"])}</span> · {e(c["author"])}</span></span>'
        f'<span class="meta" title="{e(absdate(c["date"]))}">{e(rel(c["date"]))}</span></li>'
        for c in commits[:12]) or '<li><span class="empty">Keine Commits.</span></li>'

    # Issues/PRs
    def ip_row(i: dict, kind: str) -> str:
        labels = "".join(f' <span class="pill neutral">{e(l)}</span>' for l in (i.get("labels") or [])[:3])
        extra = f' · {e(i.get("head"))} → {e(i.get("base"))}' if kind == "pr" else ""
        return (f'<li>{icon(kind)}<span><a href="{e(i["url"])}" target="_blank" rel="noopener">#{i["number"]} {e(i["title"])}</a>{labels}'
                f'<span class="sub">{e(i.get("author"))}{extra}</span></span><span class="meta">{e(rel(i.get("updated_at")))}</span></li>')
    ip_html = "".join(ip_row(p, "pr") for p in pulls[:10]) + "".join(ip_row(i, "issue") for i in issues[:15])
    ip_html = ip_html or '<li><span class="empty">Keine offenen Issues oder PRs.</span></li>'

    # Tiefenanalyse
    deep_html = (f'<div class="deep">{md(deep)}</div>' if deep.strip()
                 else '<p class="empty">Noch keine Tiefenanalyse. Sie läuft montags (Claude), sobald das Secret CLAUDE_CODE_OAUTH_TOKEN gesetzt ist.</p>')

    # Links
    links = [("github", "Repository", gh), ("issue", "Issues", f"{gh}/issues"), ("pulse", "Actions", f"{gh}/actions")]
    links += [("globe", s.replace("https://", ""), s) for s in ev.get("live_sites", [])[:6]]
    docs_files = ev.get("docs", {}).get("docs_files", [])
    if "docs/apps.html" in docs_files:
        links.append(("ext", "Apps-Übersicht", "apps.html"))
    links_html = "".join(f'<a href="{e(u)}" target="_blank" rel="noopener">{icon(i)}{e(t)}</a>' for i, t, u in links)
    branch_ref = "dev" if br.get("has_dev") else main
    docs_html = "".join(
        f'<li>{icon("doc")}<a href="{e(gh)}/blob/{e(branch_ref)}/{e(f)}" target="_blank" rel="noopener">{e(f.removeprefix("docs/"))}</a></li>'
        for f in docs_files if f.endswith(".md"))[:20000] or '<li><span class="empty">Kein docs/-Ordner.</span></li>'

    desc = meta.get("description") or (ai.get("headline") if ai else "") or "Living Dashboard"
    pkg = ev.get("package") or {}
    version = f' · v{pkg["version"]}' if pkg.get("version") else ""
    nav = [("overview", "pulse", "Übersicht", ""), ("lage", "brain", "Lage", str(len(findings)) if findings else ""),
           ("ci", "check", "CI", str(len(red_wf)) if red_wf else ""), ("commits", "commit", "Commits", ""),
           ("issues", "issue", "Issues & PRs", str(len(issues) + len(pulls)) if issues or pulls else ""),
           ("deep", "spark", "Tiefenanalyse", ""), ("links", "doc", "Docs & Links", "")]
    nav_html = "".join(f'<a href="#{a}">{icon(i)}{e(t)}' + (f'<span class="count">{e(c)}</span>' if c else "") + "</a>"
                       for a, i, t, c in nav)

    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#f6f7f3">
<meta name="description" content="{e(desc)}">
<title>{e(name)} · Dashboard</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2332462e'/%3E%3Cpath d='M5 17h6l3-7 4 12 3-5h6' stroke='%23dfebba' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<style>{CSS}</style>
</head>
<body>
<div class="shell">
<aside class="sidebar" aria-label="Navigation">
  <a class="brand" href="#overview"><span class="brand-mark">{icon("pulse")}</span><span>{e(name)}<small>VITALOS · DEV-DASHBOARD</small></span></a>
  <div class="nav-label">DASHBOARD</div>
  <nav class="nav">{nav_html}</nav>
  <div class="side-bottom"><div class="principle"><strong>Fakten vor Meinung.</strong>Ampel und Lage-Issue kommen nur aus festen Regeln. Die KI schreibt das Lagebild, sie löst keinen Alarm aus.</div></div>
</aside>
<div class="main">
  <header class="topbar"><div class="crumb">VitalOS <span>/</span> <strong>{e(name)}</strong></div>
  <span class="stamp"><span class="dot {e(status)}"></span>Stand {e(absdate(ev["generated_at"]))}</span></header>
  <main class="content">
    <section id="overview" class="hero">
      <div><div class="eyebrow">{e(ev["repo"])}{e(version)}</div><h1>{e(name)}</h1><p class="lead">{e(desc)}</p></div>
      <div class="status {e(status)}"><div class="big">{icon("check" if status == "green" else "alert")}</div><div><b>{e(st_label)}</b><span>{e(st_text)}</span></div></div>
    </section>
    <div class="metrics">{metrics_html}</div>
    <div class="grid" id="lage">
      <div class="panel"><div class="panel-head"><div><h2>Lagebild</h2><p>KI-Einschätzung aus der Evidenz{f" · {e(ai.get('model'))}" if ai.get("model") else ""}</p></div>{icon("brain")}</div><div class="panel-body">{lage_html}</div></div>
      <div class="panel"><div class="panel-head"><div><h2>Nächste Schritte</h2><p>Höchstens drei, heute machbar</p></div>{icon("arrow")}</div><div class="panel-body">{steps_html}</div></div>
    </div>
    <div class="panel"><div class="panel-head"><div><h2>Auffälligkeiten</h2><p>Regeln setzen die Ampel · KI ergänzt</p></div><span class="pill {LEVEL_PILL.get(status, '')}">{e(st_label)}</span></div><div class="panel-body"><ul class="list">{find_html}</ul></div></div>
    {fragen_html}
    <div class="panel" id="ci"><div class="panel-head"><div><h2>CI &amp; Deploys</h2><p>Letzter Lauf je Workflow und Branch</p></div>{icon("check")}</div>{ci_html}</div>
    <div class="grid" id="commits">
      <div class="panel"><div class="panel-head"><div><h2>Commits</h2><p>{e(branch_ref)} · neueste zuerst</p></div>{icon("commit")}</div><div class="panel-body"><ul class="list">{com_html}</ul></div></div>
      <div class="panel"><div class="panel-head"><div><h2>Aktivität</h2><p>Commits pro Tag, 21 Tage</p></div>{icon("pulse")}</div><div class="panel-body">{activity_svg(act)}<div class="legend"><span>{e(act[0]["day"] if act else "")}</span><span>{act_sum} gesamt</span><span>heute</span></div></div></div>
    </div>
    <div class="panel" id="issues"><div class="panel-head"><div><h2>Issues &amp; Pull Requests</h2><p>offen</p></div>{icon("issue")}</div><div class="panel-body"><ul class="list">{ip_html}</ul></div></div>
    <div class="panel" id="deep"><div class="panel-head"><div><h2>Tiefenanalyse</h2><p>Wöchentlich, agentisch (Claude) · {e(absdate(deep_at)) if deep_at else "noch nie"}</p></div>{icon("spark")}</div><div class="panel-body">{deep_html}</div></div>
    <div class="grid" id="links">
      <div class="panel"><div class="panel-head"><div><h2>Links</h2><p>Repo, Live, Apps</p></div>{icon("globe")}</div><div class="panel-body"><div class="links">{links_html}</div></div></div>
      <div class="panel"><div class="panel-head"><div><h2>Docs</h2><p>docs/*.md auf {e(branch_ref)}</p></div>{icon("doc")}</div><div class="panel-body"><ul class="list">{docs_html}</ul></div></div>
    </div>
  </main>
  <footer class="footer"><span><span class="dot {e(status)}"></span> Automatisch erzeugt aus GitHub origin · {e(absdate(ev["generated_at"]))}</span>
  <span>Engine: <a href="https://github.com/nimmsel23/dashboards/tree/engine">nimmsel23/dashboards@engine</a></span>
  <span>Rohdaten: <a href="dashboard.json">dashboard.json</a></span></footer>
</div>
</div>
</body>
</html>
"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--evidence", required=True)
    ap.add_argument("--assessment", required=True)
    ap.add_argument("--state", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    ev = json.loads(Path(a.evidence).read_text())
    asm = json.loads(Path(a.assessment).read_text())
    state, out = Path(a.state), Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    deep = (state / "deep.md").read_text(encoding="utf-8") if (state / "deep.md").is_file() else ""
    deep_at = None
    if (state / "deep.meta.json").is_file():
        deep_at = json.loads((state / "deep.meta.json").read_text()).get("at")
    (out / "index.html").write_text(render(ev, asm, deep, deep_at), encoding="utf-8")
    ev_slim = {k: v for k, v in ev.items() if k != "docs"}
    (out / "dashboard.json").write_text(json.dumps({"evidence": ev_slim, "assessment": asm}, ensure_ascii=False, indent=1))
    print(f"rendered {out / 'index.html'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
