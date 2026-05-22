import { countTokens as gptCountTokens } from "gpt-tokenizer";
import { cosineSimilarity } from "../lib/vector-search.js";
import { getEmbedding, getBatchEmbeddings } from "../lib/ai-router.js";

const SIMILARITY_THRESHOLD = 0.72;
const MAX_RULES_RETURNED = 20;
const SUMMARY_SENTENCES = 2;

const embeddingCache = new Map<string, { embedding: number[]; updatedAt: string }>();

export interface RuleDoc {
  _id: { toString(): string };
  name: string;
  content: string;
  priority?: number;
  category?: string;
  tags?: string[];
  updatedAt?: string;
  embedding?: number[];
  skillsContent?: string;
  [key: string]: unknown;
}

export interface RankedRule {
  id: string;
  name: string;
  content: string;
  priority: number;
  category: string;
  similarity: number;
  truncated: boolean;
}

export interface SkillMeta {
  id: string;
  name: string;
  summary: string;
  tokenCount: number;
}

export interface SmartSelectResult {
  rules: RankedRule[];
  skills: SkillMeta[];
  skippedRules: number;
  dedupedRules: number;
  totalRules: number;
  tokenCount: number;
}

async function batchEmbed(texts: string[]): Promise<number[][]> {
  // Let the AI router handle batching (Gemini or Azure)
  const truncated = texts.map((t) => t.substring(0, 8000));
  return getBatchEmbeddings(truncated);
}

function summarizeContent(content: string, maxSentences: number = SUMMARY_SENTENCES): string {
  const sentences = content.match(/[^.!?\n]+[.!?\n]*/g);
  if (!sentences || sentences.length <= maxSentences) return content;
  return sentences.slice(0, maxSentences).join(" ").trim() + "...";
}

