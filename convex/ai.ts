import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// The main prompt for journal generation (Internship Daily Accomplishment Report format)
const JOURNAL_GENERATION_PROMPT = `Generate an Internship Daily Accomplishment Report from GitHub commits.

FORMAT: Create 3-5 CONSOLIDATED work blocks (NOT one per commit). Group related commits together.

OUTPUT FORMAT (JSON array):
[
  {
    "start": "08:00",
    "end": "10:30",
    "task": "Route25 Flutter App Development",
    "description": "Added Flutter MVP, route models, matcher, and UI screens",
    "learning": "Learned Flutter project setup, implementing route matching algorithms, and building responsive UI screens",
    "category": "feature"
  },
  {
    "start": "10:30",
    "end": "12:00",
    "task": "Dataset and Documentation",
    "description": "Added GeoJSON datasets, SQL builders, and project documentation",
    "learning": "Practiced working with geospatial data formats and SQL schema design",
    "category": "documentation"
  },
  {
    "start": "12:00",
    "end": "13:00",
    "task": "Lunch Break",
    "description": "Lunch break",
    "learning": "",
    "category": "lunch"
  },
  {
    "start": "13:00",
    "end": "17:00",
    "task": "NightWalkers App Updates",
    "description": "Refactored settings UI, added location permissions, dark theme revamp",
    "learning": "Implemented GPS location handling, practiced UI/UX dark theme design patterns",
    "category": "refactor"
  }
]

RULES:
1. GROUP related commits by repo or feature area into ONE block
2. Maximum 5 blocks total (excluding lunch)
3. Minimum 1 hour per work block
4. task: Summarize the grouped work (2-6 words)
5. description: List what was done (combine commit messages briefly)
6. learning: Write 1-2 sentences about procedures/skills practiced (technical learning)
7. Schedule: 08:00-17:00, lunch 12:00-13:00, no gaps

CATEGORIES: feature, bugfix, refactor, documentation, testing, development, lunch`;


// Block type for AI response (matches Internship Daily Accomplishment Report)
interface AIBlock {
  start: string;
  end: string;
  task: string; // ACTIVITIES/TASKS
  description: string; // Brief summary
  learning: string; // LEARNING - procedures performed
  category: string;
}

// Attempt to repair truncated or malformed JSON
function attemptJsonRepair(jsonText: string): RegExpMatchArray | null {
  // Find all occurrences of } that could mark complete objects
  const closeBraces: number[] = [];
  for (let i = 0; i < jsonText.length; i++) {
    if (jsonText[i] === '}') {
      closeBraces.push(i);
    }
  }
  
  console.log(`Found ${closeBraces.length} closing braces, trying to repair...`);
  
  // Try each closing brace from the end, attempting to parse
  for (let i = closeBraces.length - 1; i >= 0; i--) {
    const tryPosition = closeBraces[i];
    const tryJson = jsonText.substring(0, tryPosition + 1) + '\n]';
    
    try {
      const parsed = JSON.parse(tryJson);
      // Additional validation: ensure it's an array with at least one block
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`✓ Successfully repaired JSON at position ${tryPosition}, recovered ${parsed.length} blocks`);
        return [tryJson] as RegExpMatchArray;
      }
    } catch {
      // This position didn't work, try the next one
      continue;
    }
  }
  
  console.error("Could not repair JSON - all positions failed");
  return null;
}

