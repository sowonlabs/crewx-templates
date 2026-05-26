#!/usr/bin/env node
/**
 * Agent Browser Skill - Chrome Recipe Factory
 *
 * Wraps the `agent-browser` CLI with:
 *   run     - Pass-through to agent-browser
 *   record  - Execute commands while logging them
 *   convert - Transform a recorded log into chrome-mcp recipe JSON
 *
 * Usage:
 *   node agent-browser.js run open https://google.com
 *   node agent-browser.js record start "google-search"
 *   node agent-browser.js record open https://google.com
 *   node agent-browser.js record snapshot
 *   node agent-browser.js record fill "@e3" "hello world"
 *   node agent-browser.js record click "@e2"
 *   node agent-browser.js record stop result.jsonl
 *   node agent-browser.js convert result.jsonl --hostname www.google.com --name search
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const SKILL_DIR = __dirname;
const SESSIONS_DIR = path.join(SKILL_DIR, 'sessions');
const SESSION_FILE = path.join(SESSIONS_DIR, '.current.json');
const LOG_FILE = path.join(SESSIONS_DIR, '.log.jsonl');
const SNAPSHOT_CACHE = path.join(SESSIONS_DIR, '.snapshot-refs.json');
const TOOLS_DIR = path.join(SKILL_DIR, 'tools');
const CHROME_MCP_TOOLS_DIR = process.env.CHROME_MCP_TOOLS_DIR || path.join(SKILL_DIR, '..', 'chrome-mcp', 'tools');

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// ============================================================
// agent-browser CLI wrapper
// ============================================================

/**
 * Detect if Chrome is running on CDP port (default: 9222).
 */
function isCdpAvailable(port) {
  try {
    const r = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}',
      `http://localhost:${port}/json/version`], { encoding: 'utf-8', timeout: 2000, shell: true });
    return r.stdout.trim() === '200';
  } catch { return false; }
}

const CDP_PORT = process.env.CHROME_DEBUG_PORT || '9222';

/**
 * Run `npx agent-browser <args>` and return { stdout, stderr, status }
 *
 * By default, connects to an existing Chrome via CDP (port 9222) if available.
 * This reuses chrome-mcp's browser session: login state, cookies, no bot detection.
 * Falls back to launching a fresh Chromium if CDP is not available.
 *
 * Override: set AGENT_BROWSER_NO_CDP=1 to always use fresh Chromium.
 */
function runAgentBrowser(args) {
  const env = { ...process.env, NO_COLOR: '1' };

  // Parse local wrapper option: --browser <chromium|firefox|webkit>
  let browser = null;
  let finalArgs = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--browser') {
      const next = args[i + 1];
      if (!next) {
        return {
          stdout: '',
          stderr: 'Missing value for --browser (expected: chromium, firefox, or webkit)\n',
          status: 1,
        };
      }
      if (!['chromium', 'firefox', 'webkit'].includes(next)) {
        return {
          stdout: '',
          stderr: `Invalid --browser value "${next}" (expected: chromium, firefox, or webkit)\n`,
          status: 1,
        };
      }
      browser = next;
      i += 1; // skip browser value
      continue;
    }
    finalArgs.push(arg);
  }

  const isInstall = finalArgs[0] === 'install';
  const alreadyHasHeaded = finalArgs.includes('--headed');
  const alreadyHasHeadless = finalArgs.includes('--headless');
  const envHeadless = process.env.AGENT_BROWSER_HEADLESS === '1';

  if (!isInstall && !alreadyHasHeaded && !alreadyHasHeadless && !envHeadless) {
    finalArgs = ['--headed', ...finalArgs];
  }

  if (browser) {
    const browserConfigPath = path.join(os.tmpdir(), `agent-browser-${browser}.json`);
    fs.writeFileSync(browserConfigPath, JSON.stringify({ browser }, null, 2));
    finalArgs = ['--config', browserConfigPath, ...finalArgs];
  }

  // Auto-connect to CDP unless explicitly disabled or this is an 'install' command
  const noCdp = process.env.AGENT_BROWSER_NO_CDP === '1' || Boolean(browser);
  const alreadyHasCdp = finalArgs.some(a => a === '--cdp' || a === '--auto-connect');

  if (!noCdp && !isInstall && !alreadyHasCdp && isCdpAvailable(CDP_PORT)) {
    finalArgs = ['--cdp', CDP_PORT, ...finalArgs];
  }

  const result = spawnSync('npx', ['agent-browser', ...finalArgs], {
    encoding: 'utf-8',
    timeout: 60000,
    cwd: SKILL_DIR,
    env,
    shell: true,
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status ?? 0,
    error: result.error,
  };
}

// ============================================================
// Snapshot ref parsing
// ============================================================

/**
 * Parse agent-browser snapshot output to extract @eN -> { role, label } map.
 *
 * agent-browser snapshot outputs accessibility tree like:
 *   - combobox "검색" [ref=e7]
 *   - button "Google 검색" [ref=e11]
 *
 * Multiple patterns are tried to handle different output formats.
 */
