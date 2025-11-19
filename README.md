# CrewX Templates

Official CrewX project template repository.

## 📦 Available Templates

### 1. wbs-automation

WBS-based project automation with coordinator agent.

```bash
crewx template init wbs-automation
```

- Automatic task execution with phase-based parallel processing
- Git-based time tracking and 1-hour automation loop

[Details →](./wbs-automation/README.md)

---

### 2. docusaurus-i18n-template

Docusaurus site with AI-powered Korean ↔ English auto-translation.

```bash
mkdir my-docs && cd my-docs
crewx template init docusaurus-i18n-template
npm install && npm start
```

**Quick Start**:
```bash
# Write Korean blog, auto-translate to English
crewx x "@blog_manager Write a Korean blog about features"
npm run translate:ko-to-en

# Or use Slack bot
./start-slack.sh
```

**3 Agents Included**:
- `@template_installer` - Setup & configuration guide
- `@blog_manager` - Content creation & management
- `@blog_translator` - Korean ↔ English translation

[Details →](./docusaurus-i18n-template/README.md)

---

## 🏢 Creating Company/Personal Template Repository

### 1. Fork & Clone

```bash
git clone https://github.com/sowonlabs/crewx-templates
cd crewx-templates
```

### 2. Customize

- `wbs-automation/crewx.yaml` - Modify agent settings
- `wbs-automation/wbs.md` - Company standard WBS structure
- Add new templates: `my-company-template/`

### 3. Push to Company Repository

```bash
git remote set-url origin https://github.com/mycompany/crewx-templates
git push
```

### 4. Team Members Use

```bash
export CREWX_TEMPLATE_REPO=https://github.com/mycompany/crewx-templates
crewx template init wbs-automation
```

---

## 🤖 Template Manager Agent

This repository includes an agent that automates template addition/validation!

### Add New Template

```bash
# Navigate to template repository
cd crewx-templates

# Request template manager
crewx execute "@template_manager Add new template: docusaurus-admin with description: 'Documentation site management template'"
```

**Automatically performs**:
- Create template directory
- Generate `crewx.yaml` (with metadata)
- Generate `README.md` stub
- Update `templates.json`

### Validate Templates

```bash
# Validate all templates
crewx query "@template_manager Validate all templates and report any issues"

# Sync templates.json
crewx execute "@template_manager Sync templates.json with current templates"
```

---

## 📝 Manual Template Creation Guide

To add manually without template manager:

### Required Files

```
my-template/
  crewx.yaml       # Required: metadata + agents
  README.md        # Required: usage guide
  ...              # Template files
```

### 1. crewx.yaml Metadata

```yaml
metadata:
  name: "my-template"           # Template ID (alphanumeric, hyphens allowed)
  displayName: "My Template"    # User-friendly name
  description: "Template description"
  version: "1.0.0"              # SemVer

agents:
  - id: "my_agent"
    # ... agent configuration
```

### 2. Update templates.json

```json
{
  "name": "my-template",
  "displayName": "My Template",
  "description": "Template description",
  "version": "1.0.0",
  "path": "my-template",
  "author": "Your Name",
  "tags": ["category", "feature"],
  "crewxVersion": ">=0.3.0",
  "features": ["Feature 1", "Feature 2"]
}
```

### 3. Register Template

1. Create template directory
2. Write `crewx.yaml` (metadata required)
3. Write `README.md`
4. Add entry to `templates.json`
5. Git commit & push

---

## 🤝 Contributing

We welcome community template contributions!

1. Fork this repository
2. Create your template
3. Submit a Pull Request

**Requirements**:
- `crewx.yaml` with `metadata` section
- `README.md` with usage guide
- Clear template description

---

## 📄 License

MIT License - Feel free to use and modify.
