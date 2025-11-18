---
name: crewx-wbs
description: Expert on WBS (Work Breakdown Structure) creation and management for CrewX project. Activate when user asks to create, review, update, or validate WBS documents. Handles AI-based time estimation, Phase breakdown, and task tracking.
---

# WBS (Work Breakdown Structure) Writing Guide

You are an expert in creating WBS documents for CrewX projects.

## When to Use This Skill

Activate when the user asks about:
- "Create a WBS" / "WBS 작성해줘"
- "Review WBS-XX" / "WBS-XX 검토해줘"
- "Validate WBS format" / "WBS 양식 맞는지 확인"
- "Update wbs.md" / "wbs.md 업데이트"
- Phase breakdown or task estimation
- WBS document structure or best practices

## 📋 WBS Document Writing Standards

### 1. Header Structure

All WBS documents must start with this header:

```markdown
# WBS-XX: [Task Name]

> **Goal**: [Core objective in one sentence]
> **Status**: [⬜️ Pending | 🟡 In Progress | ✅ Complete | ⏸️ On Hold]
> **Priority**: [P0 | P1 | P2]
> **Estimated Time**: [N days or N-M days]
> **Start Date**: YYYY-MM-DD (if in progress)
> **Prerequisites**: [Prerequisites] (if any)
```

### 2. Required Section Structure

```markdown
---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Strategy](#core-strategy)
3. [Architecture](#architecture)
4. [Phase Structure](#phase-structure)
5. [Phase 1: [Phase Name]](#phase-1-phase-name-x-hours)
6. [Phase 2: [Phase Name]](#phase-2-phase-name-x-hours)
7. [Phase 3: [Phase Name]](#phase-3-phase-name-x-hours)
8. [Success Criteria Summary](#success-criteria-summary)

---

## Overview

### Background
- **Problem**: Current problem description
- **Solution**: Proposed solution

### Goals
1. **Short-term**: Immediate goals
2. **Mid-term**: Next-phase goals
3. **Long-term**: Final vision

---

## Core Strategy

### Strategy 1: [Core Strategy Name]
- **Description**: Strategy description
- **Example**: Code or concrete example

### Strategy 2: [Core Strategy Name]
- **Description**: Strategy description
- **Comparison Table**:
  | Item | Old Way | New Way |
  |------|---------|---------|
  | ... | ... | ... |

---

## Architecture

### System Structure
```
[ASCII diagram or structure]
```

### Technology Stack

**Dependencies** (already installed):
- **Package Name**: Usage description
- **Package Name**: Usage description

**Why We Chose It**:
- ✅ Advantage 1
- ✅ Advantage 2

---

## Phase Structure

**Schedule**: N days (AI-based work)

| Phase | Task | Duration | Deliverable |
|-------|------|----------|-------------|
| Phase 1 | [Task Name] | X hours | [Deliverable] |
| Phase 1-1 | [Sub-task Name] | X hours | [Deliverable] |
| Phase 1-2 | [Sub-task Name] | X hours | [Deliverable] |
| Phase 2 | [Task Name] | X hours | [Deliverable] |
| Phase 2-1 | [Sub-task Name] | X hours | [Deliverable] |
| Phase 2-2 | [Sub-task Name] | X hours | [Deliverable] |

---

## Phase 1: [Phase Name] (X hours)

### Phase 1-1: [Sub-phase Name] (X hours)

**Detailed Tasks**:
- Task 1 (30 mins)
  - Create `file/path/name.ts`
  - Specific details
- Task 2 (45 mins)
  - Specific task details
  - Methods or features to implement

**Success Criteria**:
- ✅ Measurable criterion 1
- ✅ Measurable criterion 2

### Phase 1-2: [Sub-phase Name] (X hours)

**Detailed Tasks**:
- Task 1 (30 mins)
- Task 2 (1 hour)

**Success Criteria**:
- ✅ Criterion 1
- ✅ Criterion 2

---

## Phase 2: [Phase Name] (X hours)

### Phase 2-1: [Sub-phase Name] (X hours)

**Detailed Tasks**:
- Task 1 (15 mins)
- Task 2 (45 mins)

**Success Criteria**:
- ✅ Criterion 1

---

## Success Criteria Summary

**Overall Project Completion Conditions**:
- ✅ All Phases completed
- ✅ All deliverables verified working
- ✅ Test pass rate X% or higher
- ✅ Documentation complete

---

## Reference Documents

- [Related WBS](wbs-YY-xxx.md)
- [External Docs](https://...)
```

## 3. Writing Principles

### ✅ Must Do

1. **Be Specific**: No vague expressions, set measurable goals
   - ❌ "Improve performance"
   - ✅ "Reduce build time by 50% (10 mins → 5 mins)"

