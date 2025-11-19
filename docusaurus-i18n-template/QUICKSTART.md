# Quick Start Guide

Get your multilingual Docusaurus site running in 5 minutes!

## 🚀 Installation (2 minutes)

```bash
# 1. Copy template
cp -r docusaurus-i18n-template my-docs
cd my-docs

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

**Result**: Browser opens at `http://localhost:3000` 🎉

## ✏️ Write Your First Post (1 minute)

Create a Korean blog post:

**File**: `i18n/ko/docusaurus-plugin-content-blog/2025-01-15-hello.md`

```markdown
---
slug: hello
title: 안녕하세요!
authors: [team]
tags: [tutorial]
---

CrewX 자동 번역 워크플로우를 테스트합니다.

<!--truncate-->

## 소개

이 포스트는 자동으로 영어로 번역됩니다!

## 코드 예제

```bash
npm run translate:ko-to-en
```

번역 후에도 코드는 그대로 유지됩니다.
```

## 🤖 Auto-Translate (2 minutes)

```bash
# Check what needs translation
npm run translate:check

# Translate automatically
npm run translate:ko-to-en
```

**What happens**:
1. CrewX `@blog_translator` agent activates
2. Reads your Korean post
3. Translates to natural English
4. Saves to `blog/2025-01-15-hello.md`
5. Preserves Front Matter and code blocks

**Result**: Your post is now available in both languages! 🌐

## 🎨 Customize (Optional)

### Replace Placeholders

Edit `docusaurus.config.ts`:

```typescript
title: 'My Awesome Docs',              // was: {{PROJECT_TITLE}}
url: 'https://docs.mysite.com',        // was: {{YOUR_DOMAIN}}
organizationName: 'mycompany',         // was: {{YOUR_ORG}}
projectName: 'my-docs',                // was: {{PROJECT_NAME}}
```

Edit `package.json`:

```json
"name": "my-docs"  // was: {{PROJECT_NAME}}
```

### Add Your Logo

1. Save logo to `static/img/logo.png`
2. Update `docusaurus.config.ts`:

```typescript
navbar: {
  logo: {
    src: 'img/logo.png',
  },
}
```

## 🏗️ Build & Deploy

```bash
# Test production build
npm run build

# Serve locally
npm run serve
```

**Deploy to**:
- **Vercel**: Connect GitHub repo, build command `npm run build`, output `build/`
- **Netlify**: Same as Vercel
- **GitHub Pages**: `npm run deploy`

## 📖 Next Steps

- [Full Documentation](./README.md) - Detailed guide
- [Template Info](./TEMPLATE.md) - Template architecture
- Add more languages (Japanese, Chinese, etc.)
- Customize colors in `src/css/custom.css`
- Write more blog posts!

## 🆘 Troubleshooting

**Translation not working?**
```bash
# Make sure CrewX is installed
crewx --version

# Check if agent exists
crewx agent ls | grep blog_translator
```

**Build fails?**
```bash
# Clear cache and rebuild
npm run clear
npm run build
```

---

**Happy documenting! 🎉**
