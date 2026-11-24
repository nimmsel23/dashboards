# Living Area Boards

Area-Boards für Epic [vitalos#27](https://github.com/nimmsel23/vitalos/issues/27)
(Child-Issues #28–#33). Früher unter `vitalos/prod/coordination/`; seit 2026-11-24
hier im Repo `nimmsel23/dashboards`, Branch **`engine`**.

Das ist **nicht** die Dev-Repo-Engine (`engine/*.py` → Pages je Repo) und **nicht**
die vos-Zentrale (Rollen-Dashboards).

## Lokal

```sh
cd ~/dev/dashboards-engine   # oder Clone von nimmsel23/dashboards @ engine
python3 living-areas/gen-boards.py
```

Sibling-Pfade defaulten auf `$HOME/{workspace,vitaltrainer,creator,business}`,
`$HOME/vitalos`, `$HOME/dev/coach-dev`. Override: `BOARDS_HOME`, `VITALOS_ROOT`.

## CI

Workflow: [`.github/workflows/living-areas.yml`](../.github/workflows/living-areas.yml)
(Mo 05:15 UTC + `workflow_dispatch`). Braucht Repo-Secret **`SYNC_TOKEN`**
(gleicher PAT wie früher in `vitalos`) zum Klonen der privaten Sibling-Repos.

## Output

| Pfad | Zweck |
| --- | --- |
| `boards/*.md` | generierte Area-Boards |
| `BOARDS.md` | Index |
| `gen-boards.py` | Generator |