function extractSkillSummary(skillContent: string): string {
  const firstLine = skillContent.split("\n").find((l) => l.trim().length > 0);
  if (!firstLine) return "";
  return firstLine.replace(/^#+\s*|^\*\*\s*|\s*\*\*$/g, "").trim();
}

function countTokensLocal(text: string): number {
  try {
    return gptCountTokens(text);
  } catch {
    return Math.ceil(text.length / 4);
  }
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export function deduplicateRules(rules: RankedRule[]): { rules: RankedRule[]; dedupedCount: number } {
  if (rules.length <= 1) return { rules, dedupedCount: 0 };

  const deduped: RankedRule[] = [];
  let dedupedCount = 0;

  for (const rule of rules) {
    const normalized = normalizeText(rule.content);
    let merged = false;

    for (const existing of deduped) {
      const existingNorm = normalizeText(existing.content);
      const similarity = jaccardSimilarity(normalized, existingNorm);

      if (similarity > 0.8) {
        merged = true;
        dedupedCount++;
        break;
      }

      if (normalized.includes(existingNorm) || existingNorm.includes(normalized)) {
        const shorter = normalized.length <= existingNorm.length ? rule : existing;
        const longer = normalized.length > existingNorm.length ? rule : existing;
        if (shorter.content.length / longer.content.length > 0.3) {
          merged = true;
          dedupedCount++;
          break;
        }
      }
    }

    if (!merged) {
      deduped.push(rule);
    }
  }

  return { rules: deduped, dedupedCount };
}

function truncateByPriority(
  rules: RankedRule[],
  maxTokens: number
): { rules: RankedRule[]; skipped: number } {
  let budget = maxTokens;
  const kept: RankedRule[] = [];
  const skipped: RankedRule[] = [];

  const high = rules.filter((r) => r.priority !== undefined && r.priority <= 3);
  for (const r of high) {
    const tokens = countTokensLocal(r.content);
    if (tokens <= budget) {
      budget -= tokens;
      kept.push(r);
    } else {
      skipped.push(r);
    }
  }

  const medium = rules.filter((r) => r.priority !== undefined && r.priority > 3 && r.priority <= 7);
  for (const r of medium) {
    const tokens = countTokensLocal(r.content);
    if (tokens <= budget * 0.5) {
      r.truncated = false;
      budget -= tokens;
      kept.push(r);
    } else {
      const summary = summarizeContent(r.content);
      const summaryTokens = countTokensLocal(summary);
      if (summaryTokens <= budget) {
        budget -= summaryTokens;
        kept.push({ ...r, content: summary, truncated: true });
      } else {
        skipped.push(r);
      }
    }
  }

  const low = rules.filter((r) => r.priority === undefined || r.priority > 7);
  for (const r of low) {
    const summary = summarizeContent(r.content);
    const summaryTokens = countTokensLocal(summary);
    if (summaryTokens <= budget * 0.25) {
      budget -= summaryTokens;
      kept.push({ ...r, content: summary, truncated: true });
    } else {
      skipped.push(r);
    }
  }

  return { rules: kept, skipped: skipped.length };
}

export async function rankRulesByTask(
  task: string,
  rules: RuleDoc[],
  maxTokens: number = 4000
): Promise<SmartSelectResult> {
  if (!task || rules.length === 0) {
    return { rules: [], skills: [], skippedRules: 0, dedupedRules: 0, totalRules: rules.length, tokenCount: 0 };
  }

  // Separate rules from skills (docs with skillsContent)
  const skillDocs = rules.filter((r) => r.skillsContent);
  const ruleDocs = rules.filter((r) => !r.skillsContent);

  const skills: SkillMeta[] = skillDocs.map((s) => {
    const name = (s.name as string) || "Untitled Skill";
    const skillContent = (s.skillsContent as string) || "";
    return {
      id: s._id.toString(),
      name,
      summary: extractSkillSummary(skillContent),
      tokenCount: countTokensLocal(skillContent),
    };
  });

  if (ruleDocs.length === 0) {
    return { rules: [], skills, skippedRules: 0, dedupedRules: 0, totalRules: rules.length, tokenCount: skills.reduce((s, sk) => s + sk.tokenCount, 0) };
  }

  // 1. Embed the task
  const taskEmbedding = await generateTaskEmbedding(task);

  // 2. Identify rules needing embedding
  const rulesNeedingEmbedding: { rule: RuleDoc; index: number }[] = [];
  const embeddings: (number[] | null)[] = new Array(ruleDocs.length).fill(null);

  for (let i = 0; i < ruleDocs.length; i++) {
    const rule = ruleDocs[i]!;
    const id = rule._id.toString();
    const cached = embeddingCache.get(id);
    if (cached && cached.updatedAt === rule.updatedAt) {
      embeddings[i] = cached.embedding;
    } else {
      rulesNeedingEmbedding.push({ rule, index: i });
    }
  }

  // 3. Batch-embed rules that need it
  if (rulesNeedingEmbedding.length > 0) {
    const texts = rulesNeedingEmbedding.map((r) => `${r.rule.name}\n${r.rule.content}`);
    const newEmbeddings = await batchEmbed(texts);
    for (let j = 0; j < rulesNeedingEmbedding.length; j++) {
      const entry = rulesNeedingEmbedding[j]!;
      const emb = newEmbeddings[j]!;
      embeddings[entry.index] = emb;
      embeddingCache.set(entry.rule._id.toString(), { embedding: emb, updatedAt: entry.rule.updatedAt || "" });
    }
  }

  // 4. Compute similarity scores
  const scored: Array<{ rule: RuleDoc; similarity: number }> = [];
  for (let i = 0; i < ruleDocs.length; i++) {
    const emb = embeddings[i];
    if (!emb) continue;
    const sim = cosineSimilarity(taskEmbedding, emb);
    if (sim >= SIMILARITY_THRESHOLD) {
      scored.push({ rule: ruleDocs[i]!, similarity: sim });
    }
  }

  // 5. Sort by similarity descending
  scored.sort((a, b) => b.similarity - a.similarity);

  // 6. Convert to RankedRule
  const ranked: RankedRule[] = scored.map((s) => ({
    id: s.rule._id.toString(),
    name: s.rule.name,
    content: s.rule.content as string,
    priority: (s.rule.priority as number) || 50,
    category: (s.rule.category as string) || "general",
    similarity: s.similarity,
    truncated: false,
  }));

  // 7. Deduplicate
  const { rules: dedupedRules, dedupedCount } = deduplicateRules(ranked);

  // 8. Apply truncation
  const { rules: kept, skipped } = truncateByPriority(dedupedRules, maxTokens);

  // 9. Calculate token count
  const rulesTokenCount = kept.reduce((sum, r) => sum + countTokensLocal(r.content), 0);
  const skillsTokenCount = skills.reduce((sum, s) => sum + s.tokenCount, 0);

  return {
    rules: kept.slice(0, MAX_RULES_RETURNED),
    skills,
    skippedRules: skipped + (scored.length - ranked.length),
    dedupedRules: dedupedCount,
    totalRules: rules.length,
    tokenCount: rulesTokenCount + skillsTokenCount,
  };
}

async function generateTaskEmbedding(task: string): Promise<number[]> {
  return getEmbedding(task.substring(0, 8000));
}

export function formatRulesResponse(
  result: SmartSelectResult,
  task: string,
  format: "markdown" | "json"
): string {
  if (format === "json") {
    return JSON.stringify({
      rules: result.rules.map((r) => ({
        id: r.id,
        name: r.name,
        priority: r.priority,
        category: r.category,
        content: r.content,
        similarity: Math.round(r.similarity * 100) / 100,
        truncated: r.truncated,
      })),
      skills: result.skills.map((s) => ({
        id: s.id,
        name: s.name,
        summary: s.summary,
        tokenCount: s.tokenCount,
      })),
      meta: {
        task,
        totalRules: result.totalRules,
        returnedRules: result.rules.length,
        skippedRules: result.skippedRules,
        dedupedRules: result.dedupedRules,
        tokenCount: result.tokenCount,
      },
    });
  }

  if (result.rules.length === 0 && result.skills.length === 0) {
    return `No rules found relevant to "${task}".`;
  }

  const lines: string[] = [
    `# Prism Architectural Rules`,
    ``,
    `**Task:** "${task}"`,
    result.rules.length > 0
      ? `**Rules returned:** ${result.rules.length} of ${result.totalRules} (${result.skippedRules} skipped, ${result.dedupedRules} deduplicated)`
      : `**Skills available:** ${result.skills.length}`,
    `**Estimated tokens:** ${result.tokenCount}`,
    ``,
  ];

  if (result.rules.length > 0) {
    for (const r of result.rules) {
      lines.push(`## ${r.name}`);
      lines.push(``);
      lines.push(`**Priority:** ${r.priority} | **Category:** ${r.category}`);
      lines.push(`**Relevance:** ${Math.round(r.similarity * 100)}%`);
      if (r.truncated) lines.push(`**Note:** Summarized to fit token budget`);
      lines.push(``);
      lines.push(r.content);
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }
  }

  if (result.skills.length > 0) {
    lines.push(`## Available Skills`);
    lines.push(``);
    lines.push(`> Skills are procedural guides available on demand. Call \`get_skill\` with a skill ID to load full content.`);
    lines.push(``);
    for (const s of result.skills) {
      lines.push(`- **${s.name}** (\`${s.id}\`) — ${s.summary}`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}