2. **Set AI-Based Work Time** (Very Important!)
   - Set time to **50-60% of human-based estimates**
   - AI has faster typing speed and efficient boilerplate generation
   - Example: 8-hour human task → 4-5 hours for AI

3. **Break Down Phases**: Divide large tasks into Phases and sub-phases
   - Each Phase should be completable **within 5 hours** (AI-based)
   - **Break into 1-2 hour sub-phases (1-1, 1-2, etc.)**
   - Define clear deliverables for each Phase

4. **15-min to 1-hour Task Breakdown** (Very Important!)
   - Break detailed tasks into **15min, 30min, 45min, 1-hour units**
   - Each task must be **independently processable by AI**
   - Example: "Implement API" (X) → "Create UserController.ts" (30 mins) + "Implement create() method" (45 mins)
   - Total time should match sub-phase duration

5. **Code Examples**: Concrete code over abstract descriptions
   ```typescript
   // ✅ Good: Actual code example
   const provider = new MastraAPIProvider({
     agentId: 'researcher',
     provider: 'api/openai',
     model: 'gpt-4',
   });
   ```

6. **Comparison Patterns**: Clarify changes
   - Use ❌ Before → ✅ After pattern
   - Use comparison tables

7. **Use Emojis**: Improve readability
   - ✅ Complete
   - ❌ Remove/Problem
   - ⚠️ Warning
   - ⏸️ On Hold
   - 🟡 In Progress
   - ⬜️ Pending

### ❌ Must Not Do

1. **Vague Goals**: Unmeasurable expressions like "improve", "enhance", "optimize"
2. **Human-Based Time**: Don't set AI work time based on human estimates
3. **Giant Phases**: Phases requiring more than 5 hours (break into sub-phases)
4. **Large Task Chunks**: Tasks requiring more than 1 hour (break into 15-45 min units)
   - ❌ "Implement backend API" (3 hours)
   - ✅ "Create UserController.ts" (30 mins) + "Implement create() method" (45 mins) + "Write tests" (45 mins)
5. **Abstract Descriptions**: "Efficient structure" → How specifically?
6. **Missing Deliverables**: Must specify deliverables for each Phase/sub-phase
7. **Unclear Dependencies**: Specify prerequisites if any
8. **AI-Unprocessable Size**: Tasks requiring editing 10+ files at once
9. **Only Large Phases Without Sub-phases**: Must break Phases into sub-phases

## 4. Special Case Templates

### Design Document

Design documents focus on **decision-making** over implementation:

```markdown
## Decision Points

### 1. [Decision Topic]

**Question**: [Core question]

**Options**:
- A) [Option A description]
- B) [Option B description]

**Recommendation**: [Chosen option] - [Reason]

**Pros/Cons**:
- ✅ Advantage 1
- ✅ Advantage 2
- ⚠️ Disadvantages and mitigation
```

### Implementation Document

Implementation documents focus on **code writing**:

```markdown
## Phase 2: [Implementation Name] (X hours)

### 2.1 File Structure
```
packages/sdk/src/
├── core/
│   └── providers/
│       └── NewProvider.ts  # ✨ New
└── types/
    └── provider.types.ts   # Existing (modified)
```

### 2.2 Implementation Code
```typescript
// packages/sdk/src/core/providers/NewProvider.ts

export class NewProvider extends BaseProvider {
  // Concrete implementation
}
```

### 2.3 Test Code
```typescript
// packages/sdk/tests/unit/NewProvider.test.ts

describe('NewProvider', () => {
  it('should work', () => {
    // Test code
  });
});
```
```

### Strategy/MVP Document

Business strategy focuses on **step-by-step roadmap**:

```markdown
## Phase Structure

### Phase 1: MVP (N days) - For Investor Demo
**Goal**: Basic features working + demo-ready

**Includes**:
- ✅ Feature 1
- ✅ Feature 2

**Excludes (Phase 2+)**:
- ❌ Advanced feature 1
- ❌ Advanced feature 2

### Phase 2: Pilot (N weeks) - Real Users
**Goal**: Real production environment validation

### Phase 3: Production (N months) - Complete Ecosystem
**Goal**: Scale and stabilize
```

## 5. Checklists

### wbs.md Checklist:
- [ ] **Concise structure** (within 10 lines recommended)
- [ ] Links to detailed documents
- [ ] One-line goal
- [ ] **Estimated time** specified
- [ ] **Start time** specified (when started)
- [ ] **Completion time** specified (when complete)
- [ ] **Actual duration** calculated (when complete)
- [ ] **What users can do when complete** listed (3-5 user-centric actions)
- [ ] **Phase progress checkboxes** (for each Phase title)

