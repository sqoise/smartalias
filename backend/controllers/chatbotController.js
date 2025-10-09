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

      // Get or create conversation
      let conversation = await ChatbotRepository.getConversationBySession(sessionId)
      if (!conversation) {
        conversation = await ChatbotRepository.createConversation(userId, sessionId)
      }

      // Save user message
      await ChatbotRepository.saveMessage(conversation.id, 'user', query.trim())

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
            logger.info('Attempting AI generation with database context', { 
              query: query.trim(),
              contextFAQs: contextFAQs.length
            })
            
            // Prepare structured context for AI
            const aiContext = {
              faqs: contextFAQs,
              rules: [
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
              ],
              db: [] // Can be populated with announcements, events, or resident-specific data in the future
            }
            
            const aiAnswer = await aiService.generateAnswer(query.trim(), aiContext)
            const responseTime = Date.now() - startTime
            const provider = aiService.primaryProvider
            
            response = {
              type: 'ai',
              answer: aiAnswer,
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

      // Save bot response
      await ChatbotRepository.saveMessage(
        conversation.id,
        'bot',
        typeof response.answer === 'string' ? response.answer : JSON.stringify(response),
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
}

module.exports = ChatbotController
