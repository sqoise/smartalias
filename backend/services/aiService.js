const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const logger = require('../config/logger');
/**
 * Unified AI Service with Multi-Provider Support
 * Supports: Gemini, Groq, OpenRouter, OpenAI
 * With automatic fallback chain when providers fail
 */
class AIService {
  constructor() {
    this.enabled = process.env.AI_ENABLED === 'true';
    this.primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'gemini';
    // Constructor should not return; prompt logic lives in buildPrompt()
    // Parse fallback providers (comma-separated)
    const fallbackStr = process.env.AI_FALLBACK_PROVIDERS || '';
    this.fallbackProviders = fallbackStr.split(',')
      .map(p => p.trim())
      .filter(p => p && p !== 'none');
    
    // Initialize providers
    this.providers = {};
    this.initializeProviders();
    
    logger.info('AI Service initialized', {
      enabled: this.enabled,
      primary: this.primaryProvider,
      fallbacks: this.fallbackProviders,
      availableProviders: Object.keys(this.providers)
    });
  }

  /**
   * Initialize all configured AI providers
   */
  initializeProviders() {
    // Google Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.providers.gemini = {
          name: 'Google Gemini',
          client: genAI,
          model: genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash',
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7,
            },
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
          }),
          generate: this.generateGemini.bind(this)
        };
        logger.info('Gemini provider initialized', { model: process.env.GEMINI_MODEL_ID || 'gemini-2.5-flash' });
      } catch (error) {
        logger.warn('Failed to initialize Gemini provider', { error: error.message });
      }
    }

    // Groq (Llama)
    if (process.env.GROQ_API_KEY) {
      this.providers.groq = {
        name: 'Groq Llama',
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
        generate: this.generateGroq.bind(this)
      };
      logger.info('Groq provider initialized', { model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile' });
    }

  // OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.openrouter = {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL_ID || 'meta-llama/llama-3.1-8b-instruct:free',
        generate: this.generateOpenRouter.bind(this)
      };
      logger.info('OpenRouter provider initialized', { model: process.env.OPENROUTER_MODEL_ID });
    }

  // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.openai = {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL_ID || 'gpt-4o-mini',
        generate: this.generateOpenAI.bind(this)
      };
      logger.info('OpenAI provider initialized', { model: process.env.OPENAI_MODEL_ID });
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable() {
    return this.enabled && Object.keys(this.providers).length > 0;
  }

  /**
   * Generate AI answer with automatic fallback
   */
  async generateAnswer(query, context = {}) {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    // Try primary provider
    if (this.providers[this.primaryProvider]) {
      try {
        logger.info('Attempting AI generation with primary provider', { 
          provider: this.primaryProvider,
          query: query.substring(0, 50) + '...'
        });
        
        const answer = await this.generateWithProvider(this.primaryProvider, query, context);
        
        logger.info('AI answer generated successfully', {
          provider: this.primaryProvider,
          answerLength: answer?.length || 0
        });
        
        return answer;
      } catch (error) {
        logger.warn('Primary AI provider failed, trying fallbacks', {
          provider: this.primaryProvider,
          error: error.message,
          fallbacksAvailable: this.fallbackProviders.length
        });
      }
    }

    // Try fallback providers in order
    for (let i = 0; i < this.fallbackProviders.length; i++) {
      const fallbackProvider = this.fallbackProviders[i];
      
      if (!this.providers[fallbackProvider]) {
        logger.debug('Fallback provider not available, skipping', { 
          provider: fallbackProvider,
          position: i + 1
        });
        continue;
      }

      try {
        logger.info('Attempting AI generation with fallback provider', { 
          provider: fallbackProvider,
          position: i + 1,
          totalFallbacks: this.fallbackProviders.length
        });
        
        const answer = await this.generateWithProvider(fallbackProvider, query, context);
        
        logger.info('AI answer generated successfully (fallback)', {
          provider: fallbackProvider,
          position: i + 1,
          answerLength: answer?.length || 0
        });
        
        return answer;
      } catch (error) {
        logger.warn('Fallback AI provider failed', {
          provider: fallbackProvider,
          position: i + 1,
          error: error.message,
          remainingFallbacks: this.fallbackProviders.length - i - 1
        });
        
        // Continue to next fallback
        continue;
      }
    }

    logger.error('All AI providers failed', {
      primary: this.primaryProvider,
      fallbacks: this.fallbackProviders,
      totalAttempts: 1 + this.fallbackProviders.length
    });
    throw new Error('All AI providers failed');
  }

  /**
   * Generate with specific provider
   */
  async generateWithProvider(providerName, query, context) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new Error(`Provider ${providerName} not available`);
    }

    return await provider.generate(query, context, provider);
  }

  /**
   * Build prompt for all providers
   * Build comprehensive prompt with context including chat history
   * @param {string} query - User's question
   * @param {Object} context - Structured context object with faqs, rules, db, and chat data
   * @param {Array} context.faqs - FAQ entries with question/answer
   * @param {Array} context.rules - Rule-based knowledge snippets
   * @param {Array} context.db - Database records with relevant data
   * @param {Array} context.chatHistory - Recent conversation messages
   * @param {Array} context.similarQuestions - Similar questions from chat_messages
   * @param {Object} context.documentCatalog - Current document fees and info
   */
  buildPrompt(query, context = {}) {
    const faqs = context.faqs || [];
    const rules = context.rules || [];
    const dbRecords = context.db || [];
    const chatHistory = context.chatHistory || [];
    const similarQuestions = context.similarQuestions || [];
    const documentCatalog = context.documentCatalog || [];
    const recentAnnouncements = context.recentAnnouncements || [];

    // Check if query is announcement-related
    const announcementKeywords = [
      'announcement', 'announcements', 'news', 'update', 'updates', 'event', 'events', 
      'schedule', 'schedules', 'program', 'programs', 'activity', 'activities',
      'balita', 'abiso', 'paalala', 'sked', 'programa', 'gawain', 'aktibidad'
    ];
    const isAnnouncementRelated = announcementKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );

    // Format FAQ section
    const faqContext = faqs.slice(0, 5)
      .map(f => `Q: ${f.question}\nA: ${f.answer}`)
      .join('\n\n');

    // Format rule-based knowledge section
    const rulesContext = rules.slice(0, 8)
      .map(r => `- ${r}`)
      .join('\n');

    // Format database records section
    const dbContext = dbRecords.slice(0, 5)
      .map(r => {
        const id = r.id || r._id || r.code || 'record';
        const title = (r.title || r.name || '').toString().slice(0, 80);
        let summary = '';
        if (r.description) summary = r.description;
        else if (r.summary) summary = r.summary;
        else if (r.content) summary = r.content;
        else if (r.details) summary = r.details;
        else summary = JSON.stringify(r);
        summary = summary.toString().replace(/\s+/g, ' ').slice(0, 240);
        return `Record: ${id}${title ? `\nTitle: ${title}` : ''}\nInfo: ${summary}`;
      })
      .join('\n\n');

    // Format recent conversation history
    const chatContext = chatHistory.slice(-3)
      .map(msg => `${msg.message_type.toUpperCase()}: ${msg.message_text}`)
      .join('\n');

    // Format similar successful conversations
    const similarContext = similarQuestions
      .filter(q => q.was_helpful === 1 && q.bot_response)
      .slice(0, 3)
      .map(q => `Similar Q: ${q.question}\nWorked Response: ${q.bot_response}`)
      .join('\n\n');

    // Format current document catalog with fees
    const documentContext = documentCatalog.slice(0, 10)
      .map(doc => {
        const fee = parseFloat(doc.fee) === 0 ? 'FREE' : `₱${parseFloat(doc.fee).toFixed(2)}`;
        return `${doc.title}: ${fee}`;
      })
      .join('\n');

    // Format recent announcements (only if query is announcement-related)
    let announcementContext = '';
    if (isAnnouncementRelated && recentAnnouncements.length > 0) {
      announcementContext = recentAnnouncements
        .map(ann => {
          const publishedDate = new Date(ann.published_at).toLocaleDateString('en-PH');
          return `Title: ${ann.title}\nType: ${ann.type}\nPublished: ${publishedDate}\nContent: ${ann.content.slice(0, 200)}...`;
        })
        .join('\n\n');
    }

    // Build layered context sections
    const contextSections = [];
    if (rulesContext) contextSections.push(`RULE-BASED KNOWLEDGE:\n${rulesContext}`);
    if (faqContext) contextSections.push(`FAQ REFERENCE:\n${faqContext}`);
    if (dbContext) contextSections.push(`DATABASE CONTEXT:\n${dbContext}`);
    if (documentContext) contextSections.push(`CURRENT DOCUMENT FEES:\n${documentContext}`);
    if (announcementContext) contextSections.push(`RECENT ANNOUNCEMENTS:\n${announcementContext}`);
    if (chatContext) contextSections.push(`RECENT CONVERSATION:\n${chatContext}`);
    if (similarContext) contextSections.push(`SIMILAR SUCCESSFUL RESPONSES:\n${similarContext}`);

    const layeredContext = contextSections.length > 0
      ? `${contextSections.join('\n\n')}\n\n` : '';

    // Enhanced unified barangay assistance system prompt with layered knowledge sources
    return `You are Ka-Lias, a helpful AI assistant for Barangay Lias, Marilao, Bulacan, Philippines.

${layeredContext}USER QUESTION: ${query}

CRITICAL: REPLY IN THE EXACT SAME LANGUAGE AS THE USER QUESTION ABOVE.
- If question is in English → Reply ONLY in English
- If question is in Tagalog → Reply ONLY in Tagalog
- If question is in Taglish (mixed) → Reply in Taglish

CORE PRINCIPLES (FOLLOW STRICTLY):
1. Philippine Context: Base answers on Philippine barangay procedures, DILG guidelines, the Local Government Code, Data Privacy Act (RA 10173), and relevant regulations.
2. Tone & Language: Clear, respectful, understandable for ordinary Filipino residents. Match user's exact language style as instructed above.
3. Use References First: If a context section answers the question, paraphrase it accurately. Do not invent missing specifics.
4. Barangay Document Questions (barangay clearance, certificate of indigency, blotter, residency, business permit assistance): Provide in order: 
   - Purpose (Para saan / What it's for)
   - Requirements (Kadalasang kailangan / Requirements needed)
   - Where / Who to approach (desk/official)
   - Fees (kung meron / if any) or indicate if free / variable
   - Approx processing / waiting time (kung alam / if known)
   - Next steps / typical usage
5. Laws: Summarize in plain terms; only cite sections if truly needed.
6. If uncertain or varies: Say: "Depende po ito sa barangay ninyo. Mas maganda pong itanong sa Barangay Office para sa opisyal na proseso." (or English equivalent if question was in English)
7. Out-of-Scope: Briefly relate to local governance or guide to proper office (City Hall, DSWD, DILG) without fabricating agencies or contacts.
8. Data Privacy: If asked, explain simply that only necessary data is collected and protected under the Data Privacy Act.
9. Hallucination Prevention: If info not known or not in context, be transparent and recommend verifying at the Barangay Office.
10. Disallowed: No political opinions, medical diagnosis, or speculative legal advice—only procedural help.
11. Lists: Use simple numbered or dash lists. Only include realistic Philippine documents (valid gov ID, cedula/community tax certificate, proof of residency, etc.). Do not invent internal forms or fixed fees unless widely standard.
12. Announcement Guidance: If the question relates to events, schedules, updates, news, or ongoing programs that might be covered in barangay announcements, suggest checking announcements and guide them to where they can find them.

OUTPUT RULES:
- Simple question: 1–2 concise paragraphs.
- Process/document: short intro + structured list.
- Close with helpful action (e.g., Ihanda ang valid ID / Prepare your valid ID, pumunta sa Barangay Office / visit the Barangay Office).
- If contact number unknown, advise to visit/call Barangay Office directly.
- For announcement-related topics (events, schedules, programs, updates, news): Include a suggestion to check announcements and provide navigation guidance:
  * For logged-in users: "Check the Announcements section in your SmartLIAS dashboard"
  * For public access: "Visit the SmartLIAS homepage and check the Announcements section"
  * Always include: "or visit the Barangay Office for the latest updates"

ANNOUNCEMENT GUIDANCE EXAMPLES:
- Events/Programs: "Para sa latest schedules at programs, check ang Announcements sa SmartLIAS homepage o sa inyong dashboard kung naka-login na kayo."
- Schedule changes: "Mga schedule changes at updates ay naka-post sa Announcements section ng SmartLIAS."
- Community updates: "Stay updated sa mga community news through ang SmartLIAS Announcements."

If information is missing or varies locally, clearly state the limitation and guide the resident to confirm in person. If not in context and cannot be responsibly inferred, recommend official verification.
`;
  }

  /**
   * Google Gemini generation
   */
  async generateGemini(query, context, provider) {
    const prompt = this.buildPrompt(query, context);
    const result = await provider.model.generateContent(prompt);
    const response = await result.response;

    if (response.promptFeedback?.blockReason) {
      throw new Error(`Response blocked: ${response.promptFeedback.blockReason}`);
    }

    const answer = response.text();
    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response from Gemini');
    }

    return answer.trim();
  }

  /**
   * Groq (Llama) generation
   */
  async generateGroq(query, context, provider) {
    const prompt = this.buildPrompt(query, context);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response from Groq');
    }

    return answer.trim();
  }

  /**
   * OpenRouter generation
   */
  async generateOpenRouter(query, context, provider) {
    const prompt = this.buildPrompt(query, context);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
        'X-Title': 'SmartLias Chatbot'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response from OpenRouter');
    }

    return answer.trim();
  }

  /**
   * OpenAI generation
   */
  async generateOpenAI(query, context, provider) {
    const prompt = this.buildPrompt(query, context);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer || answer.trim().length === 0) {
      throw new Error('Empty response from OpenAI');
    }

    return answer.trim();
  }
}

// Export singleton instance
module.exports = new AIService();
