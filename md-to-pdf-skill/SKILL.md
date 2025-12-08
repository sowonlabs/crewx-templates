---
name: md-to-pdf-skill
description: Convert Markdown files to PDF. Supports Korean, table/code block styling, and batch conversion.
---

# Markdown to PDF Skill

Converts Markdown files to PDF documents.

## Installation (Independent Module)

This skill is installed as an **independent module**. It does not affect the parent project's dependencies.

```bash
# Navigate to skill directory
cd skills/md-to-pdf-skill

# Install dependencies (node_modules created only in this folder)
npm install

# Verify installation
node convert.js --help
```

### Note

On first run, Chromium will be downloaded (uses Puppeteer). This may take some time.

---

## Usage

```bash
# Single file conversion
node skills/md-to-pdf-skill/convert.js reports/tax_claude_result.md

# Specify output file
node skills/md-to-pdf-skill/convert.js input.md output.pdf

# Convert all .md files in folder
node skills/md-to-pdf-skill/convert.js reports/
```

## Output

- Created in same location as input file with `.pdf` extension
- Example: `report.md` → `report.pdf`
