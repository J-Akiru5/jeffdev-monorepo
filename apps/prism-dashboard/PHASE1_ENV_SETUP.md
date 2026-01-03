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

### Mux (Video hosting and transcription)

```bash
# Mux API credentials (get from https://dashboard.mux.com)
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret

# Mux webhook signature secret (optional, for production security)
MUX_WEBHOOK_SECRET=your-webhook-secret
```

### Existing Variables (Already Configured)

```bash
# Cosmos DB / MongoDB
MONGODB_URI=your-cosmos-connection-string
COSMOS_DATABASE_NAME=prism

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

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

## How to Set Up Mux

### 1. Create Mux Account

```bash
1. Go to https://mux.com
2. Sign up for free account
3. Verify email
```

### 2. Get API Credentials

```bash
# In Mux Dashboard (https://dashboard.mux.com):
1. Go to "Settings" → "Access Tokens"
2. Click "Generate new token"
3. Name: "Prism Engine"
4. Permissions: 
   - ✅ Video: Read
   - ✅ Video: Write
   - ✅ Data: Read
5. Click "Generate Token"
6. Copy Token ID and Token Secret

# Add to Doppler:
MUX_TOKEN_ID=<paste token id>
MUX_TOKEN_SECRET=<paste token secret>
```

### 3. Configure Webhook (Optional)

```bash
# In Mux Dashboard:
1. Go to "Settings" → "Webhooks"
2. Click "Create new webhook"
3. URL: https://your-domain.com/api/webhooks/mux
4. Events to listen for:
   - ✅ video.asset.ready
   - ✅ video.asset.track.ready
5. Copy the Webhook Signing Secret

# Add to Doppler:
MUX_WEBHOOK_SECRET=<paste secret>
```

---

## Testing Your Setup

### 1. Verify Environment Variables

```bash
# In terminal:
doppler run -- node -e "console.log(process.env.AZURE_OPENAI_ENDPOINT)"
# Should output: https://your-resource.openai.azure.com/

doppler run -- node -e "console.log(process.env.MUX_TOKEN_ID)"
# Should output: your token id
```

### 2. Test Azure OpenAI Connection

```bash
# In apps/prism-dashboard:
cd apps/prism-dashboard

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

### 3. Test Mux Connection

```bash
# Check Mux assets:
curl -X GET https://api.mux.com/video/v1/assets \
  -u MUX_TOKEN_ID:MUX_TOKEN_SECRET

# Should return: {"data": [...]}
```

---

## Cost Estimates

### Azure OpenAI (GPT-4o-mini)
- **Input:** $0.15 per 1M tokens (~750k words)
- **Output:** $0.60 per 1M tokens
- **Typical video:** 10-minute video ≈ 1,500 words ≈ 2,000 tokens ≈ **$0.001 per video**
- **Monthly estimate:** 100 videos/month ≈ **$0.10/month**

### Mux
- **Video encoding:** $0.005 per minute
- **Storage:** $0.01 per GB/month
- **Streaming:** $0.01 per GB delivered
- **Transcription:** Included free with encoding
- **Typical usage:** 10 videos × 10 minutes = 100 minutes ≈ **$0.50/month**

### Total Monthly Cost
**~$0.60/month** for Phase 1 implementation (100 videos)

---

## Troubleshooting

### "Azure OpenAI not configured" Error

```bash
# Check env vars are set:
echo $AZURE_OPENAI_ENDPOINT
echo $AZURE_OPENAI_API_KEY

# If empty, add to Doppler or .env.local
```

### "Failed to fetch transcript" Error

```bash
# 1. Check Mux credentials:
curl -u $MUX_TOKEN_ID:$MUX_TOKEN_SECRET https://api.mux.com/video/v1/assets

# 2. Verify asset has transcript track:
curl -u $MUX_TOKEN_ID:$MUX_TOKEN_SECRET https://api.mux.com/video/v1/assets/ASSET_ID

# 3. Check transcript generation is enabled:
# When uploading video, include: "generated_subtitles": [{"language_code": "en", "name": "English"}]
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
2. ✅ Verify Mux credentials
3. ✅ Configure webhook URL in Mux dashboard
4. ✅ Upload test video to Mux
5. ✅ Monitor webhook logs: `doppler run -- turbo dev --filter=prism-dashboard`
6. ✅ Check Cosmos DB for extracted rules

---

## Security Best Practices

### ✅ DO:
- Use Doppler for secrets management
- Rotate API keys every 90 days
- Enable webhook signature verification (MUX_WEBHOOK_SECRET)
- Use Azure Managed Identity in production
- Set up IP allowlisting for Mux webhooks

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