function parseSnapshotRefs(snapshotOutput) {
  const refs = {};
  const lines = snapshotOutput.split('\n');

  for (const line of lines) {
    // Pattern 1 (current format): "- role "label" [ref=eN]"
    let m = line.match(/-\s+(\w[\w-]*)\s+"([^"]+)"\s+\[ref=(e\d+)\]/);
    if (m) {
      refs[`@${m[3]}`] = { role: m[1], label: m[2] };
      continue;
    }
    // Pattern 2: "- role "label" @eN"
    m = line.match(/-\s+(\w[\w-]*)\s+"([^"]+)"\s+(@e\d+)/);
    if (m) {
      refs[m[3]] = { role: m[1], label: m[2] };
      continue;
    }
    // Pattern 3: "@eN [role] "label""
    m = line.match(/(@e\d+)\s+\[(\w[\w-]*)\]\s+"([^"]+)"/);
    if (m) {
      refs[m[1]] = { role: m[2], label: m[3] };
      continue;
    }
    // Pattern 4: "@eN role "label""
    m = line.match(/(@e\d+)\s+(\w[\w-]*)\s+"([^"]+)"/);
    if (m) {
      refs[m[1]] = { role: m[2], label: m[3] };
    }
  }

  return refs;
}

function loadSnapshotRefs() {
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_CACHE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveSnapshotRefs(refs) {
  fs.writeFileSync(SNAPSHOT_CACHE, JSON.stringify(refs, null, 2));
}

// ============================================================
// Session / recording management
// ============================================================

function loadSession() {
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function saveSession(session) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

function isRecording() {
  const session = loadSession();
  return session && session.recording === true;
}

function appendLog(entry) {
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() });
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ============================================================
// Ref resolution
// ============================================================

/**
 * Resolve @eN ref to "role \"label\"" chrome-mcp selector format.
 * Falls back to the raw ref if not found in the snapshot cache.
 */
function resolveRef(ref, snapshotRefs) {
  if (!ref || !ref.startsWith('@')) return ref;
  const elem = snapshotRefs[ref];
  if (elem) {
    return `${elem.role} "${elem.label}"`;
  }
  return ref;
}

/**
 * Get the current page URL from agent-browser.
 */
function getCurrentUrl() {
  try {
    const r = runAgentBrowser(['get', 'url']);
    return r.stdout.trim();
  } catch {
    return '';
  }
}

/**
 * Get the current page title from agent-browser.
 */
function getCurrentTitle() {
  try {
    const r = runAgentBrowser(['get', 'title']);
    return r.stdout.trim();
  } catch {
    return '';
  }
}

// ============================================================
// Tool Registry (self-contained execution engine)
// ============================================================

function ensureToolsDir() {
  if (!fs.existsSync(TOOLS_DIR)) fs.mkdirSync(TOOLS_DIR, { recursive: true });
}

/**
 * Parse chrome-mcp selector format: 'role "label"' → { role, label }
 */
function parseSelector(selector) {
  if (!selector) return null;
  const m = selector.match(/^(\w[\w-]*)\s+"(.+)"$/);
  if (m) return { role: m[1], label: m[2] };
  return null;
}

/**
 * Resolve hostname alias → canonical hostname.
 * E.g. "item.gmarket.co.kr" → "www.gmarket.co.kr"
 */
function resolveHostnameAlias(hostname) {
  for (const dir of [TOOLS_DIR, CHROME_MCP_TOOLS_DIR]) {
    const aliasFile = path.join(dir, '_aliases.json');
    if (!fs.existsSync(aliasFile)) continue;
    try {
      const aliases = JSON.parse(fs.readFileSync(aliasFile, 'utf-8'));
      for (const [canonical, alts] of Object.entries(aliases)) {
        if (alts.includes(hostname)) return canonical;
      }
    } catch { /* ignore */ }
  }
  return hostname;
}

/**
 * Load tools for a hostname.
 * Checks agent-browser/tools/ first, falls back to chrome-mcp/tools/.
 * Supports hostname aliases (e.g. item.gmarket.co.kr → www.gmarket.co.kr).
 */
function loadToolsForHostname(hostname) {
  const resolved = resolveHostnameAlias(hostname);
  for (const h of [hostname, resolved]) {
    const localFile = path.join(TOOLS_DIR, `${h}.json`);
    const chromeMcpFile = path.join(CHROME_MCP_TOOLS_DIR, `${h}.json`);
    const file = fs.existsSync(localFile) ? localFile :
                 fs.existsSync(chromeMcpFile) ? chromeMcpFile : null;
    if (!file) continue;
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      let functions = [];
      if (Array.isArray(data)) functions = data;
      else if (Array.isArray(data.functions)) functions = data.functions;
      return { functions, recipe: Array.isArray(data) ? { functions: data } : data, source: file };
    } catch { /* skip */ }
  }
  return { functions: [], recipe: null, source: null };
}

/**
 * List all hostnames with registered tools (both local + chrome-mcp).
 */
function listAllToolDomains() {
  const seen = new Map(); // hostname → { count, source }
  for (const [dir, label] of [[TOOLS_DIR, 'local'], [CHROME_MCP_TOOLS_DIR, 'chrome-mcp']]) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json') || file.startsWith('_')) continue;
      const hostname = file.replace('.json', '');
      if (seen.has(hostname)) continue; // local takes priority
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
        const count = Array.isArray(data) ? data.length :
                      Array.isArray(data.functions) ? data.functions.length : 0;
        seen.set(hostname, { count, source: label });
      } catch { /* skip */ }
    }
  }
  return seen;
}

/**
 * Get current page hostname from agent-browser.
 */
function getCurrentHostname() {
  const url = getCurrentUrl();
  try { return new URL(url).hostname; } catch { return null; }
}

/**
 * Execute a single tool action using agent-browser's find command.
 * Self-contained — no chrome-mcp dependency.
 */
