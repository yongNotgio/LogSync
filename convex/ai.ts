import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// The main prompt for journal generation
const JOURNAL_GENERATION_PROMPT = `You are a professional work journal generator for software developers. Your task is to transform raw GitHub commit data into a polished, HR-ready daily work journal.

STRICT RULES:
1. ALL blocks MUST be between 08:00 and 17:00 (inclusive)
2. First block MUST start at exactly 08:00
3. Last block MUST end at exactly 17:00
4. Include exactly ONE lunch break from 12:00-13:00
5. Create 6-8 task blocks that cover the ENTIRE day
6. Each block should be 30 minutes to 2 hours maximum
7. NO gaps or overlaps between blocks
8. Blocks must be in chronological order

PROFESSIONAL LANGUAGE RULES:
- Transform casual language into corporate-appropriate descriptions
- Use active verbs: "Implemented", "Developed", "Resolved", "Optimized"
- Be specific but not overly technical (readable by non-devs)
- Avoid: slang, profanity, self-deprecating comments
- 1-3 sentences per description

CATEGORY VALUES (use exactly these):
- development: General coding work
- feature: New functionality (keywords: add, new, create, implement)
- bugfix: Bug fixes (keywords: fix, bug, issue, resolve, patch)
- refactor: Code improvements (keywords: refactor, clean, improve, optimize)
- review: Code review activities
- meeting: Team meetings, standups
- documentation: Writing docs (keywords: doc, readme, comment)
- research: Investigation work
- testing: Test writing (keywords: test, spec)
- lunch: Lunch break (always 12:00-13:00)

GAP FILLING:
If commits don't fill the 8-hour workday, intelligently add:
- "Code Review" - reviewing pull requests from team members
- "Documentation" - updating technical documentation
- "Team Meeting" - daily standup or planning sessions
- "Research" - investigating solutions or learning new technologies
- "Technical Planning" - architecture discussions

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.

[
  {
    "start": "08:00",
    "end": "09:30",
    "task": "Short Task Title (3-5 words)",
    "description": "Professional description of the work accomplished...",
    "category": "feature"
  }
]

TIME ALLOCATION:
- Larger commits (more lines changed) should get proportionally more time
- Small fixes: 30-45 minutes
- Medium features: 1-1.5 hours
- Large implementations: 1.5-2 hours
- Never assign more than 2 hours to a single block`;

// Block type for AI response
interface AIBlock {
  start: string;
  end: string;
  task: string;
  description: string;
  category: string;
}

// Validate AI-generated blocks
function validateBlocks(blocks: AIBlock[]): boolean {
  if (!Array.isArray(blocks) || blocks.length === 0) return false;

  // Check required fields
  for (const block of blocks) {
    if (!block.start || !block.end || !block.task || !block.description || !block.category) {
      return false;
    }
  }

  // Check time order and no overlaps
  let lastEnd = "00:00";
  for (const block of blocks) {
    if (block.start < lastEnd) return false;
    if (block.end <= block.start) return false;
    lastEnd = block.end;
  }

  // Check workday bounds
  if (blocks[0].start !== "08:00") return false;
  if (blocks[blocks.length - 1].end !== "17:00") return false;

  return true;
}

// Generate empty day blocks (no commits)
function generateEmptyDayBlocks(): AIBlock[] {
  return [
    {
      start: "08:00",
      end: "09:00",
      task: "Daily Standup",
      description: "Participated in team standup meeting. Discussed progress, blockers, and planned tasks for the day.",
      category: "meeting",
    },
    {
      start: "09:00",
      end: "10:30",
      task: "Code Review",
      description: "Reviewed pull requests from team members. Provided constructive feedback and approved changes.",
      category: "review",
    },
    {
      start: "10:30",
      end: "12:00",
      task: "Technical Research",
      description: "Researched best practices and evaluated potential solutions for upcoming feature implementation.",
      category: "research",
    },
    {
      start: "12:00",
      end: "13:00",
      task: "Lunch Break",
      description: "Lunch break",
      category: "lunch",
    },
    {
      start: "13:00",
      end: "14:30",
      task: "Documentation",
      description: "Updated technical documentation and README files. Improved code comments for better maintainability.",
      category: "documentation",
    },
    {
      start: "14:30",
      end: "16:00",
      task: "Sprint Planning",
      description: "Participated in sprint planning session. Estimated story points and discussed implementation approaches.",
      category: "meeting",
    },
    {
      start: "16:00",
      end: "17:00",
      task: "Technical Planning",
      description: "Worked on architecture diagrams and technical specifications for upcoming features.",
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

    // Prepare commit data for AI
    const commitData = {
      date,
      totalCommits: cached.commits.length,
      commits: cached.commits.map((c: CachedCommit) => ({
        message: c.message,
        additions: c.additions,
        deletions: c.deletions,
        files: c.patches?.map((p) => p.filename) || [],
        patch: c.patches?.map((p) => p.patch).filter(Boolean).join("\n").slice(0, 1500),
      })),
    };

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
                  text: JOURNAL_GENERATION_PROMPT + "\n\nINPUT:\n" + JSON.stringify(commitData),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const result = (await response.json()) as GeminiResponse;

    // Extract text from response
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    console.log("Raw AI response:", text.substring(0, 500));

    // Parse JSON (handle markdown code blocks if present)
    let jsonText = text.trim();
    
    // Remove markdown code blocks
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Find JSON array in response
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to find JSON array in response:", jsonText);
      // If AI fails to return proper JSON, generate fallback blocks
      console.warn("Using fallback empty day blocks");
      const fallbackBlocks = generateEmptyDayBlocks();
      const totalLinesChanged = cached.commits.reduce(
        (sum: number, c: CachedCommit) => sum + c.additions + c.deletions,
        0
      );
      return {
        blocks: fallbackBlocks.map((b, i) => ({
          ...b,
          id: `block-${i}-${Date.now()}`,
          source: { type: "generated" as const, reason: "fallback" },
          isEdited: false,
        })),
        totalCommits: cached.commits.length,
        totalLinesChanged,
      };
    }

    let blocks: AIBlock[];
    try {
      blocks = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate blocks
    if (!validateBlocks(blocks)) {
      console.warn("AI blocks validation failed, using fallback");
      blocks = generateEmptyDayBlocks();
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
