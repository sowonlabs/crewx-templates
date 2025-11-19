# Docusaurus i18n Template with CrewX Auto-Translation

> Production-ready Docusaurus site template with AI-powered Korean ↔ English auto-translation workflow

This template provides **Docusaurus 3.9.2** with an **automated translation workflow** powered by CrewX AI agents.

## ✨ Features

- 📝 **Docusaurus 3.9.2** - Fixed version for stability
- 🌐 **Multilingual** - Korean/English pre-configured (easily extensible)
- 🤖 **Auto-Translation** - CrewX agent-powered translation automation
- 🚀 **Ready to Use** - Pre-configured template
- 📦 **TypeScript Support** - Type safety included

## 🎯 Core Workflow: Auto-Translation

### 1️⃣ Write Korean Blog

Create a blog post in Korean:

**File**: `i18n/ko/docusaurus-plugin-content-blog/2025-01-15-my-post.md`

```markdown
---
slug: my-post
title: 나의 첫 블로그 포스트
authors: [team]
tags: [tutorial]
---

Welcome to my blog!

<!--truncate-->

## Introduction

This post will be automatically translated to English.
```

### 2️⃣ Check Untranslated Posts

```bash
npm run translate:check
```

**Output**:
```
📋 Untranslated blogs: 1

   1. 2025-01-15-my-post.md

💡 To translate: npm run translate:ko-to-en
```

### 3️⃣ Auto-Translate

```bash
npm run translate:ko-to-en
```

**What happens**:
1. CrewX `@blog_translator` agent activates
2. Reads Korean post from `i18n/ko/docusaurus-plugin-content-blog/`
3. Translates to natural English
4. Saves to `blog/2025-01-15-my-post.md`
5. Preserves Front Matter (slug, authors, tags)
6. Maintains code blocks and formatting

**Result**: `blog/2025-01-15-my-post.md` created! 🎉

## 📦 Installation

### Prerequisites

- **Node.js** ≥ 20.0
- **npm** ≥ 8.0
- **CrewX CLI** (for translation workflow)

Install CrewX:
```bash
npm install -g @crewx/cli
```

### Quick Start

```bash
# 1. Copy template
cp -r docusaurus-i18n-template my-docs-site
cd my-docs-site

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

Browser opens at `http://localhost:3000` 🚀

## ⚙️ Configuration

### Required: Replace Placeholders

Before first use, update these placeholders in `docusaurus.config.ts`:

```typescript
{
  title: '{{PROJECT_TITLE}}',           // → 'My Awesome Docs'
  tagline: '{{PROJECT_TAGLINE}}',       // → 'Best documentation ever'
  url: 'https://{{YOUR_DOMAIN}}',       // → 'https://docs.mysite.com'
  organizationName: '{{YOUR_ORG}}',     // → 'mycompany'
  projectName: '{{PROJECT_NAME}}',      // → 'my-docs-site'
}
```

Also in `package.json`:
```json
{
  "name": "{{PROJECT_NAME}}"  // → "my-docs-site"
}
```

And in metadata files (`blog/authors.yml`, `i18n/ko/docusaurus-plugin-content-blog/authors.yml`):
```yaml
{{YOUR_ORG}}         # → Your GitHub org
{{YOUR_USERNAME}}    # → Your GitHub username
```

## 🗂️ Directory Structure

```
docusaurus-i18n-template/
├── blog/                                    # 🇬🇧 English blogs (translated)
│   ├── authors.yml
│   ├── tags.yml
│   └── *.md
│
├── i18n/ko/docusaurus-plugin-content-blog/  # 🇰🇷 Korean blogs (original)
│   ├── authors.yml
│   ├── tags.yml
│   └── *.md                                 # ⬅️ Write here!
│
├── docs/                                    # 🇬🇧 English docs
│   └── intro.md
│
├── i18n/ko/docusaurus-plugin-content-docs/  # 🇰🇷 Korean docs
│   └── current/
│       └── intro.md
│
├── scripts/
│   └── translate-blog.mjs                   # 🤖 Translation script
│
├── src/
│   ├── css/custom.css                       # Site styles
│   └── components/                          # React components
│
├── static/
│   └── img/                                 # Images
│
├── crewx.yaml                               # 🤖 Translation agent config
├── docusaurus.config.ts                     # Docusaurus config
├── sidebars.ts                              # Sidebar config
├── tsconfig.json                            # TypeScript config
├── package.json                             # Dependencies
├── README.md                                # This file
├── QUICKSTART.md                            # 5-minute guide
└── CREWX.md                                 # Agent guide
```

