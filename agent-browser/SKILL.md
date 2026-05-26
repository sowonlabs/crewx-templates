---
name: agent-browser
description: Chrome browser automation + chrome-mcp recipe factory. Execute natural language tasks and convert them into reusable chrome-mcp recipes.
metadata:
  version: 0.1.0
  changelog:
    - "0.1.0 — Internationalized to English (2026-05-26)"
---

# Agent Browser Skill — Chrome Recipe Factory

Browser automation skill powered by [agent-browser](https://www.npmjs.com/package/agent-browser) (Vercel Labs).
Acts as a **recipe factory** for the chrome-mcp skill: records new site automations and converts them into chrome-mcp JSON recipes.

---

## Prerequisites

```bash
# 1. Check if installed
node agent-browser.js --help

# 2. If not installed
npm install
node agent-browser.js install  # Download Chromium
```

---

## Core Workflow

### A. Direct Execution (Quick Tasks)

```bash
# Step-by-step manual execution
node agent-browser.js run open https://www.coupang.com
node agent-browser.js run snapshot -i
# → Check snapshot for @e1, @e2, etc. refs
node agent-browser.js run find role textbox fill "매일두유"
node agent-browser.js run press Enter
node agent-browser.js run wait 2000
node agent-browser.js run screenshot ./result.png
node agent-browser.js run close
```

### B. Record and Generate Recipe (New Sites)

```bash
# 1. Start recording
node agent-browser.js record start "coupang-search"

# 2. Browser actions (all commands are automatically logged)
node agent-browser.js record open https://www.coupang.com
node agent-browser.js record snapshot -i
# → Check snapshot for [ref=eN], then use as @eN
node agent-browser.js record fill "@e5" "매일두유"
node agent-browser.js record click "@e8"
node agent-browser.js record wait 2000

# 3. Stop recording and save
node agent-browser.js record stop sessions/coupang-search.jsonl

# 4. Convert to chrome-mcp recipe
node agent-browser.js convert sessions/coupang-search.jsonl \
  --hostname www.coupang.com \
  --name search \
  > tools/www.coupang.com.json
```

---

## Initial Setup

```bash
# Install dependencies (first time only)
cd <skill-dir>   # e.g. skills/agent-browser
npm install

# Download Chromium (first time only, ~150MB)
node agent-browser.js install

# Verify it works
node agent-browser.js test-google
```

---

## Available Commands

All commands use the format `node agent-browser.js <command>`.

### Direct Execution (`run`)

| Command | Description |
|---------|-------------|
| `run open <url>` | Open a URL |
| `run snapshot [-i]` | Output accessibility tree + refs (@e1, @e2...). `-i` shows interactive elements only |
| `run click <sel>` | Click an element. Use `@e2` ref or CSS/ARIA selector |
| `run fill <sel> <text>` | Fill text (clears first, then types) |
| `run type <sel> <text>` | Type text |
| `run press <key>` | Key press (Enter, Tab, Control+a) |
| `run find role <role> <action> [value]` | Find element by ARIA role and perform action |
| `run find text <text> <action>` | Find element by text and perform action |
| `run find label <label> fill <text>` | Find input by label and fill |
| `run wait <ms>` | Wait N milliseconds |
| `run wait --text "text"` | Wait until text appears |
| `run screenshot [path]` | Save screenshot |
| `run get url` | Return current URL |
| `run get title` | Return page title |
| `run get text <sel>` | Return element text |
| `run close` | Close browser |

### Recording (`record`)

| Command | Description |
|---------|-------------|
| `record start [name]` | Start a recording session |
| `record stop [output.jsonl]` | Stop recording and save |
| `record <any command>` | Execute command + auto-log |

### Convert (`convert`)

```bash
node agent-browser.js convert <log.jsonl> [--hostname=xxx] [--name=xxx]
```

- `--hostname`: hostname for the output JSON (default: auto-extracted from URL)
- `--name`: function name (default: `task`)

---

## Using Snapshots

agent-browser uses **accessibility tree**-based automation. Check the snapshot for refs before using them:

```bash
# Show interactive elements only
node agent-browser.js run snapshot -i

# Example output (Google):
# - combobox "검색" [ref=e7]
# - button "Google 검색" [ref=e11]
# - button "I'm Feeling Lucky" [ref=e12]

# Use ref directly: [ref=eN] → convert to @eN format
node agent-browser.js run fill "@e7" "매일두유"
node agent-browser.js run click "@e11"
```

> **Ref format**: Snapshots display `[ref=e7]` but commands use `@e7`.
> **Note**: Refs change on every page load. During recording, they are automatically converted to `role "label"` selectors.

---

## Natural Language Command Pattern

When Claude processes a natural language task:

1. Analyze the task → which site? which action?
2. Use `snapshot -i` to identify current page elements
3. Locate elements by ARIA role + label and execute
4. On success, save as a chrome-mcp recipe

**Example: "Search for 매일두유 on Coupang"**

```bash
node agent-browser.js record start "coupang-search-maeil"
node agent-browser.js record open https://www.coupang.com
node agent-browser.js record snapshot -i
# → Confirm textbox "쿠팡 상품 검색" @e3, button "검색" @e7

node agent-browser.js record find role textbox fill "매일두유" --name "쿠팡 상품 검색"
node agent-browser.js record find role button click --name "검색"
node agent-browser.js record wait 2000
node agent-browser.js record screenshot ./coupang-result.png
node agent-browser.js record stop sessions/coupang-maeil.jsonl
node agent-browser.js convert sessions/coupang-maeil.jsonl \
  --hostname www.coupang.com --name search
```

---

## Recipe Format (chrome-mcp Compatible)

```json
{
  "hostname": "www.coupang.com",
  "atoms": [
    {
      "name": "fill_search_box",
      "description": "Fill: textbox \"쿠팡 상품 검색\"",
      "action": "fill",
      "selector": "textbox \"쿠팡 상품 검색\"",
      "path": "/"
    },
    {
      "name": "click_search_btn",
      "description": "Click: button \"검색\"",
      "action": "click",
      "selector": "button \"검색\"",
      "path": "/"
    }
  ],
  "functions": [
    {
      "name": "search",
      "description": "Search for a product on Coupang",
      "params": ["query"],
      "steps": [
        { "action": "navigate", "url": "https://www.coupang.com" },
        { "action": "snapshot" },
        { "use": "fill_search_box", "value": "{query}" },
        { "use": "click_search_btn" },
        { "action": "wait" }
      ]
    }
  ]
}
```

---

## chrome-mcp Integration (Optional)

If the `chrome-mcp` skill is installed as a sibling directory, recipes can be saved directly to its tools folder. Set `CHROME_MCP_TOOLS_DIR` to override the default path.

```bash
# 1. Generate recipe → save locally or to chrome-mcp tools folder
node agent-browser.js convert sessions/log.jsonl \
  --hostname www.example.com --name search \
  > tools/www.example.com.json

# 2. Or export to chrome-mcp (if installed as sibling)
# > ../chrome-mcp/tools/www.example.com.json
```

---

## Troubleshooting

### "agent-browser: command not found"
```bash
npm install
node agent-browser.js install
```

### "Chromium not installed"
```bash
node agent-browser.js install
# or
npx agent-browser install --with-deps  # includes system dependencies on Linux
```

### @ref not resolved (recipe still contains @e3)
The `snapshot` output may not match the expected format. Use semantic locators instead:
```bash
# Instead of @ref
node agent-browser.js record find role textbox fill "search term" --name "search box label"
node agent-browser.js record find role button click --name "button name"
```

### Page loads slowly
```bash
node agent-browser.js run wait --text "text to wait for"
node agent-browser.js run wait --load networkidle
```

---

## Debug & Console Monitoring

agent-browser provides debugging features that capture browser console logs and JS errors.

### Debug Commands

| Command | Description | Options |
|---------|-------------|---------|
| `console` | All browser console logs (log, warn, error, info) | `--clear`, `--json` |
| `errors` | JS errors / uncaught exceptions only | `--clear`, `--json` |
| `eval <js>` | Execute JS code in the browser | `-b` (base64), `--stdin` |
| `highlight <sel>` | Visually highlight an element | - |
| `trace start/stop` | Record Playwright trace | `[path]` |
| `profiler start/stop` | Chrome DevTools profile | `[path]` |
| `diff snapshot` | Compare with previous snapshot | `--baseline`, `--selector` |
| `diff screenshot` | Pixel-diff screenshots | `--baseline`, `--threshold` |

### Frontend Debugging Workflow

```bash
# 1. Open the page
npx agent-browser open http://localhost:8200/threads/1

# 2. Clear console/error buffers
npx agent-browser console --clear
npx agent-browser errors --clear

# 3. Perform the action that triggers the error (click, navigate, etc.)
npx agent-browser click "@e5"
npx agent-browser wait 2000

# 4. Check JS errors
npx agent-browser errors
# → TypeError: Cannot read properties of undefined (reading 'bgClass')

# 5. Inspect console logs in detail (JSON format)
npx agent-browser console --json
# → API 404, Maximum call stack size exceeded, etc.

# 6. Check runtime state directly with eval
npx agent-browser eval "document.querySelectorAll('.error').length"

# 7. Take a screenshot for visual inspection
npx agent-browser screenshot ./debug.png
```

### Continuous Monitoring (During Development)

```bash
# Monitor while developing
npx agent-browser open http://localhost:8200

# ... after modifying code and waiting for HMR to apply ...
npx agent-browser errors        # Check for new errors
npx agent-browser console       # Check full logs
npx agent-browser errors --clear # Clear buffer after review
```

### Differences from chrome-mcp Skill

| Feature | chrome-mcp | agent-browser |
|---------|-----------|---------------|
| UI interaction (click, type) | O | O |
| Console log capture | X | **O** (`console`) |
| JS error capture | X | **O** (`errors`) |
| JS eval execution | X | **O** (`eval`) |
| Playwright trace | X | **O** (`trace`) |
| Snapshot diff | X | **O** (`diff`) |
| Element highlight | X | **O** (`highlight`) |
| Tool Registry (recipes) | O | O (convert) |
| Login profile persistence | O (.chrome-agent) | O (--profile) |

> **Summary:** Use chrome-mcp for UI automation only; use **agent-browser when debugging is needed**.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CHROME_DEBUG_PORT` | `9222` | Chrome DevTools Protocol port for connecting to an existing browser |
| `AGENT_BROWSER_HEADLESS` | (unset) | Set to `1` to run in headless mode |
| `AGENT_BROWSER_NO_CDP` | (unset) | Set to `1` to skip CDP detection and always launch a new browser |
| `CHROME_MCP_TOOLS_DIR` | `../chrome-mcp/tools` (relative to skill dir) | Path to chrome-mcp tools directory for recipe import/export |

---

## Architecture

```
agent-browser/
├── SKILL.md           # This file
├── package.json       # agent-browser dependency
├── agent-browser.js   # CLI wrapper (run / record / convert)
├── tools/             # Local recipe storage
└── sessions/          # Recorded log storage
    ├── .current.json  # Current session state
    ├── .log.jsonl     # Current recording log
    └── .snapshot-refs.json  # ref → role+label cache
```

```
Claude (agent)
    │
    ├── agent-browser.js run <cmd>
    │       └── npx agent-browser <cmd>
    │               └── Chromium (Playwright-core)
    │
    ├── agent-browser.js record <cmd>
    │       ├── npx agent-browser <cmd>
    │       └── sessions/.log.jsonl (action log)
    │
    └── agent-browser.js convert <log>
            └── chrome-mcp recipe JSON
                    └── tools/{hostname}.json (or CHROME_MCP_TOOLS_DIR)
```
