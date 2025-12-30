# Jarvis AI Assistant

Iron Man-style personal AI assistant template with multi-agent orchestration.

## Quick Start

```bash
# Initialize the template
crewx template init jarvis

# Talk to Jarvis
crewx execute "@jarvis Help me refactor the authentication module"

# Quick query with F.R.I.D.A.Y.
crewx query "@friday What's the syntax for async/await in TypeScript?"
```

## Agents

### JARVIS (Main Assistant)
- **Model**: Claude Sonnet
- **Role**: Personal AI assistant for complex tasks
- **Capabilities**:
  - Multi-agent orchestration
  - Task breakdown and parallel execution
  - Development assistance (code review, architecture, debugging)
  - Research via web search

### F.R.I.D.A.Y. (Backup Assistant)
- **Model**: Claude Haiku (fast)
- **Role**: Quick queries and simple tasks
- **Use when**: Need fast answers or Jarvis is busy

## Features

### Multi-Agent Orchestration

Jarvis can delegate tasks to specialized agents:

```bash
# Parallel execution
crewx execute "@jarvis Implement login feature with tests"

# Jarvis will automatically:
# 1. Break down the task
# 2. Assign to @claude for implementation
# 3. Assign to @codex for test generation
# 4. Coordinate results
```

### Development Workflow

```bash
# Code review
crewx execute "@jarvis Review changes in src/components/"

# Architecture design
crewx execute "@jarvis Design a caching strategy for our API"

# Debugging
crewx execute "@jarvis Help me debug: TypeError: Cannot read property 'x' of undefined"
```

### Web Research

```bash
# Jarvis delegates to Gemini for web searches
crewx execute "@jarvis Find best practices for React state management in 2024"
```

## File Structure

```
jarvis/
├── crewx.yaml              # Agent definitions
├── README.md               # This file
└── .claude/
    └── skills/
        └── jarvis/
            └── SKILL.md    # Jarvis skill definition
```

## Personality

Jarvis responds in a professional yet friendly manner, inspired by Iron Man's AI:

```
User: Jarvis, implement user authentication

Jarvis:
Very well, sir. I shall implement the authentication system.

My analysis:
- JWT-based token authentication
- Secure password hashing with bcrypt
- Refresh token rotation

I'll delegate this to @claude for implementation and @codex for test coverage.

[Proceeds with parallel execution...]
```

## Tips

1. **Be Specific**: The more detail you provide, the better Jarvis can assist
2. **Use F.R.I.D.A.Y. for Quick Queries**: Save Jarvis for complex tasks
3. **Trust the Orchestration**: Jarvis knows when to parallelize

## Requirements

- CrewX CLI >= 0.7.0
- Claude CLI (for Jarvis and F.R.I.D.A.Y.)
- Gemini CLI (optional, for web search)
- Codex CLI (optional, for code generation)

## License

MIT
