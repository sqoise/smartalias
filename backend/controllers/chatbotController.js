/**
 * Chatbot Controller
 * Handles FAQ queries, chat conversations, and intelligent responses
 * Uses Fuse.js for fuzzy search, PostgreSQL full-text search, and Multi-Provider AI
 */

const Fuse = require('fuse.js')
const ChatbotRepository = require('../repositories/ChatbotRepository')
const aiService = require('../services/aiService')
const logger = require('../config/logger')
const ApiResponse = require('../utils/apiResponse')

class ChatbotController {
  // ============================================
  // FAQ ENDPOINTS
  // ============================================

  /**
   * Get all FAQ categories
   */
  static async getCategories(req, res) {
    try {
      const categories = await ChatbotRepository.getCategories()
      return ApiResponse.success(res, categories, 'FAQ categories retrieved successfully')
    } catch (error) {
      logger.error('Error fetching FAQ categories', error)
      return ApiResponse.serverError(res, 'Failed to fetch FAQ categories', error)
    }
  }

  /**
   * Get FAQs by category (or all if no category specified)
   */
  static async getFAQs(req, res) {
    try {
      const { categoryId } = req.query
      const faqs = await ChatbotRepository.getFAQs(categoryId)
      return ApiResponse.success(res, faqs, 'FAQs retrieved successfully')
    } catch (error) {
      logger.error('Error fetching FAQs', error)
      return ApiResponse.serverError(res, 'Failed to fetch FAQs', error)
    }
  }

  /**
   * Get FAQ by ID
   */
  static async getFAQById(req, res) {
    try {
      const { id } = req.params
      const faq = await ChatbotRepository.getFAQById(id)

      if (!faq) {
        return ApiResponse.notFound(res, 'FAQ not found')
      }

      // Increment view count
      await ChatbotRepository.incrementViewCount(id)

      return ApiResponse.success(res, faq, 'FAQ retrieved successfully')
    } catch (error) {
      logger.error('Error fetching FAQ', error)
      return ApiResponse.serverError(res, 'Failed to fetch FAQ', error)
    }
  }

  /**
   * Search FAQs
   */
  static async searchFAQs(req, res) {
    try {
      const { q } = req.query

      if (!q || q.trim().length < 2) {
        return ApiResponse.error(res, 'Search query must be at least 2 characters', 400)
      }

      const faqs = await ChatbotRepository.searchFAQs(q.trim())
      return ApiResponse.success(res, faqs, `Found ${faqs.length} matching FAQs`)
    } catch (error) {
      logger.error('Error searching FAQs', error)
      return ApiResponse.serverError(res, 'Failed to search FAQs', error)
    }
  }

  /**
   * Submit FAQ feedback (helpful/not helpful)
   */
  static async submitFAQFeedback(req, res) {
    try {
      const { id } = req.params
      const { helpful } = req.body

      if (typeof helpful !== 'boolean') {
        return ApiResponse.error(res, 'Feedback must be true (helpful) or false (not helpful)', 400)
      }

      const faq = await ChatbotRepository.getFAQById(id)
      if (!faq) {
        return ApiResponse.notFound(res, 'FAQ not found')
      }

      await ChatbotRepository.updateFAQFeedback(id, helpful)

      return ApiResponse.success(res, null, 'Thank you for your feedback!')
    } catch (error) {
      logger.error('Error submitting FAQ feedback', error)
      return ApiResponse.serverError(res, 'Failed to submit feedback', error)
    }
  }

  // ============================================
  // CHATBOT QUERY ENDPOINT
  // ============================================