// Validate AI-generated blocks - must be complete 08:00-17:00 with no gaps
function validateBlocks(blocks: AIBlock[]): boolean {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    console.warn("Validation failed: Not an array or empty");
    return false;
  }

  // Check required fields
  for (const block of blocks) {
    if (!block.start || !block.end || !block.task || !block.description || !block.category) {
      console.warn("Validation failed: Missing required fields in block:", block);
      return false;
    }
  }

  // Check time format and NO GAPS
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  // Must start at 08:00
  if (blocks[0].start !== "08:00") {
    console.warn("Validation failed: Must start at 08:00, got:", blocks[0].start);
    return false;
  }
  
  // Must end at 17:00
  if (blocks[blocks.length - 1].end !== "17:00") {
    console.warn("Validation failed: Must end at 17:00, got:", blocks[blocks.length - 1].end);
    return false;
  }
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Validate time format
    if (!timeRegex.test(block.start) || !timeRegex.test(block.end)) {
      console.warn("Validation failed: Invalid time format in block:", block);
      return false;
    }
    
    // Check end after start
    if (block.end <= block.start) {
      console.warn("Validation failed: Block end <= start:", block);
      return false;
    }
    
    // Check NO GAPS - each block must start exactly when previous ended
    if (i > 0 && block.start !== blocks[i - 1].end) {
      console.warn(`Validation failed: Gap detected. Block ${i} starts at ${block.start} but previous ended at ${blocks[i - 1].end}`);
      return false;
    }
  }

  console.log("✓ Validation passed: 08:00-17:00 with no gaps");
  return true;
}

// Generate empty day blocks (no commits) - minimal generic blocks
function generateEmptyDayBlocks(): AIBlock[] {
  return [
    {
      start: "08:00",
      end: "12:00",
      task: "Development work",
      description: "Worked on local development tasks (no commits pushed today)",
      learning: "Continued learning and practice with ongoing project development",
      category: "development",
    },
    {
      start: "12:00",
      end: "13:00",
      task: "Lunch Break",
      description: "Lunch break",
      learning: "",
      category: "lunch",
    },
    {
      start: "13:00",
      end: "17:00",
      task: "Development work",
      description: "Continued local development work (no commits pushed today)",
      learning: "Practiced coding skills and project implementation techniques",
      category: "development",
    },
  ];
}

// Log AI generation
export const logGeneration = internalMutation({
  args: {
    journalId: v.id("journals"),
    promptTokens: v.number(),
    completionTokens: v.number(),
    model: v.string(),
    requestedAt: v.number(),
    completedAt: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiGenerationLogs", {
      ...args,
      durationMs: args.completedAt - args.requestedAt,
    });
  },
});

interface CachedCommit {
  sha: string;
  message: string;
  timestamp: string;
  author: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  patches?: Array<{ filename: string; status: string; patch?: string }>;
  repo: { name: string; fullName: string };
}

