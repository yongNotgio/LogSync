# AI Prompt Improvements

## Changes Made (March 2, 2026)

### Issues Fixed
1. **Not using actual commit messages properly** - AI was inventing generic descriptions
2. **Time distribution incorrect** - Wasn't properly allocating time based on lines changed
3. **Descriptions too generic** - Adding made-up technical fluff

### Prompt Improvements

#### 1. Clearer Content Rules
- Added explicit examples of GOOD vs BAD output
- Emphasized using EXACT commit messages
- Prohibited generic phrases like "robust", "enhanced", "optimized" unless in commit
- Added directive to use commit body if present

#### 2. Better Time Calculation
- Explicit calculation formula provided:
  - Total lines changed percentage
  - Multiply by 480 minutes (8 hrs - lunch)
  - Round to nearest 15 minutes
  - Min: 15 min, Max: 120 min

#### 3. Structured Input Format
```
[COMMIT 1]
Message: <actual message>
Lines: 100 (20% of total)
Estimated Time: 96 minutes
Files: file1.ts, file2.ts
```

#### 4. Technical Improvements
- Increased `maxOutputTokens` from 2000 to 4096 (handles more commits)
- Lowered `temperature` from 0.7 to 0.3 (more consistent, less creative)
- Added `responseMimeType: "application/json"` for cleaner responses
- Better JSON extraction with incomplete response handling

#### 5. Quality Monitoring
- Added post-generation quality check
- Verifies AI used actual commit content (word matching)
- Warns if <50% match with commits
- Logs detailed generation metrics

### Expected Results

**Before:**
```
Task: "Critical Authentication System Enhancement"
Description: "Implemented robust OAuth authentication flow with advanced security protocols. Enhanced session management for improved system reliability and optimized user experience through comprehensive error handling."
```

**After:**
```
Task: "Add GitHub OAuth"
Description: "Added GitHub OAuth integration with token management. [auth-service]"
```

Note: Repository name is now included at the end of each description in square brackets.

### Testing

To verify improvements:
1. Fetch commits for a day with detailed commit messages
2. Generate journal
3. Check Convex logs for quality percentage
4. Verify task/description matches commit content

### Future Improvements

If quality is still not satisfactory:
- Consider fine-tuning a model on example input/output pairs
- Add few-shot examples directly in the prompt
- Implement retry logic with quality threshold
- Build a custom microservice with better model control
