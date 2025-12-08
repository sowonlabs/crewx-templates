---
name: notion
description: Notion workspace integration - pages, databases, content management
version: 0.1.0
author: CrewX
tags:
  - notion
  - workspace
  - pages
  - databases
---

# Notion Workspace Integration

You are an expert on Notion workspace integration through the Notion API. You can help users interact with their Notion workspace, manage pages, query databases, and work with content.

## When to Use This Skill

Activate when the user asks about:
- "Notion 페이지 목록 보여줘" / "Show me Notion pages"
- "Notion에서 검색해줘" / "Search in Notion"
- Listing Notion pages or databases
- Reading Notion page content
- Creating or updating Notion pages
- Querying Notion databases
- Managing Notion workspace

## Setup Requirements

This skill requires:
1. **Notion Integration created** at https://www.notion.so/my-integrations
2. **API token** stored in `.env` file as `NOTION_INTEGRATION_SECRET`
3. **Notion pages shared** with the integration

### Initial Setup

```bash
# 1. Install the skill template
crewx template init notion-skill

# 2. Navigate to the skill directory
cd notion-skill

# 3. Install dependencies
npm install

# 4. Copy .env.example to .env and add your token
cp .env.example .env
# Edit .env and add your NOTION_INTEGRATION_SECRET

# 5. Test the setup
node get-notion-pages.js
```

> **Note**: The skill can be installed anywhere. All commands below assume you are in the skill directory.

## Available Commands

All commands should be run from within the skill directory:

### 1. List All Pages
Shows all pages in the Notion workspace:
```bash
node get-notion-pages.js
# or
npm run list
```

### 2. Read Page Content
Read detailed content of a specific page:
```bash
node read-page.js [page-id]

# Example:
node read-page.js 2a6956b8-98db-805b-b154-c6cabe5eac5a
```

### 3. Search Pages
Search for pages by keyword:
```bash
node search-pages.js [query]

# Example:
node search-pages.js "PRD"
node search-pages.js "회의록"
```

### 4. Create Page
Create a new page with content:
```bash
node create-page.js [parent-page-id] [title]

# Example:
node create-page.js 2a6956b8-98db-801f "New Document"
```

### 5. Add Content to Page
Append markdown content to existing page:
```bash
node add-content-to-page.js [page-id] [file-path]

# Example:
node add-content-to-page.js 2a7956b8-98db-8140 ./report.md
```

### 6. Database Operations
```bash
# Query database items
node query-database.js [database-id]

# Create database item
node create-database-item.js [database-id] "New Item"

# Inspect database schema
node inspect-database.js [database-id]
```

## Environment Configuration

The skill loads credentials from `.env` in the skill directory:
```bash
NOTION_INTEGRATION_SECRET=ntn_your_secret_here
```

## Core Capabilities

### 1. List Pages (`get-notion-pages.js`)
- ✅ Fetch all accessible pages from workspace
- ✅ Display page titles, IDs, URLs
- ✅ Show last edited timestamps
- ✅ Sort by last edited time

### 2. Read Page Content (`read-page.js`)
- ✅ Retrieve full page content
- ✅ Extract all block types (headings, paragraphs, lists, code, etc.)
- ✅ Parse structured data with proper formatting
- ✅ Support for: paragraphs, headings (1-3), bullets, numbered lists, todos, toggles, quotes, callouts, code blocks, dividers

### 3. Search Content (`search-pages.js`)
- ✅ Search across all pages by keyword
- ✅ Filter by page type
- ✅ Sort by last edited time
- ✅ Display matching results with metadata

### 4. Create Pages (`create-page.js`)
- ✅ Create new pages with custom titles
- ✅ Set parent page relationship
- ✅ Add initial content blocks
- ✅ Auto-timestamp creation

### 5. Database Operations
- ✅ Query databases (`query-database.js`)
- ✅ Create database entries (`create-database-item.js`)
- ✅ Inspect database schema (`inspect-database.js`)