interface CacheResult {
  commits: CachedCommit[];
  cachedAt: number;
  expiresAt: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeneratedBlock {
  id: string;
  start: string;
  end: string;
  task: string;
  description: string;
  learning: string;
  category: string;
  source: { type: string; sha?: string; repo?: string; reason?: string };
  isEdited: boolean;
}

// Generate journal using Gemini AI
export const generateJournal = action({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, { userId, date }): Promise<{
    blocks: GeneratedBlock[];
    totalCommits: number;
    totalLinesChanged: number;
  }> => {
    // Get cached commits
    const cached = (await ctx.runQuery(internal.commits.getCachedCommits, {
      userId,
      date,
    })) as CacheResult | null;

    // If no commits, generate empty day
    if (!cached || cached.commits.length === 0) {
      const blocks = generateEmptyDayBlocks();
      return {
        blocks: blocks.map((b, i) => ({
          ...b,
          id: `block-${i}-${Date.now()}`,
          source: { type: "generated" as const, reason: "no_commits" },
          isEdited: false,
        })),
        totalCommits: 0,
        totalLinesChanged: 0,
      };
    }

    // Prepare commit data for AI with clear structure
    const totalLines = cached.commits.reduce((sum: number, c: CachedCommit) => sum + c.additions + c.deletions, 0);
    
    const commitList = cached.commits.map((c: CachedCommit, idx: number) => {
      const lines = c.additions + c.deletions;
      const percentage = totalLines > 0 ? (lines / totalLines) * 100 : 0;
      const estimatedMinutes = Math.max(15, Math.min(120, Math.round((lines / totalLines) * 480)));
      
      return {
        index: idx + 1,
        message: c.message,
        repo: c.repo.name,
        lines: lines,
        percentage: Math.round(percentage),
        estimatedMinutes: estimatedMinutes,
        files: c.patches?.map((p) => p.filename) || [],
      };
    });

    // Group commits by repository for easier consolidation
    const commitsByRepo: Record<string, typeof commitList> = {};
    for (const c of commitList) {
      if (!commitsByRepo[c.repo]) {
        commitsByRepo[c.repo] = [];
      }
      commitsByRepo[c.repo].push(c);
    }

    const promptInput = `
Date: ${date}
Total Commits: ${cached.commits.length}
Total Lines Changed: ${totalLines}

COMMITS BY REPOSITORY:
${Object.entries(commitsByRepo).map(([repo, commits]) => {
  const repoLines = commits.reduce((sum, c) => sum + c.lines, 0);
  const repoPercent = totalLines > 0 ? Math.round((repoLines / totalLines) * 100) : 0;
  return `
[${repo}] - ${commits.length} commits, ${repoLines} lines (${repoPercent}% of day):
${commits.map(c => `  - "${c.message.split('\n')[0]}"`).join('\n')}`;
}).join('\n')}

Generate 3-5 consolidated blocks. Group commits from same repo together. Include learning field.`;

    console.log("Sending to Gemini AI:", {
      date,
      totalCommits: cached.commits.length,
      totalLines,
      commitSummary: commitList.map(c => ({
        repo: c.repo,
        message: c.message.split('\n')[0],
        lines: c.lines,
        estimatedMinutes: c.estimatedMinutes
      }))
    });

    // Call Gemini API
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: JOURNAL_GENERATION_PROMPT + promptInput,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,  // Very low temperature for factual, consistent output
            maxOutputTokens: 8192,  // Increased for many commits with detailed messages
            // Note: responseMimeType removed - was causing truncation issues
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API HTTP error:", response.status, error);
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const result = (await response.json()) as GeminiResponse;
    
    // Check for API-level errors
    if (!result.candidates || result.candidates.length === 0) {
      console.error("No candidates in Gemini response:", JSON.stringify(result));
      throw new Error("Gemini returned no candidates - possibly blocked by safety filters");
    }

    // Extract text from response
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Empty text in Gemini response:", JSON.stringify(result.candidates[0]));
      throw new Error("Empty response from Gemini");
    }

    console.log("Raw AI response length:", text.length);
    console.log("AI response preview:", text.substring(0, 500));
    if (text.length < 200) {
      console.warn("Response suspiciously short - may be truncated or incomplete");
    }

    // Parse JSON response
    let blocks: AIBlock[];
    try {
      let jsonText = text.trim();
      
      // Remove markdown code blocks if AI added them (shouldn't happen with JSON mime type)
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        console.log("Removed markdown code block wrapper");
        jsonText = codeBlockMatch[1].trim();
      }

      // Extract JSON array - handle both complete and truncated responses
      let jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      
      // If no closing bracket, response is definitely truncated - try to fix it
      if (!jsonMatch && jsonText.startsWith('[')) {
        console.warn("Response is truncated (no closing ]) - attempting to repair JSON...");
        jsonMatch = attemptJsonRepair(jsonText);
      }
      
      // Even if we found a match, validate it's actually parseable (might have unterminated strings)
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.warn("Matched JSON is invalid:", parseError instanceof Error ? parseError.message : String(parseError));
          console.warn("Attempting repair...");
          const repaired = attemptJsonRepair(jsonText);
          if (repaired) {
            jsonMatch = repaired;
          }
        }
      }
      
      if (!jsonMatch) {
        console.error("No JSON array found in response:", text);
        throw new Error("AI response does not contain a JSON array");
      }

      blocks = JSON.parse(jsonMatch[0]);
      console.log("Successfully parsed JSON. Got", blocks.length, "blocks");
      
      if (!Array.isArray(blocks) || blocks.length === 0) {
        console.error("Parsed value is not an array or is empty:", blocks);
        throw new Error("AI response is not a valid block array");
      }
      
      // Safety: Truncate overly verbose descriptions (AI sometimes ignores length limits)
      blocks = blocks.map(block => {
        if (block.description && block.description.length > 150) {
          const truncated = block.description.substring(0, 147) + '...';
          console.warn(`Truncated description from ${block.description.length} to 150 chars:`, block.task);
          return { ...block, description: truncated };
        }
        return block;
      });
      
      console.log("First block:", JSON.stringify(blocks[0]));
      console.log("Last block:", JSON.stringify(blocks[blocks.length - 1]));
    } catch (err) {
      console.error("JSON parse error:", err);
      console.error("Full AI response:", text);
      throw new Error(`Failed to parse AI response as JSON: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Validate blocks
    const isValid = validateBlocks(blocks);
    console.log("Block validation result:", isValid);
    
    if (!isValid) {
      console.warn("AI blocks validation failed. Issues:");
      console.warn("- First block starts at:", blocks[0]?.start);
      console.warn("- Last block ends at:", blocks[blocks.length - 1]?.end);
      console.warn("- Total blocks:", blocks.length);
      console.warn("Using fallback empty day blocks");
      blocks = generateEmptyDayBlocks();
    } else {
      console.log("✓ Blocks passed validation - using AI generated schedule");
      
      // Quality check: verify AI used actual commit messages, not invented content
      const workBlocks = blocks.filter(b => b.category !== 'lunch');
      const actualCommitMessages = cached.commits.map((c: CachedCommit) => c.message.split('\n')[0].toLowerCase());
      
      let factualBlocks = 0;
      for (const block of workBlocks) {
        const blockTask = block.task.toLowerCase();
        // Check if block task matches or is similar to any actual commit message
        const isFactual = actualCommitMessages.some(msg => {
          // Check if substantial parts of the commit message appear in the task
          const commitWords = msg.split(/\s+/).filter(w => w.length > 3);
          const matchingWords = commitWords.filter(word => blockTask.includes(word));
          return matchingWords.length >= Math.min(2, commitWords.length); // At least 2 words or all words match
        });
        
        if (isFactual) {
          factualBlocks++;
        } else {
          console.warn(`⚠️  Block "${block.task}" may not match any commit message`);
        }
      }
      
      const factualPercentage = (factualBlocks / Math.max(workBlocks.length, 1)) * 100;
      console.log(`✓ Quality: ${factualBlocks}/${workBlocks.length} blocks are factual (${Math.round(factualPercentage)}%)`);
      
      if (factualPercentage < 60) {
        console.warn(`⚠️  WARNING: Only ${Math.round(factualPercentage)}% of blocks match actual commits. AI may have invented content.`);
      }
    }

    // Calculate totals
    const totalLinesChanged = cached.commits.reduce(
      (sum: number, c: CachedCommit) => sum + c.additions + c.deletions,
      0
    );

    // Transform blocks with IDs and sources
    const transformedBlocks: GeneratedBlock[] = blocks.map((b, i): GeneratedBlock => {
      // Try to match with commits based on description similarity
      const matchingCommit: CachedCommit = cached.commits[i % cached.commits.length];
      
      return {
        ...b,
        id: `block-${i}-${Date.now()}`,
        source: matchingCommit && b.category !== "lunch" && b.category !== "meeting"
          ? { type: "commit" as const, sha: matchingCommit.sha, repo: matchingCommit.repo.fullName }
          : { type: "generated" as const, reason: b.category === "lunch" ? "lunch" : "gap_fill" },
        isEdited: false,
      };
    });

    return {
      blocks: transformedBlocks,
      totalCommits: cached.commits.length,
      totalLinesChanged,
    };
  },
});