function executeTool(tool, value) {
  const parsed = tool.selector ? parseSelector(tool.selector) :
                 (tool.role && tool.label) ? { role: tool.role, label: tool.label } : null;

  if (!parsed) {
    if (tool.action === 'navigate' && (tool.url || value)) {
      return runAgentBrowser(['open', tool.url || value]);
    }
    console.error(`Cannot parse selector: ${tool.selector || '(none)'}`);
    return { status: 1, stdout: '', stderr: 'Cannot parse selector' };
  }

  const { role, label } = parsed;
  const exact = tool.exact ? ['--exact'] : [];
  // For elements that match multiple (e.g. "장바구니" button appears twice),
  // use `find first` with a combined selector to pick the first match.
  if (tool.first) {
    const roleSelector = `role=${role}[name="${label}"]`;
    switch (tool.action) {
      case 'click':
        return runAgentBrowser(['find', 'first', roleSelector, 'click']);
      case 'fill':
        return runAgentBrowser(['find', 'first', roleSelector, 'fill', value || '']);
      default:
        return runAgentBrowser(['find', 'first', roleSelector, tool.action]);
    }
  }
  switch (tool.action) {
    case 'click':
      return runAgentBrowser(['find', 'role', role, 'click', '--name', label, ...exact]);
    case 'fill': {
      // Use direct fill with Playwright role selector to avoid --name parsing bug
      const selector = `role=${role}[name="${label}"]`;
      return runAgentBrowser(['fill', selector, value || '']);
    }
    case 'type': {
      const selector = `role=${role}[name="${label}"]`;
      return runAgentBrowser(['type', selector, value || '']);
    }
    case 'navigate':
      return runAgentBrowser(['open', tool.url || value]);
    default:
      console.error(`Unknown action: ${tool.action}`);
      return { status: 1, stdout: '', stderr: `Unknown action: ${tool.action}` };
  }
}

function toConditionList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function needsSnapshotForAssert(assertSpec) {
  if (!assertSpec) return false;
  const conditions = [
    ...toConditionList(assertSpec.success),
    ...toConditionList(assertSpec.failure),
  ];
  return conditions.some((cond) => Boolean(cond && (cond.text || cond.selector)));
}

function getConditionLabel(cond) {
  if (!cond) return '(unknown condition)';
  if (cond.text) return `text "${cond.text}"`;
  if (cond.url) return `url "${cond.url}"`;
  if (cond.title) return `title "${cond.title}"`;
  if (cond.selector) return `selector "${cond.selector}"`;
  return '(unknown condition)';
}

function matchesAssertCondition(cond, ctx) {
  if (!cond) return false;
  const checks = [];
  if (cond.text) checks.push(Boolean((ctx.snapshot || '').includes(cond.text)));
  if (cond.url) {
    const urlValue = String(ctx.url || '').toLowerCase();
    const pattern = String(cond.url || '').toLowerCase();
    let matched = urlValue.includes(pattern);
    if (!matched && pattern.includes('/')) {
      const tokens = [...new Set(pattern.split('/').map(s => s.trim()).filter(Boolean))];
      if (tokens.length > 0) matched = tokens.every(token => urlValue.includes(token));
    }
    checks.push(matched);
  }
  if (cond.title) {
    const titleValue = String(ctx.title || '').toLowerCase();
    const pattern = String(cond.title || '').toLowerCase();
    checks.push(titleValue.includes(pattern));
  }
  if (cond.selector) checks.push(Boolean((ctx.snapshot || '').includes(cond.selector)));
  if (checks.length === 0) return false;
  return checks.some(Boolean);
}

function runAssertChecks(assertSpec, fnName) {
  if (!assertSpec) return 0;

  const successConditions = toConditionList(assertSpec.success);
  const failureConditions = toConditionList(assertSpec.failure);

  if (successConditions.length === 0 && failureConditions.length === 0) return 0;

  const ctx = {
    title: getCurrentTitle(),
    url: getCurrentUrl(),
    snapshot: '',
  };

  // Collect captured dialog texts (from intercepted window.alert/confirm)
  const dialogResult = runAgentBrowser(['eval', 'JSON.stringify(window.__capturedDialogs||[])']);
  if (dialogResult.stdout) {
    try {
      let parsed = JSON.parse(dialogResult.stdout.trim());
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        ctx.snapshot = parsed.join('\n');
        console.error(`[assert] dialog captured: ${parsed.map(d => `"${d}"`).join(', ')}`);
      }
    } catch (_) {}
  }

  // Fallback: also check DOM text if no dialog was captured
  if (!ctx.snapshot && needsSnapshotForAssert(assertSpec)) {
    const evalResult = runAgentBrowser(['eval', 'document.body.textContent']);
    if (evalResult.stdout) ctx.snapshot = evalResult.stdout;
  }

  for (const cond of successConditions) {
    if (matchesAssertCondition(cond, ctx)) {
      console.error(`[assert] ✓ Success (${fnName}): ${getConditionLabel(cond)}`);
      return 0;
    }
  }

  for (const cond of failureConditions) {
    if (matchesAssertCondition(cond, ctx)) {
      const guide = cond.guide ? `\n  Guide: ${cond.guide}` : '';
      console.error(`[assert] ✗ Failed (${fnName}): ${getConditionLabel(cond)}${guide}`);
      return 1;
    }
  }

  console.error(`[assert] ✗ Failed (${fnName}): no success condition matched`);
  return 1;
}

function hasGuide(item) {
  if (!item) return false;
  if (item.guide) return true;
  const failures = toConditionList(item.assert && item.assert.failure);
  return failures.length > 0;
}

