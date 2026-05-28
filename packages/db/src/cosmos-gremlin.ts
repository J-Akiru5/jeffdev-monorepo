/**
 * Gremlin / Cosmos DB graph client for Prism neuro-symbolic AI.
 *
 * Provides a Gremlin traversal source for querying the rules graph.
 * Uses the Apache TinkerPop Gremlin client over WebSockets.
 */

import gremlin from "gremlin";

const { process, driver } = gremlin;
const { AnonymousTraversalSource, order, P } = process;
const {
  Client: GremlinClient,
  DriverRemoteConnection,
  auth: { PlainTextSaslAuthenticator },
} = driver;

type GraphTraversalSource = ReturnType<
  ReturnType<typeof AnonymousTraversalSource.traversal>["withRemote"]
>;

let _g: GraphTraversalSource | null = null;

/**
 * Get or create a Gremlin traversal source connected to Cosmos DB.
 *
 * Requires COSMOS_GREMLIN_ENDPOINT and COSMOS_GREMLIN_KEY env vars.
 *
 * Endpoint format:
 *   wss://<account>.gremlin.cosmos.azure.com:443/
 */
export function getGremlinClient(): GraphTraversalSource {
  if (_g !== null) {
    return _g;
  }

  const endpoint = process.env.COSMOS_GREMLIN_ENDPOINT;
  const key = process.env.COSMOS_GREMLIN_KEY;

  if (!endpoint || !key) {
    throw new Error(
      "COSMOS_GREMLIN_ENDPOINT and COSMOS_GREMLIN_KEY must be set",
    );
  }

  // Cosmos DB uses a custom authenticator with Gremlin
  const authenticator = new PlainTextSaslAuthenticator(
    "/dbs/prism-graph/colls/rules",
    key,
  );

  const client = GremlinClient.create(endpoint, { authenticator });

  const connection = new DriverRemoteConnection(client);
  _g = AnonymousTraversalSource.traversal().withRemote(connection);
  return _g;
}

/**
 * Close the Gremlin client connection if open.
 */
export async function closeGremlinClient(): Promise<void> {
  if (_g !== null) {
    try {
      // Gremlin library handles connection pooling
    } finally {
      _g = null;
    }
  }
}

// --- Convenience query helpers ---

/**
 * Get rules for a project, ordered by priority descending.
 */
export async function getRulesByProject(
  projectId: string,
  limit = 10,
): Promise<Record<string, unknown>[]> {
  const g = getGremlinClient();
  const results = await g
    .V()
    .hasLabel("rule")
    .has("projectId", projectId)
    .order()
    .by("priority", order.decr)
    .limit(limit)
    .valueMap()
    .toList();
  return normalizeVertices(results);
}

/**
 * Get rules related to a given rule via 'relates_to' edges.
 */
export async function getRelatedRules(
  ruleId: string,
): Promise<Record<string, unknown>[]> {
  const g = getGremlinClient();
  const results = await g
    .V(ruleId)
    .outE("relates_to")
    .inV()
    .valueMap()
    .toList();
  return normalizeVertices(results);
}

/**
 * Get rules that conflict with a given rule.
 */
export async function getConflictingRules(
  ruleId: string,
): Promise<Record<string, unknown>[]> {
  const g = getGremlinClient();
  const results = await g
    .V(ruleId)
    .outE("conflicts_with")
    .inV()
    .valueMap()
    .toList();
  return normalizeVertices(results);
}

/**
 * Get rules that have specific tags (tag traversal).
 */
export async function getRulesByTags(
  tags: string[],
): Promise<Record<string, unknown>[]> {
  const g = getGremlinClient();
  const results = await g
    .V()
    .hasLabel("tag")
    .has("name", P.within(tags))
    .inE("tagged_with")
    .outV()
    .hasLabel("rule")
    .dedup()
    .valueMap()
    .toList();
  return normalizeVertices(results);
}

/**
 * Normalize Gremlin valueMap results into flat dicts.
 */
function normalizeVertices(vertices: unknown[]): Record<string, unknown>[] {
  const normalized: Record<string, unknown>[] = [];
  for (const vertex of vertices) {
    const flat: Record<string, unknown> = {};
    if (vertex && typeof vertex === "object") {
      for (const [key, value] of Object.entries(
        vertex as Record<string, unknown>,
      )) {
        // Gremlin returns lists for each property
        if (Array.isArray(value) && value.length === 1) {
          flat[key] = value[0];
        } else {
          flat[key] = value;
        }
      }
    }
    normalized.push(flat);
  }
  return normalized;
}