  /**
   * Process chatbot query and generate intelligent response
   * Uses hybrid approach: PostgreSQL full-text search + Fuse.js fuzzy search + AI fallback
   */
  static async processQuery(req, res) {
    const startTime = Date.now()
    
    try {
      const { query, sessionId } = req.body
      const userId = req.user?.id || null // Optional auth

      if (!query || query.trim().length < 1) {
        return ApiResponse.error(res, 'Query is required', 400)
      }

      if (!sessionId) {
        return ApiResponse.error(res, 'Session ID is required', 400)
      }

      // PII Protection: Check for queries requesting personal information
      if (ChatbotController.detectPIIQuery(query.trim())) {
        logger.warn('PII query detected and blocked', { 
          query: query.trim().substring(0, 50),
          sessionId,
          userId 
        })
        
        const piiResponse = "I can help you with general barangay information, services, and procedures. However, I cannot provide personal information about specific residents for privacy protection. If you need specific resident information, please visit the barangay office with proper identification."
        
        // Get or create conversation
        let conversation = await ChatbotRepository.getConversationBySession(sessionId)
        if (!conversation) {
          conversation = await ChatbotRepository.createConversation(userId, sessionId)
        }
        
        // Save both messages (sanitized)
        const sanitizedQuery = ChatbotController.sanitizeChatMessage(query.trim())
        await ChatbotRepository.saveMessage(conversation.id, 'user', sanitizedQuery)
        await ChatbotRepository.saveMessage(conversation.id, 'bot', piiResponse, null, 'privacy_protection', 'blocked')
        
        return ApiResponse.success(res, {
          answer: piiResponse,
          source: 'privacy_protection',
          method: 'blocked',
          faqId: null,
          processingTime: Date.now() - startTime
        })
      }

      // Personal Data Sharing Protection: Check if user is sharing their own personal info
      if (ChatbotController.detectPersonalDataSharing(query.trim())) {
        logger.warn('Personal data sharing detected and blocked', { 
          query: query.trim().substring(0, 50),
          sessionId,
          userId 
        })
        
        const personalDataResponse = "⚠️ **Privacy Alert**: I noticed you might be sharing personal information. For your protection, please don't share phone numbers, addresses, full names, or other personal details in our chat. I can help you with general barangay services without needing your personal information. What can I help you with today?"
        
        // Get or create conversation
        let conversation = await ChatbotRepository.getConversationBySession(sessionId)
        if (!conversation) {
          conversation = await ChatbotRepository.createConversation(userId, sessionId)
        }
        
        // Save both messages (heavily sanitized)
        const sanitizedQuery = ChatbotController.sanitizeChatMessage(query.trim())
        await ChatbotRepository.saveMessage(conversation.id, 'user', sanitizedQuery)
        await ChatbotRepository.saveMessage(conversation.id, 'bot', personalDataResponse, null, 'privacy_protection', 'personal_data_blocked')
        
        return ApiResponse.success(res, {
          answer: personalDataResponse,
          source: 'privacy_protection',
          method: 'personal_data_blocked',
          faqId: null,
          processingTime: Date.now() - startTime
        })
      }

      // Get or create conversation
      let conversation = await ChatbotRepository.getConversationBySession(sessionId)
      
      if (!conversation) {
        conversation = await ChatbotRepository.createConversation(userId, sessionId)
        // Note: Privacy disclaimer is shown on frontend - no need to save it here
      }

      // Save user message (sanitized)
      const sanitizedQuery = ChatbotController.sanitizeChatMessage(query.trim())
      
      // Log sanitization for debugging
      if (sanitizedQuery !== query.trim()) {
        logger.info('PII detected and redacted in user message', {
          original: query.trim().substring(0, 50) + '...',
          sanitized: sanitizedQuery.substring(0, 50) + '...',
          conversationId: conversation.id
        })
      }
      
      await ChatbotRepository.saveMessage(conversation.id, 'user', sanitizedQuery)

      // STEP 1: Try rule-based search (PostgreSQL + Fuse.js)
      let matchedFAQs = await ChatbotController.hybridSearch(query.trim())

      let response
      let faqId = null
      let source = 'database'
      let method = 'postgresql'

      if (matchedFAQs.length > 0) {
        // Use the best match (first result)
        const bestMatch = matchedFAQs[0]
        
        // Calculate confidence based on match quality
        let confidence = 'medium'
        if (bestMatch.score && bestMatch.score < 0.2) {
          confidence = 'high' // Very close match
        } else if (bestMatch.score && bestMatch.score > 0.6) {
          confidence = 'low' // Weak match
        }

        // Determine method used
        method = bestMatch.method || 'postgresql'

        response = {
          type: 'faq',
          answer: bestMatch.answer,
          question: bestMatch.question,
          faqId: bestMatch.id,
          confidence: confidence,
          matchScore: bestMatch.score || 0,
          source: method === 'fusejs' ? 'fuzzy-search' : 'database',
          method: method,
          aiGenerated: false,
          ...(process.env.NODE_ENV === 'development' && { responseTime: Date.now() - startTime }), // Only in development
          metadata: {
            searchMethod: 'rule-based',
            engine: method,
            cached: false
          },
          suggestions: matchedFAQs.slice(1, 4).map(faq => ({
            id: faq.id,
            question: faq.question
          }))
        }
        faqId = bestMatch.id
        source = method === 'fusejs' ? 'fuzzy-search' : 'database'

        // Increment view count
        await ChatbotRepository.incrementViewCount(bestMatch.id)
        
        logger.info('Rule-based match found', {
          query: query.trim(),
          method,
          confidence,
          responseTime: response.responseTime
        })
      } else {
        // STEP 2: Try AI generation (Multi-Provider)
        // Get relevant FAQs as context for AI
        let contextFAQs = []
        try {
          // Try to find related FAQs for context
          const allFAQs = await ChatbotRepository.getFAQs()
          
          // Check if query is about documents/fees - if so, prioritize document FAQ
          const lowerQuery = query.toLowerCase()
          const isDocumentQuery = lowerQuery.match(/fee|cost|price|bayad|magkano|document|permit|clearance|certificate/)
          
          if (isDocumentQuery) {
            // Find the "What documents can I request" FAQ which has all fees
            const documentListFAQ = allFAQs.find(faq => 
              faq.question.toLowerCase().includes('what documents can i request')
            )
            
            if (documentListFAQ) {
              contextFAQs.push(documentListFAQ)
              logger.info('Added document list FAQ as primary context', { 
                faqId: documentListFAQ.id,
                question: documentListFAQ.question.substring(0, 50)
              })
            }
          }
          
          // Use Fuse.js to find additional related FAQs
          const fuseOptions = {
            includeScore: true,
            threshold: 0.6, // More lenient for context gathering
            keys: [
              { name: 'question', weight: 0.4 },
              { name: 'keywords', weight: 0.4 },
              { name: 'answer', weight: 0.2 }
            ]
          }
          const fuse = new Fuse(allFAQs, fuseOptions)
          const relatedResults = fuse.search(query.trim())
          
          // Add additional context (avoid duplicates)
          const additionalContext = relatedResults
            .filter(r => !contextFAQs.find(c => c.id === r.item.id))
            .slice(0, 2)
            .map(r => r.item)
          
          contextFAQs.push(...additionalContext)
          
          logger.info('Found related FAQs for AI context', { 
            query: query.trim(),
            contextFAQs: contextFAQs.length,
            isDocumentQuery: !!isDocumentQuery
          })
        } catch (contextError) {
          logger.warn('Failed to get context FAQs, AI will answer without context', { 
            error: contextError.message 
          })
        }
        
        if (aiService.isAvailable()) {
          try {
            // Sanitize query before sending to AI to protect user privacy
            // AI should never see actual names, phone numbers, etc.
            const sanitizedQuery = ChatbotController.sanitizeChatMessage(query.trim())
            
            logger.info('Attempting AI generation with enhanced context', { 
              query: sanitizedQuery, // Log sanitized version
              contextFAQs: contextFAQs.length,
              conversationId: conversation.id
            })
            
            // Get enhanced context including chat history (use sanitized query)
            const aiContext = await ChatbotRepository.buildAIContext(sanitizedQuery, conversation.id)
            
            // Add FAQ context
            aiContext.faqs = [...(aiContext.faqs || []), ...contextFAQs]
            
            // Add recent announcements if query is announcement-related
            const announcementKeywords = [
              'announcement', 'announcements', 'news', 'update', 'updates', 'event', 'events', 
              'schedule', 'schedules', 'program', 'programs', 'activity', 'activities',
              'balita', 'abiso', 'paalala', 'sked', 'programa', 'gawain', 'aktibidad'
            ];
            const isAnnouncementRelated = announcementKeywords.some(keyword => 
              sanitizedQuery.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (isAnnouncementRelated) {
              try {
                const recentAnnouncements = await ChatbotRepository.getRecentAnnouncements(3)
                aiContext.recentAnnouncements = recentAnnouncements
                logger.info('Added recent announcements to AI context', { 
                  query: sanitizedQuery,
                  announcementsCount: recentAnnouncements.length
                })
              } catch (announcementError) {
                logger.warn('Failed to get recent announcements for AI context', { 
                  error: announcementError.message 
                })
              }
            }
            
            // Add rule-based knowledge
            aiContext.rules = [
                // 4Ps Program
                'For 4Ps (Pantawid Pamilyang Pilipino Program), applicants should go to the Municipal Social Welfare and Development Office (MSWDO) or the DSWD office',
                '4Ps is a national program managed by DSWD, not the barangay - the barangay can provide supporting documents like Certificate of Indigency',
                
                // Barangay Documents
                'For barangay clearance: bring valid ID, cedula (community tax certificate), and proof of residency',
                'Most barangay documents are processed within 1-3 days, some same-day if urgent',
                'Certificate of Indigency is usually free for qualified residents and requires interview/assessment',
                'Business permit facilitation requires DTI/SEC registration and barangay clearance',
                'Senior Citizen ID and PWD ID applications are facilitated by the barangay but issued by OSCA/local government',
                
                // Blotter and Law Enforcement
                'For blotter/incident reports, go to the Barangay Office and approach the Barangay Tanod or Secretary - bring valid ID and incident details',
                'Blotter entries are official records of incidents/complaints filed at the barangay level for documentation purposes',
                'Barangay blotter is required for insurance claims, police reports, court cases, or documentation of incidents',
                'Domestic violence cases should be reported to Barangay and can be escalated to PNP Women and Children Protection Desk',
                'For serious crimes (murder, robbery, rape), go directly to PNP (police) - barangay handles minor disputes only',
                
                // Barangay Justice System (Katarungang Pambarangay)
                'Katarungang Pambarangay handles disputes between neighbors, minor property disputes, minor physical injuries, and civil cases under ₱200,000',
                'Barangay conciliation is mandatory before filing cases in court for disputes within barangay jurisdiction',
                'Lupon Tagapamayapa (Peace Committee) conducts mediation sessions for community disputes',
                'Certificate to File Action is issued when barangay conciliation fails - needed to file court cases',
                
                // DILG and LGC Guidelines
                'Under Local Government Code (RA 7160), barangays have authority over peace and order, public safety, and dispute resolution',
                'Barangay officials serve 3-year terms: Punong Barangay (Captain), 7 Kagawads (Councilors), SK Chairman, and Secretary/Treasurer',
                'Barangay Assembly meetings should be held quarterly where residents can participate in local governance',
                'Anti-Red Tape Act (RA 11032) requires simple procedures, clear timelines, and transparency in government services',
                
                // Peace and Order
                'Barangay Tanods are community peacekeepers who assist in maintaining peace and order but have limited police powers',
                'For noise complaints, public disturbance, or minor violations, contact Barangay Tanods or Barangay Office',
                'Drug-related incidents should be reported to PDEA, PNP, or Barangay Anti-Drug Abuse Council (BADAC)',
                'Curfew ordinances for minors are implemented by barangays - parents may be required to fetch violators',
                
                // Data Privacy and Records
                'Under Data Privacy Act (RA 10173), personal information in barangay records must be protected and used only for official purposes',
                'Residents have the right to access, correct, or request deletion of their personal data held by the barangay',
                'Barangay certificates and clearances should only contain necessary information and cannot include discriminatory remarks',
                
                // Emergency and Disaster Response
                'Barangay Disaster Risk Reduction and Management Council (BDRRMC) coordinates local emergency response',
                'For medical emergencies, contact local health center, rural health unit, or emergency services (911)',
                'Evacuation centers and disaster preparedness plans are managed at the barangay level during calamities',
                
                // Health and Social Services
                'Barangay Health Stations provide basic health services, immunization, and health education programs',
                'Maternal and child health services, family planning, and nutrition programs are available at barangay level',
                'Solo Parent ID applications are processed through MSWD with barangay endorsement and supporting documents'
              ]
            
            // Use sanitized query when calling AI (AI never sees real names)
            const aiAnswer = await aiService.generateAnswer(sanitizedQuery, aiContext)
            const responseTime = Date.now() - startTime
            const provider = aiService.primaryProvider
            
            // No need to filter AI response anymore since AI never received user's name
            // AI will generate natural responses like "Hello! How can I help?" instead of "Hello, Robert!"
            
            response = {
              type: 'ai',
              answer: aiAnswer, // Use AI response directly - it's clean and natural
              source: `${provider}-ai`,
              method: `ai-${provider}`,
              aiGenerated: true,
              ...(process.env.NODE_ENV === 'development' && { responseTime }), // Only in development
              disclaimer: 'AI-generated. Answer might not be accurate.',
              metadata: {
                searchMethod: 'ai-powered',
                engine: provider,
                contextFAQs: contextFAQs.length,
                cached: false
              },
              suggestions: []
            }
            source = `${provider}-ai`
            method = `ai-${provider}`
            
            logger.info('AI answer generated', {
              query: query.trim(),
              responseTime,
              provider: provider,
              answerLength: aiAnswer.length,
              contextFAQs: contextFAQs.length
            })
            
          } catch (aiError) {
            logger.warn('AI generation failed, using fallback', { 
              error: aiError.message,
              code: aiError.code,
              stack: aiError.stack
            })
            
            // STEP 3: Static fallback
            response = await ChatbotController.generateFallbackResponse(query.trim())
            response.source = 'fallback'
            response.method = 'static-fallback'
            response.aiGenerated = false
            response.responseTime = Date.now() - startTime
            response.metadata = {
              searchMethod: 'fallback',
              engine: 'static',
              reason: aiError.message.includes('AI_QUOTA_EXCEEDED') ? 'quota-exceeded' : 'ai-error'
            }
            source = 'fallback'
            method = 'static-fallback'
          }
        } else {
          // AI disabled, use static fallback
          response = await ChatbotController.generateFallbackResponse(query.trim())
          response.source = 'fallback'
          response.method = 'static-fallback'
          response.aiGenerated = false
          response.responseTime = Date.now() - startTime
          response.metadata = {
            searchMethod: 'fallback',
            engine: 'static',
            reason: 'ai-disabled'
          }
          source = 'fallback'
          method = 'static-fallback'
        }
      }

      // Save bot response (NO sanitization - bot responses are safe)
      // Only user messages are sanitized to protect user privacy
      const botResponseText = typeof response.answer === 'string' 
        ? response.answer
        : JSON.stringify(response)
      
      await ChatbotRepository.saveMessage(
        conversation.id,
        'bot',
        botResponseText,
        faqId
      )

      return ApiResponse.success(res, response, 'Query processed successfully')
    } catch (error) {
      logger.error('Error processing chatbot query', error)
      return ApiResponse.serverError(res, 'Failed to process query', error)
    }
  }

  /**
   * Hybrid search: Combines PostgreSQL full-text search with Fuse.js fuzzy search
   * This provides better results by using both exact/semantic matching and typo-tolerant fuzzy matching
   */
  static async hybridSearch(query) {
    try {
      // Step 1: Try PostgreSQL full-text search first (fast, semantic)
      const dbResults = await ChatbotRepository.searchFAQs(query)

      if (dbResults.length > 0) {
        // Found results with PostgreSQL - mark method
        logger.info('FAQ match found via PostgreSQL full-text search', { query, results: dbResults.length })
        return dbResults.map(faq => ({ ...faq, method: 'postgresql' }))
      }

      // Step 2: If no results, try Fuse.js fuzzy search (typo-tolerant)
      logger.info('No PostgreSQL results, trying Fuse.js fuzzy search', { query })
      
      // Get all FAQs for fuzzy search
      const allFAQs = await ChatbotRepository.getFAQs()

      if (allFAQs.length === 0) {
        return []
      }

      // Configure Fuse.js for fuzzy search
      const fuseOptions = {
        includeScore: true, // Include match score
        threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything (0.4 = moderate tolerance)
        distance: 100, // Maximum distance for match
        minMatchCharLength: 3, // Minimum characters to match
        keys: [
          { name: 'question', weight: 0.5 },   // Prioritize question matches
          { name: 'keywords', weight: 0.3 },   // Keywords are important
          { name: 'answer', weight: 0.2 }      // Answer has lower priority
        ]
      }

      const fuse = new Fuse(allFAQs, fuseOptions)
      const fuseResults = fuse.search(query)

      if (fuseResults.length > 0) {
        logger.info('FAQ match found via Fuse.js fuzzy search', { 
          query, 
          results: fuseResults.length,
          topScore: fuseResults[0].score 
        })

        // Transform Fuse.js results to standard format - mark as fuzzy method
        return fuseResults.map(result => ({
          ...result.item,
          score: result.score, // Include Fuse.js score
          method: 'fusejs', // Mark method used
          matchType: 'fuzzy'
        }))
      }

      logger.info('No FAQ matches found', { query })
      return []

    } catch (error) {
      logger.error('Error in hybrid search', error)
      // Fallback to database search only
      const fallbackResults = await ChatbotRepository.searchFAQs(query)
      return fallbackResults.map(faq => ({ ...faq, method: 'postgresql' }))
    }
  }

  /**
   * Generate fallback response when no FAQ matches
   */
  static async generateFallbackResponse(query) {
    // Check query intent
    const lowerQuery = query.toLowerCase()

    // Greeting queries
    if (lowerQuery.match(/^(hi|hello|hey|kumusta|kamusta|musta|good morning|good afternoon|good evening)$/i)) {
      return {
        type: 'fallback',
        answer: `Kumusta! Welcome to SmartLIAS - your digital platform for Barangay Lias services.

I can help you with:
• How to register for SmartLIAS account
• Document requests and requirements
• Account approval and login issues
• Barangay services and programs
• Office hours and contact information

What would you like to know?`,
        suggestions: [
          { id: null, question: 'How do I register for SmartLIAS account?' },
          { id: null, question: 'What documents can I request?' },
          { id: null, question: 'How long does account approval take?' }
        ]
      }
    }

    // Document-related queries
    if (lowerQuery.match(/document|request|certificate|clearance|permit/)) {
      const documents = await ChatbotRepository.getDocumentTypes()
      return {
        type: 'fallback',
        answer: 'I found information about available documents. Here are the documents you can request from Barangay Lias:',
        data: {
          documents: documents.map(doc => ({
            title: doc.title,
            description: doc.description,
            fee: doc.fee
          }))
        },
        suggestions: [
          { id: null, question: 'How do I request a barangay clearance?' },
          { id: null, question: 'What documents can I request?' },
          { id: null, question: 'How long does document processing take?' }
        ]
      }
    }

    // Special categories query
    if (lowerQuery.match(/pwd|senior|indigent|solo parent|program|assistance/)) {
      const categories = await ChatbotRepository.getSpecialCategories()
      return {
        type: 'fallback',
        answer: 'I found information about special assistance programs. Barangay Lias provides support for:',
        data: {
          categories: categories.map(cat => ({
            name: cat.category_name,
            description: cat.description
          }))
        },
        suggestions: [
          { id: null, question: 'What are the requirements for Certificate of Indigency?' },
          { id: null, question: 'What services does the barangay provide?' }
        ]
      }
    }

    // Contact/office hours query
    if (lowerQuery.match(/contact|phone|email|hours|office|time|schedule/)) {
      return {
        type: 'fallback',
        answer: `I can help you with contact information!

**Barangay Lias Contact:**
📞 Landline: (046) XXX-XXXX
📱 Mobile: 0947-XXX-XXXX
📧 Email: barangaylias@example.com

**Office Hours:**
• Monday-Friday: 8:00 AM - 5:00 PM
• Saturday: 8:00 AM - 12:00 PM
• Closed on Sundays and holidays`,
        suggestions: [
          { id: null, question: 'What are the office hours of Barangay Lias?' },
          { id: null, question: 'How can I contact barangay officials?' }
        ]
      }
    }

    // Default fallback
    return {
      type: 'fallback',
      answer: `I'm sorry, I couldn't find a specific answer to your question. 

      Here are some things I can help you with:
      • Document requests and requirements
      • Barangay services and programs
      • Office hours and contact information
      • Registration and account questions
      • Announcements and updates

      Please try rephrasing your question or browse the FAQ categories below.`,
      suggestions: [
        { id: null, question: 'What documents can I request?' },
        { id: null, question: 'What services does the barangay provide?' },
        { id: null, question: 'How do I register for an account?' }
      ]
    }
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params

      const conversation = await ChatbotRepository.getConversationBySession(sessionId)
      if (!conversation) {
        return ApiResponse.notFound(res, 'Conversation not found')
      }

      const messages = await ChatbotRepository.getConversationMessages(conversation.id)

      return ApiResponse.success(res, {
        conversation,
        messages
      }, 'Conversation history retrieved successfully')
    } catch (error) {
      logger.error('Error fetching conversation history', error)
      return ApiResponse.serverError(res, 'Failed to fetch conversation history', error)
    }
  }

