# LogSync AI - Prompt Engineering Guide

## Overview

This document contains all AI prompts used in LogSync AI for journal generation. These prompts are designed for Google Gemini 3 Flash Preview (gemini-3-flash-preview).

**Approach**: Forces a fixed 08:00-17:00 work schedule with NO gaps. Commits are distributed across the day based on lines of code changed. Uses actual commit messages as journal content.

---

## Primary Journal Generation Prompt

### System Context

```
You are a professional work journal generator. Create a complete 08:00-17:00 work schedule from GitHub commits. NO gaps allowed.
```

### Main Prompt Template

```
# TASK
You are a professional work journal generator. Create a complete 08:00-17:00 work schedule from GitHub commits.

# CRITICAL RULES
1. Schedule MUST start at exactly 08:00
2. Schedule MUST end at exactly 17:00
3. NO GAPS allowed - every minute from 08:00 to 17:00 must be accounted for
4. Include a 12:00-13:00 lunch break
5. Use commit messages as the PRIMARY content - do not invent tasks

# TIME DISTRIBUTION
Distribute commits across the work day (08:00-12:00 and 13:00-17:00 = 8 working hours).
Use the number of LINES CHANGED to determine block duration:
- Total work minutes = 480 (8 hours minus lunch)
- Each commit gets time proportional to its lines changed
- Minimum block: 15 minutes
- Maximum block: 3 hours

Example calculation:
- Total lines changed across all commits: 500
- Commit A has 100 lines → 100/500 = 20% → 96 minutes
- Commit B has 50 lines → 50/500 = 10% → 48 minutes

# COMMIT MESSAGE HANDLING
Use the ACTUAL commit messages as task/description content:
- Task title: Clean up the commit subject line (first line)
- Description: Use the commit body if present, otherwise expand on the subject
- Keep technical accuracy - do not invent features not mentioned

# CATEGORY ASSIGNMENT
Choose the most appropriate category based on commit content:
- feature: New functionality (keywords: add, new, create, implement, build)
- bugfix: Bug fixes (keywords: fix, bug, issue, resolve, patch, correct)
- refactor: Code improvements (keywords: refactor, clean, improve, optimize)
- documentation: Writing docs (keywords: doc, readme, comment)
- testing: Test writing (keywords: test, spec, coverage)
- development: General coding work (default if unclear)

# OUTPUT FORMAT (CRITICAL)
Return ONLY a valid JSON array. NO markdown, NO explanation, NO code fences.
Times in HH:MM 24-hour format. Schedule MUST be 08:00-17:00 with NO gaps.
Include repository name at end of description in square brackets like: [repo-name]

Example output (complete 08:00-17:00 schedule):
[
  {
    "start": "08:00",
    "end": "10:30",
    "task": "Implement user authentication",
    "description": "Added GitHub OAuth flow with token management. Set up session handling and user profile sync. [auth-service]",
    "category": "feature"
  },
  {
    "start": "10:30",
    "end": "12:00",
    "task": "Fix login redirect bug",
    "description": "Resolved issue where users were not redirected after login. Updated callback URL handling. [web-app]",
    "category": "bugfix"
  },
  {
    "start": "12:00",
    "end": "13:00",
    "task": "Lunch Break",
    "description": "Lunch break",
    "category": "lunch"
  },
  {
    "start": "13:00",
    "end": "15:00",
    "task": "Refactor API endpoints",
    "description": "Restructured REST API for better maintainability. Separated concerns and added error handling. [backend-api]",
    "category": "refactor"
  },
  {
    "start": "15:00",
    "end": "17:00",
    "task": "Update documentation",
    "description": "Wrote API documentation and updated README with setup instructions. [backend-api]",
    "category": "documentation"
  }
]

# INPUT DATA FORMAT
Commits will be provided with:
- repo: Repository name
- message: Full commit message
- additions/deletions: Lines of code changed (use for time distribution)
- files: Array of file paths changed

Use lines changed to determine how much time each commit gets proportionally.
Add repository name at end of description in brackets.
```

---

## Empty Day Prompt

When no commits exist for the day:

```
# APPROACH
Since there are no commits, generate a placeholder schedule with vague references to ongoing work.
Do NOT mention specific features or tasks. Use generic descriptions that reference "continuing previous work" or "ongoing development."

The schedule MUST still be complete 08:00-17:00 with no gaps.

# OUTPUT FORMAT
Return a complete JSON array with blocks like:
- Morning standup/planning
- Code review
- Ongoing development work
- Lunch break (12:00-13:00)
- Development continuation
- Documentation and planning
```

---

## Regeneration Prompt
Return either:
- Empty array: []
- Or minimal activity blocks with realistic times
```

---

## Regeneration Prompt

When user requests to regenerate a single block:

```
# TASK
Regenerate ONLY this specific time block with a new professional description. Keep the same time slot.

# CURRENT BLOCK
{
  "start": "{start}",
  "end": "{end}",
  "task": "{currentTask}",
  "description": "{currentDescription}",
  "category": "{currentCategory}"
}

# ORIGINAL COMMIT DATA
{
  "message": "{originalCommitMessage}",
  "additions": {additions},
  "deletions": {deletions},
  "files": {files}
}

# INSTRUCTIONS
- Generate a DIFFERENT but equally valid professional description
- Keep the same time slot ({start}-{end})
- May suggest a different appropriate category
- Task title can be refined