## Usage Examples

All examples assume you are in the skill directory (where SKILL.md is located).

### List All Pages
```bash
node get-notion-pages.js

# Output:
# 🔍 Fetching pages from Notion workspace...
# ✅ Found 12 pages:
# 📄 Page 1:
#    Title: 컨셉 분석 및 경쟁력 확보 조사
#    ID: 2a6956b8-98db-...
```

### Search for Specific Pages
```bash
node search-pages.js "PRD"
node search-pages.js "회의록"
```

### Read Page Content
```bash
node read-page.js 2a6956b8-98db-805b-b154-c6cabe5eac5a
```

### Create New Page
```bash
node create-page.js 2a6956b8-98db-801f "Meeting Notes 2025-12-04"
```

### Query Database
```bash
node query-database.js 2a6956b8-98db-8040-929e-fa5954bc636c
```

## Helper Scripts

### 1. `get-notion-pages.js`
Lists all accessible pages in workspace:
- ✅ Loads credentials from `.env`
- ✅ Fetches all pages with search API
- ✅ Displays formatted page information (title, ID, URL, last edited)
- ✅ Sorted by last edited time (newest first)
- ✅ Optional JSON export (commented out by default)

### 2. `read-page.js`
Reads and displays full page content:
- ✅ Loads credentials from `.env`
- ✅ Retrieves page metadata and blocks
- ✅ Formats content with proper markdown styling
- ✅ Supports all common block types
- ✅ Default page: AllWrite PRD (if no ID provided)
- ✅ Handles nested content and indentation

### 3. `search-pages.js`
Searches for pages by keyword:
- ✅ Loads credentials from `.env`
- ✅ Full-text search across page titles and content
- ✅ Filters results to pages only (excludes databases)
- ✅ Displays matching results with metadata
- ✅ Sorted by relevance and last edited time

### 4. `create-page.js`
Creates new pages in workspace:
- ✅ Loads credentials from `.env`
- ✅ Creates page under specified parent
- ✅ Sets custom title
- ✅ Adds initial timestamp content block
- ✅ Returns page ID and URL
- ✅ Validates parent page access

## Troubleshooting

### "Unauthorized" Error
- Check `NOTION_INTEGRATION_SECRET` in `.env` file
- Verify token at https://www.notion.so/my-integrations
- Ensure integration is not revoked

### "No pages found"
- Share Notion pages with the integration
- Go to page settings → Add connections → Select integration
- Verify integration has proper permissions

### "Module not found"
Install required packages:
```bash
npm install
```

## Response Format

When helping users with Notion tasks:

1. **Check credentials**: Verify `.env` has `NOTION_INTEGRATION_SECRET`
2. **Use existing scripts**: Leverage `get-notion-pages.js` when possible
3. **Provide examples**: Show concrete code snippets
4. **Handle errors gracefully**: Give clear troubleshooting steps
5. **Format output nicely**: Use tables or structured lists

## Example Interactions

### Example 1: List Pages
**User**: "Notion 페이지 목록 보여줘"

**You respond**:
```bash
node get-notion-pages.js
```
Result: 총 12개 페이지 발견

### Example 2: Search Specific Pages
**User**: "PRD 관련 페이지 찾아줘"

**You respond**:
```bash
node search-pages.js "PRD"
```
Result: "AllWrite PRD" 페이지 발견

### Example 3: Read Page Content
**User**: "AllWrite PRD 내용 요약해줘"

**You respond**:
```bash
node read-page.js 2a6956b8-98db-805b-b154-c6cabe5eac5a
```
Then analyze and summarize the content.

### Example 4: Create New Page
**User**: "회의록 페이지 만들어줘"

**You respond**:
```bash
node create-page.js [parent-id] "Meeting Notes 2025-12-04"
```
Result: 새 페이지 생성 완료, URL 반환

---

**Remember**: Always run commands from the skill directory. The skill loads credentials from the local `.env` file.
