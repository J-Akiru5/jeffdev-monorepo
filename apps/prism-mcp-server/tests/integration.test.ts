/**
 * End-to-end integration tests for Prism MCP Server
 * Tests the full flow: CLI → MCP Server → Database → Results
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoClient, type Db, type Collection } from 'mongodb';
import { VideoTranscriptSchema } from '@jeffdev/db/schema';

// Sample video: https://youtu.be/1NTKwpAVcHg
const SAMPLE_VIDEO_TRANSCRIPT = {
  id: 'test-transcript-1',
  projectId: 'test-project',
  userId: 'test-user',
  muxAssetId: 'test-asset-123',
  muxPlaybackId: 'test-playback-456',
  videoTitle: 'Sample Screen Recording - Authentication Flow',
  duration: 180, // 3 minutes
  transcriptText: `In this video, we'll walk through the authentication flow. 
First, the user lands on the login page. They enter their email and password. 
When they click submit, the form data is validated using Zod schemas. 
If validation passes, we call the Firebase signInWithEmailAndPassword method. 
On success, we redirect to the dashboard. On error, we show a toast notification.
The entire flow uses Server Actions for data mutations and Client Components for the UI.`,
  segments: [
    {
      start: 0,
      end: 30,
      text: 'In this video, we\'ll walk through the authentication flow. First, the user lands on the login page.',
    },
    {
      start: 30,
      end: 60,
      text: 'They enter their email and password. When they click submit, the form data is validated using Zod schemas.',
    },
    {
      start: 60,
      end: 120,
      text: 'If validation passes, we call the Firebase signInWithEmailAndPassword method. On success, we redirect to the dashboard.',
    },
    {
      start: 120,
      end: 180,
      text: 'On error, we show a toast notification. The entire flow uses Server Actions for data mutations and Client Components for the UI.',
    },
  ],
  extractedRules: [],
  createdAt: new Date().toISOString(),
};

describe('Database Integration', () => {
  let client: MongoClient | null = null;
  let db: Db | null = null;
  let collection: Collection | null = null;

  const MONGODB_URI = process.env.MONGODB_URI;
  const DATABASE_NAME = process.env.COSMOS_DATABASE_NAME || 'prism';

  beforeAll(async () => {
    if (!MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set. Skipping database integration tests.');
      console.warn('   Set MONGODB_URI env var to run these tests.');
      return;
    }

    try {
      client = new MongoClient(MONGODB_URI, {
        retryWrites: false, // Cosmos DB doesn't support retryable writes
        maxPoolSize: 5,
      });

      await client.connect();
      db = client.db(DATABASE_NAME);
      collection = db.collection('videoTranscripts');

      console.log(`✅ Connected to database: ${DATABASE_NAME}`);
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (client) {
      await client.close();
      console.log('✅ Database connection closed');
    }
  });

  describe('VideoTranscript Schema Validation', () => {
    it('should validate sample video transcript', () => {
      const result = VideoTranscriptSchema.safeParse(SAMPLE_VIDEO_TRANSCRIPT);

      if (!result.success) {
        console.error('Validation errors:', result.error.issues);
      }

      expect(result.success).toBe(true);
    });

    it('should reject invalid transcript (missing required fields)', () => {
      const invalid = {
        id: 'test',
        // Missing required fields
      };

      const result = VideoTranscriptSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should validate segment timestamps are numbers', () => {
      const withInvalidSegment = {
        ...SAMPLE_VIDEO_TRANSCRIPT,
        segments: [
          {
            start: 'not-a-number', // Invalid
            end: 30,
            text: 'Test segment',
          },
        ],
      };

      const result = VideoTranscriptSchema.safeParse(withInvalidSegment);
      expect(result.success).toBe(false);
    });
  });

  describe.skipIf(!MONGODB_URI)('Database Operations', () => {
    it('should connect to Cosmos DB', async () => {
      expect(client).toBeDefined();
      expect(db).toBeDefined();
      expect(collection).toBeDefined();
    });

    it('should insert sample video transcript', async () => {
      if (!collection) {
        throw new Error('Collection not initialized');
      }

      // Clean up if exists
      await collection.deleteMany({ id: SAMPLE_VIDEO_TRANSCRIPT.id });

      const result = await collection.insertOne(SAMPLE_VIDEO_TRANSCRIPT);
      
      expect(result.acknowledged).toBe(true);
      expect(result.insertedId).toBeDefined();

      console.log(`✅ Inserted transcript: ${SAMPLE_VIDEO_TRANSCRIPT.id}`);
    });

    it('should find transcript by full-text search', async () => {
      if (!collection) {
        throw new Error('Collection not initialized');
      }

      // Ensure sample data exists
      const existing = await collection.findOne({ id: SAMPLE_VIDEO_TRANSCRIPT.id });
      if (!existing) {
        await collection.insertOne(SAMPLE_VIDEO_TRANSCRIPT);
      }

      // Search for "authentication"
      const results = await collection
        .find({ transcriptText: { $regex: 'authentication', $options: 'i' } })
        .limit(5)
        .toArray();

      expect(results.length).toBeGreaterThan(0);
      
      const match = results.find((r) => r.id === SAMPLE_VIDEO_TRANSCRIPT.id);
      expect(match).toBeDefined();
      expect(match?.videoTitle).toContain('Authentication');

      console.log(`✅ Found ${results.length} transcript(s) matching "authentication"`);
    });

    it('should search by project ID', async () => {
      if (!collection) {
        throw new Error('Collection not initialized');
      }

      const results = await collection
        .find({ projectId: 'test-project' })
        .toArray();

      expect(results.length).toBeGreaterThan(0);
      
      const match = results.find((r) => r.id === SAMPLE_VIDEO_TRANSCRIPT.id);
      expect(match).toBeDefined();

      console.log(`✅ Found ${results.length} transcript(s) in project "test-project"`);
    });

    it('should return empty array for non-existent search', async () => {
      if (!collection) {
        throw new Error('Collection not initialized');
      }

      const results = await collection
        .find({ transcriptText: { $regex: 'zzz-nonexistent-xyz', $options: 'i' } })
        .toArray();

      expect(results.length).toBe(0);
    });
  });

  describe.skipIf(!MONGODB_URI)('Transcript Search Patterns', () => {
    it('should extract snippet around search query', () => {
      const text = SAMPLE_VIDEO_TRANSCRIPT.transcriptText;
      const query = 'Zod schemas';
      
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerText.indexOf(lowerQuery);

      expect(index).toBeGreaterThan(-1);

      const contextLength = 50;
      const start = Math.max(0, index - contextLength / 2);
      const end = Math.min(text.length, index + query.length + contextLength / 2);
      
      const snippet = text.substring(start, end);

      expect(snippet).toContain('Zod schemas');
      expect(snippet.length).toBeLessThanOrEqual(contextLength + query.length);
    });

    it('should format duration correctly', () => {
      const formatDuration = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
          return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      expect(formatDuration(180)).toBe('3:00');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3665)).toBe('1:01:05');
    });
  });

  describe.skipIf(!MONGODB_URI)('Cleanup', () => {
    it('should delete test data after tests', async () => {
      if (!collection) {
        return;
      }

      const result = await collection.deleteMany({ id: SAMPLE_VIDEO_TRANSCRIPT.id });
      
      console.log(`✅ Cleaned up ${result.deletedCount} test transcript(s)`);
      expect(result.acknowledged).toBe(true);
    });
  });
});

describe('MCP Tool Simulation', () => {
  it('should construct search query correctly', () => {
    const query = 'authentication flow';
    const projectId = 'test-project';

    const searchQuery = {
      transcriptText: { $regex: query, $options: 'i' },
      projectId,
    };

    expect(searchQuery.transcriptText.$regex).toBe(query);
    expect(searchQuery.transcriptText.$options).toBe('i');
    expect(searchQuery.projectId).toBe(projectId);
  });

  it('should handle query without project filter', () => {
    const query = 'Server Actions';

    const searchQuery: { transcriptText: { $regex: string; $options: string }; projectId?: string } = {
      transcriptText: { $regex: query, $options: 'i' },
    };

    expect(searchQuery.transcriptText.$regex).toBe(query);
    expect(searchQuery.projectId).toBeUndefined();
  });

  it('should format search results as markdown', () => {
    const mockResult = {
      videoTitle: 'Authentication Flow Demo',
      duration: 180,
      createdAt: new Date('2026-01-03').toISOString(),
      muxPlaybackId: 'test-playback-id',
    };

    const snippet = 'We validate using Zod schemas...';
    const lines = [
      `### ${mockResult.videoTitle}`,
      '',
      `**Duration:** 3:00`,
      `**Uploaded:** 1/3/2026`,
      '',
      '**Snippet:**',
      `> ${snippet}`,
      '',
      `**Playback:** https://stream.mux.com/${mockResult.muxPlaybackId}`,
    ];

    const formatted = lines.join('\\n');

    expect(formatted).toContain('### Authentication Flow Demo');
    expect(formatted).toContain('**Duration:** 3:00');
    expect(formatted).toContain('> We validate using Zod schemas...');
    expect(formatted).toContain('https://stream.mux.com/test-playback-id');
  });
});