function printGuidesForItems(hostname, name, items) {
  const merged = [];
  for (const item of items) {
    if (!item) continue;
    if (item.guide) merged.push(`  💡 ${item.guide}`);
    const failures = toConditionList(item.assert && item.assert.failure);
    for (const cond of failures) {
      if (!cond || !cond.guide) continue;
      const key = cond.text || cond.url || cond.title || cond.selector || 'condition';
      merged.push(`  ⚠️ "${key}" → ${cond.guide}`);
    }
  }
  const deduped = [...new Set(merged)];
  console.log(`[Guide] ${name} (${hostname}):`);
  if (deduped.length === 0) {
    console.log('  (no guides registered)');
    return 0;
  }
  deduped.forEach(line => console.log(line));
  return 0;
}

/**
 * Execute a recipe function's steps using agent-browser.
 * Self-contained execution — replaces chrome-mcp delegation.
 */
function executeRecipeFunction(recipe, funcName, params) {
  const fn = (recipe.functions || []).find(f => f.name === funcName);
  if (!fn) {
    const available = (recipe.functions || []).map(f => f.name);
    console.error(`Function "${funcName}" not found. Available: ${available.join(', ')}`);
    return 1;
  }

  // Param substitution map
  const paramMap = {};
  if (fn.params) fn.params.forEach((p, i) => { paramMap[p] = params[i] || ''; });
  function replaceParams(str) {
    if (!str) return str;
    return str.replace(/\{(\w+)\}/g, (_, key) => paramMap[key] || '');
  }

  // Inject dialog capture if assert is defined (intercept window.alert/confirm before steps)
  if (fn.assert) {
    runAgentBrowser(['eval', 'window.__capturedDialogs=[];window.__origAlert=window.alert;window.alert=function(m){window.__capturedDialogs.push(m);};window.__origConfirm=window.confirm;window.confirm=function(m){window.__capturedDialogs.push(m);return true;};void 0']);
  }

  const steps = fn.steps || [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.error(`[execute] Step ${i + 1}/${steps.length}: ${JSON.stringify(step)}`);
    let r;

    if (step.action === 'navigate') {
      r = runAgentBrowser(['open', replaceParams(step.url)]);
    } else if (step.action === 'snapshot') {
      r = runAgentBrowser(['snapshot', '-i']);
    } else if (step.action === 'wait') {
      r = runAgentBrowser(['wait', String(step.ms || step.timeout || 2000)]);
    } else if (step.action === 'press') {
      r = runAgentBrowser(['press', step.key]);
    } else if (step.action === 'screenshot') {
      r = runAgentBrowser(['screenshot', ...(step.path ? [step.path] : [])]);
    } else if (step.action === 'click' && step.selector) {
      r = executeTool(step, replaceParams(step.value));
    } else if (step.action === 'fill' && step.selector) {
      r = executeTool(step, replaceParams(step.value));
    } else if (step.action === 'type' && step.selector) {
      r = executeTool(step, replaceParams(step.value));
    } else if (step.action === 'evaluate' && step.script) {
      // Wrap as IIFE if script is a function expression (not already self-invoking)
      let script = replaceParams(step.script);
      if (script.match(/^\s*(\(?\s*\)?\s*=>|function\s*\()/) && !script.match(/\)\s*\(\s*\)\s*$/)) {
        script = `(${script})()`;
      }
      r = runAgentBrowser(['eval', script]);
    } else if (step.action === 'extract') {
      // extract: snapshot + filter links by urlMatch
      const snapR = runAgentBrowser(['snapshot', '-i']);
      if (snapR.stdout) {
        const lines = snapR.stdout.split('\n');
        const limit = step.limit || 5;
        const matched = [];
        for (const line of lines) {
          if (step.role && !line.includes(step.role)) continue;
          if (step.urlMatch && !line.includes(step.urlMatch)) continue;
          matched.push(line.trim());
          if (matched.length >= limit) break;
        }
        r = { stdout: matched.join('\n') + '\n', stderr: '', status: 0 };
      } else {
        r = snapR;
      }
    } else {
      console.error(`  Unknown step action: ${step.action}`);
      continue;
    }

    if (r) {
      if (r.stdout) process.stdout.write(r.stdout);
      if (r.status !== 0) {
        console.error(`  ✗ Step failed (status ${r.status})`);
        if (r.stderr) console.error(`  ${r.stderr.trim()}`);
        return r.status;
      }
      console.error('  ✓');
    }
  }

  if (fn.assert) {
    return runAssertChecks(fn.assert, fn.name || funcName);
  }

  return 0;
}

// ============================================================
// Record a single command execution
// ============================================================

function recordCommand(cmdArgs, result, snapshotRefs) {
  const [cmd, ...args] = cmdArgs;
  const entry = { cmd, args: [...args] };

  // Resolve @refs to stable role+label selectors
  if (['click', 'fill', 'type', 'dblclick', 'hover', 'focus'].includes(cmd)) {
    const rawSel = args[0];
    entry.selector = resolveRef(rawSel, snapshotRefs);
    if (rawSel !== entry.selector) entry.ref = rawSel;
    if (['fill', 'type'].includes(cmd)) {
      entry.value = args[1] || '';
    }
  } else if (['open', 'goto', 'navigate'].includes(cmd)) {
    entry.url = args[0];
  } else if (cmd === 'press' || cmd === 'key') {
    entry.key = args[0];
  } else if (cmd === 'screenshot') {
    entry.path = args[0] || '';
  } else if (cmd === 'wait') {
    entry.wait = args[0] || '';
  }

  // Capture page URL for path context
  if (!['close', 'quit', 'exit'].includes(cmd)) {
    entry.pageUrl = getCurrentUrl();
  }

  entry.success = !result.error && (result.status === 0);
  if (!entry.success && (result.stderr || result.error)) {
    entry.error = result.stderr?.trim() || result.error?.message || '';
  }

  appendLog(entry);
}

