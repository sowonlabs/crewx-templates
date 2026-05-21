---
name: crewx-dailyplanner
version: 0.1.0
type: doc
description: Daily planner markdown authoring guide. Exact format spec compatible with the UI parser.
tags: [planner, daily, markdown]
---

# crewx-dailyplanner

A guide for writing daily planner markdown documents in the exact format the UI parser can understand.

## File Conventions

| Field | Value |
|------|------|
| Path | `docs/daily/YYYY-MM-DD.md` |
| Filename | Date format `YYYY-MM-DD.md` (e.g. `2026-05-21.md`) |
| Encoding | UTF-8 |

## Markdown Format

The parser recognizes **only the exact structure below**. Section order is flexible, but heading names must match regardless of case.

```markdown
# YYYY-MM-DD (Weekday)

## Top 3
1. First priority — @agent1 @agent2
2. Second priority
3. Third priority — @agent3

## Brain Dump
- Free note 1
- Free note 2

## Schedule
- [ ] 09:00 Pending item
- [x] 14:00 Completed item
- [-] 16:00 Cancelled item

## Notes
Free text block. Line breaks are preserved as-is.

## Reflection
Free text block.
```

## Per-Section Parsing Rules

### H1 — Date Header
```
# 2026-05-21 (Thursday)
```
- `YYYY-MM-DD` is required; the weekday in parentheses is optional
- Weekday in English: Sunday ~ Saturday

### Top 3
```
1. Task text — @agent1 @agent2
```
- Format: `N. text` (number + period + space)
- Agent assignment: ` — @agentname` (em dash `—` followed by `@` prefix)
- The dash portion can be omitted if no agent is assigned

### Brain Dump
```
- Free note item
```
- Only lines starting with `- ` (hyphen + space) are recognized
- Blank lines or lines without `-` are ignored

### Schedule
```
- [ ] HH:MM Schedule description
- [x] HH:MM Completed item
- [-] HH:MM Cancelled item
```

| Marker | Status | UI Behavior |
|------|------|---------|
| `[ ]` | pending | Checkbox is toggleable |
| `[x]` | done | Checkbox is toggleable |
| `[-]` | cancelled | Read-only (strikethrough) |

- Time **must use `HH:MM`** format (24-hour, 2 digits)
- `- [x] 14:00 Meeting` (✓) / `- [x] 2:00pm Meeting` (✗)

### Notes
- Everything after `## Notes` is stored as a single string
- Markdown formatting is supported

### Reflection
- Everything after `## Reflection`
- Same rules as Notes

## When an Agent Writes the Daily

1. If the file already exists, **preserve existing content** — do not overwrite
2. When adding commit/task records to Schedule:
   - Round the time down to the nearest hour based on the commit timestamp (`18:39` → `18:00`)
   - Combine tasks in the same time slot into one line joined with `+`
   - Completed items use `[x]`, planned items use `[ ]`
3. Top 3 / Brain Dump / Reflection are user-authored sections — agents must not fill them in arbitrarily

## Example: Real File

```markdown
# 2026-05-21 (Thursday)

## Top 3
1. Implement daily planner — @ui_backend_dev @ui_frontend_dev
2. Organize market WIs
3. RC deployment

## Brain Dump
- First day adding the planner feature
- Finally finished organizing 11 market WIs

## Schedule
- [x] 00:00 Fix market WI-019
- [x] 14:00 Mark WI-004~017,019 as complete
- [x] 15:00 Organize market design doc + reflect in AGENTS.md
- [x] 16:00 Fix thread filtering bug (#320) + cache invalidation (#321)
- [x] 17:00 Implement daily planner backend+frontend + deploy 0.8.7-rc.2
- [x] 18:00 Improve planner UX + refactor nemotron-persona
- [ ] 20:00 Code review

## Notes
rc.2 deployed successfully. Next: stabilize planner in rc.3.

## Reflection
```

## Related Source Files

| File | Role |
|------|------|
| `src/server/domain/planner/planner.service.ts` | MD parsing / serialization |
| `src/server/domain/planner/dto/planner.dto.ts` | Type definitions |
| `src/ui/pages/planner/PlannerPage.tsx` | Frontend page |
| `src/ui/pages/planner/components/` | 5 card components |
