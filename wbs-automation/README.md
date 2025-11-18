# WBS Automation Template

WBS (Work Breakdown Structure) based project automation template for CrewX.

## 🚀 Quick Start

```bash
# 1. Create project directory
mkdir my-wbs-project && cd my-wbs-project

# 2. Download template
crewx template init wbs-automation

# 3. Configure WBS (edit wbs.md)
# Define your project goals and tasks

# 4. Run automation
./wbs-loop.sh
```

## 📦 Included Files

- `crewx.yaml` - Coordinator agent configuration
- `wbs.md` - WBS document template
- `wbs-loop.sh` - Automation loop script
- `docs/crewx-manual.md` - CrewX user manual
- `.claude/skills/crewx-wbs/` - WBS management skill
- `.claude/skills/crewx/` - CrewX usage skill

## 🛠️ Configuration

### Coordinator Agent

The Coordinator reads wbs.md and automatically manages unfinished tasks.

**How it works**:
1. Read wbs.md
2. Identify incomplete Phases
3. Execute independent Phases in parallel
4. Update wbs.md completion status and time tracking

### Environment Variables

Environment variables used by the script:
- `CONTEXT_THREAD` - Thread ID for sharing work context
- `CREWX_CMD` - CrewX command path (default: `crewx`)
- `MAX_LOOPS` - Maximum loop count (default: 24)
- `SLEEP_TIME` - Interval between loops in seconds (default: 3600 = 1 hour)

## 📚 Usage

### Writing WBS Documents

1. Create task list in the table at the top of `wbs.md`
2. Add detailed section for each task
3. Break down work into Phases

### Running Automation

```bash
# Basic run (24 hours, 1-hour intervals)
./wbs-loop.sh

# Test mode (3 times, 5-minute intervals)
./wbs-loop.sh --test

# Custom configuration
./wbs-loop.sh --loops 10 --sleep 1800
```

## 🔧 Customization

### Adding Agents

Add development team agents in `crewx.yaml`:

```yaml
agents:
  - id: "my_dev"
    name: "My Developer"
    inline:
      type: "agent"
      provider: "cli/claude"
      model: "sonnet"
      prompt: |
        You are a developer...
```

### Using WBS Skill

`.claude/skills/crewx-wbs/SKILL.md` provides WBS writing guidelines.
Automatically detected by Claude Code.

### Using CrewX Skill

`.claude/skills/crewx/SKILL.md` provides CrewX framework usage and command reference.
Essential for understanding `crewx q`, `crewx execute` commands and agent configuration.

## 📖 Reference Documentation

- [CrewX Manual](docs/crewx-manual.md) - Complete user guide (included in template)
- [CrewX GitHub](https://github.com/sowonlabs/crewx) - Official repository

## 📄 License

MIT License - Feel free to use and modify.
