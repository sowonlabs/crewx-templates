---
name: slack-upload-skill
description: Upload files to Slack channels or threads. Supports auto-detection of channel/thread from environment.
---

# Slack File Upload Skill

Uploads files to Slack channels or specific threads.

## Installation (Independent Module)

This skill is installed as an **independent module**. It does not affect the parent project's dependencies.

```bash
# 1. Install the skill template
crewx template init slack-upload-skill

# 2. Navigate to the skill directory
cd slack-upload-skill

# 3. Install dependencies (pure Node.js - no additional packages)
npm install

# 4. Verify installation
node slack-upload.mjs --help
```

> **Note**: The skill can be installed anywhere. All commands below assume you are in the skill directory.

---

## When to Use

- When sending reports, PDFs, images, etc. to Slack
- When attaching results to a specific thread

## Usage

All commands should be run from within the skill directory:

```bash
# Using environment variables (recommended) - auto-detect channel/thread
node slack-upload.mjs <file_path> -m "message"

# Specify channel/thread directly
node slack-upload.mjs <channel_id> <file_path> -t <thread_ts> -m "message"
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--channel` | `-c` | Channel ID (default: `SLACK_CHANNEL_ID` env var) |
| `--thread_ts` | `-t` | Thread timestamp (default: `SLACK_THREAD_TS` env var) |
| `--message` | `-m` | Message to send with file |
| `--token` | | Slack bot token (default: `SLACK_BOT_TOKEN` env var) |

### Examples

```bash
# Auto-detect channel/thread from env vars (recommended in crewx slack mode)
node slack-upload.mjs /path/to/result.pdf -m "Here are the results"

# Specify channel/thread directly
node slack-upload.mjs C09U0MUREEQ /path/to/result.pdf -t 1732123456.123456
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SLACK_CHANNEL_ID` | Default channel ID |
| `SLACK_THREAD_TS` | Default thread timestamp |
| `SLACK_BOT_TOKEN` | Slack bot token |

## Required Slack App Permissions

- `files:write` - Upload files
- `chat:write` - Send messages to channels

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `missing_scope` | Missing files:write permission | Add scope in Slack app and reinstall |
| `channel_not_found` | Invalid channel ID | Verify correct channel ID |
| `not_in_channel` | Bot not in channel | Invite with `/invite @botname` |
