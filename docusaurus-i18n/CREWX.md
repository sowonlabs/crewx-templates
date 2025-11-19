# CrewX Agent Guide - Docusaurus i18n Template

> This document helps CrewX agents understand and work with this project effectively.

## 🎯 Project Overview

**Project Type**: Docusaurus 3.9.2 multilingual documentation site
**Primary Languages**: Korean (original) → English (auto-translated)
**Core Feature**: AI-powered auto-translation workflow

## 📁 Directory Structure

### Key Directories

```
project-root/
├── blog/                                    # 🇬🇧 English blogs (translated results)
│   ├── authors.yml                          # Author info (English)
│   ├── tags.yml                             # Tag info (English)
│   └── YYYY-MM-DD-slug.md                   # Translated blog posts
│
├── i18n/ko/docusaurus-plugin-content-blog/  # 🇰🇷 Korean blogs (original)
│   ├── authors.yml                          # Author info (Korean)
│   ├── tags.yml                             # Tag info (Korean)
│   └── YYYY-MM-DD-slug.md                   # Korean blog posts (write here!)
│
├── docs/                                    # 🇬🇧 English docs
│   └── *.md
│
├── i18n/ko/docusaurus-plugin-content-docs/  # 🇰🇷 Korean docs
│   └── current/
│       └── *.md
│
├── scripts/
│   └── translate-blog.mjs                   # Auto-translation script
│
├── src/                                     # Theme customization
│   ├── css/custom.css                       # Site styles
│   └── components/                          # React components
│
├── static/                                  # Static files
│   └── img/                                 # Images (blogs, logos, etc.)
│
├── crewx.yaml                               # CrewX config (translation agent)
├── docusaurus.config.ts                     # Docusaurus config
├── sidebars.ts                              # Sidebar config
└── package.json                             # Dependencies (Docusaurus 3.9.2)
```

## 🤖 Translation Workflow

### 1️⃣ Write Korean Blog

**Location**: `i18n/ko/docusaurus-plugin-content-blog/`

**Filename Convention**: `YYYY-MM-DD-slug-name.md`

**Front Matter Structure**:
```yaml
---
slug: article-slug               # URL path (DO NOT change)
title: Blog Title                # Will be translated
authors: [team, admin]           # Reference authors.yml (DO NOT change)
tags: [tutorial, release]        # Reference tags.yml (DO NOT change)
---

Blog content starts here...

<!--truncate-->  ⬅️ Summary separator (must include)

## Main Section

Content...
```

### 2️⃣ Run Translation

**Auto-translate command**:
```bash
# Check untranslated files
npm run translate:check

# Translate all untranslated files
npm run translate:ko-to-en
```

**Manual translation (specific file)**:
```bash
crewx x "@blog_translator Translate i18n/ko/docusaurus-plugin-content-blog/2025-01-15-example.md to English and save it to blog/2025-01-15-example.md"
```

### 3️⃣ Translation Rules

**@blog_translator agent automatically handles**:

✅ **Preserve** (never change):
- `slug`: URL path
- `authors`: Author list
- `tags`: Tag list
- Code block content
- Image paths
- Commands, variable names

✅ **Translate** (to natural English):
- `title`: Blog title
- Body text
- Markdown headings
- List items

✅ **Maintain format**:
- Markdown syntax (`#`, `**`, `*`, `-`, numbered lists)
- Emojis (🤖, 💬, 📝, etc.)
- `<!--truncate-->` tag
- Code block language specifiers (```bash, ```typescript)

✅ **Adjust links**:
- Internal link locale changes:
  - `/ko/docs/intro` → `/docs/intro` (KR→EN)
  - `/docs/intro` → `/ko/docs/intro` (EN→KR)
- External links: Keep unchanged

## 📝 Agent Work Guidelines

### When Creating New Blog Posts

1. **Check file location**:
   - Korean: `i18n/ko/docusaurus-plugin-content-blog/`
   - English: `blog/`

2. **Filename rules**:
   - Include date: `2025-01-15-topic-name.md`
   - Use lowercase + hyphens
   - Use same filename for both languages

3. **Front Matter required fields**:
   ```yaml
   slug: unique-slug      # Unique URL path
   title: Title
   authors: [team]        # Defined in authors.yml
   tags: [tutorial]       # Defined in tags.yml
   ```

4. **Body writing rules**:
   - Add `<!--truncate-->` below title (summary separator)
   - Specify language in code blocks (```bash, ```typescript)
   - Use `/img/` or `./img/` paths for images

### When Modifying Existing Blogs

1. **Edit original file**:
   - Korean original: `i18n/ko/docusaurus-plugin-content-blog/*.md`
   - English translation: `blog/*.md`

2. **Re-translate after editing**:
   - If Korean edited: Delete English file and re-translate
   - If English edited: Edit directly (no translation script needed)

3. **Caution when changing Front Matter**:
   - `slug` change: Change identically in both files
   - `authors`, `tags` change: First verify definition in `.yml` files

### When Translating

1. **Pre-translation checklist**:
   ```bash
   # 1. Verify Korean original file exists
   ls -la i18n/ko/docusaurus-plugin-content-blog/*.md

   # 2. Check untranslated file list
   npm run translate:check
   ```

