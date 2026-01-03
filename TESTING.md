# Integration Tests - Phase 2

## Setup

### 1. Database Configuration

Create your Cosmos DB database:
- **Database Name:** `prism`
- **Collection:** `videoTranscripts`

Set environment variables:
```bash
export MONGODB_URI="your-cosmos-connection-string"
export COSMOS_DATABASE_NAME="prism"
```

Or using Doppler:
```bash
doppler run -- npm test
```

### 2. Install Dependencies

```bash
# From monorepo root
npm install

# Or for specific packages
cd packages/prism-cli && npm install
cd apps/prism-mcp-server && npm install
```

### 3. Build MCP Server (required for CLI tests)

```bash
cd apps/prism-mcp-server
npm run build
```

## Running Tests

### CLI Tests (Unit + Integration)

```bash
cd packages/prism-cli
npm test
```

**Tests included:**
- ✅ MCP server path resolution
- ✅ Environment variable handling  
- ✅ Process lifecycle management
- ⏭️ End-to-end CLI launch (requires built MCP server)

### MCP Server Tests (Database Integration)

```bash
cd apps/prism-mcp-server
npm test
```

**Tests included:**
- ✅ VideoTranscript schema validation
- ⏭️ Database connection (requires MONGODB_URI)
- ⏭️ Insert sample transcript
- ⏭️ Full-text search
- ⏭️ Project filtering
- ⏭️ Snippet extraction
- ⏭️ Duration formatting

### Watch Mode (Development)

```bash
npm run test:watch
```

## Test Data

The tests use a sample transcript based on your video:
- **YouTube:** https://youtu.be/1NTKwpAVcHg
- **Topic:** Authentication flow walkthrough
- **Duration:** 3 minutes
- **Content:** Firebase auth, Zod validation, Server Actions

The transcript is automatically:
- ✅ Inserted before tests
- ✅ Cleaned up after tests

## Conditional Test Execution

Tests are smart about dependencies:

```typescript
// Skips if MCP server not built
it.skipIf(!existsSync(mcpServerPath))('should launch MCP server', ...)

// Skips if MONGODB_URI not set
describe.skipIf(!MONGODB_URI)('Database Operations', ...)
```

## Expected Output

### All Tests Passing ✅

```bash
✓ prism connect command (4)
  ✓ MCP server path resolution (2)
  ✓ Environment variable handling (3)
  ✓ Process lifecycle (2)

✓ Database Integration (12)
  ✓ VideoTranscript Schema Validation (3)
  ✓ Database Operations (4) [requires MONGODB_URI]
  ✓ Transcript Search Patterns (2)
  ✓ MCP Tool Simulation (3)

Test Files  2 passed (2)
     Tests  16 passed (16)
```

### With Warnings (Missing Config)

```bash
⚠️  MONGODB_URI not set. Skipping database integration tests.
⚠️  MCP server not built. Run: cd apps/prism-mcp-server && npm run build

✓ prism connect command (9 tests, 4 skipped)
✓ Database Integration (12 tests, 8 skipped)

Test Files  2 passed (2)
     Tests  8 passed | 8 skipped (16)
```

## Troubleshooting

### "MCP server not built"
```bash
cd apps/prism-mcp-server
npm run build
```

### "MONGODB_URI not set"
```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"
export COSMOS_DATABASE_NAME="prism"
```

### "Collection not found"
Create the collection in Azure Portal:
1. Go to your Cosmos DB account
2. Create database: `prism`
3. Create collection: `videoTranscripts`

### TypeScript errors in tests
```bash
# Ensure db package is available
cd packages/db
npm run check-types

# Install missing types
npm install --save-dev @types/node
```

## Next Steps

Once tests pass:
1. ✅ Verify `prism connect` launches without errors
2. ✅ Test MCP tools in Cursor/Windsurf
3. ➡️ Implement Phase 3 (Azure OpenAI + Mux)

---

**Test Status:** Ready to run (requires config)
