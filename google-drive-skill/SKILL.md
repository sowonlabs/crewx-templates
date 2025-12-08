---
name: google-drive
description: Google Drive integration - list, search, download files
version: 0.1.0
author: CrewX
tags:
  - google
  - drive
  - files
  - storage
---

# Google Drive Skill

Google Drive API integration for CrewX. Provides file listing, searching, and downloading.

## When to Use This Skill

Activate when the user asks about:
- "드라이브 파일 보여줘" / "List Drive files"
- "파일 업로드해줘" / "Upload file"
- "드라이브 검색해줘" / "Search Drive"
- Reading file content from Drive
- Listing files in a folder
- Managing Drive files

## Setup Requirements

This skill requires:
1. **Google Cloud Project** with Google Drive API enabled
2. **OAuth credentials** (Web application type)
3. **Refresh token** obtained via setup-auth.js
4. **Environment variables** in `skills/google-drive/.env`

### Initial Setup

```bash
# 1. Install dependencies (skill directory is self-contained)
cd skills/google-drive
npm install

# 2. Run authentication setup with your credentials.json
node setup-auth.js --credentials /path/to/credentials.json

# 3. Follow the browser authorization flow
# Credentials are automatically saved to .env

# 4. Test the setup
node list-files.js 5
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Google Drive API**: APIs & Services > Library > Google Drive API
4. Create OAuth credentials:
   - APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Application type: **Web application**
   - Add redirect URI: `http://localhost:4100/code`
   - Download the JSON file as `credentials.json`

## Available Commands

All commands run from within the `skills/google-drive` directory:

### 1. List Files
Shows recent files from Drive:
```bash
node list-files.js [count]
# or
npm run list

# Examples:
node list-files.js           # List 10 recent files
node list-files.js 20        # List 20 recent files
```

### 2. Search Files
Search files by keyword (searches in name and content):
```bash
node search-files.js <keyword> [options]
# or
npm run search -- <keyword>

# Options:
#   --limit <n>     Number of results (default: 20)
#   --type <type>   Filter by type: folder, document, spreadsheet, presentation, pdf, image

# Examples:
node search-files.js "프로젝트"                    # Search by keyword
node search-files.js "회의록" --type document      # Only Google Docs
node search-files.js "예산" --type spreadsheet     # Only Spreadsheets
node search-files.js "발표" --limit 5              # Limit to 5 results
```

### 3. Upload File
Upload a local file to Drive:
```bash
node upload-file.js <local-path> [folder-id]
# or
npm run upload -- <local-path>

# Examples:
node upload-file.js "./report.pdf"
node upload-file.js "./image.png" "1A2B3C4D5E6F"
```

### 4. Read File Metadata/Content
Read file metadata, download, or export Google Docs content:
```bash
node read-file.js <file-id> [options]
# or
npm run read -- <file-id>

# Options:
#   --download <path>   Download/export file to local path
#   --export <mime>     Export format (text/plain, application/pdf, etc.)

# Examples:
node read-file.js 1A2B3C4D5E6F                              # Show metadata only

# Google Docs → text/plain by default
node read-file.js 1A2B3C4D5E6F --download ./meeting-notes.txt   # ✅ Correct: .txt for text
node read-file.js 1A2B3C4D5E6F --download ./doc.pdf --export application/pdf  # Export Doc as PDF

# Google Slides → PDF by default
node read-file.js 1A2B3C4D5E6F --download ./slide.pdf       # ✅ Correct: .pdf for PDF
node read-file.js 1A2B3C4D5E6F --download ./slide.txt --export text/plain  # Text only (no images)
```

**Default export formats:**
- Google Docs → `text/plain` (plain text, not markdown)
- Google Sheets → Excel (`.xlsx`)
- Google Slides → PDF

⚠️ **Important Notes:**
- **Download path extension does NOT determine format** - `--download file.md` won't create markdown
- **Use `--export` to specify format** - e.g., `--export application/pdf` for PDF
- **Google Docs can't export as markdown** - only text/plain, PDF, DOCX, etc.
- **Match extension to actual format** - if exporting PDF, use `.pdf` extension

💡 **For Obsidian/Markdown users:**
Google Docs를 마크다운으로 저장하려면:
1. `--download file.txt`로 텍스트 추출 (default)
2. 내용 확인 후 필요시 수동으로 `.md`로 변환
3. 또는 PDF로 받아서 Obsidian에서 PDF로 열기

## Environment Configuration

The skill loads credentials from `skills/google-drive/.env`:
```bash
DRIVE_CLIENT_ID=your_client_id.apps.googleusercontent.com
DRIVE_CLIENT_SECRET=your_client_secret
DRIVE_REFRESH_TOKEN=your_refresh_token
```

