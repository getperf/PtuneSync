--- uri call ---
ptune-sync://pull/?home=C:\home\pkm\skel\obsidian\ptune-sync-skel\build&list=_Today

stdout:
{"version": 1, "timestamp": "2026-03-13T15:10:28.932+09:00", "status": "success", "success": true, "command": "pull", "data": {"list": "_Today", "exported_at": "2026-03-13T06:10:27.330658+00:00", "tasks": [{"id": "WnhEME9HSTAzMzgwLV9Dcg", "title": "a", "pomodoro_planned": null, "pomodoro_actual": null, "review_flags": [], "started": null, "completed": null, "status": "needsAction", "parent": null, "tags": [], "goal": null}, {"id": "bTl1TTJJUy1RQTI1NDFCTg", "title": "<夜>プール🚫", "pomodoro_planned": null, "pomodoro_actual": null, "review_flags": [], "started": null, "completed": null, "status": "needsAction", "parent": null, "tags": [], "goal": null}], "schema_version": 2}}

--- uri call ---
ptune-sync://diff/?home=C:\home\pkm\skel\obsidian\ptune-sync-skel\build&input=C:\home\pkm\skel\obsidian\ptune-sync-skel\sample\diff.json&list=_Today

stdout:
{"version": 1, "timestamp": "2026-03-13T15:10:55.113+09:00", "status": "error", "success": false, "command": "diff", "error": {"type": "DIFF_ERROR", "message": "Diff validation failed"}, "data": {"summary": {"create": 5, "update": 0, "delete": 3, "errors": 1, "warnings": 0}, "errors": ["Remote task missing: VjJIWi0wN2NZWEh6OTVkbw"], "warnings": []}}

