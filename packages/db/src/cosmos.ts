/**
 * @module @jeffdev/db/cosmos
 * @description MongoDB client for Azure Cosmos DB (MongoDB API).
 * Uses MONGODB_URI from Doppler environment.
 * 
 * @example
 * import { getDatabase, getCollection } from "@jeffdev/db/cosmos";
 * const rules = await getCollection("rules").find({}).toArray();
 */

import { MongoClient, ObjectId, type Db, type Collection, type Document } from "mongodb";

let client: MongoClient | null = null;
let database: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.COSMOS_DATABASE_NAME || "prism";

/**
 * Get or create the MongoDB client connection.
 * Uses connection pooling for efficient reuse.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "[packages/db] MONGODB_URI is not set. " +
      "Ensure Doppler is injecting environment variables."
    );
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      // Cosmos DB recommended settings
      retryWrites: false, // Cosmos DB doesn't support retryable writes
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
    });

    await client.connect();
    console.log("[packages/db] Connected to Azure Cosmos DB (MongoDB API)");
    
    return client;
  } catch (error) {
    throw new Error(
      `[packages/db] Failed to connect to MongoDB: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get the Prism database instance.
 * Automatically connects if not already connected.
 */
export async function getDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  const mongoClient = await getMongoClient();
  database = mongoClient.db(DATABASE_NAME);
  
  return database;
}

/**
 * Get a typed collection from the Prism database.
 * @param collectionName - Name of the collection
 * @returns Typed MongoDB collection
 * 
 * @example
 * const rules = await getCollection<RuleDocument>("rules");
 */
export async function getCollection<T extends Document = Document>(
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDatabase();
  return db.collection<T>(collectionName);
}

/**
 * Gracefully close the MongoDB connection.
 * Call this during application shutdown.
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    database = null;
    console.log("[packages/db] MongoDB connection closed");
  }
}

// Re-export types for consumers
export type { Db, Collection, Document, MongoClient };
export { ObjectId };