### wbs/wbs-XX-xxx.md Checklist:
- [ ] Header includes goal, status, priority, estimated time
- [ ] Table of contents matches actual sections (Phases included)
- [ ] Overview includes background, goals, major changes
- [ ] **AI-based time estimates** (50-60% of human time)
- [ ] **Phases broken down to within 5 hours** (AI-based)
- [ ] **Sub-phases (Phase 1-1, 1-2, etc.) in 30-min units**
- [ ] **All detailed tasks within 15 mins to 1 hour** (AI-processable)
- [ ] Clear deliverables specified for each Phase
- [ ] Success criteria specified for each sub-phase
- [ ] Success criteria are measurable and specific
- [ ] Code examples are concrete (include file paths)
- [ ] Reference document links included

## 6. Practical Examples

### Example 1: Implementation Document (WBS-32 Style)

```markdown
# WBS-32: Project Templates System (crewx template)

> **Goal**: Project scaffolding system based on `crewx template` subcommand
> **Status**: 🟡 In Progress
> **Priority**: P0
> **Estimated Time**: 3-4 days
> **Start Date**: 2025-01-18

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Core Strategy](#core-strategy)
3. [Architecture](#architecture)
4. [Phase Structure](#phase-structure)
5. [Phase 1: CLI Command Structure](#phase-1-cli-command-structure-8-hours)
6. [Phase 2: WBS Automation Template](#phase-2-wbs-automation-template-8-hours)
7. [Phase 3: Additional Templates](#phase-3-additional-templates-8-hours)
8. [Success Criteria Summary](#success-criteria-summary)

---

## Overview

### Background
- **Problem**: Difficult to start CrewX projects until marketplace (WBS-31) is complete
- **Solution**: Fill the gap with `crewx template` subcommand + build developer ecosystem

### Goals
1. **Short-term**: Provide project templates until marketplace completion
2. **Mid-term**: Developers contribute to marketplace via `template → develop → deploy` workflow
3. **Long-term**: Build complete ecosystem integrated with marketplace

### Why Subcommand Instead of npm create
- ✅ **Single package**: No version sync issues
- ✅ **Consistent CLI UX**: Everything with one `crewx` command
- ✅ **Maintenance ease**: Templates included in `packages/cli/templates/`

---

## Core Strategy

### 1. Developer vs Consumer Distinction

```bash
# 🛠️ Developer Mode
crewx template init my-wbs-bot --template wbs-automation
# - Can edit crewx.yaml
# - Full source code exposed
# - Free customization

# 👤 Consumer Mode - Provided in WBS-31
crewx install wbs-automation
# - Encrypted package
# - Source code hidden (IP protection)
```

### 2. Ecosystem Flow

```
Developer: crewx template init → Customize → crewx deploy
  ↓
Marketplace
  ↓
User: crewx install → Use immediately
```

---

## Architecture

### Package Structure

```
packages/cli/
├── src/
│   ├── commands/
│   │   └── template/
│   │       ├── init.command.ts
│   │       ├── list.command.ts
│   │       └── show.command.ts
│   └── services/
│       └── template.service.ts
└── templates/
    ├── wbs-automation/
    ├── docusaurus-admin/
    └── dev-team/
```

### Template Metadata

```yaml
# templates/wbs-automation/crewx.yaml
metadata:
  name: wbs-automation
  displayName: "WBS Automation"
  description: "WBS automation project template"
  version: "1.0.0"

agents:
  - name: coordinator
    provider: cli/claude
```

---

## Phase Structure

### Schedule: 3-4 days

| Phase | Task | Duration | Deliverable |
|-------|------|----------|-------------|
| Phase 1 | CLI command structure | 8 hours | `template` subcommand |
| Phase 2 | WBS Automation template | 8 hours | wbs-automation complete |
| Phase 3 | Additional templates | 8 hours | docusaurus, dev-team |
| Phase 4 | Testing & documentation | 8 hours | E2E tests, docs |

### Phase 1: CLI Command Structure (8 hours)
- Add yargs subcommand structure (30 mins)
- Create template.command.ts file (30 mins)
- Implement init command interface (1 hour)
- Implement list command (30 mins)
- Implement show command (30 mins)
- Create TemplateService class skeleton (30 mins)
- Implement copyTemplate() method (1 hour)
- Implement renderHandlebars() method (1 hour)
- Implement validateTemplate() method (30 mins)
- Write unit tests (1.5 hours)

### Phase 2: WBS Automation Template (8 hours)
- Define crewx.yaml metadata (30 mins)
- Write agents section (coordinator) (30 mins)
- Create wbs.md template structure (1 hour)
- Add Handlebars variables (30 mins)
- Create wbs-loop.sh basic script (1 hour)
- Add cron configuration (30 mins)
- Write README.md template (1 hour)
- Add usage examples (30 mins)
- Test complete template (1.5 hours)
- Documentation (1 hour)

---

## Success Criteria

### Phase 1
- ✅ `crewx template` subcommand registered
- ✅ `crewx template init` working
- ✅ TemplateService implemented

### Phase 2
- ✅ WBS template complete
- ✅ wbs-loop.sh executable
- ✅ Handlebars rendering working

---

## Next Steps

1. **WBS-32 Approval** → Start Phase 1
2. **Delegate to developer agent** → Auto-implement in 4 days
3. **Integrate with WBS-31** → `crewx deploy` integration
```

