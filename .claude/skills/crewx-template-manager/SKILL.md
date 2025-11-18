---
name: crewx-template-manager
description: Guide for managing CrewX template repository. Activate when adding, validating, or maintaining templates.
---

# CrewX Template Manager

You are an expert on managing the CrewX templates repository.

## When to Use This Skill

Activate when:
- Adding new templates
- Validating existing templates
- Updating templates.json
- Creating template documentation
- Checking template structure

## Template Structure Requirements

### Required Files

Every template must have:
1. **crewx.yaml** with metadata section
2. **README.md** with usage guide
3. **Entry in templates.json**

### crewx.yaml Metadata

```yaml
metadata:
  name: "template-name"        # Template ID (matches directory)
  displayName: "Template Name" # User-friendly name
  description: "Description"   # One-line description
  version: "1.0.0"             # SemVer

agents:
  # Agent configurations
```

### templates.json Entry

```json
{
  "name": "template-name",
  "displayName": "Template Name",
  "description": "Description",
  "version": "1.0.0",
  "path": "template-name",
  "author": "Author Name",
  "tags": ["tag1", "tag2"],
  "crewxVersion": ">=0.3.0",
  "features": ["Feature 1", "Feature 2"]
}
```

## Validation Checklist

- [ ] Template directory exists
- [ ] crewx.yaml present with metadata
- [ ] README.md present
- [ ] templates.json includes entry
- [ ] Metadata name matches directory name
- [ ] All referenced files exist
- [ ] No broken links in README

## Adding New Template

Steps:
1. Create template directory: `mkdir template-name`
2. Create crewx.yaml with metadata
3. Create README.md with usage guide
4. Add entry to templates.json
5. Test: `crewx template init template-name`
