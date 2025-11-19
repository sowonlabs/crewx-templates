---
sidebar_position: 1
---

# Getting Started

Welcome to the documentation!

## Quick Start

Get started by installing dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

Build the production site:

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Translation Workflow

This site uses an automated translation workflow powered by CrewX:

1. **Write in Korean** - Create blog posts in `i18n/ko/docusaurus-plugin-content-blog/`
2. **Check** - Run `npm run translate:check` to see untranslated posts
3. **Translate** - Run `npm run translate:ko-to-en` to auto-translate to English

Learn more about the [translation workflow](./translation).