## Core Capabilities

### 1. List Files (`list-files.js`)
- ✅ Fetch recent files
- ✅ Display name, type, modified time
- ✅ Configurable result count

### 2. Search Files (`search-files.js`)
- ✅ Full Drive search query support
- ✅ Filter by name, type, date
- ✅ Search in specific folders

### 3. Upload File (`upload-file.js`)
- ✅ Upload local files
- ✅ Support for specific folder destination
- ✅ Auto-detect MIME type

### 4. Read File (`read-file.js`)
- ✅ Retrieve file metadata
- ✅ Export Google Docs/Sheets/Slides to text/pdf
- ✅ Download binary files (not implemented in CLI, but API supports it)

## How Search Works

`search-files.js`는 키워드를 받아서 **파일 이름**과 **내용** 모두에서 검색합니다.

내부적으로 다음 Drive API 쿼리를 생성합니다:
```
(name contains 'keyword' or fullText contains 'keyword') and trashed = false
```

**`--type` 옵션으로 필터링:**
| Type | Google Drive MIME Type |
|------|------------------------|
| `folder` | 폴더 |
| `document` | Google Docs |
| `spreadsheet` | Google Sheets |
| `presentation` | Google Slides |
| `pdf` | PDF 파일 |
| `image` | 이미지 파일 |

## Usage Examples

All examples assume you are in the `skills/google-drive` directory.

### Example 1: List Files (파일 목록)
```bash
node list-files.js

# Output:
# 📂 Fetching 10 most recent files...
# ✅ Found 10 files:
# ──────────────────────────────────────────
# 📄 Project Plan.docx (application/vnd.openxmlformats-officedocument.wordprocessingml.document)
#    ID: 1A2B3C...
#    Modified: 2025. 12. 4. 오전 10:30:00
```

### Example 2: Search Files (파일 검색)
```bash
node search-files.js "양상증"

# Output:
# Searching for "양상증"...
#
# Found 18 files:
# --------------------------------------------------------------------------------
# 📊 (가칭)양상증.com
#    ID: 1DUsqcGJlqWKtQOgAqPu3zO7YXFZyvLqer8mrAf9Hs-c
#    Size: 4.3 KB | Modified: 2025년 12월 4일 오전 10:41
#    Link: https://docs.google.com/spreadsheets/d/...
#
# 📽️ 양상증 프로젝트
#    ID: 1wgITIuoHgy3I62doEgu96bMZP0XpRsIVRAKYPhJol2k
#    ...
```

### Example 3: Upload File (파일 업로드)
```bash
node upload-file.js "./local-file.txt"

# Output:
# 📤 Uploading ./local-file.txt...
# ✅ File uploaded successfully!
#    ID: 1X2Y3Z...
#    Name: local-file.txt
```

### Example 4: Read Google Slides (슬라이드 읽기)
```bash
# 1. Export as text (텍스트로 추출)
node read-file.js 1wgITIuoHgy3I62doEgu96bMZP0XpRsIVRAKYPhJol2k \
  --download /tmp/slide.txt --export text/plain

# 2. Export as PDF (이미지 포함)
node read-file.js 1wgITIuoHgy3I62doEgu96bMZP0XpRsIVRAKYPhJol2k \
  --download /tmp/slide.pdf

# Output:
# ════════════════════════════════════════════════════════════════════
# 📽️ 양상증 프로젝트
# ──────────────────────────────────────────────────────────────────
# ID: 1wgITIuoHgy3I62doEgu96bMZP0XpRsIVRAKYPhJol2k
# Type: application/vnd.google-apps.presentation
# Size: 991.0 KB
# ════════════════════════════════════════════════════════════════════
#
# ⬇️  Downloading to /tmp/slide.pdf...
#    Exporting as application/pdf...
# ✅ Download complete!
```

## Troubleshooting

### "Missing Drive credentials"
1. Run `npm install` in skills/google-drive directory
2. Run `node setup-auth.js --credentials /path/to/credentials.json`
3. Verify `.env` file has all three variables set

### "invalid_grant" Error
Refresh token has been revoked or expired:
1. Go to https://myaccount.google.com/connections
2. Remove this app from connected apps
3. Re-run `node setup-auth.js --credentials credentials.json`

### "Insufficient Permission"
Required scopes are automatically requested:
- `https://www.googleapis.com/auth/drive`

## Response Format

When helping users with Drive tasks:

1. **Run appropriate command**: Use the right script for the task
2. **Parse results**: Format output in readable manner
3. **Handle errors**: Provide clear troubleshooting steps
4. **Suggest next steps**: What user might want to do next