  /**
   * End conversation
   */
  static async endConversation(req, res) {
    try {
      const { sessionId } = req.params

      const conversation = await ChatbotRepository.getConversationBySession(sessionId)
      if (!conversation) {
        return ApiResponse.notFound(res, 'Conversation not found')
      }

      await ChatbotRepository.endConversation(conversation.id)

      return ApiResponse.success(res, null, 'Conversation ended successfully')
    } catch (error) {
      logger.error('Error ending conversation', error)
      return ApiResponse.serverError(res, 'Failed to end conversation', error)
    }
  }

  /**
   * Get AI service status for admin dashboard
   */
  static async getAIStatus(req, res) {
    try {
      const aiStatus = {
        enabled: aiService.enabled,
        available: aiService.isAvailable(),
        primaryProvider: aiService.primaryProvider,
        fallbackProviders: aiService.fallbackProviders,
        availableProviders: Object.keys(aiService.providers),
        providerDetails: {}
      }

      // Get detailed status for each provider
      for (const [providerName, provider] of Object.entries(aiService.providers)) {
        aiStatus.providerDetails[providerName] = {
          name: provider.name,
          model: provider.model || 'N/A',
          status: 'online'
        }
      }

      // Test primary provider with a simple query if available
      if (aiStatus.available) {
        try {
          const testContext = {
            faqs: [],
            rules: ['Test rule for AI status check'],
            db: []
          }
          
          const testResponse = await aiService.generateAnswer('test', testContext)
          aiStatus.lastTestResponse = testResponse ? 'success' : 'failed'
          aiStatus.lastTestAt = new Date().toISOString()
          
          // Update availability based on actual test result
          if (!testResponse) {
            aiStatus.available = false
            aiStatus.lastTestError = 'AI test call returned empty response'
          }
        } catch (testError) {
          logger.warn('AI status test failed', { error: testError.message })
          aiStatus.available = false  // Set to false if test fails
          aiStatus.lastTestResponse = 'failed'
          aiStatus.lastTestError = testError.message
          aiStatus.lastTestAt = new Date().toISOString()
        }
      }

      return ApiResponse.success(res, aiStatus, 'AI service status retrieved successfully')
    } catch (error) {
      logger.error('Error getting AI status', error)
      return ApiResponse.serverError(res, 'Failed to get AI status', error)
    }
  }