2. **Execute translation**:
   ```bash
   # Auto-translate all untranslated files
   npm run translate:ko-to-en
   ```

3. **Post-translation validation**:
   ```bash
   # Test build
   npm run build

   # Check with local server
   npm start
   ```

## 🔧 Configuration File Descriptions

### `docusaurus.config.ts`

**i18n settings**:
```typescript
i18n: {
  defaultLocale: 'en',          // Default language: English
  locales: ['en', 'ko'],        // Supported languages
  localeConfigs: {
    en: { label: 'English', ... },
    ko: { label: '한국어', ... }
  }
}
```

**Placeholders to replace**:
- `{{PROJECT_TITLE}}`: Project title
- `{{YOUR_DOMAIN}}`: Deployment domain
- `{{YOUR_ORG}}`: GitHub organization
- `{{PROJECT_NAME}}`: Project name

### `crewx.yaml`

**Included agent**:
- `@blog_translator`: Blog translation specialist agent
  - Model: Claude Haiku (fast and economical)
  - Role: Korean↔English technical blog translation
  - Capabilities: Preserve Front Matter, natural translation, maintain formatting

### `scripts/translate-blog.mjs`

**Features**:
1. Scan Korean blog list (`i18n/ko/docusaurus-plugin-content-blog/*.md`)
2. Scan English blog list (`blog/*.md`)
3. Detect untranslated files by comparing filenames
4. Call CrewX `@blog_translator` agent
5. Save translation results

**Modes**:
- `check`: Display untranslated file list only
- `translate`: Execute actual translation

## 🚨 Important Notes

### When Writing Files

❌ **Never do**:
- Write Korean directly in `blog/` directory (English only)
- Translate Front Matter's `slug`, `authors`, `tags`
- Translate code block content
- Change image paths

✅ **Always do**:
- Write Korean in `i18n/ko/docusaurus-plugin-content-blog/`
- Include `<!--truncate-->` tag
- Specify code block language
- Include Front Matter required fields

### When Translating

⚠️ **Checkpoints**:
- Is Front Matter identical in both files? (slug, authors, tags)
- Are code blocks preserved as-is?
- Is Markdown formatting intact?
- Are internal links adjusted to correct locale?

## 📦 Dependency Information

**Fixed versions** (do not change):
- Docusaurus: `3.9.2`
- React: `19.0.0`
- TypeScript: `5.6.2`

**Caution when updating**:
- Docusaurus major version changes require checking Breaking Changes
- Check Docusaurus compatibility when changing React version

## 🎯 Common Work Scenarios

### Scenario 1: Create New Blog Post

```bash
# 1. Write Korean blog
# File: i18n/ko/docusaurus-plugin-content-blog/2025-01-20-new-feature.md

# 2. Check translation
npm run translate:check
# Output: "1 untranslated blog: 2025-01-20-new-feature.md"

# 3. Auto-translate
npm run translate:ko-to-en
# Result: blog/2025-01-20-new-feature.md created

# 4. Validate
npm run build
```

### Scenario 2: Modify Existing Blog

```bash
# 1. Edit Korean original
# File: i18n/ko/docusaurus-plugin-content-blog/2025-01-15-old-post.md

# 2. Delete English translation
rm blog/2025-01-15-old-post.md

# 3. Re-translate
npm run translate:ko-to-en
```

### Scenario 3: Add New Author

```bash
# 1. Edit both authors.yml files
# - blog/authors.yml (English)
# - i18n/ko/docusaurus-plugin-content-blog/authors.yml (Korean)

# 2. Use same key (ID)
# blog/authors.yml:
#   new_author:
#     name: New Author
#     title: Developer

# i18n/ko/docusaurus-plugin-content-blog/authors.yml:
#   new_author:
#     name: 새로운 작성자
#     title: 개발자

# 3. Use in blog
# Front Matter:
#   authors: [new_author]
```

## 🛠️ Troubleshooting

### Translation Not Running

**Cause**: CrewX CLI not installed or agent not found

**Solution**:
```bash
# Check CrewX installation
crewx --version

# Check agent list
crewx agent ls

# Verify crewx.yaml path
ls -la crewx.yaml
```

### Build Fails

**Cause**: Front Matter error or file path issues

**Solution**:
```bash
# Clear cache
npm run clear

# Rebuild
npm run build

# Check error message to find problematic file
```

### Locale Not Switching

**Cause**: i18n directory structure error

**Solution**: Verify directory path
```bash
# Correct structure
i18n/ko/docusaurus-plugin-content-blog/*.md  ✅
i18n/ko/blog/*.md                             ❌
```

## 📚 References

- [Docusaurus Official Documentation](https://docusaurus.io/)
- [Docusaurus i18n Guide](https://docusaurus.io/docs/i18n/introduction)
- [CrewX Documentation](https://crewx.dev/)
- This project's [README.md](./README.md)
- This project's [QUICKSTART.md](./QUICKSTART.md)

---

**This document is written to help CrewX agents understand and work correctly with the project.**
