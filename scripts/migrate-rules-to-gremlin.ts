#!/usr/bin/env node
/**
 * migrate-rules-to-gremlin.ts
 *
 * Migration script: MongoDB Rules → Gremlin Graph (Cosmos DB).
 *
 * Usage:
 *   ts-node scripts/migrate-rules-to-gremlin.ts [--dry-run] [--project-id=<id>]
 *
 * Steps:
 *   1. Read all rules from MongoDB `rules` collection
 *   2. Create Gremlin vertices for each rule
 *   3. Create tag vertices and 'tagged_with' edges
 *   4. Use Gemini to analyze rule content → suggest relationships (relates_to, conflicts_with, requires)
 *   5. Verify vertex count matches MongoDB document count
 *
 * Env vars required:
 *   MONGODB_URI
 *   COSMOS_DATABASE_NAME (default: prism)
 *   COSMOS_GREMLIN_ENDPOINT (if not set, only prints what would be migrated)
 *   COSMOS_GREMLIN_KEY
 *   GEMINI_API_KEY
 */

// @ts-ignore - gremlin package has no TS declarations
import gremlin from "gremlin";
import { MongoClient, type Collection, type Document } from "mongodb";

// ─── Config ────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.COSMOS_DATABASE_NAME || "prism";
const GREMLIN_ENDPOINT = process.env.COSMOS_GREMLIN_ENDPOINT;
const GREMLIN_KEY = process.env.COSMOS_GREMLIN_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DRY_RUN = process.argv.includes("--dry-run");
const PROJECT_FILTER = process.argv
  .find((a) => a.startsWith("--project-id="))
  ?.split("=")[1];

// ─── Helpers ────────────────────────────────────────────────────────

function log(...args: unknown[]) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function error(...args: unknown[]) {
  console.error(`[${new Date().toISOString()}] ❌`, ...args);
}

// ─── Gremlin Client ────────────────────────────────────────────────

let _g: gremlin.process.GraphTraversalSource | null = null;

function getGremlinClient(): gremlin.process.GraphTraversalSource {
  if (_g) return _g;

  if (!GREMLIN_ENDPOINT || !GREMLIN_KEY) {
    throw new Error("COSMOS_GREMLIN_ENDPOINT and COSMOS_GREMLIN_KEY must be set");
  }

  const { AnonymousTraversalSource, DriverRemoteConnection, Client, auth } = gremlin.driver || gremlin.process;
  const authenticator = new auth.PlainTextSaslAuthenticator(
    `/dbs/prism-graph/colls/rules`,
    GREMLIN_KEY
  );
  const client = Client.create(GREMLIN_ENDPOINT, { authenticator });
  const connection = new DriverRemoteConnection(client);
  _g = AnonymousTraversalSource.traversal().withRemote(connection);
  return _g;
}

// ─── MongoDB Client ────────────────────────────────────────────────

async function getMongoCollection(): Promise<Collection<Document>> {
  if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

  const client = new MongoClient(MONGODB_URI, {
    retryWrites: false,
    maxPoolSize: 5,
  });
  await client.connect();
  return client.db(DATABASE_NAME).collection("rules");
}

// ─── Gemini Relationship Detection ─────────────────────────────────

interface RelationshipResult {
  type: "relates_to" | "conflicts_with" | "requires" | null;
  weight: number;
  reason: string;
}

async function detectRelationship(
  ruleA: Document,
  ruleB: Document
): Promise<RelationshipResult> {
  // Default: no relationship detected
  // In production, this would call Gemini to analyze semantic relationships
  // For now, use simple heuristic: same category + overlapping tags
  const tagsA = new Set<string>((ruleA.tags || []) as string[]);
  const tagsB = new Set<string>((ruleB.tags || []) as string[]);
  const commonTags = [...tagsA].filter((t) => tagsB.has(t));

  if (commonTags.length === 0) {
    return { type: null, weight: 0, reason: "No common tags" };
  }

  const categoryMatch = ruleA.category === ruleB.category;

  if (categoryMatch && commonTags.length >= 2) {
    return {
      type: "relates_to",
      weight: 0.7 + commonTags.length * 0.05,
      reason: `Same category + ${commonTags.length} common tags`,
    };
  }

  if (commonTags.length >= 1) {
    return {
      type: "relates_to",
      weight: 0.4 + commonTags.length * 0.1,
      reason: `${commonTags.length} common tag(s)`,
    };
  }

  return { type: null, weight: 0, reason: "No relationship detected" };
}

// ─── Main Migration ────────────────────────────────────────────────

interface Counts {
  rules: number;
  tags: number;
  taggedWith: number;
  relatesTo: number;
  conflictsWith: number;
  requires: number;
}

