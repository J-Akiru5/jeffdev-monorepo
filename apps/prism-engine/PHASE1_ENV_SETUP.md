# Phase 1 - Environment Variables Setup

## Required Environment Variables for Azure OpenAI Integration

Add these to your **Doppler** project (recommended) or `.env.local`:

### Azure OpenAI (GPT-4o-mini for rule extraction)

```bash
# Azure OpenAI endpoint (example: https://your-resource.openai.azure.com/)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/

# Azure OpenAI API key
AZURE_OPENAI_API_KEY=your-azure-openai-api-key

# Deployment name (the name you gave when deploying the model in Azure)
# Default: gpt-4o-mini
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
```

### Existing Variables (Already Configured)

```bash
# Cosmos DB / MongoDB
MONGODB_URI=your-cosmos-connection-string
COSMOS_DATABASE_NAME=prism

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_PRISM_URL=http://localhost:3001
NEXT_PUBLIC_DOCS_URL=http://localhost:3002
```

---

## How to Set Up Azure OpenAI

### 1. Create Azure OpenAI Resource

```bash
# Via Azure Portal:
1. Go to https://portal.azure.com
2. Search for "Azure OpenAI"
3. Click "Create"
4. Fill in:
   - Subscription: Your subscription
   - Resource Group: Create new or use existing
   - Region: East US (or your preferred region)
   - Name: prism-openai (or your choice)
   - Pricing tier: Standard S0

5. Click "Review + Create"
```

### 2. Deploy GPT-4o-mini Model

```bash
# In Azure OpenAI Studio (https://oai.azure.com):
1. Go to "Deployments"
2. Click "Create new deployment"
3. Select model: "gpt-4o-mini"
4. Deployment name: "gpt-4o-mini" (or your choice)
5. Click "Create"
```

### 3. Get Your Credentials

```bash
# In Azure Portal:
1. Go to your Azure OpenAI resource
2. Click "Keys and Endpoint" (left sidebar)
3. Copy:
   - Endpoint: https://your-resource.openai.azure.com/
   - Key 1: Your API key

# Add to Doppler:
AZURE_OPENAI_ENDPOINT=<paste endpoint>
AZURE_OPENAI_API_KEY=<paste key>
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
```

---

## Testing Your Setup

### 1. Verify Environment Variables

```bash
# In terminal:
doppler run -- node -e "console.log(process.env.AZURE_OPENAI_ENDPOINT)"
# Should output: https://your-resource.openai.azure.com/
```

### 2. Test Azure OpenAI Connection

```bash
# In apps/prism-engine:
cd apps/prism-engine

# Run test script:
node -e "
import('./src/lib/azure-openai.ts').then(async (m) => {
  const result = await m.extractRulesFromTranscript(
    'Always use TypeScript for type safety.',
    'Test Video'
  );
  console.log('✅ Azure OpenAI working:', result);
}).catch(console.error);
"
```

---

## Cost Estimates

### Azure OpenAI (GPT-4o-mini)

- **Input:** $0.15 per 1M tokens (~750k words)
- **Output:** $0.60 per 1M tokens
- **Monthly estimate:** ~**$0.10/month** for moderate usage

### Total Monthly Cost

**~$0.10/month** for Phase 1 implementation

---

## Troubleshooting

### "Azure OpenAI not configured" Error

```bash
# Check env vars are set:
echo $AZURE_OPENAI_ENDPOINT
echo $AZURE_OPENAI_API_KEY

# If empty, add to Doppler or .env.local
```

### "Deployment not found" Error

```bash
# Check deployment name matches:
# In Azure OpenAI Studio → Deployments → Copy exact name
# Update AZURE_OPENAI_DEPLOYMENT_NAME to match
```

---

## Next Steps

After setting up environment variables:

1. ✅ Verify Azure OpenAI connection
2. ✅ Monitor logs: `doppler run -- turbo dev --filter=prism-engine`

---

## Security Best Practices

### ✅ DO:

- Use Doppler for secrets management
- Rotate API keys every 90 days
- Use Azure Managed Identity in production

### ❌ DON'T:

- Commit `.env` files to git
- Share API keys in Slack/email
- Use test keys in production
- Expose keys in client-side code
- Log full API keys in console

---

**Last Updated:** January 3, 2026  
**Phase:** Phase 1 - Azure OpenAI Integration  
**Status:** ✅ Implementation Complete