  // ============================================
  // PII PROTECTION METHODS
  // ============================================

  /**
   * Detect queries that might be requesting personal information
   */
  static detectPIIQuery(query) {
    const piiPatterns = [
      // Phone/contact requests
      /\b(phone|contact|number|telepono|contact number|mobile|cellphone)\b.*\b(resident|person|name|sino|kanino)\b/i,
      /\b(sino|who|sinong)\b.*\b(phone|contact|number|telepono)\b/i,
      
      // Address requests
      /\b(address|tirahan|nakatira|tahanan|bahay)\b.*\b(sino|who|resident|person|name)\b/i,
      /\b(sino|who|sinong)\b.*\b(nakatira|tirahan|address|bahay)\b/i,
      
      // Birthday/personal details
      /\b(birthday|birth date|kapanganakan|kaarawan)\b.*\b(resident|person|sino)\b/i,
      /\b(sino|who|sinong)\b.*\b(birthday|kaarawan|kapanganakan)\b/i,
      
      // List of residents
      /\b(list|listahan|mga pangalan)\b.*\b(residents|mga residente|nakatira)\b/i,
      /\b(residents|mga residente)\b.*\b(list|listahan|mga pangalan)\b/i,
      
      // Personal information
      /\b(personal info|personal information|pribadong impormasyon)\b/i,
      /\b(email|email address|email ni)\b.*\b(resident|person|sino)\b/i,
      
      // Family/household info
      /\b(family|pamilya|household|sambahayan)\b.*\b(member|miyembro|sino|who)\b/i,
      /\b(sino|who)\b.*\b(family|pamilya|household|miyembro)\b/i
    ]
    
    return piiPatterns.some(pattern => pattern.test(query))
  }