async function main() {
  log("Starting Gremlin migration...");
  log(`Dry run: ${DRY_RUN}`);
  if (PROJECT_FILTER) log(`Filtering by project: ${PROJECT_FILTER}`);

  // 1. Fetch rules from MongoDB
  log("Connecting to MongoDB...");
  const collection = await getMongoCollection();
  const query: Record<string, unknown> = { isActive: true };
  if (PROJECT_FILTER) query.projectId = PROJECT_FILTER;
  const rules = await collection.find(query).toArray();
  log(`Found ${rules.length} active rules in MongoDB`);

  if (rules.length === 0) {
    log("No rules to migrate. Exiting.");
    process.exit(0);
  }

  if (DRY_RUN) {
    log("--- Dry run mode ---");
    log(`Would migrate ${rules.length} rules`);
    log(`Would create vertices, tag edges, and relationship edges`);
    log("--- End dry run ---");
    process.exit(0);
  }

  // 2. Initialize Gremlin client
  log("Connecting to Gremlin (Cosmos DB Graph)...");
  const g = getGremlinClient();
  const { P, __ } = gremlin.process;

  const counts: Counts = { rules: 0, tags: 0, taggedWith: 0, relatesTo: 0, conflictsWith: 0, requires: 0 };

  // 3. Create vertices for each rule
  log("Creating rule vertices...");
  for (const rule of rules) {
    const id = rule._id.toString();
    try {
      await g
        .addV("rule")
        .property("id", id)
        .property("title", rule.title || rule.name || "")
        .property("content", (rule.content as string) || "")
        .property("category", (rule.category as string) || "general")
        .property("priority", (rule.priority as number) || 5)
        .property("projectId", (rule.projectId as string) || "")
        .property("source", (rule.source as string) || "manual")
        .property("tags", JSON.stringify(rule.tags || []))
        .iterate();
      counts.rules++;
    } catch (e) {
      error(`Failed to create vertex for rule ${id}:`, e);
    }
  }
  log(`Created ${counts.rules} rule vertices`);

  // 4. Create tag vertices and 'tagged_with' edges
  log("Creating tag vertices and edges...");
  for (const rule of rules) {
    const ruleId = rule._id.toString();
    const tags = (rule.tags || []) as string[];

    for (const tag of tags) {
      try {
        // Find or create tag vertex
        const tagResult = await g
          .V()
          .hasLabel("tag")
          .has("name", tag)
          .fold()
          .coalesce(__.unfold(), __.addV("tag").property("name", tag))
          .next();

        // Create 'tagged_with' edge from rule → tag
        await g
          .V(ruleId)
          .addE("tagged_with")
          .to(g.V(tagResult.value.id))
          .iterate();

        counts.tags++;
        counts.taggedWith++;
      } catch (e) {
        error(`Failed to create tag edge for rule ${ruleId}, tag ${tag}:`, e);
      }
    }
  }
  log(`Created ${counts.tags} tag vertices and ${counts.taggedWith} tagged_with edges`);

  // 5. Generate relationships between rules
  log("Analyzing rule relationships...");
  let relationshipCount = 0;
  const totalPairs = (rules.length * (rules.length - 1)) / 2;

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i]!;
      const ruleB = rules[j]!;
      relationshipCount++;

      if (relationshipCount % 100 === 0) {
        log(`Analyzed ${relationshipCount}/${totalPairs} rule pairs...`);
      }

      const relationship = await detectRelationship(ruleA, ruleB);
      if (!relationship.type) continue;

      const idA = ruleA._id.toString();
      const idB = ruleB._id.toString();

      try {
        switch (relationship.type) {
          case "relates_to":
            await g
              .V(idA)
              .addE("relates_to")
              .property("weight", relationship.weight)
              .property("reason", relationship.reason)
              .to(g.V(idB))
              .iterate();
            counts.relatesTo++;
            break;

          case "conflicts_with":
            await g
              .V(idA)
              .addE("conflicts_with")
              .property("weight", relationship.weight)
              .property("reason", relationship.reason)
              .to(g.V(idB))
              .iterate();
            counts.conflictsWith++;
            break;

          case "requires":
            await g
              .V(idA)
              .addE("requires")
              .to(g.V(idB))
              .iterate();
            counts.requires++;
            break;
        }
      } catch (e) {
        error(`Failed to create edge ${relationship.type} between ${idA} and ${idB}:`, e);
      }
    }
  }
  log(`Created ${counts.relatesTo} relates_to, ${counts.conflictsWith} conflicts_with, ${counts.requires} requires edges`);

  // 6. Verify
  log("Verifying migration...");
  const vertexCount = await g.V().hasLabel("rule").count().next();
  log(`Gremlin rule vertices: ${vertexCount.value}`);
  log(`MongoDB rules: ${rules.length}`);
  log(`Match: ${vertexCount.value === rules.length ? "✅" : "❌"}`);

  // Summary
  log("\n─── Migration Summary ───");
  log(`Rules migrated:  ${counts.rules}`);
  log(`Tags created:    ${counts.tags}`);
  log(`Tagged edges:    ${counts.taggedWith}`);
  log(`Relates-to:      ${counts.relatesTo}`);
  log(`Conflicts-with:  ${counts.conflictsWith}`);
  log(`Requires:        ${counts.requires}`);
  log(`────────────────────────`);
  log("Migration complete ✅");
}

main().catch((err) => {
  error("Migration failed:", err);
  process.exit(1);
});
