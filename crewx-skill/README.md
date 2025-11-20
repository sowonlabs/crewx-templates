# CrewX Skill for Claude Code

A Claude Code skill that provides expert assistance with CrewX CLI framework.

## 📋 What's Included

- **CrewX Expert Skill**: Comprehensive knowledge of CrewX commands, configuration, and workflows
- **CrewX Manual**: Complete reference documentation for all CrewX features
- **Auto-activation**: Skill activates automatically when you ask CrewX-related questions

## 🚀 Quick Start

### Installation

```bash
# Initialize in your CrewX project
crewx template init crewx-skill

# Or manually copy to any project
cp -r .claude /path/to/your/project/
```

### Usage

Once installed, your Claude Code assistant will automatically help with:

```bash
# Ask about CrewX commands
"How do I create a custom agent?"
"What's the difference between query and execute?"

# Get configuration help
"Show me crewx.yaml syntax for adding skills"
"How do I configure multiple AI providers?"

# Troubleshooting
"Why is my agent not found?"
"How do I check which AIs are available?"
```

## 🎯 When the Skill Activates

The skill automatically activates when you mention:
- CrewX commands (`crewx q`, `crewx execute`, `crewx agent ls`)
- Configuration files (`crewx.yaml`, `SKILL.md`)
- Agent or skill setup
- Multi-AI workflows
- CrewX troubleshooting

## 📚 What the Skill Provides

### 1. Command Reference
Get exact command syntax with examples:
```bash
crewx q "@agent_name your question"
crewx execute "@agent_name your task"
crewx agent ls
crewx doctor
```

### 2. Configuration Help
Guidance on `crewx.yaml` structure:
```yaml
agents:
  - id: my_agent
    name: "My Custom Agent"
    provider: cli/claude
    skills:
      include:
        - skill-name
```

### 3. Multi-AI Strategy
Recommendations for which AI to use:
- **Claude**: Complex reasoning, code analysis
- **Gemini**: Fast queries, search integration
- **Copilot**: GitHub integration, IDE workflows

### 4. Troubleshooting
Solutions for common issues:
- Agent not found errors
- Provider CLI configuration
- Skill loading problems

## 🔧 Customization

### Add Project-Specific Context

Edit `.claude/skills/crewx/SKILL.md` to add your project's:
- Custom agent definitions
- Team workflows
- Project-specific conventions

### Update Manual

Keep `crewx-manual.md` up to date as CrewX evolves.

## 📖 Documentation Structure

```
.claude/
└── skills/
    └── crewx/
        ├── SKILL.md         # Skill definition and activation rules
        └── crewx-manual.md  # Complete CrewX reference guide
```

## 🤝 Works With

- **Claude Code** (CLI or VS Code extension)
- **Any CrewX project** (>= 0.7.0)
- **All AI providers** (Claude, Gemini, Copilot, Codex)

## 💡 Tips

1. **Be specific**: Ask "How do I..." questions for best results
2. **Use examples**: The skill provides copy-pasteable code
3. **Reference docs**: Skill links to detailed documentation
4. **Iterate**: Start with simple queries, then dive deeper

## 🔄 Updates

To get the latest CrewX skill updates:

```bash
# Re-initialize from template
crewx template init crewx-skill --force

# Or manually update from GitHub
curl -L https://github.com/sowonlabs/crewx-templates/archive/main.zip
```

## 📝 License

MIT License - Free to use and modify.

---

**Part of [CrewX Templates](https://github.com/sowonlabs/crewx-templates)**
