---
name: nemotron-persona
description: Persona simulation skill powered by NVIDIA Nemotron-Personas-Korea dataset (1M Korean personas). Demographic-based search and conversation.
metadata:
  version: 0.2.0
  dataset: nvidia/Nemotron-Personas-Korea
  license: CC BY 4.0
---

# Nemotron Persona Skill

Large-scale persona simulation using the **NVIDIA Nemotron-Personas-Korea** dataset (1M Korean personas, CC BY 4.0), reflecting real demographic distributions.

> Operates independently from the `persona` skill (manual 55 profiles).

## File Structure

```
skills/nemotron-persona/
├── .gitignore              # Excludes .data/
├── SKILL.md
├── package.json            # duckdb dependency
├── nemotron-persona.js     # Main CLI facade
├── crewx.yaml              # nemotron_persona_actor agent
└── .data/                  # Parquet file storage (gitignored)
    ├── 0.parquet
    ├── 1.parquet
    └── ...
```

## Installation

```bash
cd skills/nemotron-persona
npm install
```

## Commands

### Dataset Management

```bash
# Download 9 parquet shards (~2GB)
node nemotron-persona.js download

# Check download status
node nemotron-persona.js status
```

### Search & Filter

```bash
# Basic search (5 random samples)
node nemotron-persona.js search

# Demographic filter combinations
node nemotron-persona.js search --age=20-30 --province=서울특별시
node nemotron-persona.js search --sex=여성 --occupation=교사
node nemotron-persona.js search --age=40-50 --district=강남구 --limit=10
```

**Search Options:**

| Option | Description | Example |
|--------|-------------|---------|
| `--age=N-M` | Age range | `--age=25-35` |
| `--sex=value` | Gender | `남성` \| `여성` |
| `--province=value` | Province/City | `서울특별시` |
| `--district=value` | District | `강남구` |
| `--occupation=value` | Occupation (partial match) | `교사` |
| `--education=value` | Education level (partial match) | `4년제` |
| `--limit=N` | Result count (default: 5) | `--limit=10` |

### Pick Persona

```bash
# View specific persona by UUID
node nemotron-persona.js pick abc123-...

# Random pick (with optional filters)
node nemotron-persona.js pick --random
node nemotron-persona.js pick --random --age=30-40 --sex=여성
```

### Conversation (Simulation)

```bash
# Converse with a specific persona by UUID
node nemotron-persona.js query abc123-... "자기소개 해주세요"

# Converse with a random persona (with optional filters)
node nemotron-persona.js query --random "AI 도구 사용하시나요?"
node nemotron-persona.js query --random --age=20-30 --province=서울특별시 "취업 걱정이 있으신가요?"
```

## Dataset Info

- **Source**: `nvidia/Nemotron-Personas-Korea` (HuggingFace)
- **Scale**: 1M rows, 9 parquet shards (~2GB)
- **License**: CC BY 4.0
- **Key columns**: `uuid`, `persona`, `professional_persona`, `sports_persona`, `arts_persona`, `travel_persona`, `culinary_persona`, `family_persona`, `sex`, `age`, `province`, `district`, `occupation`, `education_level`, etc. (26 total)

## Output Examples

### search

```
🔍 Filter: age=25-35, province=서울특별시
📊 Matched: 5 samples from 48,231

1. (Age 29, Male) — 서울특별시 강남구, Software Developer
   "A backend developer dreaming of becoming a digital nomad..."
   uuid: abc123-...
```

### pick

```
👤 (uuid: abc123-...)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Age: 71 | Gender: Female | Location: 서울특별시 서초구
Occupation: Accounting Clerk | Education: 4-year University (Natural Science)
Marital: Married | Housing: Multi-unit

📋 General: "..."
💼 Professional: "..."
```

## Notes

1. **Disk space**: 9 shards total ~2GB. Ensure sufficient free space.
2. **First run**: Must run `download` before search/conversation is available.
3. **Simulation limits**: AI inference based on dataset — not related to real individuals.
4. **License**: CC BY 4.0 — free to use with attribution.

## Version History

| Version | Changes |
|---------|---------|
| v0.2.0 | Renamed from persona2 to nemotron-persona |
| v0.1.0 | Initial version — Nemotron-Personas-Korea integration, DuckDB-based search |