// ============================================================
// Convert log → chrome-mcp recipe JSON
// ============================================================

/**
 * Resolve a raw @eN selector using a snapshot refs map.
 * Only converts if selector is exactly "@eN" (unresolved raw ref).
 * Already-resolved selectors (e.g. 'button "검색"') are left unchanged.
 */
function resolveRefForConvert(selector, refs) {
  if (!selector || !selector.match(/^@e\d+$/)) return selector;
  const elem = refs[selector];
  if (elem) return `${elem.role} "${elem.label}"`;
  return selector; // not found — keep raw ref
}

/**
 * Convert a recorded .jsonl log file to chrome-mcp recipe format.
 *
 * chrome-mcp format:
 * {
 *   "hostname": "www.google.com",
 *   "functions": [{
 *     name, description, params, steps: [{ action, ... }]
 *   }]
 * }
 *
 * @param {string} logFile      Path to the .jsonl recording
 * @param {string} hostname     Override hostname (derived from URL if omitted)
 * @param {string} functionName Function name in recipe (default: "task")
 * @param {string} refsPath     Path to .snapshot-refs.json for @ref post-processing
 *                              (default: sessions/.snapshot-refs.json)
 */
function convertLogToRecipe(logFile, hostname, functionName, refsPath) {
  const raw = fs.readFileSync(logFile, 'utf-8').trim();
  if (!raw) throw new Error('Log file is empty');

  // Load snapshot refs for @eN post-processing
  let snapshotRefs = {};
  const defaultRefsPath = path.join(SESSIONS_DIR, '.snapshot-refs.json');
  const resolvedRefsPath = refsPath || defaultRefsPath;
  if (fs.existsSync(resolvedRefsPath)) {
    try {
      snapshotRefs = JSON.parse(fs.readFileSync(resolvedRefsPath, 'utf-8'));
      const refCount = Object.keys(snapshotRefs).length;
      if (refCount > 0) {
        process.stderr.write(`[convert] Loaded ${refCount} snapshot refs from ${resolvedRefsPath}\n`);
      }
    } catch {
      process.stderr.write(`[convert] Warning: could not parse refs file: ${resolvedRefsPath}\n`);
    }
  }

  const entries = raw
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((e) => e.success !== false); // skip failed entries

  const steps = [];

  let firstUrl = null;
  let hasQueryParam = false;

  for (const entry of entries) {
    const { cmd, url, selector, value, key, pageUrl, wait } = entry;

    if (['open', 'goto', 'navigate'].includes(cmd)) {
      if (!firstUrl) firstUrl = url || entry.args?.[0];
      steps.push({ action: 'navigate', url: url || entry.args?.[0] });

    } else if (cmd === 'snapshot') {
      steps.push({ action: 'snapshot' });

    } else if (cmd === 'click' && selector) {
      // Post-process unresolved @eN refs using snapshot refs
      const resolvedSel = resolveRefForConvert(selector, snapshotRefs);
      if (resolvedSel !== selector) {
        process.stderr.write(`[convert] Resolved ${selector} → ${resolvedSel}\n`);
      }
      steps.push({ action: 'click', selector: resolvedSel, path: safePathname(pageUrl) });

    } else if (['fill', 'type'].includes(cmd) && selector) {
      // Post-process unresolved @eN refs using snapshot refs
      const resolvedSel = resolveRefForConvert(selector, snapshotRefs);
      if (resolvedSel !== selector) {
        process.stderr.write(`[convert] Resolved ${selector} → ${resolvedSel}\n`);
      }
      // Treat value as a {query} parameter placeholder if it looks user-supplied
      const stepValue = value && value.trim() ? '{query}' : '';
      if (stepValue === '{query}') hasQueryParam = true;
      steps.push({ action: 'fill', selector: resolvedSel, value: stepValue || value, path: safePathname(pageUrl) });

    } else if (['press', 'key'].includes(cmd) && key) {
      steps.push({ action: 'press', key });

    } else if (cmd === 'wait') {
      steps.push({ action: 'wait', ...(wait && !isNaN(+wait) ? { ms: +wait } : {}) });

    } else if (cmd === 'screenshot') {
      steps.push({ action: 'screenshot', ...(entry.path ? { path: entry.path } : {}) });
    }
  }

  // Ensure last step is a wait
  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    if (last.action !== 'wait') {
      steps.push({ action: 'wait' });
    }
  }

  // Derive hostname from first URL if not provided
  if (!hostname && firstUrl) {
    try {
      hostname = new URL(firstUrl).hostname;
    } catch {
      hostname = 'example.com';
    }
  }

  return {
    hostname: hostname || 'example.com',
    functions: [
      {
        name: functionName || 'task',
        description: `Auto-generated from agent-browser recording (${new Date().toISOString().slice(0, 10)})`,
        params: hasQueryParam ? ['query'] : [],
        steps,
      },
    ],
  };
}

function safePathname(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return '/';
  }
}

// ============================================================
// CLI Command Dispatch
// ============================================================

const [, , command, ...restArgs] = process.argv;