## 🤖 Translation Agent

### Configuration

Defined in `crewx.yaml`:

```yaml
agents:
  - id: blog_translator
    name: "Blog Translator"
    provider: "cli/claude"
    model: "haiku"  # Fast & cost-effective
```

### What It Does

The `@blog_translator` agent:

✅ **Preserves**:
- `slug`, `authors`, `tags` in Front Matter
- Code blocks (unchanged)
- Image paths
- Markdown formatting
- Emojis

✅ **Translates**:
- `title` in Front Matter
- Blog content
- Headings and lists

✅ **Adjusts**:
- Internal links (`/ko/docs/intro` ↔ `/docs/intro`)

### Manual Translation

For specific files:

```bash
# Korean → English
crewx x "@blog_translator Translate i18n/ko/docusaurus-plugin-content-blog/2025-01-15-example.md to English and save it to blog/2025-01-15-example.md"

# English → Korean
crewx x "@blog_translator Translate blog/2025-01-15-example.md to Korean and save it to i18n/ko/docusaurus-plugin-content-blog/2025-01-15-example.md"
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm run serve` | Serve built site locally |
| `npm run translate:check` | Check untranslated blogs |
| `npm run translate:ko-to-en` | Auto-translate all untranslated posts |
| `npm run clear` | Clear cache |
| `npm run typecheck` | TypeScript type check |

## 🌐 Adding More Languages

To support Japanese, Chinese, etc:

### 1. Update `docusaurus.config.ts`

```typescript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'ko', 'ja'],  // Add Japanese
  localeConfigs: {
    ja: {
      label: '日本語',
      direction: 'ltr',
      htmlLang: 'ja-JP',
    },
  },
}
```

### 2. Create Directories

```bash
mkdir -p i18n/ja/docusaurus-plugin-content-blog
mkdir -p i18n/ja/docusaurus-plugin-content-docs/current
```

### 3. Customize Translation Script

Modify `scripts/translate-blog.mjs` to support other language pairs.

## 🎨 Customization

### Change Colors

Edit `src/css/custom.css`:

```css
:root {
  --ifm-color-primary: #2e8555;  /* Change to your brand color */
}
```

### Change Logo

1. Add logo file to `static/img/logo.png`
2. Update `docusaurus.config.ts`:

```typescript
navbar: {
  logo: {
    src: 'img/logo.png',
  },
}
```

### Add Footer Links

Edit `docusaurus.config.ts`:

```typescript
footer: {
  links: [
    {
      title: 'Community',
      items: [
        { label: 'GitHub', href: 'https://github.com/yourorg' },
        { label: 'Twitter', href: 'https://twitter.com/yourhandle' },
      ],
    },
  ],
}
```

## 🚀 Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Build Command: `npm run build`
4. Output Directory: `build`

### Netlify

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "build/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

```bash
npm run build
npm run deploy
```

## 🛠️ Troubleshooting

### Translation Not Working

**Issue**: CrewX CLI not installed or agent not found

**Solution**:
```bash
# Check CrewX installation
crewx --version

# List available agents
crewx agent ls

# Verify crewx.yaml exists
ls -la crewx.yaml
```

### Build Fails

**Issue**: File path problems or Front Matter errors

**Solution**:
```bash
# Clear cache and rebuild
npm run clear
npm run build
```

### Locale Not Switching

**Issue**: i18n directory structure incorrect

**Solution**: Verify structure:
```
i18n/ko/docusaurus-plugin-content-blog/  ✅
i18n/ko/blog/                             ❌
```

## 📖 Documentation Files

- **[README.md](./README.md)** (this file) - Complete guide
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute quick start
- **[CREWX.md](./CREWX.md)** - Guide for CrewX agents working on this project

## 🎯 Use Cases

This template is perfect for:

- 🌏 **Multi-region teams** - Write once, publish globally
- 📚 **Open source projects** - Engage international contributors
- 🏢 **Company blogs** - Reach Korean & English audiences
- 🎓 **Technical tutorials** - Share knowledge across languages

## 📚 Resources

- [Docusaurus Documentation](https://docusaurus.io/)
- [CrewX Documentation](https://crewx.dev/)
- [i18n Guide](https://docusaurus.io/docs/i18n/introduction)

## 🤝 Contributing

Issues and PRs welcome!

## 📝 License

MIT License - Free to use and modify!

---

**Built with ❤️ using Docusaurus & CrewX**
