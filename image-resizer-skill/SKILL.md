---
name: image-resizer-skill
description: Image resizing tool optimized for AI API file size limits. Resize images for Gemini, Claude, and other AI APIs.
---

# Image Resizer Skill

## Installation (Independent Module)

This skill is installed as an **independent module**. It does not affect the parent project's dependencies.

```bash
# Navigate to skill directory
cd skills/image-resizer-skill

# Install dependencies (node_modules created only in this folder)
npm install

# Verify installation
node resizer.js --help
```

### Alternative Installation (System ImageMagick)

If Sharp installation is difficult, install ImageMagick system-wide:

```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick
```

If Sharp is unavailable, the tool automatically falls back to ImageMagick.

---

This skill resizes large image files to appropriate sizes for AI API processing.

## Use Cases

- When processing images larger than 1MB
- When fitting images to Gemini API or other AI API file size limits
- When reducing document image sizes (scans, photos, etc.)
- **When batch processing multiple images at once** (recommended)

## Features

### 1. Directory Batch Processing (Recommended!)

**Use this method!** Resize all images in a directory at once.

```bash
node .claude/skills/image-resizer-skill/resizer.js --dir <directory-path>
```

**Example:**
```bash
# Resize entire Slack files directory
node .claude/skills/image-resizer-skill/resizer.js --dir ".crewx/slack-files/C09U0MUREEQ_1764149430.448869"
```

**Result:**
- All images saved to `<directory-path>/resized/` folder
- Files > 1MB: Automatically resized
- Files < 1MB: Copied as-is

### 2. Single Image Resizing

When resizing individual files:

```bash
node .claude/skills/image-resizer-skill/resizer.js <input-file> [output-file] [options]
```

**Options:**
- `--max-width <number>`: Maximum width (default: 2048)
- `--max-height <number>`: Maximum height (default: 2048)
- `--quality <number>`: JPEG quality 1-100 (default: 85)
- `--max-size <number>`: Maximum file size in MB (default: 1)

### 3. Glob Pattern Batch Processing

When processing files matching specific patterns:

```bash
node .claude/skills/image-resizer-skill/resizer.js "*.jpg" ./resized/
```

## Technical Specifications

### Supported Formats
- Input: JPG, JPEG, PNG, WebP, GIF, TIFF
- Output: JPEG (optimized compression)

### Dependencies
This tool uses one of the following:
1. **Sharp** (recommended): Node.js image processing library
2. **ImageMagick** (fallback): System-installed convert command

Falls back to ImageMagick automatically if Sharp is unavailable.

### Sharp Installation (Recommended)
```bash
npm install sharp
```

### ImageMagick Installation (Fallback)
```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# CentOS/RHEL
sudo yum install imagemagick
```

## Recommended Settings

### Defaults (Optimized for Gemini API)
- **Max size**: 1MB (Gemini stability)
- **Max resolution**: 2048x2048
- **Quality**: 85

```bash
# Directory batch processing (using defaults)
node .claude/skills/image-resizer-skill/resizer.js --dir ".crewx/slack-files/C09U0MUREEQ_1234567890"
```

### For Claude API (Larger files allowed)
```bash
node .claude/skills/image-resizer-skill/resizer.js --dir "<directory>" --max-size 3
```

### For Document Scans (OCR optimized)
```bash
node .claude/skills/image-resizer-skill/resizer.js --dir "<directory>" --max-width 1920 --quality 90
```

## Agent Usage Guide

When AI agents use this skill, follow these steps:

### When Image Directory is Found (Required)

**Always resize the entire directory before image analysis:**

```bash
# Batch resize entire directory
node .claude/skills/image-resizer-skill/resizer.js --dir ".crewx/slack-files/C09U0MUREEQ_1764149430.448869"

# Work with resized files
# Use only files from the resized/ folder!
```

### Important Rules

1. **Do not resize individual files** - Always use `--dir` option for batch processing
2. **Do not use original files** - Always use files from `resized/` folder
3. **1MB threshold** - Files over 1MB are automatically resized

### Error Handling

If resizing fails:
1. Neither Sharp nor ImageMagick available: Installation guide provided
2. File not found: Check path
3. Permission issues: Check file permissions

## Notes

1. **Preserve originals**: When possible, keep original files and save to new files
2. **Quality loss**: JPEG compression is lossy, some quality degradation may occur
3. **Text readability**: For documents, don't lower quality too much (minimum 80 recommended)
4. **Batch processing**: Processing many files may take time

## Troubleshooting

### Sharp Installation Failure
```bash
# Check Node.js version (14+ required)
node --version

# Install build tools
npm install --global node-gyp
```

### ImageMagick Errors
```bash
# Verify ImageMagick installation
which convert

# Check version
convert --version
```

## Example Workflow

### Tax Calculation Scenario

```bash
# 1. Batch resize entire directory (once!)
node .claude/skills/image-resizer-skill/resizer.js --dir ".crewx/slack-files/C09U0MUREEQ_1764149430.448869"

# 2. Analyze resized files
# Use files from .crewx/slack-files/C09U0MUREEQ_1764149430.448869/resized/ folder
```

**Important:** Do not resize files one by one. Always use `--dir` option for batch processing.
