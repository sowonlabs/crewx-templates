---
name: md-to-pdf-skill
description: Convert Markdown files to PDF. Supports Korean, table/code block styling, and batch conversion.
---

# Markdown to PDF Skill

Converts Markdown files to PDF documents.

## Installation (Independent Module)

This skill is installed as an **independent module**. It does not affect the parent project's dependencies.

```bash
# 1. Install the skill template
crewx template init md-to-pdf-skill

# 2. Navigate to the skill directory
cd md-to-pdf-skill

# 3. Install dependencies (node_modules created only in this folder)
npm install

# 4. Verify installation
node convert.js --help
```

> **Note**: The skill can be installed anywhere. All commands below assume you are in the skill directory.

### Note

On first run, Chromium will be downloaded (uses Puppeteer). This may take some time.

---

## Usage

All commands should be run from within the skill directory:

```bash
# Single file conversion
node convert.js /path/to/report.md

# Specify output file
node convert.js /path/to/input.md /path/to/output.pdf

# Convert all .md files in folder
node convert.js /path/to/reports/
```

## Output

- Created in same location as input file with `.pdf` extension
- Example: `report.md` → `report.pdf`
