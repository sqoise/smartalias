# SmartLias AI Provider Configuration

## 🎯 Your Current Setup

### Provider Chain (Failover Order)
```
1. PRIMARY:   Google Gemini (gemini-2.5-flash)
   ↓ (if fails or quota exceeded)
2. FALLBACK:  Groq Llama (llama-3.3-70b-versatile)
   ↓ (if fails)
3. FALLBACK:  OpenAI (gpt-4o-mini)
   ↓ (if fails)
4. FALLBACK:  OpenRouter (meta-llama/llama-3.1-8b-instruct:free)
   ↓ (if all fail)
5. STATIC:    Fallback message
```

## 📊 Capacity & Limits

### With Current Configuration

| Position | Provider | Free Tier | Status |
|----------|----------|-----------|--------|
| **1st** | **Gemini** | 1,500 requests/day | ✅ Configured |
| **2nd** | **Groq** | 14,400 requests/day | ⏳ Needs API key |
| **3rd** | **OpenAI** | Paid only | ⏳ Needs API key |
| **4th** | **OpenRouter** | Free models available | ⏳ Needs API key |

**Total Potential Free Capacity**: ~16,000 requests/day

## 🔧 Setup Required

### 1. Keep Using Gemini (Already Working)
```bash
# No action needed - already configured
AI_PRIMARY_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyBA_WMHh39EoJ4irvloLRI-OK7ZrUOS0zA
```

### 2. Add Groq as First Fallback (Recommended)

**Get API Key**:
1. Visit: https://console.groq.com/
2. Sign up (free)
3. Go to "API Keys" → "Create API Key"
4. Copy the key (starts with `gsk_`)

**Update `.env`**:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
GROQ_MODEL_ID=llama-3.3-70b-versatile
```

### 3. Add OpenAI as Second Fallback (Optional - Paid)

**Get API Key**:
1. Visit: https://platform.openai.com/
2. Sign up and add payment method
3. Go to "API Keys" → "Create new secret key"
4. Copy the key (starts with `sk-`)

**Update `.env`**:
```env
OPENAI_API_KEY=sk-your_actual_openai_api_key_here
OPENAI_MODEL_ID=gpt-4o-mini
```

### 4. Add OpenRouter as Third Fallback (Optional - Free)

**Get API Key**:
1. Visit: https://openrouter.ai/
2. Sign up (free)
3. Go to "Keys" → "Create Key"
4. Copy the key (starts with `sk-or-v1-`)

**Update `.env`**:
```env
OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct:free
```

## ✅ Testing Your Setup

### 1. Restart Backend
```bash
cd backend
pkill -f "node.*server.js"
node server.js &
```

### 2. Check Initialization
```bash
tail -20 logs/application.log | grep "AI Service initialized"
```

Expected output:
```
AI Service initialized {
  enabled: true,
  primary: 'gemini',
  fallbacks: ['groq', 'openai', 'openrouter'],
  availableProviders: ['gemini']  // Will show more as you add keys
}
```

### 3. Test AI Generation
```bash
curl -s -X POST http://localhost:9000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"query": "I need help with financial assistance", "sessionId": "test-chain"}' \
  | jq -r '.data | {answer: .answer[0:100], provider: .metadata.engine}'
```

### 4. Test Failover (Simulate Primary Failure)

To test the fallback chain, temporarily disable Gemini:
```env
# In .env, comment out or invalidate the key:
GEMINI_API_KEY=invalid_key_for_testing
```

Restart backend and test again - it should automatically use Groq.

## 📈 How It Works

1. **User asks complex question** that doesn't match FAQs
2. **System tries Gemini first** (your primary)
3. **If Gemini fails** (quota, error, timeout):
   - Tries Groq (14,400/day free)
4. **If Groq fails**:
   - Tries OpenAI (paid, but reliable)
5. **If OpenAI fails**:
   - Tries OpenRouter (free models)
6. **If all AI fails**:
   - Returns static fallback message

## 💡 Recommended Immediate Action

**Get Groq API key** (5 minutes):
1. Visit https://console.groq.com/
2. Sign up with Google/GitHub
3. Create API key
4. Update `.env` with the key
5. Restart backend

**Benefits**:
- ✅ 10x more free requests (14,400 vs 1,500)
- ✅ Much faster responses (500+ tokens/sec)
- ✅ Automatic failover if Gemini hits quota
- ✅ No code changes needed

## 🔍 Monitoring

### Check Which Provider Was Used
```bash
tail -50 backend/logs/application.log | grep "AI answer generated"
```

### Count Failures Per Provider
```bash
grep "AI provider failed" backend/logs/application.log | tail -20
```

### See Fallback Activations
```bash
grep "trying fallbacks" backend/logs/application.log | wc -l
```

## 🎯 Your Next Steps

- [ ] Get Groq API key (RECOMMENDED - 5 min)
- [ ] Test AI with complex questions
- [ ] Monitor which providers are used
- [ ] Optionally add OpenAI (if you have budget)
- [ ] Optionally add OpenRouter (free alternative)

---

**Status**: ✅ Configured with Gemini primary + 3-tier fallback chain  
**Action Needed**: Add Groq API key for 10x capacity boost