  /**
   * Detect if user is sharing their own personal information
   */
  static detectPersonalDataSharing(query) {
    const personalSharingPatterns = [
      // Phone numbers
      /\b(09\d{9}|\d{3}-\d{4}|\+63\d{10})\b/,
      // Email addresses
      /\b[\w\.-]+@[\w\.-]+\.\w+\b/,
      // Dates that might be birth dates
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
      /\b\d{4}-\d{1,2}-\d{1,2}\b/,
      // Potential addresses with numbers
      /\b\d+\s+[A-Za-z\s]+(street|st\.?|avenue|ave\.?|road|rd\.?)\b/i,
      // ID-like patterns
      /\b\d{4}-\d{4}-\d{4}\b/,
      // Long number sequences
      /\b\d{12,}\b/,
      // Phrases indicating personal sharing
      /\b(my name is|ako si|pangalan ko|tawag sakin)\b/i,
      /\b(my address|address ko|nakatira ako sa)\b/i,
      /\b(my phone|phone ko|number ko)\b/i
    ]
    
    return personalSharingPatterns.some(pattern => pattern.test(query))
  }

  /**
   * Sanitize chat messages before storing or sending to AI
   * Redacts sensitive personal information for privacy protection
   * Uses safe replacement patterns that won't conflict with AI context
   */
  static sanitizeChatMessage(message) {
    if (!message) return message
    
    let sanitized = message
    
    // Remove phone numbers (11-digit mobile, 7-digit landline, international format)
    sanitized = sanitized.replace(/\b(09\d{9}|\+639\d{9}|\d{3}-\d{4}|\+63\d{10})\b/g, '[PHONE_REDACTED]')
    
    // Remove email addresses
    sanitized = sanitized.replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REDACTED]')
    