# OUTPUT FORMAT
Return ONLY ONE JSON object (not an array):
{
  "start": "{start}",
  "end": "{end}",
  "task": "New Task Title",
  "description": "New professional description...",
  "category": "appropriate_category"
}
```

---

## Description Enhancement Prompt

For enhancing a single description without changing structure:

```
# TASK
Enhance this description to be more professional and detailed while maintaining accuracy.

# CURRENT
"{currentDescription}"

# CONTEXT
- Task: {task}
- Files changed: {files}
- Lines: +{additions} -{deletions}

# RULES
- Keep it to 1-3 sentences
- Use professional language
- Be specific about the technical work


# OUTPUT
Return ONLY the enhanced description text (no JSON, no quotes).
```

---

## Prompt Variables Reference

| Variable | Type | Description |
|----------|------|-------------|
| `{date}` | string | YYYY-MM-DD format |
| `{commits}` | array | Array of commit objects |
| `{totalCommits}` | number | Count of commits |
| `{start}` | string | HH:MM format |
| `{end}` | string | HH:MM format |
| `{task}` | string | Current task title |
| `{currentDescription}` | string | Current description |
| `{currentCategory}` | string | Current category |
| `{additions}` | number | Lines added |
| `{deletions}` | number | Lines deleted |
| `{files}` | array | List of changed files |

---

## Example Transformations

### Casual → Professional

| Original Commit | Professional Task | Professional Description |
|-----------------|-------------------|--------------------------|
| "fixed centering div" | "UI Layout Optimization" | "Resolved CSS alignment issues in the main interface. Applied flexbox centering techniques for improved cross-browser consistency." |
| "lol this should work now" | "Bug Resolution" | "Debugged and resolved application functionality issue. Implemented comprehensive fix with validation testing." |
| "WIP: auth stuff" | "Authentication Implementation" | "Progressed on user authentication module. Developed foundational security components for the login system." |
| "cleanup" | "Code Quality Improvement" | "Performed code refactoring to improve maintainability. Removed deprecated patterns and optimized file structure." |
| "tests" | "Test Coverage Expansion" | "Developed comprehensive unit tests for critical application components. Improved code coverage and reliability metrics." |
| "merge main" | "Branch Integration" | "Integrated latest changes from main branch. Resolved merge conflicts and ensured compatibility with existing features." |

---

## Error Handling Prompts

### Invalid JSON Recovery

When the AI returns invalid JSON, send this follow-up:

```
The previous response was not valid JSON. Please regenerate ONLY the JSON array of work blocks.

Rules:
- Start output immediately with [ character
- End with ] character  
- No markdown code blocks
- No explanatory text
- Valid JSON only
```

### Incomplete Schedule Recovery

When blocks don't cover full day:

```
The schedule is incomplete. Current blocks end at {lastEndTime} but must end at 17:00.

Add additional blocks to fill the remaining time until 17:00. Use appropriate filler activities (review, documentation, meetings).

Return ONLY the additional blocks needed as a JSON array.
```

---

## Model Configuration

### Gemini 3 Flash Preview Settings

```javascript
const generationConfig = {
  temperature: 0.7,        // Balance creativity and consistency
  maxOutputTokens: 2000,   // Enough for full day schedule
};
```

### Why These Settings

- **Temperature 0.7**: Provides varied descriptions without being too random
- **maxOutputTokens 2000**: ~8 blocks × 100 tokens each + buffer
- **Model**: gemini-3-flash-preview - Latest Gemini model with improved JSON output

---

## Token Optimization

### Diff Truncation Strategy

```typescript
// Truncate patches to save tokens
const MAX_PATCH_LENGTH = 500; // chars per file
const MAX_FILES_PER_COMMIT = 5;

const truncatePatch = (patch: string): string => {
  if (patch.length <= MAX_PATCH_LENGTH) return patch;
  return patch.slice(0, MAX_PATCH_LENGTH) + "\n... [truncated]";
};
```

### Estimated Token Usage

| Component | Estimated Tokens |
|-----------|------------------|
| System prompt | ~400 |
| Input (5 commits) | ~300-500 |
| Output (8 blocks) | ~400-600 |
| **Total per request** | **~1,100-1,500** |

---

## Testing Prompts

### Validation Checklist

Before deploying prompt changes, verify:

- [ ] Output is valid JSON
- [ ] Times are in HH:MM 24-hour format
- [ ] Schedule starts at exactly 08:00
- [ ] Schedule ends at exactly 17:00
- [ ] NO GAPS - each block starts exactly when previous ended
- [ ] Includes 12:00-13:00 lunch break
- [ ] Each block has end > start
- [ ] All categories are valid
- [ ] Content uses actual commit messages (not invented)
- [ ] Time distribution reflects lines changed

### Test Cases

1. **Single commit day** - Commit gets most of morning/afternoon, rest filled with generic blocks
2. **Heavy commit day (20+)** - Distributed proportionally by lines changed
3. **Empty day** - Full 08:00-17:00 with vague "ongoing work" descriptions
4. **Commits with detailed messages** - Should use commit body in description
5. **Large commit (500+ lines)** - Gets proportionally more time than small commits
6. **Multiple small commits** - Each gets minimum 15 min block
