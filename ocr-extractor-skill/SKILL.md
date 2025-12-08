---
name: ocr-extractor-skill
description: OCR and markdown conversion skill using Gemini. Supports parallel processing and hash-based caching.
---

# OCR Extractor Skill

## Installation (Independent Module)

This skill is installed as an **independent module**. It does not affect the parent project's dependencies.

```bash
# Navigate to skill directory
cd skills/ocr-extractor-skill

# Install dependencies (pure Node.js - no additional packages)
npm install

# Verify installation
node extractor.js --help
```

### Prerequisites

**Gemini CLI** must be installed on your system:

```bash
# Verify Gemini CLI installation
which gemini
gemini --version

# If not installed
npm install -g @anthropic/gemini-cli
```

---

This skill leverages Gemini's excellent OCR capabilities to extract text from images and convert to markdown.

## Key Features

1. **Individual Image OCR**: Pass each image independently to Gemini for accurate OCR
2. **Parallel Processing**: Adjust concurrent processing count with `--concurrency` option (default: 2)
3. **Hash Cache**: Automatically skip already-processed files using SHA256 hash
4. **Markdown Output**: Save structured markdown to `working/` directory

## Why This Skill?

Gemini excels at individual image OCR, but when **analyzing multiple images at once**:
- Context becomes confused
- Difficult to get desired analysis results
- Content from different documents gets mixed

**Solution**: Process images individually → Organize as markdown → Analyze organized text

## Usage

### Basic Usage

```bash
# Directory OCR (parallel 2, default)
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./images

# Parallel 3 processing (faster, watch API limits)
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./images --concurrency 3

# Single image processing
node .claude/skills/ocr-extractor-skill/extractor.js ./image.jpg
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dir <path>` | Image directory | - |
| `--output <path>` | Result save location | `./working/[timestamp]` |
| `--concurrency <n>` | Concurrent processing count | `2` |
| `--prompt <text>` | Custom OCR prompt | (default prompt) |
| `--no-cache` | Ignore cache | `false` |
| `--clear-cache` | Clear cache | `false` |

### Output Structure

```
working/20251126120000/
├── INDEX.md           # Index and statistics
├── image1.md          # Image1 OCR result
├── image2.md          # Image2 OCR result
└── .ocr-cache.json    # Hash cache
```

## Agent Usage Guide

### Workflow (Recommended)

```bash
# Step 1: Image resizing (image-resizer-skill)
node .claude/skills/image-resizer-skill/resizer.js --dir ".crewx/slack-files/C09U0MUREEQ_123"

# Step 2: OCR extraction (automatically uses resized images)
node .claude/skills/ocr-extractor-skill/extractor.js --dir ".crewx/slack-files/C09U0MUREEQ_123" --concurrency 2

# Step 3: Analyze results
# Check working/[timestamp]/INDEX.md then analyze individual markdown files
```

### Parallel Processing Guide

| Situation | Recommended concurrency | Reason |
|-----------|------------------------|--------|
| Normal tasks | 2 | Stable, API limit headroom |
| Fast processing needed | 3 | Faster, watch API limits |
| API errors occurring | 1 | Sequential for stability |
| Large batch (50+) | 2-3 | Parallel saves time |

### Cache Usage

- **Default**: Automatically skip same files (hash-based)
- **Force reprocess**: Use `--no-cache` option
- **Clear cache**: Use `--clear-cache` option

```bash
# Already processed files automatically skipped
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./images
# Output: ⏭️  Cached (skipped): image1.jpg

# Force reprocess
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./images --no-cache
```

## Special Purpose Prompts

### For Tax Documents

```bash
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./tax-docs \
  --prompt "This is a tax-related document. Please extract the following accurately:
- Amounts (in currency units)
- Dates (YYYY-MM-DD format)
- Addresses
- Names/Business names
- Tax-related numbers (tax base, rates, amounts, etc.)"
```

### For Contracts

```bash
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./contracts \
  --prompt "This is a contract document. Please extract:
- Contracting parties
- Contract date, start date, end date
- Amount terms
- Key clauses"
```

### For Receipts

```bash
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./receipts \
  --prompt "This is a receipt. Please extract:
- Business name
- Date/Time
- Item amounts
- Total"
```

## Supported Image Formats

- JPG, JPEG, PNG, WebP, GIF, TIFF, BMP

## Dependencies

- **Gemini CLI**: Must be installed on system
- **Node.js**: 14.0 or higher

## Notes

1. **API Limits**: Watch Gemini API call limits. For large batches, `--concurrency 1-2` recommended
2. **Resize First**: For large images, resize with `image-resizer-skill` first
3. **Cache Location**: Cache is saved in output directory. Different output directories don't share cache

## Troubleshooting

### Gemini CLI Errors

```bash
# Verify gemini installation
which gemini
gemini --version
```

### Timeouts

- Try lowering `--concurrency 1`
- Check image sizes (may need resizing)

### Cache Issues

```bash
# Clear cache and retry
node .claude/skills/ocr-extractor-skill/extractor.js --dir ./images --clear-cache
```