    // Remove dates that might be birth dates (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
    sanitized = sanitized.replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g, '[DATE_REDACTED]')
    sanitized = sanitized.replace(/\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g, '[DATE_REDACTED]')
    
    // Remove names after common phrases (I'm, I am, my name is, ako si, etc.)
    sanitized = sanitized.replace(/\b(I'm|I am|my name is|ako si|pangalan ko ay|tawag sakin ay|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi, '$1 [NAME_REDACTED]')
    
    // Remove names in greetings (Hi Robert, Hello Maria, etc.)
    sanitized = sanitized.replace(/\b(hi|hello|hey|kumusta)\s+([A-Z][a-z]+)\b/gi, '$1 [NAME_REDACTED]')
    
    // Remove standalone capitalized names (single or multiple words)
    sanitized = sanitized.replace(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g, (match) => {
      // Don't redact common words that are capitalized
      const commonWords = ['SmartLIAS', 'Barangay', 'Lias', 'Philippines', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      if (commonWords.includes(match)) return match
      // If it's a 2-3 word capitalized phrase, likely a name
      if (match.split(' ').length >= 2) return '[NAME_REDACTED]'
      return match
    })
    
    // Remove potential addresses with street numbers
    sanitized = sanitized.replace(/\b\d+\s+[A-Za-z\s]+(street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?)\b/gi, '[ADDRESS_REDACTED]')
    
    // Remove potential ID numbers (SSS, TIN, UMID patterns)
    sanitized = sanitized.replace(/\b\d{2}-\d{7}-\d{1}\b/g, '[SSS_REDACTED]')  // SSS format
    sanitized = sanitized.replace(/\b\d{3}-\d{3}-\d{3}-\d{3}\b/g, '[TIN_REDACTED]')  // TIN format
    sanitized = sanitized.replace(/\b\d{4}-\d{7}-\d{1}\b/g, '[UMID_REDACTED]')  // UMID format
    sanitized = sanitized.replace(/\b\d{4}-\d{4}-\d{4}\b/g, '[ID_REDACTED]')  // Generic ID format
    
    // Remove long number sequences (12+ digits) that might be IDs
    sanitized = sanitized.replace(/\b\d{12,}\b/g, '[NUMBER_REDACTED]')
    
    // Remove potential barangay ID formats
    sanitized = sanitized.replace(/\b[A-Z]{2,4}-\d{4,8}\b/g, '[ID_REDACTED]')
    
    return sanitized
  }

  /**
   * DEPRECATED: No longer needed since we sanitize user query before sending to AI
   * 
   * The AI never receives user's actual name, so it can't echo it back.
   * This prevents awkward "[NAME_REDACTED]" messages in the UI.
   * 
   * Previous approach: Filter AI response → "Hello, [NAME_REDACTED]!"
   * Current approach: Sanitize input → AI responds naturally → "Hello! How can I help?"
   */
  
  /**
   * Filter AI responses to prevent accidental PII disclosure
   * Applies same redaction patterns as sanitizeChatMessage for consistency
   */
  static filterAIResponse(response) {
    if (!response) return response
    
    return response
      // Remove any phone numbers that might have leaked through
      .replace(/\b(09\d{9}|\+639\d{9}|\d{3}-\d{4}|\+63\d{10})\b/g, '[PHONE_REDACTED]')
      // Remove email addresses
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL_REDACTED]')
      // Remove specific dates
      .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g, '[DATE_REDACTED]')
      .replace(/\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g, '[DATE_REDACTED]')
      // Remove potential names in responses
      .replace(/\b(Mr\.|Mrs\.|Ms\.)\s+[A-Z][a-z]+\b/g, '[NAME_REDACTED]')
      .replace(/\b([A-Z][a-z]+\s){1,3}[A-Z][a-z]+\b/g, '[NAME_REDACTED]')
      // Remove ID numbers
      .replace(/\b\d{2}-\d{7}-\d{1}\b/g, '[SSS_REDACTED]')
      .replace(/\b\d{3}-\d{3}-\d{3}-\d{3}\b/g, '[TIN_REDACTED]')
      .replace(/\b\d{4}-\d{7}-\d{1}\b/g, '[UMID_REDACTED]')
      .replace(/\b\d{4}-\d{4}-\d{4}\b/g, '[ID_REDACTED]')
      .replace(/\b\d{12,}\b/g, '[NUMBER_REDACTED]')
      .replace(/\b[A-Z]{2,4}-\d{4,8}\b/g, '[ID_REDACTED]')
  }
}

module.exports = ChatbotController
