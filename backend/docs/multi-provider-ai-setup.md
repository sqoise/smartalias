# Multi-Provider AI Configuration Guide

## 📋 Overview

SmartLias now supports multiple AI providers with automatic fallback. This gives you:
- ✅ **Higher free quotas** (14,400 requests/day with Groq vs 1,500 with Gemini)
- ✅ **Automatic fallback** if primary provider fails or quota exceeded
- ✅ **Flexibility** to switch providers without code changes
- ✅ **Cost optimization** by using free tiers strategically

## 🤖 Supported AI Providers

### 1. **Google Gemini** (Current Default)
- **Free Tier**: 1,500 requests/day, 15 requests/minute
- **Best For**: General purpose, good quality
- **Setup**: ✅ Already configured
- **Get API Key**: https://aistudio.google.com/

### 2. **Groq (Llama 3)** (Recommended)
- **Free Tier**: 14,400 requests/day, 30 requests/minute
- **Best For**: Fast responses (500+ tokens/sec), higher limits
- **Setup**: See below
- **Get API Key**: https://console.groq.com/

### 3. **OpenRouter** (Multi-Model)
- **Free Tier**: Multiple free models available
- **Best For**: Access to multiple models through one API
- **Setup**: See below
- **Get API Key**: https://openrouter.ai/

### 4. **Anthropic Claude**
- **Free Tier**: $5 credit for new accounts
- **Best For**: High-quality conversational AI
- **Setup**: See below
- **Get API Key**: https://console.anthropic.com/

### 5. **OpenAI GPT**
- **Free Tier**: None (paid only)
- **Best For**: Production with budget
- **Setup**: See below
- **Get API Key**: https://platform.openai.com/

## 🚀 Quick Setup

### Option 1: Use Groq (Recommended - 10x More Free Requests)

1. **Get Groq API Key**:
   ```bash
   # Visit: https://console.groq.com/
   # Sign up (free)
   # Go to API Keys → Create API Key
   # Copy the key
   ```

2. **Update `.env`**:
   ```env
   AI_PRIMARY_PROVIDER=groq
   AI_FALLBACK_PROVIDER=gemini
   
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL_ID=llama-3.3-70b-versatile
   
   # Keep Gemini as fallback
   GEMINI_API_KEY=AIzaSyBA_WMHh39EoJ4irvloLRI-OK7ZrUOS0zA
   GEMINI_MODEL_ID=gemini-2.5-flash
   ```

3. **Restart Backend**:
   ```bash
   cd backend
   pkill -f "node.*server.js"
   node server.js &
   ```

### Option 2: Keep Gemini Primary with Groq Fallback

