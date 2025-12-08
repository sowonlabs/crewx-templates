---
name: gmail
description: Gmail integration for reading, searching, and sending emails. Activate when user asks about emails, inbox, or email-related tasks.
version: 0.1.0
---

# Gmail Integration Skill

You are an expert on Gmail integration through the Gmail API. You can help users read, search, and send emails from their Gmail account.

## When to Use This Skill

Activate when the user asks about:
- "이메일 확인해줘" / "Check my emails"
- "메일 보내줘" / "Send an email"
- "이메일 검색해줘" / "Search emails"
- Reading email content
- Listing inbox messages
- Sending emails with attachments
- Email management tasks

## Setup Requirements

This skill requires:
1. **Google Cloud Project** with Gmail API enabled
2. **OAuth credentials** (Web application type)
3. **Refresh token** obtained via setup-auth.js
4. **Environment variables** in `.env` (in the skill directory)

### Initial Setup

```bash
# 1. Install the skill template
crewx template init gmail-skill

# 2. Navigate to the skill directory
cd gmail-skill

# 3. Install dependencies
npm install

# 4. Run authentication setup with your credentials.json
node setup-auth.js --credentials /path/to/credentials.json

# 5. Follow the browser authorization flow
# Credentials are automatically saved to .env

# 6. Test the setup
node list-messages.js 5
```

> **Note**: The skill can be installed anywhere. All commands below assume you are in the skill directory.

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Gmail API**: APIs & Services > Library > Gmail API
4. Create OAuth credentials:
   - APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Application type: **Web application**
   - Add redirect URI: `http://localhost:4100/code`
   - Download the JSON file as `credentials.json`

## Available Commands

All commands should be run from within the skill directory:

### 1. List Messages
Shows recent emails from inbox:
```bash
node list-messages.js [count]
# or
npm run list

# Examples:
node list-messages.js           # List 10 recent emails
node list-messages.js 20        # List 20 recent emails
```

### 2. Read Message
Read full content of a specific email:
```bash
node read-message.js <message-id>
# or
npm run read -- <message-id>

# Example:
node read-message.js 18c8f4a2b3d4e5f6
```

### 3. Send Message
Send a new email:
```bash
node send-message.js <to> <subject> <body> [cc] [bcc]
# or
npm run send -- <to> <subject> <body>

# Examples:
node send-message.js "user@example.com" "Meeting Tomorrow" "Let's meet at 3pm."
node send-message.js "user@example.com" "Hello" "Message body" "cc@example.com"

# JSON mode (from stdin):
echo '{"to":"a@b.com","subject":"Hi","body":"Hello"}' | node send-message.js --json
```

### 4. Search Messages
Search emails with Gmail query syntax:
```bash
node search-messages.js <query> [maxResults]
# or
npm run search -- <query>

# Examples:
node search-messages.js "is:unread"
node search-messages.js "from:boss@company.com subject:urgent"
node search-messages.js "has:attachment after:2025/01/01" 20
```

## Environment Configuration

The skill loads credentials from `.env` in the skill directory:
```bash
GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
```

## Core Capabilities

### 1. List Messages (`list-messages.js`)
- ✅ Fetch recent emails from inbox
- ✅ Display sender, subject, date, snippet
- ✅ Unread/Important indicators
- ✅ Configurable result count

### 2. Read Message (`read-message.js`)
- ✅ Retrieve full email content
- ✅ Parse HTML and plain text bodies
- ✅ Show attachments list
- ✅ Display headers (From, To, CC, Subject, Date)
- ✅ Auto-mark as read

### 3. Send Message (`send-message.js`)
- ✅ Compose and send new emails
- ✅ UTF-8 subject support (Korean, etc.)
- ✅ HTML body support
- ✅ CC/BCC support
- ✅ JSON mode for stdin input

### 4. Search Messages (`search-messages.js`)
- ✅ Full Gmail search query support
- ✅ Filter by sender, date, labels
- ✅ Search in subject/body
- ✅ Attachment filtering

## Gmail Search Query Syntax

Common search operators:
- `from:sender@email.com` - From specific sender
- `to:recipient@email.com` - To specific recipient
- `subject:keyword` - Subject contains keyword
- `is:unread` - Unread emails only
- `is:starred` - Starred emails
- `has:attachment` - Has attachments
- `after:2025/01/01` - After date
- `before:2025/12/31` - Before date
- `label:important` - Has specific label

## Usage Examples

All examples assume you are in the skill directory (where SKILL.md is located).

### Example 1: Check Inbox (이메일 확인)
```bash
node list-messages.js

# Output:
# 📬 Fetching 10 most recent emails...
# ✅ Found 10 emails:
# ──────────────────────────────────────────
# 📮 [UNREAD]⭐ Weekly Report
#    From: John Doe <john@example.com>
#    Date: 2025. 12. 4. 오전 10:30:00
#    ID: 18c8f4a2b3d4e5f6
#    Preview: Here's the weekly report...
```

### Example 2: Search Emails (이메일 검색)
```bash
node search-messages.js "subject:회의 is:unread"

# Output:
# 🔍 Searching for: "subject:회의 is:unread"
# ✅ Found 3 emails:
# ...
```

### Example 3: Read Specific Email (이메일 읽기)
```bash
node read-message.js 18c8f4a2b3d4e5f6

# Output:
# ════════════════════════════════════════════════════════════════════
# 📧 Subject: Weekly Report
# ──────────────────────────────────────────────────────────────────
# From: John Doe <john@example.com>
# To: me@example.com
# Date: 2025. 12. 4. 오전 10:30:00
# ════════════════════════════════════════════════════════════════════
# 📝 Content:
# Here's the weekly report as requested...
```

### Example 4: Send Email (이메일 보내기)
```bash
node send-message.js "colleague@company.com" "Meeting Update" "The meeting has been rescheduled to 4pm."

# Output:
# ✅ Email sent successfully!
# ════════════════════════════════════════════════════════════════════
# 📧 To: colleague@company.com
# 📝 Subject: Meeting Update
# 🆔 Message ID: 18c8f4a2b3d4e5f7
```

### Example 5: Find Unread Emails (안 읽은 메일)
```bash
node search-messages.js "is:unread" 20
```

## Troubleshooting

### "Missing Gmail credentials"
1. Run `npm install` in the skill directory
2. Run `node setup-auth.js --credentials /path/to/credentials.json`
3. Verify `.env` file has all three variables set

### "invalid_grant" Error
Refresh token has been revoked or expired:
1. Go to https://myaccount.google.com/connections
2. Remove this app from connected apps
3. Re-run `node setup-auth.js --credentials credentials.json`

### "Invalid Credentials"
- Check OAuth credentials are for "Web application" type
- Verify redirect URI is `http://localhost:4100/code`
- Verify Gmail API is enabled in Google Cloud Console

### "Insufficient Permission"
Required scopes are automatically requested:
- `gmail.readonly` - Read emails
- `gmail.send` - Send emails
- `gmail.compose` - Compose emails
- `gmail.modify` - Modify labels

## Response Format

When helping users with Gmail tasks:

1. **Run appropriate command**: Use the right script for the task
2. **Parse results**: Format output in readable manner
3. **Handle errors**: Provide clear troubleshooting steps
4. **Suggest next steps**: What user might want to do next

---

**Remember**: Always run commands from the skill directory. Credentials are loaded from the local `.env` file. Handle errors gracefully and provide user-friendly output.