if (!command || command === '--help' || command === '-h') {
  console.log(`
Agent Browser Skill - Chrome Recipe Factory
Version: 0.1.0

Usage: node agent-browser.js <command> [args...]

Commands:
  install                    Install Chromium (first-time setup)
  run <args...>              Pass-through to agent-browser CLI
  record start [name]        Start a recording session
  record stop [output.jsonl] Stop recording and save log
  record <cmd> [args...]     Run command and record it to session
  convert <log.jsonl>        Convert log to chrome-mcp recipe JSON
    --hostname=<host>          Override hostname (default: from URL)
    --name=<funcname>          Function name in recipe (default: task)
    --refs=<path>              Snapshot refs JSON for @eN post-processing
                               (default: sessions/.snapshot-refs.json)
  tools list [hostname]      List registered tools (local + chrome-mcp)
  tools use <name> [value]   Execute a function (self-contained, no chrome-mcp)
  tools save <host> <json>   Save tools for a hostname
  tools import [hostname]    Import tools from chrome-mcp/tools/
  execute <recipe.json> <fn> [params...]
                             Execute a recipe function (self-contained engine)
  test-google                Quick test: Google search for 'hello world'

Examples:
  # First-time setup
  node agent-browser.js install

  # Direct use (no recording)
  node agent-browser.js run open https://google.com
  node agent-browser.js run --browser firefox open https://google.com
  node agent-browser.js run --browser webkit snapshot -i
  node agent-browser.js run snapshot
  node agent-browser.js run find role textbox fill "hello world"
  node agent-browser.js run press Enter

  # Record a session and convert to chrome-mcp recipe
  node agent-browser.js record start "google-search"
  node agent-browser.js record open https://www.google.com
  node agent-browser.js record snapshot
  node agent-browser.js record fill "@e3" "hello world"
  node agent-browser.js record press "Enter"
  node agent-browser.js record wait 2000
  node agent-browser.js record stop sessions/google-search.jsonl
  node agent-browser.js convert sessions/google-search.jsonl \\
    --hostname www.google.com --name search

  # Quick test
  node agent-browser.js test-google
`);
  process.exit(0);
}

// ── install ─────────────────────────────────────────────────

if (command === 'install') {
  console.log('Installing Chromium for agent-browser...');
  const r = runAgentBrowser(['install']);
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  process.exit(r.status ?? 0);
}

// ── run ─────────────────────────────────────────────────────

if (command === 'run') {
  const r = runAgentBrowser(restArgs);
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  process.exit(r.status ?? 0);
}

// ── record ──────────────────────────────────────────────────

if (command === 'record') {
  const subcmd = restArgs[0];

  if (subcmd === 'start') {
    const name = restArgs[1] || `session-${Date.now()}`;
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
    if (fs.existsSync(SNAPSHOT_CACHE)) fs.unlinkSync(SNAPSHOT_CACHE);
    saveSession({ name, recording: true, startedAt: new Date().toISOString() });
    console.log(`Recording started: ${name}`);
    console.log(`Log: ${LOG_FILE}`);
    process.exit(0);
  }

  if (subcmd === 'stop') {
    const outputFile = restArgs[1] || path.join(SESSIONS_DIR, `recorded-${Date.now()}.jsonl`);
    const session = loadSession();
    if (!session || !session.recording) {
      console.error('No active recording session. Run: node agent-browser.js record start');
      process.exit(1);
    }
    if (fs.existsSync(LOG_FILE)) {
      fs.copyFileSync(LOG_FILE, outputFile);
      const count = fs.readFileSync(outputFile, 'utf-8').trim().split('\n').filter(Boolean).length;
      console.log(`Recording saved: ${outputFile} (${count} entries)`);
      console.log(`\nNext step: node agent-browser.js convert ${outputFile} --hostname <host> --name <func>`);
    } else {
      console.log('No actions were recorded.');
    }
    saveSession({ ...session, recording: false, endedAt: new Date().toISOString() });
    process.exit(0);
  }

  // record <cmd> [args...] — execute + log
  const cmdArgs = restArgs; // subcmd = agent-browser command
  let snapshotRefs = loadSnapshotRefs();

  // Auto-snapshot before first interaction if no refs are cached yet.
  // This ensures @eN refs are resolved against the *current* page,
  // not a stale snapshot from a previous session.
  const INTERACTION_CMDS = ['click', 'fill', 'type', 'dblclick', 'hover', 'focus', 'press', 'key'];
  if (INTERACTION_CMDS.includes(cmdArgs[0]) && Object.keys(snapshotRefs).length === 0) {
    process.stderr.write('[record] No snapshot refs cached — auto-snapshotting current page...\n');
    const snapResult = runAgentBrowser(['snapshot', '-i']);
    if (snapResult.status === 0) {
      const freshRefs = parseSnapshotRefs(snapResult.stdout);
      if (Object.keys(freshRefs).length > 0) {
        saveSnapshotRefs(freshRefs);
        snapshotRefs = freshRefs;
        process.stderr.write(`[record] Auto-snapshot cached ${Object.keys(freshRefs).length} refs\n`);
      }
    } else {
      process.stderr.write('[record] Warning: auto-snapshot failed, @eN refs may not resolve correctly\n');
    }
  }

  const r = runAgentBrowser(cmdArgs);
  process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);

  // If snapshot, refresh the ref cache
  if (cmdArgs[0] === 'snapshot') {
    const refs = parseSnapshotRefs(r.stdout);
    if (Object.keys(refs).length > 0) {
      saveSnapshotRefs(refs);
      snapshotRefs = refs;
      console.error(`[record] Cached ${Object.keys(refs).length} refs`);
    }
  }

  if (isRecording()) {
    recordCommand(cmdArgs, r, snapshotRefs);
  } else {
    console.error('[record] Warning: no active session. Run: node agent-browser.js record start');
  }

  process.exit(r.status ?? 0);
}

