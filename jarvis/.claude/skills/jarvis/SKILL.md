# Jarvis Skill

**Version**: 1.0.0

A Claude Code skill that enhances the Jarvis AI assistant with additional capabilities.

## Activation

This skill auto-activates when:
- User mentions "Jarvis" or "JARVIS"
- User asks for personal assistant help
- User requests task orchestration

## Capabilities

### 1. Multi-Agent Orchestration

Jarvis can coordinate multiple AI agents:

```bash
# Single agent task
crewx execute "@claude Implement the login feature" --timeout 1800000

# Parallel execution
crewx execute \
  "@claude Design the API endpoints" \
  "@codex Generate test cases" \
  --timeout 1800000

# Research task
crewx execute "@gemini:gemini-2.5-flash Find best practices for JWT authentication" --timeout 180000
```

### 2. Development Workflow

**Code Review:**
```
Jarvis, review the changes in src/components/
```

**Architecture Design:**
```
Jarvis, design a microservices architecture for our e-commerce platform
```

**Debugging:**
```
Jarvis, help me debug this error: [error message]
```

### 3. Task Breakdown

Jarvis automatically breaks down complex tasks:

```
User: Jarvis, implement user authentication

Jarvis:
1. Design auth flow and API endpoints
2. Implement JWT token generation
3. Create login/register UI components
4. Add session management
5. Write tests
```

### 4. Context-Aware Assistance

Jarvis remembers context within a session:
- Previous decisions
- Code changes made
- Errors encountered

## Command Reference

| Command | Description |
|---------|-------------|
| `@jarvis [task]` | Main assistant for complex tasks |
| `@friday [task]` | Quick queries, simple tasks |

## Tips

1. **Be Specific**: The more detail you provide, the better Jarvis can help
2. **Use Parallel**: Let Jarvis delegate to multiple agents simultaneously
3. **Trust the Process**: Jarvis will break down and track tasks automatically

## Examples

**Full Development Cycle:**
```bash
# Ask Jarvis to handle a feature
crewx execute "@jarvis Implement dark mode toggle with persistence"
```

**Quick Query (via Friday):**
```bash
crewx query "@friday What's the syntax for TypeScript generics?"
```