```env
AI_PRIMARY_PROVIDER=gemini
AI_FALLBACK_PROVIDER=groq

GEMINI_API_KEY=AIzaSyBA_WMHh39EoJ4irvloLRI-OK7ZrUOS0zA
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Option 3: Use OpenRouter (Multiple Free Models)

1. **Get OpenRouter API Key**:
   ```bash
   # Visit: https://openrouter.ai/
   # Sign up (free)
   # Go to Keys → Create Key
   ```

2. **Update `.env`**:
   ```env
   AI_PRIMARY_PROVIDER=openrouter
   AI_FALLBACK_PROVIDER=gemini
   
   OPENROUTER_API_KEY=sk-or-v1-your_key_here
   OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
   ```

## 🔧 Available Model IDs

### Groq Models (Free)
```env
GROQ_MODEL_ID=llama-3.3-70b-versatile    # Best overall (70B params)
GROQ_MODEL_ID=llama-3.1-8b-instant       # Fastest (8B params)
GROQ_MODEL_ID=mixtral-8x7b-32768         # Good for long context
```

### Gemini Models (Free)
```env
GEMINI_MODEL_ID=gemini-2.5-flash         # Stable (current)
GEMINI_MODEL_ID=gemini-2.5-pro           # Most capable
GEMINI_MODEL_ID=gemini-flash-latest      # Always latest
```

### OpenRouter Free Models
```env
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_MODEL_ID=google/gemma-2-9b-it:free
OPENROUTER_MODEL_ID=microsoft/phi-3-mini-128k-instruct:free
```

### Anthropic Models (Paid)
```env
ANTHROPIC_MODEL_ID=claude-3-5-haiku-20241022    # Fast & cheap
ANTHROPIC_MODEL_ID=claude-3-5-sonnet-20241022   # Best quality
```

### OpenAI Models (Paid)
```env
OPENAI_MODEL_ID=gpt-4o-mini              # Cheapest GPT-4
OPENAI_MODEL_ID=gpt-4o                   # Most capable
```

## 📊 Provider Comparison

| Provider | Free Requests/Day | Speed | Quality | Best For |
|----------|------------------|-------|---------|----------|
| **Groq** | 14,400 | ⚡⚡⚡⚡⚡ Very Fast | ⭐⭐⭐⭐ Excellent | **Recommended** |
| Gemini | 1,500 | ⚡⚡⚡⚡ Fast | ⭐⭐⭐⭐⭐ Excellent | Current Default |
| OpenRouter | Varies | ⚡⚡⚡ Medium | ⭐⭐⭐⭐ Good | Multi-model |
| Anthropic | $5 credit | ⚡⚡⚡⚡ Fast | ⭐⭐⭐⭐⭐ Excellent | Premium |
| OpenAI | Paid only | ⚡⚡⚡ Medium | ⭐⭐⭐⭐⭐ Excellent | Production |

## 🔍 Testing Your Setup

### Test Primary Provider
```bash
cd backend
curl -s -X POST http://localhost:9000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"query": "I need help with financial assistance", "sessionId": "test-ai"}' \
  | jq -r '.data | {answer: .answer, source: .source, provider: .metadata.engine}'
```

### Check Logs
```bash
tail -30 backend/logs/application.log | grep "AI Service initialized"
# Should show: primary and fallback providers
```

## 💡 Recommended Configuration

**For Maximum Free Usage:**
```env
AI_PRIMARY_PROVIDER=groq
AI_FALLBACK_PROVIDER=gemini

GROQ_API_KEY=your_groq_key
GROQ_MODEL_ID=llama-3.3-70b-versatile

GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL_ID=gemini-2.5-flash
```

**Benefits:**
- 14,400 requests/day from Groq (primary)
- 1,500 requests/day from Gemini (fallback)
- Total: ~16,000 requests/day FREE!
- Automatic failover if Groq quota exceeded

## 🚨 Troubleshooting

### Issue: "AI service is not available"
**Solution**: Check that at least one provider is configured:
```bash
grep "API_KEY" backend/.env
# Make sure at least one provider has a valid API key
```

### Issue: "Primary AI provider failed"
**Solution**: Check logs to see why:
```bash
tail -50 backend/logs/application.log | grep "AI provider failed"
```

### Issue: Empty responses
**Solution**: Some providers block certain content. Try different provider or check safety settings.

## 📈 Monitoring Usage

### Check Daily AI Usage
```bash
grep "AI answer generated" backend/logs/application.log | grep "$(date +%Y-%m-%d)" | wc -l
```

### Check Which Provider is Being Used
```bash
tail -20 backend/logs/application.log | grep "provider"
```

### See Fallback Activations
```bash
grep "Primary AI provider failed" backend/logs/application.log | tail -10
```

## 🎯 Next Steps

1. **Get Groq API Key** (recommended for 10x more free requests)
2. **Update `.env` file** with your API keys
3. **Restart backend** to apply changes
4. **Test with complex questions** to see AI in action
5. **Monitor logs** to track usage and performance

## 📚 Additional Resources

- **Groq Console**: https://console.groq.com/
- **Google AI Studio**: https://aistudio.google.com/
- **OpenRouter**: https://openrouter.ai/
- **Anthropic Console**: https://console.anthropic.com/
- **OpenAI Platform**: https://platform.openai.com/

---

**Need Help?** Check the logs or test with the chatbot!