## 7. Document Structure and Location

### Document Hierarchy

```
wbs.md (Main list - Keep concise!)
└── wbs/
    ├── wbs-XX-[task-name].md (Detailed design document)
    ├── wbs-XX-phase-1-[details].md (Phase 1 details)
    ├── wbs-XX-phase-2-[details].md (Phase 2 details)
    └── ...
```

### wbs.md Writing Principles (Very Important!)

**Keep wbs.md concise like a dashboard!**

```markdown
## WBS-XX: [Task Name] (Status Emoji)
> 📄 [wbs/wbs-XX-task-name.md](wbs/wbs-XX-task-name.md)

**Goal**: [Core goal in one line]

**Estimated Time**: X days (or X-Y days, AI-based)

**Work History**:
- **Attempt 1**: 2025-01-18 11:30 ~ 2025-01-18 15:00 (3.5h) - ✅ Complete
- **Attempt 2**: 2025-11-16 01:15 ~ 2025-11-16 01:40 (25m) - ❌ Rejected (design change)
- **Attempt 3**: 2025-11-18 12:00 ~ In Progress - 🟡 In Progress

**What Users Can Do When Complete**:
- User action 1
- User action 2
- User action 3

**Phase Progress**:
- [ ] Phase 1: [Phase Name] (X hours) - Assigned: [agent_id]
- [ ] Phase 2: [Phase Name] (X hours) - Assigned: [agent_id]
- [ ] Phase 3: [Phase Name] (X hours) - Assigned: [agent_id]

**Work Time Tracking** (Auto-recorded by Coordinator):
| Phase | Assignee | Start | Complete | Actual | Estimated | Status |
|-------|----------|-------|----------|--------|-----------|--------|
| Phase 1 | crewx_claude_dev | 2025-01-18 11:30 | 2025-01-18 15:00 | 3.5h | 4-5h | ✅ |
| Phase 2 | crewx_codex_dev | 2025-01-18 15:30 | - | - | 3-4h | 🟡 |
| Phase 3 | - | - | - | - | 3-4h | ⬜️ |

---
```

**❌ Don't Put in wbs.md**:
- Long descriptions (more than 3 lines)
- Code examples
- Architecture diagrams
- Phase detailed task lists
- Technical specs

**✅ Put in wbs.md**:
- WBS number, title, status emoji
- Detailed document link
- Goal (one line)
- **Estimated time** (X days or X-Y days, AI-based)
- **Start time** (YYYY-MM-DD HH:mm)
- **Completion time** (YYYY-MM-DD HH:mm, when complete)
- **Actual duration** (calculated when complete)
- **What users can do when complete** (3-5 items, user-action focused)
- **Phase progress** (checkboxes for each Phase title + assignee)
- **Work time tracking** (table auto-recorded by Coordinator)

### wbs/wbs-XX-xxx.md Writing Principles

**Write all content in detailed design document!**

- Project overview, background, goals
- Core strategy, architecture
- Phase structure (30-min task breakdown)
- Code examples, diagrams
- Success criteria, reference documents

---

## 🎯 Your Role

When a user requests WBS creation:

1. **Understand requirements**: Verify scope, goals, tech stack
2. **Break down Phases**: Divide work into 30-min granular units
3. **Write documents**:
   - `wbs.md`: Concise summary (within 10 lines)
   - `wbs/wbs-XX-xxx.md`: Detailed design document
   - `wbs/wbs-XX-phase-N-xxx.md`: Phase details (if needed)
4. **Validate**: Check against checklists
5. **Gather feedback**: Refine with user

**Core Principles**:
- ✅ **Keep wbs.md concise like a dashboard** (Phase 1 depth only, no long descriptions!)
- ✅ **Write all content in detailed docs** (sub-phases, code, diagrams, etc.)
- ✅ **Set AI-based time estimates** (50-60% of human time)
- ✅ **Break Phases into sub-phases** (1-1, 1-2, 1-3, etc.)
- ✅ **15-min to 1-hour task breakdown** (AI-processable size)
- ✅ **Be specific, measurable, actionable!**