// ── convert ─────────────────────────────────────────────────

if (command === 'convert') {
  const logFile = restArgs[0];
  if (!logFile) {
    console.error('Usage: node agent-browser.js convert <log.jsonl> [--hostname=xxx] [--name=xxx]');
    process.exit(1);
  }

  const hostnameArg = restArgs.find((a) => a.startsWith('--hostname='));
  const nameArg = restArgs.find((a) => a.startsWith('--name='));
  const refsArg = restArgs.find((a) => a.startsWith('--refs='));
  const hostname = hostnameArg ? hostnameArg.split('=')[1] : null;
  const funcName = nameArg ? nameArg.split('=')[1] : 'task';
  const refsPath = refsArg ? refsArg.split('=').slice(1).join('=') : null;

  try {
    const recipe = convertLogToRecipe(logFile, hostname, funcName, refsPath);
    console.log(JSON.stringify(recipe, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Conversion failed:', err.message);
    process.exit(1);
  }
}

// ── tools ────────────────────────────────────────────────────

if (command === 'tools') {
  const subcmd = restArgs[0];

  if (!subcmd || subcmd === '--help') {
    console.log(`
Usage: node agent-browser.js tools <subcommand>

Subcommands:
  list [hostname]              List registered tools
  use <name> [value]           Execute a function (self-contained, no chrome-mcp)
  guide <name>                 Show guide for a tool/function in current hostname
  save <hostname> <json>       Save tools for a hostname
  import [hostname]            Import tools from chrome-mcp/tools/
`);
    process.exit(0);
  }

  if (subcmd === 'list') {
    ensureToolsDir();
    const hostname = restArgs[1];
    if (hostname) {
      const { functions, source } = loadToolsForHostname(hostname);
      if (functions.length === 0) {
        console.log(`No tools found for ${hostname}`);
      } else {
        const srcLabel = source ? path.basename(path.dirname(source)) : '';
        console.log(`[Tool Registry] ${hostname} — ${functions.length} function(s) (${srcLabel}):`);
        functions.forEach((t, i) => {
          const guideMark = hasGuide(t) ? ' 📖' : '';
          const firstStep = Array.isArray(t.steps) && t.steps.length > 0 ? t.steps[0] : null;
          const target = firstStep ? (firstStep.selector || firstStep.action || 'step') : 'function';
          const route = t.path || firstStep?.path || '/';
          console.log(`  ${i + 1}. ${t.name} → ${target} [${route}]${guideMark}`);
        });
      }
    } else {
      const domains = listAllToolDomains();
      if (domains.size === 0) {
        console.log('No tools registered.');
      } else {
        console.log(`[Tool Registry] ${domains.size} domain(s):`);
        for (const [h, info] of [...domains].sort((a, b) => a[0].localeCompare(b[0]))) {
          console.log(`  - ${h} (${info.count} tools, ${info.source})`);
        }
      }
    }
    process.exit(0);
  }

  if (subcmd === 'use') {
    const toolName = restArgs[1];
    const params = restArgs.slice(2);
    const value = params.join(' ') || undefined;
    if (!toolName) {
      console.error('Usage: node agent-browser.js tools use <name> [value]');
      process.exit(1);
    }
    const hostname = getCurrentHostname();
    if (!hostname) {
      console.error('No page open. Run: node agent-browser.js run open <url>');
      process.exit(1);
    }
    const { functions, recipe } = loadToolsForHostname(hostname);
    const fn = functions.find(f => f.name === toolName);
    if (fn && recipe) {
      console.error(`Executing function: ${toolName}(${params.join(', ')})`);
      const status = executeRecipeFunction(recipe, toolName, params);
      process.exit(status);
    }

    if (!fn) {
      console.error(`Tool "${toolName}" not found for ${hostname}`);
      const available = functions.map(f => f.name);
      if (available.length > 0) console.error(`Available: ${available.join(', ')}`);
      process.exit(1);
    }
  }

  if (subcmd === 'guide') {
    const name = restArgs[1];
    if (!name) {
      console.error('Usage: node agent-browser.js tools guide <name>');
      process.exit(1);
    }
    const hostname = getCurrentHostname();
    if (!hostname) {
      console.error('No page open. Run: node agent-browser.js run open <url>');
      process.exit(1);
    }
    const { functions } = loadToolsForHostname(hostname);
    const matches = functions.filter(f => f.name === name);
    if (matches.length === 0) {
      console.error(`Guide target "${name}" not found for ${hostname}`);
      const available = functions.map(f => f.name);
      if (available.length > 0) console.error(`Available: ${available.join(', ')}`);
      process.exit(1);
    }
    const status = printGuidesForItems(hostname, name, matches);
    process.exit(status);
  }

  if (subcmd === 'save') {
    ensureToolsDir();
    const hostname = restArgs[1];
    const jsonStr = restArgs[2];
    if (!hostname || !jsonStr) {
      console.error('Usage: node agent-browser.js tools save <hostname> \'<json>\'');
      process.exit(1);
    }
    try {
      const tools = JSON.parse(jsonStr);
      const file = path.join(TOOLS_DIR, `${hostname}.json`);
      fs.writeFileSync(file, JSON.stringify(tools, null, 2));
      const count = Array.isArray(tools) ? tools.length : (tools.functions || []).length;
      console.log(`Saved ${count} tools to ${file}`);
    } catch (err) {
      console.error(`Invalid JSON: ${err.message}`);
      process.exit(1);
    }
    process.exit(0);
  }

  if (subcmd === 'import') {
    ensureToolsDir();
    const hostname = restArgs[1];
    if (hostname) {
      const srcFile = path.join(CHROME_MCP_TOOLS_DIR, `${hostname}.json`);
      if (!fs.existsSync(srcFile)) {
        console.error(`No chrome-mcp tools found for ${hostname}`);
        process.exit(1);
      }
      const destFile = path.join(TOOLS_DIR, `${hostname}.json`);
      fs.copyFileSync(srcFile, destFile);
      console.log(`Imported: ${srcFile} → ${destFile}`);
    } else {
      if (!fs.existsSync(CHROME_MCP_TOOLS_DIR)) {
        console.error('chrome-mcp tools directory not found');
        process.exit(1);
      }
      let count = 0;
      for (const file of fs.readdirSync(CHROME_MCP_TOOLS_DIR)) {
        if (!file.endsWith('.json') || file.startsWith('_')) continue;
        fs.copyFileSync(path.join(CHROME_MCP_TOOLS_DIR, file), path.join(TOOLS_DIR, file));
        count++;
      }
      console.log(`Imported ${count} tool file(s) from chrome-mcp`);
    }
    process.exit(0);
  }

  console.error(`Unknown tools subcommand: ${subcmd}`);
  console.error('Available: list, use, guide, save, import');
  process.exit(1);
}

// ── execute (self-contained engine) ──────────────────────────

if (command === 'execute') {
  const recipeFile = restArgs[0];
  const funcName = restArgs[1];
  const params = restArgs.slice(2);

  if (!recipeFile || !funcName) {
    console.error('Usage: node agent-browser.js execute <recipe.json> <function-name> [params...]');
    console.error('Example: node agent-browser.js execute sessions/search.json search "매일두유"');
    process.exit(1);
  }

  let recipe;
  try {
    recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf-8'));
  } catch (err) {
    console.error(`Failed to read recipe: ${err.message}`);
    process.exit(1);
  }

  const status = executeRecipeFunction(recipe, funcName, params);
  process.exit(status);
}

// ── test-google ─────────────────────────────────────────────

if (command === 'test-google') {
  console.log('=== Test: Google search for "hello world" ===\n');

  let allOk = true;

  // Step 1: Open Google
  process.stdout.write('[Open Google] ');
  let r = runAgentBrowser(['open', 'https://www.google.com']);
  if (r.status !== 0) { console.log('FAILED\n' + r.stderr); process.exit(1); }
  console.log('OK' + (r.stdout.trim() ? ` — ${r.stdout.trim().split('\n')[0]}` : ''));

  // Step 2: Snapshot
  process.stdout.write('[Snapshot] ');
  r = runAgentBrowser(['snapshot', '-i']);
  const snapshotText = r.stdout;
  const lines = snapshotText.trim().split('\n');
  console.log(`OK (${lines.length} lines)`);
  console.log(snapshotText.slice(0, 500) + (snapshotText.length > 500 ? '\n  ...(truncated)' : ''));

  // Step 3: Find search box ref from snapshot
  const refs = parseSnapshotRefs(snapshotText);
  const searchRef = Object.entries(refs).find(
    ([, v]) => ['combobox', 'textbox', 'searchbox'].includes(v.role)
  );

  let fillArgs;
  if (searchRef) {
    process.stdout.write(`[Fill search box via ref ${searchRef[0]} (${searchRef[1].role} "${searchRef[1].label}")] `);
    fillArgs = ['fill', searchRef[0], 'hello world'];
  } else {
    // Fallback: type directly into focused element using keyboard
    process.stdout.write('[Fill search box via keyboard] ');
    fillArgs = ['keyboard', 'type', 'hello world'];
  }

  r = runAgentBrowser(fillArgs);
  if (r.status !== 0) {
    console.log('FAILED\n' + r.stderr);
    allOk = false;
  } else {
    console.log('OK');
  }

  if (allOk) {
    // Step 4: Press Enter
    process.stdout.write('[Press Enter] ');
    r = runAgentBrowser(['press', 'Enter']);
    if (r.status !== 0) { console.log('FAILED\n' + r.stderr); allOk = false; }
    else console.log('OK');
  }

  if (allOk) {
    // Step 5: Wait
    process.stdout.write('[Wait 2s] ');
    r = runAgentBrowser(['wait', '2000']);
    console.log(r.status === 0 ? 'OK' : 'FAILED (non-fatal)');
  }

  if (allOk) {
    // Step 6: Screenshot
    const screenshotPath = path.join(SKILL_DIR, 'test-result.png');
    process.stdout.write('[Screenshot] ');
    r = runAgentBrowser(['screenshot', screenshotPath]);
    console.log(r.status === 0 ? `OK — ${screenshotPath}` : 'FAILED (non-fatal)');
  }

  if (allOk) {
    console.log('\nTest PASSED. Screenshot: ' + path.join(SKILL_DIR, 'test-result.png'));
  } else {
    console.log('\nTest FAILED. Make sure agent-browser is installed:');
    console.log('  node agent-browser.js install');
  }

  process.exit(allOk ? 0 : 1);
}

// ── fallback: pass-through ───────────────────────────────────

const r = runAgentBrowser([command, ...restArgs]);
process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status ?? 0);
